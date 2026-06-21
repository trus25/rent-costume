import {
  contentSource,
  productAlt,
  productName,
  toSourceContent,
} from '../../../lib/rental-utils';
import { CATALOGUE_MAX_IMAGE_COUNT } from './catalogueEditorUtils';
import type { LocalizedContent, MaintenanceBlock, Product, ProductImage, ProductVariant, TFunction } from '../../../types/domain';

export { CATALOGUE_MAX_IMAGE_COUNT };

export type DraftNumber = number | '';

export type DetailErrorMap = {
  name?: string;
};

export type VariantFieldErrors = {
  label?: string;
  total?: string;
};

export type VariantErrorMap = Record<string, VariantFieldErrors>;

export type NewVariantErrors = {
  label?: string;
  total?: string;
};

export type NewVariantDraft = {
  label: string;
  total: DraftNumber;
  notes: string;
};

export type CreateProductDraft = {
  name: string;
  meta: string;
  category: string;
  gender: string;
  price: DraftNumber;
  variantLabel: string;
  total: DraftNumber;
};

export type SaveState = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message: string;
};

export function cloneProduct(product: Product | null | undefined): Product | null {
  if (!product) return null;
  return {
    ...product,
    variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({ ...variant })) : [],
    maintenanceBlocks: Array.isArray(product.maintenanceBlocks) ? product.maintenanceBlocks.map((block) => ({ ...block })) : [],
    images: Array.isArray(product.images) ? product.images.map((image) => (typeof image === 'string' ? image : { ...image })) : undefined,
  };
}

export function getDraftImages(product: Product | null | undefined, t: TFunction): ProductImage[] {
  if (!product) return [];
  const fallbackAlt = productAlt(product, t);
  const fallbackLabel = productName(product, t);
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const normalized = rawImages
    .map((image, index) => {
      const src = typeof image === 'string' ? image : image?.src ?? image?.image ?? '';
      if (!src) return null;
      return {
        id: typeof image === 'string' ? `${product.id}-image-${index}` : image.id ?? `${product.id}-image-${index}`,
        src,
        alt: typeof image === 'string' ? fallbackAlt : image.alt ?? fallbackAlt,
        label: typeof image === 'string' ? fallbackLabel : image.label ?? fallbackLabel,
        isCover: typeof image === 'string' ? false : Boolean(image.isCover),
      };
    })
    .filter((image): image is ProductImage => Boolean(image));

  if (normalized.length === 0 && product.image) {
    return [{
      id: `${product.id}-legacy-cover`,
      src: product.image,
      alt: fallbackAlt,
      label: fallbackLabel,
      isCover: true,
    }];
  }

  return ensureSingleCover(normalized);
}

export function normalizeProductForSave(product: Product, t: TFunction): Product {
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
    metaId,
    metaEn,
    altId,
    altEn,
    nameKey,
    metaKey,
    altKey,
    copyKey,
    detailAriaKey,
    priceKey,
    unitKey,
    ...rest
  } = product;
  const derivedAlt = productAlt(product, t);
  const images = ensureSingleCover(getDraftImages(product, t)).map((image, index) => toStoredImage({ ...image, alt: derivedAlt }, index));
  const cover = images.find((image) => image.isCover) ?? images[0];
  return {
    ...rest,
    gender: product.gender ?? 'unisex',
    unitKey: normalizeUnitKey(unitKey ?? product.unitKey),
    description: toSourceContent(product.description, firstContentText(descriptionId, descriptionEn, bundleId, bundleEn, literalFallback(copyKey))),
    price: toNonNegativeNumber(product.price),
    image: cover?.src ?? product.image ?? '',
    images,
    variants: product.variants.map((variant) => normalizeVariantForSave(variant, {
      measurementId,
      measurementEn,
      variantNotesId,
      variantNotesEn,
    })),
    maintenanceBlocks: product.maintenanceBlocks.map((block) => ({ ...block })),
  };
}

