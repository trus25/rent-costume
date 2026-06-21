import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  aggregateDayAvailability,
  buildMonthGrid,
  formatMonth,
  getMonthRange,
  monthKey,
  shiftMonth,
} from './calendarUtils';
import {
  formatDate,
  variantLabel,
} from '../../../lib/rental-utils';
import { getProductDayAvailability } from '../../../lib/availability';
import type { AvailabilityRow, DataAdapter, DateRange, Locale, Product, ProductDayAvailability, Rental, TFunction } from '../../../types/domain';

export function ProductAvailabilityCalendar({
  product,
  selectedVariantId,
  dates,
  locale,
  t,
  rentals,
  dataAdapter,
}: {
  product: Product;
  selectedVariantId: string;
  dates: DateRange;
  locale: Locale;
  t: TFunction;
  rentals: Rental[];
  dataAdapter?: DataAdapter;
}) {
  const [monthCursor, setMonthCursor] = useState(monthKey(dates.start));
  const [inspectedDate, setInspectedDate] = useState(dates.start);
  const [availabilityRows, setAvailabilityRows] = useState<AvailabilityRow[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const monthRange = useMemo(() => getMonthRange(monthCursor), [monthCursor]);
  const rowsByDate = useMemo(() => {
    const byDate = new Map<string, AvailabilityRow[]>();
    availabilityRows.forEach((row) => {
      const rows = byDate.get(row.date) ?? [];
      rows.push(row);
      byDate.set(row.date, rows);
    });
    return byDate;
  }, [availabilityRows]);
  const getDayAvailability = (day: string): ProductDayAvailability => {
    const rows = rowsByDate.get(day);
    const fallback = getProductDayAvailability(product, day, rentals);
    return rows?.length ? aggregateDayAvailability(product, day, rows, fallback) : fallback;
  };
  const inspected = getDayAvailability(inspectedDate);
  const weekdayLabels = useMemo(() => {
    const base = new Date('2026-06-07T00:00:00');
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }).format(date);
    });
  }, [locale]);

  useEffect(() => {
    setMonthCursor(monthKey(dates.start));
    setInspectedDate(dates.start);
  }, [dates.start]);

  useEffect(() => {
    if (!dataAdapter) return undefined;
    const controller = new AbortController();
    setAvailabilityLoading(true);
    setAvailabilityError('');
    dataAdapter.availability
      .batch({
        productIds: [product.id],
        start: monthRange.start,
        end: monthRange.end,
        signal: controller.signal,
      })
      .then((rows) => setAvailabilityRows(rows))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setAvailabilityError(t('customer.calendar.loadError'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [product.id, monthRange.start, monthRange.end, rentals, t]);

  return (
    <section className="availability-calendar availability-calendar-panel" aria-label={t('customer.calendar.aria')}>
      <div className="calendar-board">
        <div className="calendar-heading">
          <div>
            <span className="visually-hidden">{t('customer.calendar.title')}</span>
            <strong>{variantLabel(t, selectedVariant?.label ?? selectedVariantId)}</strong>
          </div>
          <div className="calendar-controls">
            <button type="button" onClick={() => setMonthCursor((current) => shiftMonth(current, -1))} aria-label={t('customer.calendar.previous')}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <span>{formatMonth(monthCursor, locale)}</span>
            <button type="button" onClick={() => setMonthCursor((current) => shiftMonth(current, 1))} aria-label={t('customer.calendar.next')}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="calendar-grid" role="grid" aria-label={formatMonth(monthCursor, locale)}>
          {weekdayLabels.map((label) => (
            <span className="calendar-weekday" key={label}>
              {label}
            </span>
          ))}
          {monthDays.map((day, index) => {
            if (!day) return <span className="calendar-day empty" aria-hidden="true" key={`empty-${index}`} />;

            const dayInfo = getDayAvailability(day);
            const inSelectedRange = day >= dates.start && day <= dates.end;
            return (
              <button
                className={`calendar-day ${dayInfo.state} ${inspectedDate === day ? 'selected' : ''} ${inSelectedRange ? 'in-range' : ''}`}
                type="button"
                key={day}
                onClick={() => setInspectedDate(day)}
                aria-label={t('customer.calendar.dayAria', {
                  date: formatDate(day, locale),
                  state: t(`enum.availability.${dayInfo.state}`),
                  available: dayInfo.available,
                })}
              >
                <span>{Number(day.slice(-2))}</span>
                <small>{dayInfo.available}</small>
              </button>
            );
          })}
        </div>

        <div className="calendar-legend" aria-label={t('customer.calendar.legend')}>
          {['unavailable', 'fully_booked', 'partially_booked', 'available'].map((state) => (
            <span className={`legend-item ${state}`} key={state}>
              <i aria-hidden="true" />
              {t(`enum.availability.${state}`)}
            </span>
          ))}
        </div>

        {availabilityLoading || availabilityError ? (
          <div className="calendar-feedback">
            {availabilityLoading ? <p className="calendar-hint">{t('customer.calendar.loading')}</p> : null}
            {availabilityError ? <p className="validation-message">{availabilityError}</p> : null}
          </div>
        ) : null}
      </div>

      <aside className="calendar-inspector">
        <div>
          <span className="eyebrow">{formatDate(inspectedDate, locale)}</span>
          <strong>{t(`enum.availability.${inspected.state}`)}</strong>
        </div>
        <div className="calendar-stock-list">
          {inspected.variants.map((variant) => (
            <span
              className={`calendar-stock-chip ${selectedVariantId === variant.variantId ? 'selected' : ''}`}
              key={variant.variantId}
            >
              <span>{variantLabel(t, variant.label)}</span>
              <b>{variant.available}/{variant.total}</b>
            </span>
          ))}
        </div>
      </aside>
    </section>
  );
}
