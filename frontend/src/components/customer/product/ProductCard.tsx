import { Link, type To } from 'react-router-dom';
import { StatusPill } from '../../shared';
import {
  findNextAvailableWindow,
  formatDateRange,
  formatRupiah,
  productAlt,
  productCoverImage,
  productDescription,
  productMeta,
  productName,
  variantSummary,
} from '../../../lib/rental-utils';
import { getMaintenanceReason, getProductAvailability } from '../../../lib/availability';
import type { DateRange, Locale, Product, ProductAvailabilityState, Rental, TFunction } from '../../../types/domain';

export function ProductCard({
  product,
  dates,
  detailTo,
  locale,
  t,
  rentals,
  availabilityOverride,
}: {
  product: Product;
  dates: DateRange;
  detailTo: To;
  locale: Locale;
  t: TFunction;
  rentals: Rental[];
  availabilityOverride?: ProductAvailabilityState;
}) {
  const availability = availabilityOverride ?? getProductAvailability(product, dates, rentals);
  const isBlocked = availability === 'fully_booked' || availability === 'unavailable';
  const maintenanceReason = availability === 'unavailable' ? getMaintenanceReason(product, dates) : '';
  const nextWindow = isBlocked ? findNextAvailableWindow(product, null, dates, rentals) : null;
  const configuredDetailAria = product.detailAriaKey ? t(product.detailAriaKey) : '';
  const detailAria =
    product.detailAria ||
    (configuredDetailAria && configuredDetailAria !== product.detailAriaKey
      ? configuredDetailAria
      : t('customer.product.detailAria', { product: productName(product, t) }));

  return (
    <article className={`product-card customer-product-card ${isBlocked ? 'muted' : ''}`}>
      <Link className="product-media product-card-link" to={detailTo} aria-label={detailAria}>
        <img src={productCoverImage(product, t)} alt={productAlt(product, t)} loading="lazy" />
        <StatusPill type="availability" value={availability} t={t} />
      </Link>
      <div className="product-copy">
        <span className="product-meta">{productMeta(product, t)}</span>
        <div className="product-title-line">
          <h3>{productName(product, t)}</h3>
          <strong>
            {formatRupiah(product.price)}
            <small>{t(product.unitKey)}</small>
          </strong>
        </div>
        <p>{productDescription(product, locale, t)}</p>
        <div className="product-footer">
          <span>
            {maintenanceReason
              ? t('customer.product.unavailableReason', { reason: maintenanceReason })
              : nextWindow
              ? t('customer.product.nextAvailable', { range: formatDateRange(nextWindow, locale) })
              : variantSummary(product, dates, locale, t, rentals)}
          </span>
          <Link to={detailTo}>
            {t('customer.product.detailAction')}
          </Link>
        </div>
      </div>
    </article>
  );
}
