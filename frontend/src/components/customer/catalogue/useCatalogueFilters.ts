import { useCallback, useMemo, useState } from 'react';
import type { NavigateOptions } from 'react-router-dom';
import type { Product, TFunction } from '../../../types/domain';
import {
  buildActiveFilterSummaries,
  FILTER_KEYS,
  uniqueProductValues,
  type CatalogueFilters,
  type CatalogueParamUpdates,
} from './catalogueControllerUtils';

type UpdateCatalogueParams = (updates: CatalogueParamUpdates, options?: NavigateOptions) => void;

export function useCatalogueFilters({
  favorites,
  favoritesOnly,
  filters,
  products,
  t,
  updateCatalogueParams,
}: {
  favorites: string[];
  favoritesOnly: boolean;
  filters: CatalogueFilters;
  products: Product[];
  t: TFunction;
  updateCatalogueParams: UpdateCatalogueParams;
}) {
  const [activeFilter, setActiveFilter] = useState('');
  const regionOptions = useMemo(() => uniqueProductValues(products, 'region'), [products]);
  const typeOptions = useMemo(() => uniqueProductValues(products, 'category'), [products]);
  const activeFilterCount = useMemo(() => FILTER_KEYS.reduce((count, key) => {
    if (key === 'favorites') return count + (favoritesOnly ? 1 : 0);
    const value = filters[key];
    if (key === 'sort') return count + (value && value !== 'relevance' ? 1 : 0);
    return count + (value && value !== 'all' ? 1 : 0);
  }, 0), [favoritesOnly, filters]);
  const secondaryFilterCount = useMemo(() => (
    (favoritesOnly ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.gender !== 'all' ? 1 : 0) +
    (filters.sort !== 'relevance' ? 1 : 0)
  ), [favoritesOnly, filters.gender, filters.maxPrice, filters.minPrice, filters.sort]);
  const activeFilterSummaries = useMemo(
    () => buildActiveFilterSummaries({
      filters,
      favoritesOnly,
      favoritesCount: favorites.length,
      t,
    }),
    [favorites.length, favoritesOnly, filters, t],
  );

  const clearFilters = useCallback(() => {
    updateCatalogueParams({
      region: undefined,
      type: undefined,
      gender: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
      favorites: undefined,
    }, { replace: false });
    setActiveFilter('');
  }, [updateCatalogueParams]);

  return {
    activeFilter,
    activeFilterCount,
    activeFilterSummaries,
    clearFilters,
    regionOptions,
    secondaryFilterCount,
    setActiveFilter,
    typeOptions,
  };
}
