import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  CatalogueEditor,
  SwitchProductDialog,
} from '../../components/admin/catalogue/CatalogueEditor';
import {
  AdminCreateAction,
  AdminCreateFab,
  AdminListWindow,
  AdminViewBar,
} from '../../components/admin/common/AdminManagement';
import {
  CatalogueCreatePanel,
  categoryOptions,
  genderOptions,
} from '../../components/admin/catalogue/CatalogueCreatePanel';
import { CatalogueProductList } from '../../components/admin/catalogue/CatalogueProductList';
import {
  makeMediaId,
  readFileAsDataUrl,
  toNonNegativeDraftNumber,
  toNonNegativeNumber,
  updateSource,
} from '../../components/admin/catalogue/catalogueAdminUtils';
import { useCatalogueAdminController } from '../../components/admin/catalogue/useCatalogueAdminController';
import type { CatalogueEditorTab } from '../../components/admin/catalogue/catalogueEditorUtils';
import { SearchInput } from '../../components/shared';
import { adminDetailPath, adminListPath, adminNewPath, type AdminSubroute } from '../../lib/admin-routes';
import type { DataAdapter, Locale, Product, TFunction } from '../../types/domain';
import type { StateSetter } from '../../types/app';

export default function CatalogueAdmin({
  t,
  locale,
  products,
  setProducts,
  dataAdapter,
  route,
}: {
  t: TFunction;
  locale: Locale;
  products: Product[];
  setProducts: StateSetter<Product[]>;
  dataAdapter?: DataAdapter;
  route: AdminSubroute;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const listPath = adminListPath('catalogue', location.search);
  const selectedProductId = route.kind === 'detail' ? route.id : undefined;
  const controller = useCatalogueAdminController({
    t,
    products,
    setProducts,
    dataAdapter,
    selectedProductId,
    onOpenProduct: (productId) => navigate(adminDetailPath('catalogue', productId, location.search)),
    onCreateSuccess: (productId) => navigate(adminDetailPath('catalogue', productId), { replace: true }),
  });

  if (route.kind === 'new') {
    return (
      <section className="admin-route-page catalogue-create-page">
        <CatalogueCreatePanel
          t={t}
          locale={locale}
          createDraft={controller.createDraft}
          setCreateDraft={controller.setCreateDraft}
          onCreate={controller.createProduct}
          onClose={() => navigate(listPath)}
          toNonNegativeDraftNumber={toNonNegativeDraftNumber}
          standalone
        />
      </section>
    );
  }

  if (route.kind === 'detail') {
    if (!controller.selected || !controller.productDraft) return <Navigate to={listPath} replace />;

    return (
      <section className="admin-route-page catalogue-detail-page">
        <CatalogueEditor
          t={t}
          locale={locale}
          productDraft={controller.productDraft}
          mediaItems={controller.mediaItems}
          coverImage={controller.coverImage}
          activeTab={controller.activeTab}
          setActiveTab={(tab) => controller.setActiveTab(tab as CatalogueEditorTab)}
          detailErrors={controller.detailErrors}
          variantErrors={controller.variantErrors}
          newVariant={controller.newVariant}
          newVariantErrors={controller.newVariantErrors}
          setNewVariant={controller.setNewVariant}
          setNewVariantErrors={controller.setNewVariantErrors}
          updateDraft={controller.updateDraft}
          updateVariant={controller.updateVariant}
          updateMediaItems={controller.updateMediaItems}
          adjustVariantTotal={controller.adjustVariantTotal}
          removeVariant={controller.removeVariant}
          addVariant={controller.addVariant}
          variantLabelRef={controller.variantLabelRef}
          maintenanceOpen={controller.maintenanceOpen}
          setMaintenanceOpen={controller.setMaintenanceOpen}
          maintenanceDraft={controller.maintenanceDraft}
          setMaintenanceDraft={controller.setMaintenanceDraft}
          saveMaintenanceBlock={controller.saveMaintenanceBlock}
          removeMaintenanceBlock={controller.removeMaintenanceBlock}
          isDirty={controller.isDirty}
          hasValidationErrors={controller.hasValidationErrors}
          saveState={controller.saveState}
          onSave={controller.saveProduct}
          onDiscard={controller.resetProduct}
          onClose={() => navigate(listPath)}
          showCloseButton={false}
          categoryOptions={categoryOptions(locale)}
          genderOptions={genderOptions(t)}
          toNonNegativeDraftNumber={toNonNegativeDraftNumber}
          toNonNegativeNumber={toNonNegativeNumber}
          updateSource={updateSource}
          makeMediaId={makeMediaId}
          readFileAsDataUrl={readFileAsDataUrl}
        />
        <SwitchProductDialog
          t={t}
          open={Boolean(controller.switchTargetId)}
          onStay={controller.clearSwitchTarget}
          onDiscard={controller.discardAndSwitch}
          onSave={controller.saveAndSwitch}
          saving={controller.saveState.status === 'saving'}
        />
      </section>
    );
  }

  return (
    <section className="catalogue-list-page">
      <AdminListWindow>
        <AdminViewBar>
          <SearchInput value={controller.query} onChange={controller.setQuery} placeholder={t('common.search')} clearLabel={t('common.clear')} />
          <AdminCreateAction
            label={t('admin.catalogue.add')}
            to={adminNewPath('catalogue', location.search)}
          />
        </AdminViewBar>
        <AdminCreateFab
          label={t('admin.catalogue.add')}
          to={adminNewPath('catalogue', location.search)}
        />
        <CatalogueProductList
          products={controller.filtered}
          selectedId={undefined}
          isDirty={controller.isDirty}
          t={t}
          onSelect={controller.requestProductSwitch}
        />
      </AdminListWindow>
    </section>
  );
}
