import { Heart, Search, SlidersHorizontal } from 'lucide-react';
import type { RefObject } from 'react';
import type { To } from 'react-router-dom';
import { ProductCard } from '../product/ProductCard';
import { EmptyState } from '../../shared';
import { formatDateRange } from '../../../lib/rental-utils';
import type { DateRange, Locale, Product, ProductAvailabilityState, Rental, TFunction } from '../../../types/domain';

export function CatalogueResults({
  hasSearched,
  t,
  locale,
  appliedDates,
  visibleProducts,
  displayedProducts,
  catalogueLoading,
  favoritesOnly,
  buildDetailTo,
  rentals,
  availabilityByProduct,
  hasMoreProducts,
  sentinelRef,
}: {
  hasSearched: boolean;
  t: TFunction;
  locale: Locale;
  appliedDates: DateRange;
  visibleProducts: Product[];
  displayedProducts: Product[];
  catalogueLoading: boolean;
  favoritesOnly: boolean;
  buildDetailTo: (productId: string) => To;
  rentals: Rental[];
  availabilityByProduct: Partial<Record<string, ProductAvailabilityState>>;
  hasMoreProducts: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
}) {
  if (!hasSearched) {
    return <EmptyState title={t('customer.catalogue.preSearchTitle')} copy={t('customer.catalogue.preSearchCopy')} icon={SlidersHorizontal} />;
  }

  return (
    <>
      <div className="catalogue-result-status" aria-live="polite">
        <span>{t('customer.catalogue.resultCount', { count: visibleProducts.length })}</span>
        <strong>{formatDateRange(appliedDates, locale)}</strong>
      </div>
      {catalogueLoading ? <p className="helper-text">{t('customer.catalogue.loading')}</p> : null}
      {!catalogueLoading && visibleProducts.length === 0 ? (
        <EmptyState
          title={favoritesOnly ? t('customer.favorites.emptyTitle') : t('customer.catalogue.emptyTitle')}
          copy={favoritesOnly ? t('customer.favorites.emptyCopy') : t('customer.catalogue.emptyCopy')}
          icon={favoritesOnly ? Heart : Search}
        />
      ) : (
        <>
          <div className="product-grid" aria-label={t('customer.grid.aria')}>
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                dates={appliedDates}
                locale={locale}
                t={t}
                detailTo={buildDetailTo(product.id)}
                rentals={rentals}
                availabilityOverride={availabilityByProduct[product.id]}
              />
            ))}
          </div>
          {hasMoreProducts ? (
            <div className="load-more-sentinel" ref={sentinelRef}>
              <span>{t('customer.catalogue.loadingMore')}</span>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
