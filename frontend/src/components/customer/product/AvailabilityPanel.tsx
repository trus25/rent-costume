import { ChevronRight } from 'lucide-react';
import {
  getVariantAvailability,
  productName,
} from '../../../lib/rental-utils';
import type { DateRange, Product, Rental, TFunction } from '../../../types/domain';

export function AvailabilityPanel({
  products,
  dates,
  t,
  onOpenCart,
  rentals,
}: {
  products: Product[];
  dates: DateRange;
  t: TFunction;
  onOpenCart: () => void;
  rentals: Rental[];
}) {
  const totals = products.map((product) => ({
    product,
    available: product.variants.reduce((sum, variant) => sum + getVariantAvailability(product, variant.id, dates, rentals), 0),
  }));

  return (
    <aside className="availability-panel" aria-label={t('customer.availability.aria')}>
      <span className="eyebrow">{t('customer.availability.kicker')}</span>
      <h2>{t('customer.availability.title')}</h2>
      <p>{t('customer.availability.copy')}</p>
      <div className="availability-list">
        {totals.map(({ product, available }) => (
          <span key={product.id}>
            {productName(product, t)}
            <b>{available}</b>
          </span>
        ))}
      </div>
      <button type="button" onClick={onOpenCart}>
        {t('customer.availability.action')}
        <ChevronRight aria-hidden="true" />
      </button>
    </aside>
  );
}
