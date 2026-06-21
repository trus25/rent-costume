import type {
  DateRange,
  MaintenanceBlock,
  Product,
  ProductAvailabilityState,
  ProductDayAvailability,
  ProductVariant,
  Rental,
  RentalLifecycle,
  RentalRequest,
} from '../types/domain';

export const STOCK_HOLDING_LIFECYCLES: RentalLifecycle[] = [
  'confirmed',
  'preparing',
  'ready_pickup',
  'out_delivery',
  'on_rent',
  'returned',
];

export const RELEASED_LIFECYCLES: RentalLifecycle[] = ['inspected', 'completed', 'rejected', 'cancelled'];

export function isStockHoldingLifecycle(lifecycle: RentalLifecycle): boolean {
  return STOCK_HOLDING_LIFECYCLES.includes(lifecycle);
}

export function overlaps(a: DateRange, b: DateRange) {
  return a.start <= b.end && b.start <= a.end;
}

export function getMaintenanceBlock(product: Product | null | undefined, dates: DateRange): MaintenanceBlock | null {
  const blocks = Array.isArray(product?.maintenanceBlocks) ? product.maintenanceBlocks : [];
  return blocks.find((block) => overlaps(dates, block)) ?? null;
}

export function getMaintenanceReason(product: Product | null | undefined, dates: DateRange): string {
  return String(getMaintenanceBlock(product, dates)?.reason ?? '').trim();
}

export function getVariantBookedQuantity(productId: string, variantId: string, dates: DateRange, rentals: Rental[] = []) {
  return rentals
    .filter((rental) => isStockHoldingLifecycle(rental.lifecycle) && overlaps(dates, rental))
    .flatMap((rental) => rental.items)
    .filter((item) => item.productId === productId && item.variantId === variantId)
    .reduce((sum, item) => sum + item.qty, 0);
}

export function getVariantAvailability(product: Product, variantId: string, dates: DateRange, rentals: Rental[] = []): number {
  if (!product.active || getMaintenanceBlock(product, dates)) return 0;
  const variant = product.variants.find((entry) => entry.id === variantId);
  if (!variant) return 0;
  return Math.max(0, (Number(variant.total) || 0) - getVariantBookedQuantity(product.id, variantId, dates, rentals));
}

export function getProductAvailability(product: Product, dates: DateRange, rentals: Rental[] = []): ProductAvailabilityState {
  if (!product.active || getMaintenanceBlock(product, dates)) return 'unavailable';
  const variantStates = product.variants.map((variant) => ({
    available: getVariantAvailability(product, variant.id, dates, rentals),
    booked: getVariantBookedQuantity(product.id, variant.id, dates, rentals),
  }));
  if (variantStates.every((variant) => variant.available <= 0)) return 'fully_booked';
  if (variantStates.some((variant) => variant.booked > 0)) return 'partially_booked';
  return 'available';
}

export function firstAvailableVariant(product: Product, dates: DateRange, rentals: Rental[] = []): ProductVariant {
  return product.variants.find((variant) => getVariantAvailability(product, variant.id, dates, rentals) > 0) ?? product.variants[0];
}

export function getProductDayAvailability(product: Product, date: string, rentals: Rental[] = []): ProductDayAvailability {
  const range = { start: date, end: date };
  const unavailable = !product.active || Boolean(getMaintenanceBlock(product, range));
  const rows = product.variants.map((variant) => {
    const booked = getVariantBookedQuantity(product.id, variant.id, range, rentals);
    const total = Number(variant.total) || 0;
    const available = unavailable ? 0 : Math.max(0, total - booked);
    return {
      date,
      productId: product.id,
      variantId: variant.id,
      label: variant.label,
      total,
      booked,
      available,
      state: (unavailable ? 'unavailable' : available <= 0 ? 'fully_booked' : booked > 0 ? 'partially_booked' : 'available') as ProductAvailabilityState,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const booked = rows.reduce((sum, row) => sum + row.booked, 0);
  const available = rows.reduce((sum, row) => sum + row.available, 0);
  const state = unavailable
    ? 'unavailable'
    : available <= 0
      ? 'fully_booked'
      : booked > 0
        ? 'partially_booked'
        : 'available';

  return { date, productId: product.id, total, booked, available, state, variants: rows };
}

export function getDerivedVariantHold(productId: string, variantId: string, rentals: Rental[] = []): number {
  return rentals
    .filter((rental) => isStockHoldingLifecycle(rental.lifecycle))
    .flatMap((rental) => rental.items)
    .filter((item) => item.productId === productId && item.variantId === variantId)
    .reduce((sum, item) => sum + item.qty, 0);
}

export type VariantStockSummary = {
  variantId: string;
  label: string;
  total: number;
  held: number;
  available: number;
};

export type ProductStockSummary = {
  productId: string;
  total: number;
  held: number;
  available: number;
  state: ProductAvailabilityState;
  variants: VariantStockSummary[];
};

export type RequestAvailabilityRow = {
  productId: string;
  variantId: string;
  requested: number;
  available: number;
};

export function getProductStockSummary(product: Product, rentals: Rental[] = []): ProductStockSummary {
  const variants = product.variants.map((variant) => {
    const total = Number(variant.total) || 0;
    const held = getDerivedVariantHold(product.id, variant.id, rentals);
    return {
      variantId: variant.id,
      label: variant.label,
      total,
      held,
      available: product.active ? Math.max(0, total - held) : 0,
    };
  });
  const total = variants.reduce((sum, variant) => sum + variant.total, 0);
  const held = variants.reduce((sum, variant) => sum + variant.held, 0);
  const available = variants.reduce((sum, variant) => sum + variant.available, 0);
  const state: ProductAvailabilityState = !product.active
    ? 'unavailable'
    : available <= 0
      ? 'fully_booked'
      : held > 0
        ? 'partially_booked'
        : 'available';
  return { productId: product.id, total, held, available, state, variants };
}

export function getProductStockSummaries(products: Product[], rentals: Rental[] = []): Record<string, ProductStockSummary> {
  return Object.fromEntries(products.map((product) => [product.id, getProductStockSummary(product, rentals)]));
}

export function getRequestAvailabilityRows(request: RentalRequest, products: Product[], rentals: Rental[] = []): RequestAvailabilityRow[] {
  return request.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return {
      productId: item.productId,
      variantId: item.variantId,
      requested: item.qty,
      available: product ? getVariantAvailability(product, item.variantId, request, rentals) : 0,
    };
  });
}

export function availabilityRank(value: ProductAvailabilityState) {
  if (value === 'available') return 0;
  if (value === 'partially_booked' || value === 'limited') return 1;
  if (value === 'fully_booked' || value === 'full') return 2;
  return 3;
}
