import { useCallback, useMemo } from 'react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { emptyFavorites } from './catalogueControllerUtils';
import { formatDateRange } from '../../../lib/rental-utils';
import { useCatalogueCartDateSync } from './useCatalogueCartDateSync';
import { useCatalogueFilters } from './useCatalogueFilters';
import { useCatalogueListing } from './useCatalogueListing';
import { useCatalogueSearchDraft } from './useCatalogueSearchDraft';
import { useCatalogueUrlState } from './useCatalogueUrlState';
import type {
  CartItem,
  DataAdapter,
  Locale,
  Product,
  Rental,
  Settings,
  TFunction,
} from '../../../types/domain';
import type { StateSetter } from '../../../types/app';

type UseCustomerCatalogueControllerParams = {
  locale: Locale;
  t: TFunction;
  products: Product[];
  rentals: Rental[];
  settings: Settings;
  cart: CartItem[];
  setCart: StateSetter<CartItem[]>;
  dataAdapter?: DataAdapter;
};

export function useCustomerCatalogueController({
  locale,
  t,
  products,
  rentals,
  settings,
  cart,
  setCart,
  dataAdapter,
}: UseCustomerCatalogueControllerParams) {
  const [favorites] = usePersistentState('cr-v2-favorites', emptyFavorites);
  const urlState = useCatalogueUrlState();
  const {
    appliedDates,
    appliedQuery,
    buildDetailTo,
    favoritesOnly,
    filters,
    hasSearched,
    updateCatalogueParams,
  } = urlState;
  const periodLabel = useMemo(() => formatDateRange(appliedDates, locale), [appliedDates, locale]);
  const searchDraft = useCatalogueSearchDraft({
    appliedDates,
    appliedQuery,
    cartItemCount: cart.length,
    t,
    updateCatalogueParams,
  });
  const {
    applySearch,
    dateError,
    draftDates,
    draftQuery,
    setDraftDates,
    setDraftQuery,
    setShowSyncPrompt,
    showSyncPrompt,
  } = searchDraft;
  const filterModel = useCatalogueFilters({
    favorites,
    favoritesOnly,
    filters,
    products,
    t,
    updateCatalogueParams,
  });
  const listing = useCatalogueListing({
    appliedDates,
    appliedQuery,
    dataAdapter,
    favorites,
    favoritesOnly,
    filters,
    hasSearched,
    products,
    rentals,
    settings,
    t,
  });
  const dismissSyncPrompt = useCallback(() => setShowSyncPrompt(false), [setShowSyncPrompt]);
  const syncCartDates = useCatalogueCartDateSync({
    draftDates,
    onSynced: dismissSyncPrompt,
    products,
    rentals,
    setCart,
  });

  return {
    activeFilter: filterModel.activeFilter,
    activeFilterCount: filterModel.activeFilterCount,
    activeFilterSummaries: filterModel.activeFilterSummaries,
    appliedDates,
    applySearch,
    availabilityByProduct: listing.availabilityByProduct,
    buildDetailTo,
    catalogueError: listing.catalogueError,
    catalogueLoading: listing.catalogueLoading,
    clearFilters: filterModel.clearFilters,
    displayedProducts: listing.displayedProducts,
    draftDates,
    draftQuery,
    favorites,
    favoritesOnly,
    filters,
    hasMoreProducts: listing.hasMoreProducts,
    hasSearched,
    periodLabel,
    regionOptions: filterModel.regionOptions,
    secondaryFilterCount: filterModel.secondaryFilterCount,
    sentinelRef: listing.sentinelRef,
    setActiveFilter: filterModel.setActiveFilter,
    setDraftDates,
    setDraftQuery,
    setShowSyncPrompt,
    showSyncPrompt,
    syncCartDates,
    typeOptions: filterModel.typeOptions,
    updateCatalogueParams,
    visibleProducts: listing.visibleProducts,
    dateError,
  };
}
