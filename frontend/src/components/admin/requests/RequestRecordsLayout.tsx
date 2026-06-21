import { AlertTriangle, CalendarDays, Search, UserRound } from 'lucide-react';
import { RequestMobileCards, RequestReviewPanel } from './RequestsView';
import { EmptyState, StatusPill } from '../../shared';
import { formatDateRange, productName, variantLabel } from '../../../lib/rental-utils';
import type { Locale, Product, RentalRequest, RequestItemOutcome, TFunction } from '../../../types/domain';

type RequestRecordsLayoutProps = {
  rentals: RentalRequest[];
  selected?: RentalRequest;
  products: Product[];
  t: TFunction;
  locale: Locale;
  canMutateRequest: boolean;
  onSelect: (reference: string) => void;
  onAccept: (rental: RentalRequest) => void;
  onEdit: (rental: RentalRequest) => void;
  onReject: (rental: RentalRequest) => void;
  onSaveRevision: (reference: string, itemOutcomes: RequestItemOutcome[]) => void;
};

export function RequestRecordsLayout({
  rentals,
  selected,
  products,
  t,
  locale,
  canMutateRequest,
  onSelect,
  onAccept,
  onEdit,
  onReject,
  onSaveRevision,
}: RequestRecordsLayoutProps) {
  return (
    <div className="records-layout request-records-layout">
      <RequestMobileCards
        rentals={rentals}
        selectedRef={selected?.reference}
        products={products}
        t={t}
        locale={locale}
        onSelect={onSelect}
      />
      <div className="desktop-request-queue" role="list" aria-label={t('admin.tabs.aria')}>
        {rentals.length === 0 ? (
          <EmptyState title={t('admin.requests.emptyTitle')} copy={t('admin.requests.emptyCopy')} icon={Search} />
        ) : (
          rentals.map((rental) => {
            const selectedRow = selected?.reference === rental.reference;
            const stale = rental.staleHours >= 24;
            const ageLabel = requestQueueAge(rental, locale);
            return (
              <button
                className={`request-queue-card ${selectedRow ? 'selected' : ''} ${stale ? 'is-stale' : ''}`.trim()}
                type="button"
                role="listitem"
                aria-current={selectedRow ? 'true' : undefined}
                onClick={() => onSelect(rental.reference)}
                key={rental.reference}
              >
                <span className="request-queue-card-head">
                  <strong>{rental.reference}</strong>
                  <span className={stale ? 'stale-marker' : ''}>
                    {stale ? <AlertTriangle aria-hidden="true" /> : null}
                    {ageLabel}
                  </span>
                </span>
                <span className="request-queue-customer">
                  <UserRound aria-hidden="true" />
                  <span>{rental.customerName}</span>
                </span>
                <span className="request-queue-items">
                  <span>{t('admin.requests.requestedItems')}</span>
                  <strong>{requestQueueItems(rental, products, t)}</strong>
                </span>
                <span className="request-queue-meta">
                  <StatusPill type="fulfillment" value={rental.fulfillment} t={t} />
                  <StatusPill type="payment" value={rental.paymentStatus} t={t} />
                </span>
                <span className="request-queue-date">
                  <CalendarDays aria-hidden="true" />
                  <span>{formatDateRange(rental, locale)}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
      {selected ? (
        <div className="desktop-record-panel">
          <RequestReviewPanel
            rental={selected}
            products={products}
            t={t}
            locale={locale}
            canMutate={canMutateRequest}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
            onSaveRevision={onSaveRevision}
          />
        </div>
      ) : null}
    </div>
  );
}

function requestQueueAge(rental: RentalRequest, locale: Locale) {
  const hours = Math.max(0, Number(rental.staleHours) || 0);
  const compactAge = locale === 'id'
    ? hours < 1 ? '<1 jam' : `${hours} jam`
    : hours < 1 ? '<1h' : `${hours}h`;

  if (hours >= 24) return locale === 'id' ? `Tertahan ${compactAge}` : `Held ${compactAge}`;
  return locale === 'id' ? `Masuk ${compactAge} lalu` : `Received ${compactAge} ago`;
}

function requestQueueItems(rental: RentalRequest, products: Product[], t: TFunction) {
  const labels = rental.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const productLabel = product ? productName(product, t) : item.productId;
    return `${productLabel} - ${variantLabel(t, item.variantId)} x ${item.qty}`;
  });
  return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');
}
