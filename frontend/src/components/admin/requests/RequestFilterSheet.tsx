import { X } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet';
import { Field, SearchInput, SelectField } from '../../shared';
import type { StateSetter } from '../../../types/app';
import type { TFunction } from '../../../types/domain';
import type {
  RequestFulfillmentFilter,
  RequestPaymentFilter,
  RequestSortMode,
} from './requestTypes';

type RequestFilterSheetProps = {
  open: boolean;
  setOpen: StateSetter<boolean>;
  t: TFunction;
  query: string;
  setQuery: StateSetter<string>;
  fulfillmentFilter: RequestFulfillmentFilter;
  setFulfillmentFilter: StateSetter<RequestFulfillmentFilter>;
  fulfillmentFilters: RequestFulfillmentFilter[];
  paymentFilter: RequestPaymentFilter;
  setPaymentFilter: StateSetter<RequestPaymentFilter>;
  paymentFilters: RequestPaymentFilter[];
  sortMode: RequestSortMode;
  setSortMode: StateSetter<RequestSortMode>;
  sortModes: RequestSortMode[];
  applyFilters: () => void;
  clearFilters: () => void;
};

export function RequestFilterSheet({
  open,
  setOpen,
  t,
  query,
  setQuery,
  fulfillmentFilter,
  setFulfillmentFilter,
  fulfillmentFilters,
  paymentFilter,
  setPaymentFilter,
  paymentFilters,
  sortMode,
  setSortMode,
  sortModes,
  applyFilters,
  clearFilters,
}: RequestFilterSheetProps) {
  return (
    <AdminBottomSheet
      as="div"
      open={open}
      onClose={() => setOpen(false)}
      className="filter-panel request-filter-sheet"
      backdropClassName="request-filter-backdrop"
      ariaLabel={t('admin.requests.filtersAria')}
      closeLabel={t('common.close')}
    >
      <AdminSheetHeader
        kicker={t('admin.tools.filterSort')}
        title={t('admin.requests.filtersTitle')}
        closeLabel={t('common.close')}
        onClose={() => setOpen(false)}
      />
      <Field label={t('admin.requests.filterSearch')}>
        <SearchInput
          as="span"
          value={query}
          onChange={setQuery}
          placeholder={t('admin.requests.filterSearchPlaceholder')}
          clearLabel={t('common.clear')}
        />
      </Field>
      <SelectField
        label={t('admin.table.fulfillment')}
        value={fulfillmentFilter}
        onValueChange={(value) => setFulfillmentFilter(value as RequestFulfillmentFilter)}
        options={fulfillmentFilters.map((value) => ({
          value,
          label: value === 'all' ? t('admin.requests.filterAllFulfillment') : t(`enum.fulfillment.${value}`),
        }))}
      />
      <SelectField
        label={t('admin.table.payment')}
        value={paymentFilter}
        onValueChange={(value) => setPaymentFilter(value as RequestPaymentFilter)}
        options={paymentFilters.map((value) => ({
          value,
          label: value === 'all' ? t('admin.requests.filterAllPayment') : t(`enum.payment.${value}`),
        }))}
      />
      <SelectField
        label={t('admin.tools.sort')}
        value={sortMode}
        onValueChange={(value) => setSortMode(value as RequestSortMode)}
        options={sortModes.map((mode) => ({
          value: mode,
          label: t(`admin.tools.sort.${mode}`),
        }))}
      />
      <div className="filter-actions">
        <button className="secondary-button" type="button" onClick={applyFilters}>
          {t('common.apply')}
        </button>
        <button className="outline-button" type="button" onClick={clearFilters}>
          <X aria-hidden="true" />
          {t('common.clear')}
        </button>
      </div>
    </AdminBottomSheet>
  );
}
