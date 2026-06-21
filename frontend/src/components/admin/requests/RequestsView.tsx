import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, LockKeyhole, Search, UserRound } from 'lucide-react';
import { RecordActionBar } from '../common/AdminManagement';
import { ActivityLog, RentalItems } from '../rentals/RentalRecordComponents';
import { EmptyState, MobileDetailShell, StatusPill } from '../../shared';
import { formatDateRange, productName, variantLabel } from '../../../lib/rental-utils';
import type { RequestAvailabilityRow } from '../../../lib/availability';
import type { Locale, Product, RentalRequest, RequestItemOutcome, RequestOutcome, TFunction, Tone } from '../../../types/domain';

type RequestMobileDetailProps = {
  rental: RentalRequest;
  products: Product[];
  availabilityRows: RequestAvailabilityRow[];
  t: TFunction;
  locale: Locale;
  canMutate: boolean;
  onBack: () => void;
  onAccept: (rental: RentalRequest) => void;
  onEdit: (rental: RentalRequest) => void;
  onReject: (rental: RentalRequest) => void;
  onSaveRevision: (reference: string, itemOutcomes: RequestItemOutcome[]) => void;
};

export function RequestMobileDetail({ rental, products, availabilityRows, t, locale, canMutate, onBack, onAccept, onEdit, onReject, onSaveRevision }: RequestMobileDetailProps) {
  return (
    <MobileDetailShell
      className="request-mobile-detail-view request-detail-shell"
      backLabel={t('admin.nav.requests')}
      title={rental.reference}
      onBack={onBack}
      actionLabel={t('admin.common.detailActions')}
      actionClassName="request-detail-actionbar"
      actions={canMutate ? (
        <RequestDecisionBar
          rental={rental}
          t={t}
          onAccept={onAccept}
          onEdit={onEdit}
          onReject={onReject}
          className="request-mobile-decisionbar"
          showStatus={false}
        />
      ) : null}
    >
      <RequestReviewPanel
        rental={rental}
        products={products}
        availabilityRows={availabilityRows}
        t={t}
        locale={locale}
        canMutate={canMutate}
        showActions={false}
        onAccept={onAccept}
        onEdit={onEdit}
        onReject={onReject}
        onSaveRevision={onSaveRevision}
      />
    </MobileDetailShell>
  );
}

type RequestMobileCardsProps = {
  rentals: RentalRequest[];
  selectedRef?: string;
  products: Product[];
  t: TFunction;
  locale: Locale;
  onSelect: (reference: string) => void;
};

export function RequestMobileCards({ rentals, selectedRef, products, t, locale, onSelect }: RequestMobileCardsProps) {
  if (rentals.length === 0) {
    return (
      <div className="request-mobile-list">
        <EmptyState title={t('admin.requests.emptyTitle')} copy={t('admin.requests.emptyCopy')} icon={Search} />
      </div>
    );
  }

  return (
    <div className="request-mobile-list" aria-label={t('admin.tabs.aria')}>
      {rentals.map((rental) => {
        const isSelected = selectedRef === rental.reference;
        const isStale = rental.staleHours >= 24;
        const itemSummary = requestItemSummary(rental, products, t);

        return (
          <article className={`record-mobile-card request-mobile-card ${isSelected ? 'selected' : ''} ${isStale ? 'is-stale' : ''}`.trim()} key={rental.reference}>
            <button className="request-card-summary" type="button" aria-current={isSelected ? 'true' : undefined} onClick={() => onSelect(rental.reference)}>
              <span className="request-card-head">
                <span className="request-card-title">
                  <strong>{rental.reference}</strong>
                  <small className={isStale ? 'stale-marker' : ''}>
                    {isStale ? <AlertTriangle aria-hidden="true" /> : null}
                    {requestAgeLabel(rental, locale)}
                  </small>
                </span>
                <StatusPill value={requestOutcomeLabel(rental.outcome, locale)} t={t} tone={requestOutcomeTone(rental.outcome)} />
              </span>
              <span className="request-card-meta">
                <span>
                  <UserRound aria-hidden="true" />
                  <span>{rental.customerName}</span>
                </span>
                <span>
                  <CalendarDays aria-hidden="true" />
                  <span>{formatDateRange(rental, locale)}</span>
                </span>
              </span>
              <span className="request-card-items">
                <span>{t('admin.requests.requestedItems')}</span>
                <strong>{itemSummary}</strong>
              </span>
              <span className="request-card-badges">
                <StatusPill type="fulfillment" value={rental.fulfillment} t={t} />
                <StatusPill type="payment" value={rental.paymentStatus} t={t} />
              </span>
              <span className="request-card-view">{t('common.view')}</span>
            </button>
          </article>
        );
      })}
    </div>
  );
}

