import { z } from 'zod';
import type {
  ActivityItem,
  CartItem,
  CartLineItem,
  ChecklistItem,
  Client,
  DateRange,
  LocalizedContent,
  Locale,
  MaintenanceBlock,
  PaymentStatus,
  Product,
  ProductAvailabilityState,
  ProductDayAvailability,
  ProductImage,
  ProductVariant,
  Rental,
  RentalRequest,
  RentalItem,
  RentalLifecycle,
  Settings,
  TFunction,
  Tone,
} from '../types/domain';

export const TODAY = '2026-05-27';
export const BLOCKING_LIFECYCLES: RentalLifecycle[] = ['confirmed', 'preparing', 'ready_pickup', 'out_delivery', 'on_rent'];
export const RELEASED_LIFECYCLES: RentalLifecycle[] = ['returned', 'completed', 'rejected', 'cancelled'];

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number) {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function dayCount(start: string, end: string) {
  return Math.floor((toDate(end).getTime() - toDate(start).getTime()) / 86400000) + 1;
}

export function makeBookingSchema(t: TFunction) {
  return z
    .object({
      name: z.string().min(2, t('common.required')),
      phone: z.string().min(8, t('common.required')),
      email: z.string().email().or(z.literal('')),
      fulfillment: z.enum(['pickup', 'delivery']),
      pickupWindow: z.string(),
      returnWindow: z.string().min(3, t('common.required')),
      deliveryWindow: z.string(),
      address: z.string(),
      notes: z.string(),
    })
    .superRefine((value, ctx) => {
      if (value.fulfillment === 'pickup' && !value.pickupWindow.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupWindow'], message: t('common.required') });
      }
      if (value.fulfillment === 'delivery' && !value.address.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: t('common.required') });
      }
      if (value.fulfillment === 'delivery' && !value.deliveryWindow.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deliveryWindow'], message: t('common.required') });
      }
    });
}

export function makeLookupSchema(t: TFunction) {
  return z.object({
    reference: z.string().min(4, t('common.required')),
    phone: z.string().min(8, t('common.required')),
    changeType: z.string(),
    changeNotes: z.string(),
  });
}

export function validateDates(dates: DateRange) {
  if (dates.start < TODAY) return 'customer.date.errorPast';
  if (dates.end < dates.start) return 'customer.date.errorOrder';
  return '';
}

export function getCartItems(cart: CartItem[], products: Product[]): CartLineItem[] {
  return cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((item): item is CartLineItem => Boolean(item));
}

export function getProductAvailability(product: Product, dates: DateRange, rentals: Rental[]): ProductAvailabilityState {
  if (!product.active || product.maintenanceBlocks.some((block) => overlaps(dates, block))) return 'unavailable';
  const variantStates = product.variants.map((variant) => ({
    available: getVariantAvailability(product, variant.id, dates, rentals),
    booked: Array.isArray(rentals) ? getVariantBookedQuantity(product.id, variant.id, dates, rentals) : variant.held,
  }));
  if (variantStates.every((variant) => variant.available <= 0)) return 'fully_booked';
  if (variantStates.some((variant) => variant.booked > 0)) return 'partially_booked';
  return 'available';
}

export function getMaintenanceBlock(product: Product | null | undefined, dates: DateRange): MaintenanceBlock | null {
  const blocks = Array.isArray(product?.maintenanceBlocks) ? product.maintenanceBlocks : [];
  return blocks.find((block) => overlaps(dates, block)) ?? null;
}

export function getMaintenanceReason(product: Product | null | undefined, dates: DateRange): string {
  return String(getMaintenanceBlock(product, dates)?.reason ?? '').trim();
}

export function getVariantAvailability(product: Product, variantId: string, dates: DateRange, rentals?: Rental[]): number {
  if (product.maintenanceBlocks.some((block) => overlaps(dates, block))) return 0;
  const variant = product.variants.find((entry) => entry.id === variantId);
  if (!variant) return 0;
  if (Array.isArray(rentals)) {
    return Math.max(0, (Number(variant.total) || 0) - getVariantBookedQuantity(product.id, variantId, dates, rentals));
  }
  return Math.max(0, (Number(variant.total) || 0) - variant.held);
}

export function firstAvailableVariant(product: Product, dates: DateRange, rentals: Rental[]): ProductVariant {
  return product.variants.find((variant) => getVariantAvailability(product, variant.id, dates, rentals) > 0) ?? product.variants[0];
}

