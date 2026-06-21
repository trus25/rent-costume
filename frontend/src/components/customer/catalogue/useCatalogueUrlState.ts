import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, type NavigateOptions, type To } from 'react-router-dom';
import { validateDates } from '../../../lib/rental-utils';
import {
  readCatalogueDates,
  readFilterValue,
  readPriceValue,
  type CatalogueFilters,
  type CatalogueParamUpdates,
} from './catalogueControllerUtils';

export function useCatalogueUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSearched = searchParams.get('search') === '1';
  const favoritesOnly = searchParams.get('favorites') === '1';
  const appliedQuery = searchParams.get('q') ?? '';
  const appliedDates = readCatalogueDates(searchParams);
  const filters = useMemo<CatalogueFilters>(() => ({
    region: readFilterValue(searchParams, 'region'),
    type: readFilterValue(searchParams, 'type'),
    gender: readFilterValue(searchParams, 'gender'),
    minPrice: readPriceValue(searchParams, 'minPrice'),
    maxPrice: readPriceValue(searchParams, 'maxPrice'),
    sort: readFilterValue(searchParams, 'sort', 'relevance'),
  }), [searchParams]);

  useEffect(() => {
    if (hasSearched) return;

    const error = validateDates(appliedDates);
    if (error) return;

    const next = new URLSearchParams(searchParams);
    next.set('start', appliedDates.start);
    next.set('end', appliedDates.end);
    next.set('search', '1');
    setSearchParams(next, { replace: true });
  }, [hasSearched, appliedDates.start, appliedDates.end, searchParams, setSearchParams]);

  const updateCatalogueParams = useCallback((updates: CatalogueParamUpdates, options: NavigateOptions = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all' || (key === 'sort' && value === 'relevance')) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, options);
  }, [searchParams, setSearchParams]);

  const buildDetailTo = useCallback((productId: string): To => {
    const next = new URLSearchParams(searchParams);
    next.set('search', '1');
    next.set('start', appliedDates.start);
    next.set('end', appliedDates.end);
    const search = next.toString();
    return { pathname: `/costumes/${productId}`, search: search ? `?${search}` : '' };
  }, [appliedDates.end, appliedDates.start, searchParams]);

  return {
    appliedDates,
    appliedQuery,
    buildDetailTo,
    favoritesOnly,
    filters,
    hasSearched,
    updateCatalogueParams,
  };
}