type RequestReviewPanelProps = {
  rental: RentalRequest;
  products: Product[];
  availabilityRows: RequestAvailabilityRow[];
  t: TFunction;
  locale: Locale;
  canMutate: boolean;
  showActions?: boolean;
  onAccept: (rental: RentalRequest) => void;
  onEdit: (rental: RentalRequest) => void;
  onReject: (rental: RentalRequest) => void;
  onSaveRevision: (reference: string, itemOutcomes: RequestItemOutcome[]) => void;
};

export function RequestReviewPanel({
  rental,
  products,
  availabilityRows,
  t,
  locale,
  canMutate,
  showActions = true,
  onAccept,
  onEdit,
  onReject,
  onSaveRevision,
}: RequestReviewPanelProps) {
  const isStale = rental.staleHours >= 24;
  const requestAge = requestAgeLabel(rental, locale);
  const hasSavedOutcomes = Array.isArray(rental.itemOutcomes) && rental.itemOutcomes.length > 0;
  const [availabilityChecked, setAvailabilityChecked] = useState(hasSavedOutcomes);
  const [revisionOpen, setRevisionOpen] = useState(hasSavedOutcomes);
  const [revisionError, setRevisionError] = useState('');
  const [revisionSaved, setRevisionSaved] = useState(false);
  const [draftOutcomes, setDraftOutcomes] = useState<RequestItemOutcome[]>(() => buildOutcomeDrafts(rental, products));
  const visibleOutcomes = hasSavedOutcomes ? rental.itemOutcomes ?? [] : revisionSaved ? draftOutcomes : [];

  useEffect(() => {
    const nextHasSavedOutcomes = Array.isArray(rental.itemOutcomes) && rental.itemOutcomes.length > 0;
    setAvailabilityChecked(nextHasSavedOutcomes);
    setRevisionOpen(nextHasSavedOutcomes);
    setRevisionError('');
    setRevisionSaved(false);
    setDraftOutcomes(buildOutcomeDrafts(rental, products));
  }, [rental.reference, rental.itemOutcomes, products]);

  const updateDraftOutcome = (index: number, updates: Partial<RequestItemOutcome>) => {
    setRevisionError('');
    setRevisionSaved(false);
    setDraftOutcomes((current) => current.map((outcome, outcomeIndex) => (
      outcomeIndex === index ? { ...outcome, ...updates } : outcome
    )));
  };

  const saveRevision = () => {
    const normalized = draftOutcomes.map(normalizeOutcome);
    const unbalanced = normalized.some((outcome) => outcomeTotal(outcome) !== outcome.requestedQty);
    if (unbalanced) {
      setRevisionError(t('admin.requests.outcomeBalanceError'));
      setRevisionSaved(false);
      return;
    }

    onSaveRevision(rental.reference, normalized);
    setRevisionError('');
    setRevisionSaved(true);
  };

  return (
    <aside className={`record-panel request-review-panel ${isStale ? 'is-stale' : ''}`.trim()} aria-label={t('admin.requests.reviewAria')}>
      <div className="record-panel-head request-review-head">
        <span className="eyebrow">{t('admin.requests.reviewKicker')}</span>
        <strong>{rental.reference}</strong>
      </div>

      <section className="request-review-customer" aria-label={t('admin.table.customer')}>
        <span className="section-kicker">{t('admin.table.customer')}</span>
        <strong>{rental.customerName}</strong>
        <span>{rental.phone}</span>
        {rental.email ? <span>{rental.email}</span> : null}
      </section>

      <div className="inline-status request-review-status" aria-label={t('common.status')}>
        <StatusPill value={requestOutcomeLabel(rental.outcome, locale)} t={t} tone={requestOutcomeTone(rental.outcome)} />
        <StatusPill type="fulfillment" value={rental.fulfillment} t={t} />
        <StatusPill type="payment" value={rental.paymentStatus} t={t} />
        <StatusPill value={requestAge} t={t} tone={isStale ? 'warning' : 'info'} icon={isStale ? AlertTriangle : Clock3} />
      </div>

      <section className="request-review-section request-review-items">
        <span className="section-kicker">{t('admin.requests.requestedItems')}</span>
        <RentalItems rental={rental} products={products} t={t} />
      </section>

      {canMutate ? (
        <RequestOutcomeRevisionPanel
          rental={rental}
          products={products}
          availabilityRows={availabilityRows}
          t={t}
          availabilityChecked={availabilityChecked}
          revisionOpen={revisionOpen}
          revisionError={revisionError}
          draftOutcomes={draftOutcomes}
          onCheckAvailability={() => {
            setAvailabilityChecked(true);
            setRevisionOpen(true);
            setRevisionError('');
          }}
          onOpenRevision={() => setRevisionOpen(true)}
          onUpdateOutcome={updateDraftOutcome}
          onSaveRevision={saveRevision}
        />
      ) : null}

      {visibleOutcomes.length > 0 ? (
        <RequestOutcomeSummary outcomes={visibleOutcomes} products={products} t={t} />
      ) : null}

      <dl className="record-fields request-review-fields">
        <div>
          <dt>{t('admin.panel.date')}</dt>
          <dd>{formatDateRange(rental, locale)}</dd>
        </div>
        <div>
          <dt>{t('admin.panel.fulfillment')}</dt>
          <dd>{fulfillmentDetail(rental, t)}</dd>
        </div>
        <div>
          <dt>{t('admin.table.payment')}</dt>
          <dd>{paymentDetail(rental, t)}</dd>
        </div>
        <div>
          <dt>{t('admin.requests.staleAge')}</dt>
          <dd>{requestAge}</dd>
        </div>
        <div>
          <dt>{t('common.notes')}</dt>
          <dd>{rental.notes || '-'}</dd>
        </div>
        <div>
          <dt>{t('admin.common.internalNotes')}</dt>
          <dd>{rental.internalNotes || '-'}</dd>
        </div>
      </dl>

      {canMutate && showActions ? (
        <RequestDecisionBar rental={rental} t={t} onAccept={onAccept} onEdit={onEdit} onReject={onReject} />
      ) : null}

      {!canMutate ? <RequestLockedState t={t} /> : null}

      <ActivityLog rental={rental} locale={locale} t={t} />
    </aside>
  );
}