export function overlaps(a: DateRange, b: DateRange) {
  return a.start <= b.end && b.start <= a.end;
}

export function availabilityTone(value: ProductAvailabilityState): Tone {
  if (value === 'available') return 'success';
  if (value === 'partially_booked' || value === 'limited') return 'warning';
  return 'danger';
}

export function variantSummary(product: Product, dates: DateRange, locale: Locale, t: TFunction, rentals: Rental[]): string {
  const available = product.variants.filter((variant) => getVariantAvailability(product, variant.id, dates, rentals) > 0);
  if (available.length === 0) return t('customer.product.unavailableAction');
  if (available.length === 1) return `${variantLabel(t, available[0].label)} ${locale === 'id' ? 'tersedia' : 'available'}`;
  return `${available.map((variant) => variantLabel(t, variant.label)).join(', ')}`;
}

export function getVariantBookedQuantity(productId: string, variantId: string, dates: DateRange, rentals: Rental[]) {
  return rentals
    .filter((rental) => BLOCKING_LIFECYCLES.includes(rental.lifecycle) && overlaps(dates, rental))
    .flatMap((rental) => rental.items)
    .filter((item) => item.productId === productId && item.variantId === variantId)
    .reduce((sum, item) => sum + item.qty, 0);
}

export function getProductDayAvailability(product: Product, date: string, rentals: Rental[] = []): ProductDayAvailability {
  const range = { start: date, end: date };
  const unavailable = !product.active || product.maintenanceBlocks.some((block) => overlaps(range, block));
  const rows = product.variants.map((variant) => {
    const booked = Array.isArray(rentals)
      ? getVariantBookedQuantity(product.id, variant.id, range, rentals)
      : variant.held;
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

export function findNextAvailableWindow(product: Product, variantId: string | null | undefined, dates: DateRange, rentals: Rental[], maxDays = 90): DateRange | null {
  const duration = Math.max(1, dayCount(dates.start, dates.end));
  for (let offset = 1; offset <= maxDays - duration + 1; offset += 1) {
    const start = addDays(dates.start, offset);
    const end = addDays(start, duration - 1);
    const everyDayAvailable = Array.from({ length: duration }).every((_, index) => {
      const date = addDays(start, index);
      if (variantId) return getVariantAvailability(product, variantId, { start: date, end: date }, rentals) > 0;
      return getProductDayAvailability(product, date, rentals).available > 0;
    });
    if (everyDayAvailable) return { start, end };
  }
  return null;
}

export function variantLabel(t: TFunction, variant: string) {
  return variant === 'package' ? t('variant.package') : variant;
}

function firstText(...values: Array<unknown>) {
  const value = values.find((entry) => String(entry ?? '').trim());
  return String(value ?? '').trim();
}

function translatedOrFallback(t: TFunction, key: string | undefined, fallback = '') {
  if (!key) return fallback;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function productName(product: Product, t: TFunction) {
  return localizeContent(product.name, 'id', product.nameId ?? product.nameEn ?? translatedOrFallback(t, product.nameKey, t('common.empty')));
}

export function productMeta(product: Product, t: TFunction) {
  return localizeContent(product.meta, 'id', product.metaId ?? product.metaEn ?? translatedOrFallback(t, product.metaKey, t('common.empty')));
}

export function productAlt(product: Product, t: TFunction) {
  return localizeContent(product.alt, 'id', product.altId ?? product.altEn ?? productName(product, t));
}

export function localizeContent(value: unknown, locale: Locale | string = 'id', fallback = '') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as { translations?: Record<string, unknown>; source?: unknown };
    const translations = record.translations && typeof record.translations === 'object' ? record.translations : {};
    const translated = translations[locale];
    return String(translated || record.source || fallback || '').trim();
  }
  return String(value ?? fallback ?? '').trim();
}

export function toSourceContent(value: unknown, fallback = ''): Exclude<LocalizedContent, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as { translations?: Record<string, string>; source?: unknown; sourceLocale?: Locale | string };
    const translations = record.translations && typeof record.translations === 'object' ? record.translations : {};
    return {
      sourceLocale: record.sourceLocale || 'id',
      source: firstText(record.source, fallback),
      translations: { ...translations },
    };
  }
  return {
    sourceLocale: 'id',
    source: String(value ?? fallback ?? '').trim(),
    translations: {},
  };
}

