
import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { StatusPill } from '../../shared';
import { formatDateRange, productAlt, productCoverImage, productName, variantLabel } from '../../../lib/rental-utils';
import type { Locale, Product, Rental, RentalRequest, TFunction } from '../../../types/domain';

type ItemizedRecord = Pick<Rental | RentalRequest, 'reference' | 'items'>;
type ActivityRecord = Pick<Rental | RentalRequest, 'activity'>;

type RecordPanelProps = {
  rental: Rental;
  products: Product[];
  t: TFunction;
  locale: Locale;
  children?: ReactNode;
};

export function RecordPanel({ rental, products, t, locale, children }: RecordPanelProps) {
  return (
    <aside className="record-panel" aria-label={t('admin.panel.aria')}>
      <div className="record-panel-head">
        <span className="eyebrow">{t('admin.common.selected')}</span>
        <strong>{rental.reference}</strong>
      </div>
      <p>{t('admin.panel.copy')}</p>
      <div className="inline-status">
        <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
        <StatusPill type="payment" value={rental.paymentStatus} t={t} />
      </div>
      <RentalItems rental={rental} products={products} t={t} />
      <dl className="record-fields">
        <div>
          <dt>{t('admin.panel.date')}</dt>
          <dd>{formatDateRange(rental, locale)}</dd>
        </div>
        <div>
          <dt>{t('admin.panel.fulfillment')}</dt>
          <dd>{t(`enum.fulfillment.${rental.fulfillment}`)}</dd>
        </div>
        <div>
          <dt>{t('common.phone')}</dt>
          <dd>{rental.phone}</dd>
        </div>
        <div>
          <dt>{t('common.notes')}</dt>
          <dd>{rental.notes || '-'}</dd>
        </div>
      </dl>
      {children}
      <ActivityLog rental={rental} locale={locale} t={t} />
    </aside>
  );
}

type ChecklistProps = {
  rental: Rental;
  locale: Locale;
  onToggle: (itemId: string) => void;
  t: TFunction;
};

export function Checklist({ rental, locale, onToggle, t }: ChecklistProps) {
  return (
    <div className="checklist">
      <span className="section-kicker">{t('admin.rentals.checklist')}</span>
      {rental.checklist.map((item) => (
        <label className="checkbox-row" key={item.id}>
          <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
          <span>{locale === 'id' ? item.labelId : item.labelEn}</span>
        </label>
      ))}
    </div>
  );
}

type ActivityLogProps = {
  rental: ActivityRecord;
  locale: Locale;
  t: TFunction;
};

export function ActivityLog({ rental, locale, t }: ActivityLogProps) {
  return (
    <div className="activity-log">
      <span className="section-kicker">{t('admin.common.activity')}</span>
      {rental.activity.map((item) => (
        <div className="activity-item" key={item.id}>
          <Clock aria-hidden="true" />
          <div>
            <strong>{item.time}</strong>
            <p>{locale === 'id' ? item.textId : item.textEn}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

type RentalItemsProps = {
  rental: ItemizedRecord;
  products: Product[];
  t: TFunction;
  compact?: boolean;
};

export function RentalItems({ rental, products, t, compact = false }: RentalItemsProps) {
  return (
    <div className={`rental-items ${compact ? 'compact' : ''}`}>
      {rental.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return product ? (
          <div className="rental-item" key={`${rental.reference}-${item.productId}-${item.variantId}`}>
            {!compact ? <img src={productCoverImage(product, t)} alt={productAlt(product, t)} /> : null}
            <div>
              <strong>{productName(product, t)}</strong>
              <small>{variantLabel(t, item.variantId)} x {item.qty}</small>
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}