type RequestOutcomeRevisionPanelProps = {
  rental: RentalRequest;
  products: Product[];
  availabilityRows: RequestAvailabilityRow[];
  t: TFunction;
  availabilityChecked: boolean;
  revisionOpen: boolean;
  revisionError: string;
  draftOutcomes: RequestItemOutcome[];
  onCheckAvailability: () => void;
  onOpenRevision: () => void;
  onUpdateOutcome: (index: number, updates: Partial<RequestItemOutcome>) => void;
  onSaveRevision: () => void;
};

function RequestOutcomeRevisionPanel({
  rental,
  products,
  availabilityRows,
  t,
  availabilityChecked,
  revisionOpen,
  revisionError,
  draftOutcomes,
  onCheckAvailability,
  onOpenRevision,
  onUpdateOutcome,
  onSaveRevision,
}: RequestOutcomeRevisionPanelProps) {
  return (
    <section className="request-review-section request-outcome-panel" aria-label={t('admin.requests.outcomeSectionAria')}>
      <div className="request-outcome-head">
        <div>
          <span className="section-kicker">{t('admin.requests.availabilityTitle')}</span>
          <p>{t('admin.requests.availabilityCopy')}</p>
        </div>
        <button type="button" onClick={onCheckAvailability}>
          {t('admin.requests.availabilityCheck')}
        </button>
      </div>

      {availabilityChecked ? (
        <div className="request-availability-grid">
          {rental.items.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            const available = availabilityRows.find((row) => row.productId === item.productId && row.variantId === item.variantId)?.available ?? 0;
            return (
              <div className="request-availability-row" key={`${item.productId}-${item.variantId}`}>
                <span>{product ? productName(product, t) : item.productId}</span>
                <strong>{t('admin.requests.availableQuantity', { count: available })}</strong>
              </div>
            );
          })}
          <button type="button" className="request-revise-action" onClick={onOpenRevision}>
            {t('admin.requests.reviseOutcomes')}
          </button>
        </div>
      ) : null}

      {revisionOpen ? (
        <div className="request-outcome-form">
          {draftOutcomes.map((outcome, index) => {
            const requestedProduct = products.find((entry) => entry.id === outcome.requestedProductId);
            const requestedVariant = requestedProduct?.variants.find((variant) => variant.id === outcome.requestedVariantId);
            const substituteValue = `${outcome.substituteProductId ?? ''}|${outcome.substituteVariantId ?? ''}`;

            return (
              <fieldset className="request-outcome-card" key={`${outcome.requestedProductId}-${outcome.requestedVariantId}`}>
                <legend>
                  {t('admin.requests.originalDemand')}: {requestedProduct ? productName(requestedProduct, t) : outcome.requestedProductId}
                  {' '}
                  {requestedVariant ? variantLabel(t, requestedVariant.label) : outcome.requestedVariantId}
                  {' '}
                  x {outcome.requestedQty}
                </legend>
                <div className="request-outcome-fields">
                  <label>
                    <span>{t('admin.requests.acceptedQuantity')}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={outcome.acceptedQty}
                      onChange={(event) => onUpdateOutcome(index, { acceptedQty: toOutcomeQty(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>{t('admin.requests.substitutedQuantity')}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={outcome.substitutedQty}
                      onChange={(event) => onUpdateOutcome(index, { substitutedQty: toOutcomeQty(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>{t('admin.requests.substituteCostume')}</span>
                    <select
                      value={substituteValue}
                      onChange={(event) => {
                        const [substituteProductId, substituteVariantId] = event.target.value.split('|');
                        onUpdateOutcome(index, { substituteProductId, substituteVariantId });
                      }}
                    >
                      {substituteOptions(products, outcome.requestedProductId, t).map((option) => (
                        <option value={`${option.productId}|${option.variantId}`} key={`${option.productId}-${option.variantId}`}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t('admin.requests.removedQuantity')}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={outcome.removedByCustomerQty}
                      onChange={(event) => onUpdateOutcome(index, { removedByCustomerQty: toOutcomeQty(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>{t('admin.requests.stockoutQuantity')}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={outcome.unfulfilledStockoutQty}
                      onChange={(event) => onUpdateOutcome(index, { unfulfilledStockoutQty: toOutcomeQty(event.target.value) })}
                    />
                  </label>
                </div>
              </fieldset>
            );
          })}

          {revisionError ? (
            <div className="inline-alert warning request-outcome-error">
              <AlertTriangle aria-hidden="true" />
              <p>{revisionError}</p>
            </div>
          ) : null}

          <button type="button" className="request-save-revision" onClick={onSaveRevision}>
            {t('admin.requests.saveRevision')}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function RequestOutcomeSummary({ outcomes, products, t }: { outcomes: RequestItemOutcome[]; products: Product[]; t: TFunction }) {
  return (
    <section className="request-review-section request-outcome-summary">
      <span className="section-kicker">{t('admin.requests.outcomeSummary')}</span>
      <strong>{t('admin.requests.revisionSaved')}</strong>
      <p>{t('admin.requests.revisionSavedCopy')}</p>
      <dl className="record-fields request-outcome-fields-summary">
        {outcomes.map((outcome) => {
          const requestedLabel = outcomeItemLabel(products, outcome.requestedProductId, outcome.requestedVariantId, t);
          const substituteLabel = outcome.substituteProductId
            ? outcomeItemLabel(products, outcome.substituteProductId, outcome.substituteVariantId, t)
            : '-';

          return (
            <div className="request-outcome-summary-card" key={`${outcome.requestedProductId}-${outcome.requestedVariantId}`}>
              <dt>{t('admin.requests.originalDemand')}</dt>
              <dd>{requestedLabel} x {outcome.requestedQty}</dd>
              <dt>{t('admin.requests.acceptedOutcome')}</dt>
              <dd>{outcome.acceptedQty}</dd>
              <dt>{t('admin.requests.substitutedOutcome')}</dt>
              <dd>{outcome.substitutedQty > 0 ? `${outcome.substitutedQty} - ${substituteLabel}` : '0'}</dd>
              <dt>{t('admin.requests.removedOutcome')}</dt>
              <dd>{outcome.removedByCustomerQty}</dd>
              <dt>{t('admin.requests.stockoutOutcome')}</dt>
              <dd>{outcome.unfulfilledStockoutQty}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

type RequestDecisionBarProps = {
  rental: RentalRequest;
  t: TFunction;
  onAccept: (rental: RentalRequest) => void;
  onEdit: (rental: RentalRequest) => void;
  onReject: (rental: RentalRequest) => void;
  className?: string;
  showStatus?: boolean;
};

export function RequestDecisionBar({
  rental,
  t,
  onAccept,
  onEdit,
  onReject,
  className = '',
  showStatus = true,
}: RequestDecisionBarProps) {
  return (
    <RecordActionBar
      className={`request-decision-bar ${className}`.trim()}
      label={t('admin.common.detailActions')}
      status={showStatus ? t('admin.requests.decisionReady') : undefined}
      primary={(
        <button type="button" onClick={() => onAccept(rental)}>
          {t('admin.requests.accept')}
        </button>
      )}
      secondary={<button type="button" onClick={() => onEdit(rental)}>{t('admin.requests.editAction')}</button>}
      destructive={<button className="danger-action" type="button" onClick={() => onReject(rental)}>{t('admin.requests.rejectAction')}</button>}
    />
  );
}

function RequestLockedState({ t }: { t: TFunction }) {
  return (
    <div className="inline-alert warning request-locked-state">
      <LockKeyhole aria-hidden="true" />
      <div>
        <strong>{t('admin.requests.lockedTitle')}</strong>
        <p>{t('admin.requests.notPending')}</p>
      </div>
    </div>
  );
}

function buildOutcomeDrafts(rental: RentalRequest, products: Product[]): RequestItemOutcome[] {
  return rental.items.map((item, index) => {
    const saved = rental.itemOutcomes?.find((outcome) => (
      outcome.requestedProductId === item.productId && outcome.requestedVariantId === item.variantId
    )) ?? rental.itemOutcomes?.[index];
    const fallbackSubstitute = firstSubstituteOption(products, item.productId);

    return {
      requestedProductId: item.productId,
      requestedVariantId: item.variantId,
      requestedQty: Math.max(0, Number(item.qty) || 0),
      acceptedQty: toOutcomeQty(saved?.acceptedQty ?? item.qty),
      substitutedQty: toOutcomeQty(saved?.substitutedQty ?? 0),
      removedByCustomerQty: toOutcomeQty(saved?.removedByCustomerQty ?? 0),
      unfulfilledStockoutQty: toOutcomeQty(saved?.unfulfilledStockoutQty ?? 0),
      substituteProductId: saved?.substituteProductId ?? fallbackSubstitute?.productId,
      substituteVariantId: saved?.substituteVariantId ?? fallbackSubstitute?.variantId,
    };
  });
}

function firstSubstituteOption(products: Product[], requestedProductId: string) {
  const product = products.find((entry) => entry.id !== requestedProductId && entry.variants.length > 0)
    ?? products.find((entry) => entry.variants.length > 0);
  const variant = product?.variants[0];
  return product && variant ? { productId: product.id, variantId: variant.id } : null;
}

function substituteOptions(products: Product[], requestedProductId: string, t: TFunction) {
  return products
    .filter((product) => product.id !== requestedProductId && product.variants.length > 0)
    .map((product) => ({
      productId: product.id,
      variantId: product.variants[0].id,
      label: productName(product, t),
    }));
}

function toOutcomeQty(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalizeOutcome(outcome: RequestItemOutcome): RequestItemOutcome {
  return {
    ...outcome,
    requestedQty: toOutcomeQty(outcome.requestedQty),
    acceptedQty: toOutcomeQty(outcome.acceptedQty),
    substitutedQty: toOutcomeQty(outcome.substitutedQty),
    removedByCustomerQty: toOutcomeQty(outcome.removedByCustomerQty),
    unfulfilledStockoutQty: toOutcomeQty(outcome.unfulfilledStockoutQty),
  };
}

function outcomeTotal(outcome: RequestItemOutcome) {
  return outcome.acceptedQty + outcome.substitutedQty + outcome.removedByCustomerQty + outcome.unfulfilledStockoutQty;
}

function outcomeItemLabel(products: Product[], productId: string | undefined, variantId: string | undefined, t: TFunction) {
  const product = products.find((entry) => entry.id === productId);
  const variant = product?.variants.find((entry) => entry.id === variantId);
  if (!product) return productId ?? '-';
  return `${productName(product, t)} - ${variant ? variantLabel(t, variant.label) : variantId ?? '-'}`;
}

function requestItemSummary(rental: RentalRequest, products: Product[], t: TFunction) {
  const items = rental.items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return '';
      return `${productName(product, t)} - ${variantLabel(t, item.variantId)} x ${item.qty}`;
    })
    .filter(Boolean);
  return items.length ? items.join(', ') : '-';
}

function requestAgeLabel(rental: RentalRequest, locale: Locale) {
  const hours = Math.max(0, Number(rental.staleHours) || 0);
  const compactAge = locale === 'id'
    ? hours < 1 ? '<1 jam' : `${hours} jam`
    : hours < 1 ? '<1h' : `${hours}h`;
  if (hours >= 24) return locale === 'id' ? `Tertahan ${compactAge}` : `Waiting ${compactAge}`;
  return locale === 'id' ? `Masuk ${compactAge} lalu` : `Received ${compactAge} ago`;
}

function fulfillmentDetail(rental: RentalRequest, t: TFunction) {
  if (rental.fulfillment === 'delivery') {
    const detail = rental.deliveryWindow || rental.address || rental.deliveryNotes;
    return detail ? `${t('enum.fulfillment.delivery')} - ${detail}` : t('enum.fulfillment.delivery');
  }
  return rental.pickupWindow ? `${t('enum.fulfillment.pickup')} - ${rental.pickupWindow}` : t('enum.fulfillment.pickup');
}

function paymentDetail(rental: RentalRequest, t: TFunction) {
  const status = t(`enum.payment.${rental.paymentStatus}`);
  return status;
}

function requestOutcomeLabel(outcome: RequestOutcome, locale: Locale) {
  if (outcome === 'accepted') return locale === 'id' ? 'Diterima' : 'Accepted';
  if (outcome === 'rejected') return locale === 'id' ? 'Ditolak' : 'Rejected';
  return 'Pending';
}

function requestOutcomeTone(outcome: RequestOutcome): Tone {
  if (outcome === 'accepted') return 'success';
  if (outcome === 'rejected') return 'danger';
  return 'warning';
}