export function contentSource(value: unknown, fallback = '') {
  return toSourceContent(value, fallback).source;
}

export function productDescription(product: Product, locale: Locale, t: TFunction) {
  return localizeContent(
    product.description,
    locale,
    firstText(
      product.descriptionId,
      product.descriptionEn,
      product.bundleId,
      product.bundleEn,
      translatedOrFallback(t, product.copyKey, t('common.empty')),
    ),
  );
}

export function selectedVariantNotes(product: Product, variantId: string, locale: Locale, t: TFunction) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const variant = variants.find((entry) => entry.id === variantId) ?? variants[0] ?? {};
  return localizeContent(
    variant.notes,
    locale,
    firstText(
      variant.notesId,
      variant.notesEn,
      product.variantNotesId,
      product.variantNotesEn,
      product.measurementId,
      product.measurementEn,
      t('common.empty'),
    ),
  );
}

export function productGallery(product: Product, t: TFunction): ProductImage[] {
  const fallbackSrc = product.image ?? '';
  const fallbackAlt = productAlt(product, t);
  const fallbackLabel = productName(product, t);
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const normalized: ProductImage[] = rawImages
    .map((image, index): ProductImage | null => {
      if (typeof image === 'string') {
        return image
          ? {
              id: `${product.id}-image-${index}`,
              src: image,
              alt: fallbackAlt,
              label: fallbackLabel,
              isCover: false,
            }
          : null;
      }

      const src = image.src ?? image.image ?? '';
      if (!src) return null;
      return {
        id: image.id ?? `${product.id}-image-${index}`,
        src,
        alt: image.alt ?? fallbackAlt,
        label: image.label ?? fallbackLabel,
        isCover: Boolean(image.isCover),
      };
    })
    .filter((image): image is ProductImage => Boolean(image));
  const uniqueImages = normalized.reduce<ProductImage[]>((unique, image) => {
    const existingIndex = unique.findIndex((entry) => entry.src === image.src);
    if (existingIndex < 0) return [...unique, image];
    if (image.isCover && !unique[existingIndex].isCover) {
      return unique.map((entry, index) => (index === existingIndex ? image : entry));
    }
    return unique;
  }, []);

  if (uniqueImages.length === 0) {
    return fallbackSrc
      ? [{ id: `${product.id}-legacy-cover`, src: fallbackSrc, alt: fallbackAlt, label: fallbackLabel, isCover: true }]
      : [];
  }

  const markedCoverIndex = uniqueImages.findIndex((image) => image.isCover);
  const legacyCoverIndex = fallbackSrc ? uniqueImages.findIndex((image) => image.src === fallbackSrc) : -1;
  const coverIndex = markedCoverIndex >= 0 ? markedCoverIndex : legacyCoverIndex >= 0 ? legacyCoverIndex : 0;
  const gallery = uniqueImages.map((image, index) => ({ ...image, isCover: index === coverIndex }));
  const cover = gallery[coverIndex];
  return cover ? [cover, ...gallery.filter((_, index) => index !== coverIndex)] : gallery;
}

export function productCoverImage(product: Product, t: TFunction) {
  return productGallery(product, t).find((image) => image.isCover)?.src ?? product.image ?? '';
}

export function formatRupiah(value: number | string) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
}

export function formatDate(value: string | undefined, locale: Locale) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateRange(value: DateRange, locale: Locale) {
  return `${formatDate(value.start, locale)} - ${formatDate(value.end, locale)}`;
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').replace(/^0/, '62');
}

type ClientSource = Pick<Rental | RentalRequest, 'customerName' | 'phone' | 'email' | 'notes'>;

export function upsertClient(clients: Client[], source: ClientSource): Client[] {
  const existing = clients.find((client) => normalizePhone(client.phone) === normalizePhone(source.phone));
  if (existing) {
    return clients.map((client) =>
      client === existing
        ? {
            ...client,
            name: source.customerName,
            email: source.email,
            totalRentals: client.totalRentals + 1,
            lastContact: '27 Mei 2026',
          }
        : client,
    );
  }
  return [
    {
      id: `client-${Date.now()}`,
      name: source.customerName,
      phone: source.phone,
      email: source.email,
      totalRentals: 1,
      lastContact: '27 Mei 2026',
      notes: source.notes,
    },
    ...clients,
  ];
}

export function hasRentalChanged<T>(previous: T, next: T) {
  return JSON.stringify(previous) !== JSON.stringify(next);
}

