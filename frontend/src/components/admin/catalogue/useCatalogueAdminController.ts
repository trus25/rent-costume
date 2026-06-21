import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATALOGUE_MAX_IMAGE_COUNT,
  cloneProduct,
  ensureSingleCover,
  getDraftImages,
  hasErrors,
  makeVariantId,
  normalizeProductForSave,
  stableProductJson,
  toNonNegativeNumber,
  toStoredImage,
  validateDetails,
  validateNewVariant,
  validateVariants,
} from './catalogueAdminUtils';
import { getProductStockSummaries, getProductStockSummary } from '../../../lib/availability';
import { productCoverImage, productName, toSourceContent } from '../../../lib/rental-utils';
import { resetMobileDetailScroll } from '../../../lib/mobile-detail';
import type {
  CreateProductDraft,
  DetailErrorMap,
  NewVariantDraft,
  NewVariantErrors,
  SaveState,
  VariantErrorMap,
} from './catalogueAdminUtils';
import type { CatalogueEditorTab } from './catalogueEditorUtils';
import type { MaintenanceDraft, MediaItemsUpdater, ProductDraftPatch, VariantPatch } from './catalogueEditorTypes';
import type { DataAdapter, Product, ProductVariant, Rental, TFunction } from '../../../types/domain';
import type { StateSetter } from '../../../types/app';

type UseCatalogueAdminControllerParams = {
  t: TFunction;
  products: Product[];
  setProducts: StateSetter<Product[]>;
  rentals: Rental[];
  dataAdapter?: DataAdapter;
  selectedProductId?: string;
  onOpenProduct?: (productId: string) => void;
  onCreateSuccess?: (productId: string) => void;
};

