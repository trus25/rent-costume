import { CalendarDays, CreditCard, PackageCheck, Search } from 'lucide-react';
import { EmptyState, SearchInput, StatusPill } from '../../shared';
import { formatDateRange } from '../../../lib/rental-utils';
import type { StateSetter } from '../../../types/app';
import type { Locale, Rental, TFunction } from '../../../types/domain';
import type { RentalFilter } from './rentalWorkflowTypes';

type RentalListViewProps = {
  t: TFunction;
  locale: Locale;
  query: string;
  setQuery: StateSetter<string>;
  statusFilter: RentalFilter;
  filterCounts: Record<RentalFilter, number>;
  rentalFilters: RentalFilter[];
  filteredRentals: Rental[];
  selected?: Rental;
  onStatusFilterChange: (status: RentalFilter) => void;
  onSelectRental: (reference: string) => void;
};

export function RentalListView({
  t,
  locale,
  query,
  setQuery,
  statusFilter,
  filterCounts,
  rentalFilters,
  filteredRentals,
  selected,
  onStatusFilterChange,
  onSelectRental,
}: RentalListViewProps) {
  return (
    <section className="base-window management-window rental-list-view">
      <div className="rental-filter-strip" aria-label={t('admin.rentals.filtersAria')}>
        <SearchInput value={query} onChange={setQuery} placeholder={t('admin.rentals.searchPlaceholder')} clearLabel={t('common.clear')} />
        <div className="filter-row rental-filter-row">
          {rentalFilters.map((filter) => {
            const active = statusFilter === filter;
            const label = t(`admin.rentals.filter.${filter}`);

            return (
              <button
                className={`filter-chip ${active ? 'active' : ''}`}
                type="button"
                aria-pressed={active}
                aria-label={t('admin.rentals.filterChipAria', {
                  filter: label,
                  count: filterCounts[filter],
                  state: active ? t('admin.rentals.filterStateActive') : t('admin.rentals.filterStateInactive'),
                })}
                onClick={() => onStatusFilterChange(filter)}
                key={filter}
              >
                <span>{label}</span>
                <strong className="filter-count">{filterCounts[filter]}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <div className="management-list padded">
        {filteredRentals.length === 0 ? (
          <EmptyState title={t('admin.rentals.emptyTitle')} copy={t('admin.rentals.emptyCopy')} icon={Search} />
        ) : (
          filteredRentals.map((rental) => (
            <button
              className={`management-card record-mobile-card rental-record-card ${selected?.reference === rental.reference ? 'selected' : ''}`}
              type="button"
              aria-current={selected?.reference === rental.reference ? 'true' : undefined}
              key={rental.reference}
              onClick={() => onSelectRental(rental.reference)}
            >
              <div className="rental-record-main">
                <div>
                  <strong>{rental.reference}</strong>
                  <span>{rental.customerName}</span>
                </div>
                <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
              </div>
              <div className="rental-record-meta">
                <span>
                  <CalendarDays aria-hidden="true" />
                  {formatDateRange(rental, locale)}
                </span>
                <span>
                  <PackageCheck aria-hidden="true" />
                  {t('admin.rentals.itemCount', { count: getRentalItemCount(rental) })}
                </span>
                <span>
                  <CreditCard aria-hidden="true" />
                  {t(`enum.payment.${rental.paymentStatus}`)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function getRentalItemCount(rental: Rental): number {
  return rental.items.reduce((sum, item) => sum + item.qty, 0);
}
