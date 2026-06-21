import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminWorkQueueLayout } from '../../components/admin/common/AdminManagement';
import { OverrideDialog } from '../../components/admin/rentals/RentalDialogs';
import { RentalListView } from '../../components/admin/rentals/RentalListView';
import { RentalWorkflowDetail } from '../../components/admin/rentals/RentalWorkflowDetail';
import { rentalFilters, useRentalsAdminController } from '../../components/admin/rentals/useRentalsAdminController';
import { adminDetailPath, adminListPath, searchWithout, type AdminSubroute } from '../../lib/admin-routes';
import type { StateSetter } from '../../types/app';
import type { Locale, Product, Rental, Settings as AppSettings, TFunction } from '../../types/domain';

type RentalsAdminProps = {
  t: TFunction;
  locale: Locale;
  rentals: Rental[];
  setRentals: StateSetter<Rental[]>;
  products: Product[];
  setProducts: StateSetter<Product[]>;
  settings: AppSettings;
  route: AdminSubroute;
};

export default function RentalsAdmin({ t, locale, rentals, setRentals, products, setProducts, settings, route }: RentalsAdminProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const listSearch = searchWithout(location.search, ['reference']);
  const listPath = adminListPath('rentals', listSearch);
  const detailReference = route.kind === 'detail' ? route.id : undefined;
  const controller = useRentalsAdminController({
    t,
    rentals,
    setRentals,
    products,
    setProducts,
    settings,
    detailReference,
    onOpenDetail: (reference) => navigate(adminDetailPath('rentals', reference, listSearch)),
    onCloseDetail: () => navigate(listPath),
  });

  if (route.kind === 'new') {
    return <Navigate to={listPath} replace />;
  }

  if (route.kind === 'detail') {
    if (!controller.selected) return <Navigate to={listPath} replace />;

    return (
      <section className="admin-route-page rental-detail-page">
        <RentalWorkflowDetail
          selected={controller.selected}
          t={t}
          locale={locale}
          products={products}
          workflow={controller.workflow}
          onBack={controller.closeDetailView}
          nextAction={controller.nextAction}
          manualTransitions={controller.manualTransitions}
          NextActionIcon={controller.NextActionIcon}
          isCompleted={controller.isCompleted}
          canComplete={controller.canComplete}
          requireVerifiedProof={controller.requireVerifiedProof}
          correctionOpen={controller.correctionOpen}
          setCorrectionOpen={controller.setCorrectionOpen}
          setOverrideOpen={controller.setOverrideOpen}
          planningEditable={controller.planningEditable}
          showChecklist={controller.showChecklist}
        />
        <OverrideDialog
          open={controller.overrideOpen}
          setOpen={controller.setOverrideOpen}
          t={t}
          rental={controller.selected}
          locale={locale}
          onOverride={controller.overrideSelected}
        />
      </section>
    );
  }

  return (
    <AdminWorkQueueLayout featureGrid className="rentals-admin-grid">
      <RentalListView
        t={t}
        locale={locale}
        query={controller.query}
        setQuery={controller.setQuery}
        statusFilter={controller.statusFilter}
        filterCounts={controller.filterCounts}
        rentalFilters={rentalFilters}
        filteredRentals={controller.filteredRentals}
        selected={undefined}
        onStatusFilterChange={controller.updateStatusFilter}
        onSelectRental={controller.selectRental}
      />
    </AdminWorkQueueLayout>
  );
}
