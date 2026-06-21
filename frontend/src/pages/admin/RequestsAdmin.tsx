import * as Tabs from '@radix-ui/react-tabs';
import { ListFilter } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminCreateAction, AdminCreateFab, AdminViewBar, AdminWorkQueueLayout } from '../../components/admin/common/AdminManagement';
import { EditRentalDialog, RejectDialog } from '../../components/admin/rentals/RentalDialogs';
import { RequestReviewPanel } from '../../components/admin/requests/RequestsView';
import { RequestActiveFilterChips } from '../../components/admin/requests/RequestActiveFilterChips';
import { RequestCreatePanel } from '../../components/admin/requests/RequestCreatePanel';
import { RequestFilterSheet } from '../../components/admin/requests/RequestFilterSheet';
import { RequestRecordsLayout } from '../../components/admin/requests/RequestRecordsLayout';
import {
  fulfillmentFilters,
  paymentFilters,
  requestTabs,
  sortModes,
  useRequestsAdminController,
} from '../../components/admin/requests/useRequestsAdminController';
import { adminDetailPath, adminListPath, adminNewPath, searchWithout, type AdminSubroute } from '../../lib/admin-routes';
import type { DataAdapter, Locale, Product, RentalRequest, TFunction } from '../../types/domain';

type RequestsAdminProps = {
  t: TFunction;
  locale: Locale;
  requests: RentalRequest[];
  products: Product[];
  dataAdapter: DataAdapter;
  route: AdminSubroute;
};

export default function RequestsAdmin({ t, locale, requests, products, dataAdapter, route }: RequestsAdminProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const listSearch = searchWithout(location.search, ['reference']);
  const listPath = adminListPath('requests', listSearch);
  const detailReference = route.kind === 'detail' ? route.id : undefined;
  const legacyReference = route.kind === 'list' ? new URLSearchParams(location.search).get('reference') : null;
  const controller = useRequestsAdminController({
    t,
    requests,
    products,
    dataAdapter,
    detailReference,
    onOpenDetail: (reference) => navigate(adminDetailPath('requests', reference, listSearch)),
    onCloseDetail: () => navigate(listPath),
    onCreateSuccess: (rental) => navigate(adminDetailPath('requests', rental.reference), { replace: true }),
  });

  if (legacyReference) {
    return <Navigate to={adminDetailPath('requests', legacyReference, listSearch)} replace />;
  }

  if (route.kind === 'new') {
    return (
      <section className="admin-route-page request-create-page">
        <RequestCreatePanel
          t={t}
          products={products}
          newRequest={controller.newRequest}
          updateNewRequest={controller.updateNewRequest}
          selectedRequestProduct={controller.selectedRequestProduct}
          handleNewRequestProduct={controller.handleNewRequestProduct}
          addError={controller.addError}
          createRequest={controller.createRequest}
          onClose={() => navigate(listPath)}
          standalone
        />
      </section>
    );
  }

  if (route.kind === 'detail') {
    if (!controller.selected) return <Navigate to={listPath} replace />;

    return (
      <section className="admin-route-page request-detail-page">
        <RequestReviewPanel
          rental={controller.selected}
          products={products}
          t={t}
          locale={locale}
          canMutate={controller.canMutateRequest}
          onAccept={controller.acceptRequest}
          onEdit={controller.editRequest}
          onReject={controller.rejectRequest}
          onSaveRevision={controller.saveOutcomeRevision}
        />
        <RejectDialog open={controller.rejectOpen} setOpen={controller.setRejectOpen} t={t} onReject={controller.rejectSelected} />
        <EditRentalDialog
          open={controller.editOpen}
          setOpen={controller.setEditOpen}
          rental={controller.selected}
          t={t}
          onSave={(values) => controller.saveRequestDetails(values.reference, values)}
        />
      </section>
    );
  }

  return (
    <AdminWorkQueueLayout as="section" baseWindow className="requests-window">
      <div className="request-list-view">
        <Tabs.Root value={controller.tab} onValueChange={controller.handleTabChange}>
          <AdminViewBar>
            <Tabs.List className="view-tabs request-tabs" aria-label={t('admin.tabs.aria')}>
              {requestTabs.map((value) => (
                <Tabs.Trigger className="tab-trigger" value={value} key={value}>
                  <span>{value === 'all' ? t('admin.tabs.all') : t(`admin.requests.${value}`)}</span>
                  <strong className="tab-count">{controller.requestCounts[value]}</strong>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <div className="view-actions">
              <AdminCreateAction
                label={t('admin.requests.add')}
                to={adminNewPath('requests', listSearch)}
              />
              <div className="view-tools">
                <button
                  type="button"
                  className={controller.filtersOpen ? 'selected' : ''}
                  aria-expanded={controller.filtersOpen}
                  onClick={() => controller.setFiltersOpen((open) => !open)}
                >
                  <ListFilter aria-hidden="true" />
                  {t('admin.tools.filterSort')}
                  {controller.activeFilters.length > 0 ? <strong className="filter-count">{controller.activeFilters.length}</strong> : null}
                </button>
              </div>
            </div>
          </AdminViewBar>
          <RequestFilterSheet
            open={controller.filtersOpen}
            setOpen={controller.setFiltersOpen}
            t={t}
            query={controller.query}
            setQuery={controller.setQuery}
            fulfillmentFilter={controller.fulfillmentFilter}
            setFulfillmentFilter={controller.setFulfillmentFilter}
            fulfillmentFilters={fulfillmentFilters}
            paymentFilter={controller.paymentFilter}
            setPaymentFilter={controller.setPaymentFilter}
            paymentFilters={paymentFilters}
            sortMode={controller.sortMode}
            setSortMode={controller.setSortMode}
            sortModes={sortModes}
            applyFilters={controller.applyFilters}
            clearFilters={controller.clearFilters}
          />
        </Tabs.Root>

        <RequestActiveFilterChips
          filters={controller.activeFilters}
          t={t}
          onClearFilter={controller.clearActiveFilter}
          onClearAll={controller.clearFilters}
        />

        <AdminCreateFab
          label={t('admin.requests.add')}
          to={adminNewPath('requests', listSearch)}
        />

        <RequestRecordsLayout
          rentals={controller.filtered}
          selected={undefined}
          products={products}
          t={t}
          locale={locale}
          canMutateRequest={false}
          onSelect={controller.selectRequest}
          onAccept={controller.acceptRequest}
          onEdit={controller.editRequest}
          onReject={controller.rejectRequest}
          onSaveRevision={controller.saveOutcomeRevision}
        />
      </div>

      <RejectDialog open={controller.rejectOpen} setOpen={controller.setRejectOpen} t={t} onReject={controller.rejectSelected} />
      <EditRentalDialog
        open={controller.editOpen}
        setOpen={controller.setEditOpen}
        rental={controller.selected}
        t={t}
        onSave={(values) => controller.saveRequestDetails(values.reference, values)}
      />
    </AdminWorkQueueLayout>
  );
}