export function useCatalogueAdminController({
  t,
  products,
  setProducts,
  rentals,
  dataAdapter,
  selectedProductId,
  onOpenProduct,
  onCreateSuccess,
}: UseCatalogueAdminControllerParams) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedProductId ?? products[0]?.id);
  const editorOpen = Boolean(selectedProductId);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateProductDraft>({ name: '', meta: '', category: 'formal', gender: 'unisex', price: '', variantLabel: 'M', total: 1 });
  const [productDraft, setProductDraft] = useState(cloneProduct(products[0]));
  const [activeTab, setActiveTab] = useState<CatalogueEditorTab>('details');
  const [newVariant, setNewVariant] = useState<NewVariantDraft>({ label: '', total: 1, notes: '' });
  const [newVariantErrors, setNewVariantErrors] = useState<NewVariantErrors>({});
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceDraft>({ start: '', end: '', reason: '' });
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle', message: '' });
  const [switchTargetId, setSwitchTargetId] = useState('');
  const variantLabelRef = useRef<HTMLInputElement | null>(null);

  const selected = selectedProductId
    ? products.find((product) => product.id === selectedProductId)
    : products.find((product) => product.id === selectedId) ?? products[0];
  const filtered = products.filter((product) => productName(product, t).toLowerCase().includes(query.trim().toLowerCase()));
  const mediaItems = useMemo(() => getDraftImages(productDraft, t), [productDraft, t]);
  const stockSummaries = useMemo(() => getProductStockSummaries(products, rentals), [products, rentals]);
  const stockSummary = useMemo(
    () => productDraft ? getProductStockSummary(productDraft, rentals) : null,
    [productDraft, rentals],
  );
  const coverImage = mediaItems.find((image) => image.isCover) ?? mediaItems[0];
  const detailErrors = useMemo<DetailErrorMap>(() => validateDetails(productDraft, t), [productDraft, t]);
  const variantErrors = useMemo<VariantErrorMap>(() => {
    const heldByVariant = Object.fromEntries((stockSummary?.variants ?? []).map((variant) => [variant.variantId, variant.held]));
    return validateVariants(productDraft?.variants ?? [], t, heldByVariant);
  }, [productDraft?.variants, stockSummary, t]);
  const hasValidationErrors = hasErrors(detailErrors) || Object.values(variantErrors).some(hasErrors);
  const isDirty = Boolean(selected && productDraft && stableProductJson(selected) !== stableProductJson(productDraft));

  useEffect(() => {
    if (selected) return;
    setSelectedId(products[0]?.id);
  }, [products, selected]);

  useEffect(() => {
    if (selectedProductId) setSelectedId(selectedProductId);
  }, [selectedProductId]);

  useEffect(() => {
    setProductDraft(cloneProduct(selected));
    setNewVariant({ label: '', total: 1, notes: '' });
    setNewVariantErrors({});
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setActiveTab('details');
    setSaveState({ status: 'idle', message: '' });
  }, [selected?.id]);

  useEffect(() => {
    if (editorOpen) resetMobileDetailScroll();
  }, [editorOpen, selected?.id]);

  const updateDraft = (changes: ProductDraftPatch) => {
    resetSavedState(setSaveState);
    setProductDraft((current) => (current ? { ...current, ...changes } : current));
  };

  const updateVariant = (variantId: string, changes: VariantPatch) => {
    resetSavedState(setSaveState);
    const { total, ...variantChanges } = changes;
    const normalizedChanges: Partial<ProductVariant> =
      total === undefined
        ? variantChanges
        : { ...variantChanges, total: total === '' ? '' : Number(total) || 0 };
    setProductDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: current.variants.map((variant) => (variant.id === variantId ? { ...variant, ...normalizedChanges } : variant)),
      };
    });
  };

  const updateMediaItems: MediaItemsUpdater = (updater) => {
    resetSavedState(setSaveState);
    setProductDraft((current) => {
      if (!current) return current;
      const currentImages = getDraftImages(current, t);
      const nextImages = ensureSingleCover(updater(currentImages).slice(0, CATALOGUE_MAX_IMAGE_COUNT));
      const nextCover = nextImages.find((image) => image.isCover) ?? nextImages[0];
      return {
        ...current,
        image: nextCover?.src ?? '',
        images: nextImages.map(toStoredImage),
      };
    });
  };

  const adjustVariantTotal = (variantId: string, delta: number) => {
    resetSavedState(setSaveState);
    setProductDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: current.variants.map((variant) => {
          if (variant.id !== variantId) return variant;
          const held = stockSummary?.variants.find((entry) => entry.variantId === variant.id)?.held ?? 0;
          const currentTotal = Number(variant.total) || 0;
          return { ...variant, total: Math.max(Math.max(1, held), currentTotal + delta) };
        }),
      };
    });
  };

  const addVariant = () => {
    const label = newVariant.label.trim();
    const stock = Number(newVariant.total);
    const errors = validateNewVariant({ label, stock, variants: productDraft?.variants ?? [], t });
    setNewVariantErrors(errors);
    if (hasErrors(errors) || !productDraft) {
      if (errors.label) window.requestAnimationFrame(() => variantLabelRef.current?.focus());
      return;
    }

    resetSavedState(setSaveState);
    const id = makeVariantId(label, productDraft.variants);
    setProductDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        variants: [
          ...current.variants,
          {
            id,
            label,
            total: stock,
            held: 0,
            notes: toSourceContent(newVariant.notes.trim()),
          },
        ],
      };
    });
    setNewVariant({ label: '', total: 1, notes: '' });
    setNewVariantErrors({});
    window.requestAnimationFrame(() => variantLabelRef.current?.focus());
  };

  const createProduct = () => {
    const name = createDraft.name.trim();
    const meta = createDraft.meta.trim();
    const variantLabel = createDraft.variantLabel.trim();
    if (!name || !variantLabel) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `catalogue-${Date.now()}`;
    const uniqueId = products.some((product) => product.id === slug) ? `${slug}-${products.length + 1}` : slug;
    const fallbackMeta = createDraft.category === 'accessory' ? 'Aksesori' : 'Adat formal';
    const sourceProduct = selected ?? products[0];
    const coverSrc = sourceProduct ? productCoverImage(sourceProduct, t) : '';
    const nextProduct: Product = {
      id: uniqueId,
      image: coverSrc,
      images: coverSrc ? [{ id: `${uniqueId}-cover`, src: coverSrc, alt: name, label: name, isCover: true }] : [],
      category: createDraft.category,
      region: createDraft.category === 'accessory' ? 'dance' : 'bali',
      gender: createDraft.gender,
      active: false,
      unitKey: createDraft.category === 'accessory' ? 'customer.product.unitPack' : 'customer.product.unitSet',
      name,
      meta: meta || fallbackMeta,
      alt: name,
      price: toNonNegativeNumber(createDraft.price),
      availability: 'available',
      description: toSourceContent('Tambahkan deskripsi produk'),
      variants: [{
        id: variantLabel.toUpperCase(),
        label: variantLabel.toUpperCase(),
        total: Math.max(1, Number(createDraft.total) || 1),
        held: 0,
        notes: toSourceContent('Tambahkan catatan varian'),
      }],
      maintenanceBlocks: [],
    };
    setProducts((current) => [nextProduct, ...current]);
    setSelectedId(nextProduct.id);
    setCreateOpen(false);
    setCreateDraft({ name: '', meta: '', category: 'formal', gender: 'unisex', price: '', variantLabel: 'M', total: 1 });
    onCreateSuccess?.(nextProduct.id);
  };

  const removeVariant = (variantId: string) => {
    resetSavedState(setSaveState);
    setProductDraft((current) => {
      if (!current) return current;
      if (current.variants.length <= 1) {
        setSaveState({ status: 'error', message: t('admin.catalogue.errorLastVariant') });
        return current;
      }
      return {
        ...current,
        variants: current.variants.filter((variant) => variant.id !== variantId),
      };
    });
  };

  const saveProduct = async () => {
    if (!selected || !productDraft) return false;
    if (hasValidationErrors) {
      setSaveState({ status: 'error', message: t('admin.catalogue.fixValidation') });
      return false;
    }

    const nextProduct = normalizeProductForSave(productDraft, t);
    setSaveState({ status: 'saving', message: t('admin.catalogue.saving') });
    try {
      if (dataAdapter) {
        await dataAdapter.admin.products.save(nextProduct);
      } else {
        setProducts((current) => current.map((product) => (product.id === selected.id ? nextProduct : product)));
      }
      setProductDraft(cloneProduct(nextProduct));
      setSaveState({ status: 'saved', message: t('admin.catalogue.saved') });
      window.setTimeout(() => setSaveState((current) => (current.status === 'saved' ? { status: 'idle', message: '' } : current)), 2400);
      return true;
    } catch {
      setSaveState({ status: 'error', message: t('admin.catalogue.saveError') });
      return false;
    }
  };

  const resetProduct = () => {
    setProductDraft(cloneProduct(selected));
    setNewVariant({ label: '', total: 1, notes: '' });
    setNewVariantErrors({});
    setMaintenanceOpen(false);
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setSaveState({ status: 'idle', message: '' });
  };

  const requestProductSwitch = (productId: string) => {
    if (productId === selected?.id) {
      onOpenProduct?.(productId);
      return;
    }
    if (isDirty) {
      setSwitchTargetId(productId);
      return;
    }
    setSelectedId(productId);
    onOpenProduct?.(productId);
  };

  const saveAndSwitch = async () => {
    const saved = await saveProduct();
    if (!saved) return;
    setSelectedId(switchTargetId);
    onOpenProduct?.(switchTargetId);
    setSwitchTargetId('');
  };

  const discardAndSwitch = () => {
    setSelectedId(switchTargetId);
    onOpenProduct?.(switchTargetId);
    setSwitchTargetId('');
  };

  const saveMaintenanceBlock = () => {
    if (!maintenanceDraft.start || !maintenanceDraft.end || !productDraft) return;
    resetSavedState(setSaveState);
    setProductDraft((current) => (current ? {
      ...current,
      maintenanceBlocks: [
        ...current.maintenanceBlocks,
        {
          id: `maintenance-${Date.now()}`,
          start: maintenanceDraft.start,
          end: maintenanceDraft.end,
          reason: (maintenanceDraft.reason ?? '').trim(),
        },
      ],
    } : current));
    setMaintenanceDraft({ start: '', end: '', reason: '' });
    setMaintenanceOpen(false);
  };

  const removeMaintenanceBlock = (blockIndex: number) => {
    resetSavedState(setSaveState);
    setProductDraft((current) => (current ? {
      ...current,
      maintenanceBlocks: current.maintenanceBlocks.filter((_, index) => index !== blockIndex),
    } : current));
  };

  return {
    query,
    setQuery,
    selected,
    filtered,
    editorOpen,
    createOpen,
    setCreateOpen,
    createDraft,
    setCreateDraft,
    productDraft,
    activeTab,
    setActiveTab,
    newVariant,
    setNewVariant,
    newVariantErrors,
    setNewVariantErrors,
    maintenanceOpen,
    setMaintenanceOpen,
    maintenanceDraft,
    setMaintenanceDraft,
    saveState,
    switchTargetId,
    variantLabelRef,
    mediaItems,
    coverImage,
    detailErrors,
    variantErrors,
    stockSummaries,
    stockSummary,
    hasValidationErrors,
    isDirty,
    updateDraft,
    updateVariant,
    updateMediaItems,
    adjustVariantTotal,
    addVariant,
    createProduct,
    removeVariant,
    saveProduct,
    resetProduct,
    requestProductSwitch,
    saveAndSwitch,
    discardAndSwitch,
    saveMaintenanceBlock,
    removeMaintenanceBlock,
    clearSwitchTarget: () => setSwitchTargetId(''),
  };
}

function resetSavedState(setSaveState: StateSetter<SaveState>) {
  setSaveState((current) => (current.status === 'saved' || current.status === 'error' ? { status: 'idle', message: '' } : current));
}
