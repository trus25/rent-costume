import { contentSource, toSourceContent } from './rental-utils';
import type { Product, ProductVariant } from '../types/domain';

export function normalizeProductContent(product: Product, initialProduct: Partial<Product> = {}): Product {
  const {
    descriptionId,
    descriptionEn,
    bundleId,
    bundleEn,
    measurementId,
    measurementEn,
    variantNotesId,
    variantNotesEn,
    nameId,
    nameEn,
    nameKey,
    metaId,
    metaEn,
    metaKey,
    altId,
    altEn,
    altKey,
    copyKey,
    detailAriaKey,
    priceKey,
    unitKey,
    ...rest
  } = product;
  const name = firstContentText(product.name, nameId, nameEn, initialProduct.name, literalFallback(nameKey));
  const meta = firstContentText(product.meta, metaId, metaEn, initialProduct.meta, literalFallback(metaKey));
  const alt = firstContentText(product.alt, altId, altEn, initialProduct.alt, literalFallback(altKey), name);
  const descriptionFallback = firstContentText(
    descriptionId,
    descriptionEn,
    bundleId,
    bundleEn,
    contentSource(initialProduct.description),
    initialProduct.descriptionId,
    initialProduct.descriptionEn,
    initialProduct.bundleId,
    initialProduct.bundleEn,
    literalFallback(copyKey),
  );
  const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : initialProduct.variants ?? [];
  const maintenanceBlocks = Array.isArray(product.maintenanceBlocks) ? product.maintenanceBlocks : initialProduct.maintenanceBlocks ?? [];

  return {
    ...rest,
    name,
    meta,
    alt,
    unitKey: normalizeUnitKey(unitKey ?? initialProduct.unitKey),
    gender: product.gender ?? initialProduct.gender ?? 'unisex',
    description: toSourceContent(product.description, descriptionFallback),
    variants: variants.map((variant) => normalizeVariantContent(variant, {
      measurementId,
      measurementEn,
      variantNotesId,
      variantNotesEn,
      initialProduct,
    })),
    maintenanceBlocks,
  };
}

export function stableJson(value: unknown) {
  return JSON.stringify(value);
}

function normalizeVariantContent(variant: ProductVariant, productContext: {
  measurementId?: string;
  measurementEn?: string;
  variantNotesId?: string;
  variantNotesEn?: string;
  initialProduct?: Partial<Product>;
}): ProductVariant {
  const { notesId, notesEn, ...rest } = variant;
  const initialVariant = productContext.initialProduct?.variants?.find((entry) => entry.id === variant.id);
  const notesFallback = firstContentText(
    notesId,
    notesEn,
    productContext.variantNotesId,
    productContext.variantNotesEn,
    productContext.measurementId,
    productContext.measurementEn,
    contentSource(initialVariant?.notes),
    initialVariant?.notesId,
    initialVariant?.notesEn,
    productContext.initialProduct?.measurementId,
    productContext.initialProduct?.measurementEn,
  );

  return {
    ...rest,
    notes: toSourceContent(variant.notes, notesFallback),
  };
}

function firstContentText(...values: unknown[]) {
  const value = values.map((entry) => contentSource(entry)).find((entry) => String(entry ?? '').trim());
  return String(value ?? '').trim();
}

function literalFallback(value: string | undefined) {
  if (!value || /^[a-z0-9]+(\.[a-z0-9_-]+)+$/i.test(value)) return '';
  return value;
}

function normalizeUnitKey(unitKey: string | undefined) {
  if (unitKey === 'customer.product.batik.unitSet') return 'customer.product.unitSet';
  if (unitKey === 'customer.product.songket.unitPack') return 'customer.product.unitPack';
  return unitKey ?? 'customer.product.unitSet';
}
