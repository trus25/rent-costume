import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildAvailabilityMap,
  filterCatalogueProducts,
  RESULT_BATCH_SIZE,
  type AvailabilityByProduct,
  type CatalogueFilters,
} from './catalogueControllerUtils';
import type {
  AvailabilityRow,
  DataAdapter,
  DateRange,
  Product,
  Rental,
  Settings,
  TFunction,
} from '../../../types/domain';

export function useCatalogueListing({
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
}: {
  appliedDates: DateRange;
  appliedQuery: string;
  dataAdapter?: DataAdapter;
  favorites: string[];
  favoritesOnly: boolean;
  filters: CatalogueFilters;
  hasSearched: boolean;
  products: Product[];
  rentals: Rental[];
  settings: Settings;
  t: TFunction;
}) {
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(RESULT_BATCH_SIZE);
  const [availabilityByProduct, setAvailabilityByProduct] = useState<AvailabilityByProduct>({});
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const displayedProducts = useMemo(
    () => visibleProducts.slice(0, visibleCount),
    [visibleProducts, visibleCount],
  );
  const hasMoreProducts = visibleCount < visibleProducts.length;

  useEffect(() => {
    setVisibleCount(RESULT_BATCH_SIZE);
  }, [
    appliedQuery,
    appliedDates.start,
    appliedDates.end,
    filters.region,
    filters.type,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    favoritesOnly,
  ]);

  useEffect(() => {
    if (!hasSearched) {
      setCatalogueLoading(false);
      setCatalogueError('');
      setVisibleProducts([]);
      setAvailabilityByProduct({});
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCatalogueLoading(true);
      setCatalogueError('');
      const listPromise = dataAdapter
        ? dataAdapter.catalogue.list({
            q: appliedQuery,
            region: filters.region,
            type: filters.type,
            gender: filters.gender,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sort: filters.sort,
            start: appliedDates.start,
            end: appliedDates.end,
            page: 1,
            pageSize: 96,
            signal: controller.signal,
          })
        : Promise.resolve({
            items: filterCatalogueProducts({
              products,
              settings,
              query: appliedQuery,
              filters,
              dates: appliedDates,
              rentals,
              t,
            }),
          });

      listPromise
        .then((result) => {
          const favoriteIds = new Set(favorites);
          setVisibleProducts(favoritesOnly ? result.items.filter((product) => favoriteIds.has(product.id)) : result.items);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setCatalogueError(t('customer.catalogue.loadError'));
          setVisibleProducts([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setCatalogueLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    hasSearched,
    appliedQuery,
    filters.region,
    filters.type,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    favoritesOnly,
    favorites,
    appliedDates.start,
    appliedDates.end,
    products,
    settings,
    rentals,
    t,
    dataAdapter,
  ]);

  useEffect(() => {
    const productIds = displayedProducts.map((product) => product.id);
    if (!hasSearched || !dataAdapter || productIds.length === 0) {
      setAvailabilityByProduct({});
      return undefined;
    }

    const controller = new AbortController();
    dataAdapter.availability
      .batch({
        productIds,
        start: appliedDates.start,
        end: appliedDates.end,
        signal: controller.signal,
      })
      .then((rows: AvailabilityRow[]) => setAvailabilityByProduct(buildAvailabilityMap(rows)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') setAvailabilityByProduct({});
      });

    return () => controller.abort();
  }, [hasSearched, displayedProducts, appliedDates.start, appliedDates.end, dataAdapter]);

  useEffect(() => {
    if (!hasMoreProducts) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(current + RESULT_BATCH_SIZE, visibleProducts.length));
        }
      },
      { rootMargin: '220px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreProducts, visibleProducts.length]);

  return {
    availabilityByProduct,
    catalogueError,
    catalogueLoading,
    displayedProducts,
    hasMoreProducts,
    sentinelRef,
    visibleProducts,
  };
}
