import { X } from 'lucide-react';
import type { TFunction } from '../../../types/domain';
import type { RequestActiveFilter, RequestActiveFilterKey } from './requestTypes';

type RequestActiveFilterChipsProps = {
  filters: RequestActiveFilter[];
  t: TFunction;
  onClearFilter: (key: RequestActiveFilterKey) => void;
  onClearAll: () => void;
};

export function RequestActiveFilterChips({ filters, t, onClearFilter, onClearAll }: RequestActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="request-active-filters" aria-label={t('admin.requests.activeFilters')}>
      <span className="request-active-filters-label">{t('admin.requests.activeFilters')}</span>
      <div className="request-active-filter-list">
        {filters.map((filter) => (
          <button
            className="filter-chip active request-filter-chip"
            type="button"
            aria-label={`${t('admin.requests.clearFilter')} ${filter.label}`}
            onClick={() => onClearFilter(filter.key)}
            key={filter.key}
          >
            <span>
              <strong>{filter.label}</strong>
              {filter.value}
            </span>
            <X aria-hidden="true" />
          </button>
        ))}
        {filters.length > 1 ? (
          <button className="outline-button request-clear-filters" type="button" onClick={onClearAll}>
            <X aria-hidden="true" />
            {t('common.clear')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
