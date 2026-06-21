import { defaultDates } from '../../../mockData';
import { availabilityRank, getProductAvailability } from '../../../lib/availability';
import {
  productMeta,
  productName,
} from '../../../lib/rental-utils';
import type {
  AvailabilityRow,
  DateRange,
  Product,
  ProductAvailabilityState,
  Rental,
  Settings,
  TFunction,
} from '../../../types/domain';

export const RESULT_BATCH_SIZE = 6;
export const FILTER_KEYS = ['region', 'type', 'gender', 'minPrice', 'maxPrice', 'sort', 'favorites'] as const;
export const emptyFavorites: string[] = [];

export type CatalogueFilters = {
  region: string;
  type: string;
  gender: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

export type CatalogueParamUpdates = Partial<Record<(typeof FILTER_KEYS)[number] | 'q' | 'start' | 'end' | 'search', string | undefined | null>>;

export type ActiveFilterSummary = {
  key: string;
  label: string;
  value: string | number;
};

export type AvailabilityByProduct = Partial<Record<string, ProductAvailabilityState>>;

export function readCatalogueDates(searchParams: URLSearchParams): DateRange {
  return {
    start: searchParams.get('start') || defaultDates.start,
    end: searchParams.get('end') || defaultDates.end,
  };
}

export function readFilterValue(searchParams: URLSearchParams, key: string, fallback = 'all') {
  return searchParams.get(key) || fallback;
}

export function readPriceValue(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) || '';
}

export function optionLabel(value: string, t: TFunction, prefix: string) {
  if (!value || value === 'all') return t('customer.filters.all');
  const key = `${prefix}.${value}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function uniqueProductValues(products: Product[], key: 'region' | 'category' | 'gender') {
  return [...new Set(products.map((product) => product[key]).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b));
}

export function buildActiveFilterSummaries({
  filters,
  favoritesOnly,
  favoritesCount,
  t,
}: {
  filters: CatalogueFilters;
  favoritesOnly: boolean;
  favoritesCount: number;
  t: TFunction;
}): ActiveFilterSummary[] {
  const items: ActiveFilterSummary[] = [];
  if (favoritesOnly) items.push({ key: 'favorites', label: t('customer.filters.favorites'), value: favoritesCount });
  if (filters.region && filters.region !== 'all') items.push({ key: 'region', label: t('customer.filters.region'), value: optionLabel(filters.region, t, 'customer.filters.regionOption') });
  if (filters.type && filters.type !== 'all') items.push({ key: 'type', label: t('customer.filters.type'), value: optionLabel(filters.type, t, 'customer.filters.typeOption') });
  if (filters.minPrice || filters.maxPrice) items.push({ key: 'price', label: t('customer.filters.price'), value: priceLabel(filters, t) });
  if (filters.gender && filters.gender !== 'all') items.push({ key: 'gender', label: t('customer.filters.gender'), value: optionLabel(filters.gender, t, 'enum.gender') });
  if (filters.sort && filters.sort !== 'relevance') items.push({ key: 'sort', label: t('customer.filters.sort'), value: t(`customer.sort.${filters.sort}`) });
  return items;
}

export function filterCatalogueProducts({
  products,
  settings,
  query,
  filters,
  dates,
  rentals,
  t,
}: {
  products: Product[];
  settings: Settings;
  query: string;
  filters: CatalogueFilters;
  dates: DateRange;
  rentals: Rental[];
  t: TFunction;
}) {
  if (!settings.publicCatalogue) return [];
  const normalized = query.trim().toLowerCase();
  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);
  const hasMinPrice = Number.isFinite(minPrice) && filters.minPrice !== '';
  const hasMaxPrice = Number.isFinite(maxPrice) && filters.maxPrice !== '';
  const filtered = products.filter((product) => {
    const name = productName(product, t).toLowerCase();
    const meta = productMeta(product, t).toLowerCase();
    const searchText = `${name} ${meta} ${product.region} ${product.category} ${product.gender ?? 'unisex'}`;
    const regionMatches = !filters.region || filters.region === 'all' || product.region === filters.region;
    const typeMatches = !filters.type || filters.type === 'all' || product.category === filters.type;
    const genderMatches = !filters.gender || filters.gender === 'all' || (product.gender ?? 'unisex') === filters.gender;
    const minMatches = !hasMinPrice || Number(product.price) >= minPrice;
    const maxMatches = !hasMaxPrice || Number(product.price) <= maxPrice;
    return product.active && regionMatches && typeMatches && genderMatches && minMatches && maxMatches && (!normalized || searchText.includes(normalized));
  });
  return sortCatalogueProducts(filtered, filters.sort, dates, rentals);
}

export function buildAvailabilityMap(rows: AvailabilityRow[]): AvailabilityByProduct {
  const byProductAndDate = rows.reduce((map, row) => {
    const key = `${row.productId}:${row.date}`;
    const dayRows = map.get(key) ?? [];
    dayRows.push(row);
    map.set(key, dayRows);
    return map;
  }, new Map<string, AvailabilityRow[]>());

  return [...byProductAndDate.entries()].reduce<AvailabilityByProduct>((result, [key, dayRows]) => {
    const productId = key.split(':')[0];
    const available = dayRows.reduce((sum, row) => sum + row.available, 0);
    const booked = dayRows.reduce((sum, row) => sum + row.booked, 0);
    const dayState = dayRows.every((row) => row.state === 'unavailable')
      ? 'unavailable'
      : available <= 0
        ? 'fully_booked'
        : booked > 0
          ? 'partially_booked'
          : 'available';

    if (!result[productId]) {
      result[productId] = dayState;
    } else if (dayState === 'unavailable') {
      result[productId] = 'unavailable';
    } else if (dayState === 'fully_booked' && result[productId] !== 'unavailable') {
      result[productId] = 'fully_booked';
    } else if (dayState === 'partially_booked' && result[productId] === 'available') {
      result[productId] = 'partially_booked';
    }
    return result;
  }, {});
}

function priceLabel(filters: CatalogueFilters, t: TFunction) {
  if (!filters.minPrice && !filters.maxPrice) return t('customer.filters.all');
  if (filters.minPrice && filters.maxPrice) return t('customer.filters.priceRange', { min: filters.minPrice, max: filters.maxPrice });
  if (filters.minPrice) return t('customer.filters.priceFrom', { min: filters.minPrice });
  return t('customer.filters.priceTo', { max: filters.maxPrice });
}

function sortCatalogueProducts(products: Product[], sort: string, dates: DateRange, rentals: Rental[]) {
  const sorted = [...products];
  if (sort === 'price_asc') return sorted.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price_desc') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === 'availability') {
    return sorted.sort((a, b) => availabilityRank(getProductAvailability(a, dates, rentals)) - availabilityRank(getProductAvailability(b, dates, rentals)));
  }
  return sorted;
}
