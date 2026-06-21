import type { Dispatch, SetStateAction } from 'react';
import type { CatalogueEditorTab } from './catalogueEditorUtils';
import type {
  CreateProductDraft,
  DetailErrorMap,
  DraftNumber,
  NewVariantDraft,
  NewVariantErrors,
  SaveState,
  VariantErrorMap,
} from './catalogueAdminUtils';
import type { ProductStockSummary } from '../../../lib/availability';
import type { Locale, MaintenanceBlock, Product, ProductImage, ProductVariant, TFunction } from '../../../types/domain';
import type { InputRef, StateSetter } from '../../../types/app';
import type { SelectOption } from '../../shared';

export type MaintenanceDraft = MaintenanceBlock;

export type ProductDraftPatch = Partial<Product>;

export type VariantPatch = Omit<Partial<ProductVariant>, 'total'> & {
  total?: number | string;
};

export type MediaItemsUpdater = (updater: (current: ProductImage[]) => ProductImage[]) => void;

export type CatalogueEditorProps = {
  t: TFunction;
  locale: Locale;
  productDraft: Product;
  stockSummary: ProductStockSummary;
  mediaItems: ProductImage[];
  coverImage?: ProductImage;
  activeTab: CatalogueEditorTab;
  setActiveTab: (tab: string) => void;
  detailErrors: DetailErrorMap;
  variantErrors: VariantErrorMap;
  newVariant: NewVariantDraft;
  newVariantErrors: NewVariantErrors;
  setNewVariant: StateSetter<NewVariantDraft>;
  setNewVariantErrors: StateSetter<NewVariantErrors>;
  updateDraft: (changes: ProductDraftPatch) => void;
  updateVariant: (variantId: string, changes: VariantPatch) => void;
  updateMediaItems: MediaItemsUpdater;
  adjustVariantTotal: (variantId: string, delta: number) => void;
  removeVariant: (variantId: string) => void;
  addVariant: () => void;
  variantLabelRef: InputRef;
  maintenanceOpen: boolean;
  setMaintenanceOpen: Dispatch<SetStateAction<boolean>>;
  maintenanceDraft: MaintenanceDraft;
  setMaintenanceDraft: StateSetter<MaintenanceDraft>;
  saveMaintenanceBlock: () => void;
  removeMaintenanceBlock: (blockIndex: number) => void;
  isDirty: boolean;
  hasValidationErrors: boolean;
  saveState: SaveState;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
  onClose: () => void;
  showCloseButton?: boolean;
  categoryOptions: SelectOption[];
  genderOptions: SelectOption[];
  toNonNegativeDraftNumber: (value: string | number) => DraftNumber;
  toNonNegativeNumber: (value: string | number) => number;
  updateSource: (content: unknown, source: string) => Exclude<Product['name'], string>;
  makeMediaId: () => string;
  readFileAsDataUrl: (file: File) => Promise<string>;
};

export type CatalogueCreateDraft = CreateProductDraft;