export function appendActivity<T extends { activity: ActivityItem[] }>(record: T, activity: Omit<ActivityItem, 'id' | 'time'>): T {
  const activityItems = Array.isArray(record.activity) ? record.activity : [];
  const latest = activityItems[0];

  if (latest?.textId === activity.textId && latest?.textEn === activity.textEn) {
    return { ...record, activity: activityItems };
  }

  const timestamp = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date()).replace(',', '');

  return {
    ...record,
    activity: [
      {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: timestamp,
        ...activity,
      },
      ...activityItems,
    ],
  };
}

export function activityText(textId: string, textEn: string): Omit<ActivityItem, 'id' | 'time'> {
  return { textId, textEn };
}

export function updateVariantTotal(product: Product, variantId: string, delta: number): Product {
  return {
    ...product,
    variants: product.variants.map((variant) =>
      variant.id === variantId ? { ...variant, total: Math.max(variant.held, (Number(variant.total) || 0) + delta) } : variant,
    ),
  };
}

export function applyItemHoldDelta(products: Product[], items: RentalItem[], delta: number): Product[] {
  return products.map((product) => {
    const productItems = items.filter((item) => item.productId === product.id);
    if (productItems.length === 0) return product;

    return {
      ...product,
      variants: product.variants.map((variant) => {
        const qtyDelta = productItems
          .filter((item) => item.variantId === variant.id)
          .reduce((sum, item) => sum + item.qty * delta, 0);
        return qtyDelta === 0 ? variant : { ...variant, held: Math.max(0, Math.min(Number(variant.total) || 0, variant.held + qtyDelta)) };
      }),
    };
  });
}

export function shouldReleaseHold(previousLifecycle: RentalLifecycle, nextLifecycle: RentalLifecycle) {
  return BLOCKING_LIFECYCLES.includes(previousLifecycle) && ['returned', 'rejected', 'cancelled'].includes(nextLifecycle);
}

export function localizedData(item: Record<string, unknown>, field: string, t: TFunction): string {
  const locale = document.documentElement.lang === 'en' ? 'en' : 'id';
  const idValue = item[`${field}Id`];
  const enValue = item[`${field}En`];
  return String((locale === 'id' ? idValue : enValue) ?? idValue ?? t('common.empty'));
}

export function getAdminMetrics(rentals: Rental[], requests: RentalRequest[] = []) {
  const pendingRequests = requests.filter((request) => request.outcome === 'pending');
  return {
    requested: pendingRequests.length,
    staleRequests: pendingRequests.filter((request) => request.staleHours >= 24).length,
    deliveryRequests: pendingRequests.filter((request) => request.fulfillment === 'delivery').length,
    ready: rentals.filter((rental) => ['preparing', 'ready_pickup'].includes(rental.lifecycle)).length,
    outWithCustomer: rentals.filter((rental) => ['out_delivery', 'on_rent'].includes(rental.lifecycle)).length,
    returnedOpen: rentals.filter((rental) => rental.lifecycle === 'returned' && rental.paymentStatus !== 'verified').length,
    overdue: rentals.filter((rental) => rental.lifecycle === 'on_rent').length,
    completed: rentals.filter((rental) => rental.lifecycle === 'completed').length,
  };
}

export function getAdminTitle(section: string | undefined, t: TFunction) {
  const map: Record<string, string> = {
    requests: 'admin.requests.title',
    rentals: 'admin.rentals.title',
    catalogue: 'admin.catalogue.title',
    clients: 'admin.clients.title',
    notifications: 'admin.notifications.title',
    settings: 'admin.settings.title',
  };
  return t((section ? map[section] : undefined) ?? 'admin.header.title');
}

export function getAdminCopy(section: string | undefined, t: TFunction) {
  const map: Record<string, string> = {
    requests: 'admin.requests.copy',
    rentals: 'admin.rentals.copy',
    catalogue: 'admin.catalogue.copy',
    clients: 'admin.clients.copy',
    notifications: 'admin.notifications.copy',
    settings: 'admin.settings.copy',
  };
  return t((section ? map[section] : undefined) ?? 'admin.header.copy');
}

export function resolveTagline(settings: Settings, scope: 'customer' | 'admin' | 'staff', t: TFunction) {
  if (scope === 'customer') return settings.customerTaglineCustom || t(settings.customerTaglineKey);
  return settings.staffTaglineCustom || t(settings.staffTaglineKey);
}