function normalizeVariantForSave(variant: ProductVariant, productContext: {
  measurementId?: string;
  measurementEn?: string;
  variantNotesId?: string;
  variantNotesEn?: string;
}): ProductVariant {
  const { notesId, notesEn, ...rest } = variant;
  return {
    ...rest,
    label: String(variant.label).trim(),
    total: Math.max(Number(variant.held) || 0, Math.max(1, Number(variant.total) || 1)),
    held: Number(variant.held) || 0,
    notes: toSourceContent(
      variant.notes,
      firstContentText(notesId, notesEn, productContext.variantNotesId, productContext.variantNotesEn, productContext.measurementId, productContext.measurementEn),
    ),
  };
}

export function toNonNegativeDraftNumber(value: string | number): DraftNumber {
  if (value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function toNonNegativeNumber(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function ensureSingleCover(images: ProductImage[]): ProductImage[] {
  const clean = images.filter((image) => image?.src);
  if (clean.length === 0) return [];
  const coverIndex = clean.findIndex((image) => image.isCover);
  const resolvedCoverIndex = coverIndex >= 0 ? coverIndex : 0;
  return clean.map((image, index) => ({ ...image, isCover: index === resolvedCoverIndex }));
}

export function toStoredImage(image: Pick<ProductImage, 'src'> & Partial<ProductImage>, index = 0): ProductImage {
  return {
    id: image.id ?? makeMediaId(),
    src: image.src,
    alt: image.alt ?? '',
    label: image.label ?? `Image ${index + 1}`,
    isCover: Boolean(image.isCover),
  };
}

export function validateDetails(product: Product | null | undefined, t: TFunction): DetailErrorMap {
  if (!product) return {};
  return {
    name: productName(product, t).trim() ? '' : t('common.required'),
  };
}

export function validateVariants(variants: ProductVariant[], t: TFunction): VariantErrorMap {
  const errors: VariantErrorMap = {};
  const labels = new Map<string, string[]>();
  variants.forEach((variant) => {
    const label = String(variant.label ?? '').trim();
    const total = Number(variant.total);
    const held = Number(variant.held) || 0;
    errors[variant.id] = {};
    if (!label) errors[variant.id].label = t('common.required');
    if (!Number.isFinite(total) || total < 1) errors[variant.id].total = t('admin.catalogue.errorStockMin');
    if (Number.isFinite(total) && total < held) errors[variant.id].total = t('admin.catalogue.errorStockHeld', { count: held });
    const key = label.toLowerCase();
    if (key) labels.set(key, [...(labels.get(key) ?? []), variant.id]);
  });

  labels.forEach((ids) => {
    if (ids.length <= 1) return;
    ids.forEach((id) => {
      errors[id] = { ...errors[id], label: t('admin.catalogue.errorDuplicateVariant') };
    });
  });
  return errors;
}

export function validateNewVariant({ label, stock, variants, t }: { label: string; stock: number; variants: ProductVariant[]; t: TFunction }): NewVariantErrors {
  const errors: NewVariantErrors = {};
  if (!label) errors.label = t('common.required');
  if (!Number.isFinite(stock) || stock < 1) errors.total = t('admin.catalogue.errorStockMin');
  if (variants.some((variant) => String(variant.label).trim().toLowerCase() === label.toLowerCase())) {
    errors.label = t('admin.catalogue.errorDuplicateVariant');
  }
  return errors;
}

export function hasErrors(errorMap: Record<string, unknown> | undefined) {
  if (!errorMap) return false;
  return Object.values(errorMap).some(Boolean);
}

export function updateSource(content: unknown, source: string): Exclude<LocalizedContent, string> {
  return {
    ...toSourceContent(content),
    source,
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

export function stableProductJson(product: Product | null | undefined) {
  if (!product) return '';
  return JSON.stringify({
    ...product,
    variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({ ...variant })) : [],
    maintenanceBlocks: Array.isArray(product.maintenanceBlocks) ? product.maintenanceBlocks.map((block) => ({ ...block })) : [],
    images: Array.isArray(product.images) ? product.images.map((image) => (typeof image === 'string' ? image : { ...image })) : undefined,
  });
}

export function makeVariantId(label: string, variants: ProductVariant[]) {
  const base = label.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toUpperCase() || `VARIANT-${Date.now()}`;
  if (!variants.some((variant) => variant.id === base)) return base;
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}

export function makeMediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
