import { CatalogueFilterBoard } from '../../components/customer/catalogue/CatalogueFilters';
import { CatalogueResults } from '../../components/customer/catalogue/CatalogueResults';
import { optionLabel } from '../../components/customer/catalogue/catalogueControllerUtils';
import { useCustomerCatalogueController } from '../../components/customer/catalogue/useCustomerCatalogueController';
import { RentalSearchPanel } from '../../components/customer/home/RentalSearchPanel';
import CustomerFrame, { CustomerContentShell, CustomerPageIntro } from './CustomerFrame';
import type {
  CartItem,
  DataAdapter,
  Locale,
  Product,
  Rental,
  Settings,
  TFunction,
} from '../../types/domain';
import type { StateSetter } from '../../types/app';

export default function CustomerCataloguePage({
  locale,
  setLocale,
  t,
  products,
  rentals,
  settings,
  cart,
  setCart,
  onOpenCart,
  dataAdapter,
}: {
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
  products: Product[];
  rentals: Rental[];
  settings: Settings;
  cart: CartItem[];
  setCart: StateSetter<CartItem[]>;
  onOpenCart: () => void;
  dataAdapter?: DataAdapter;
}) {
  const catalogue = useCustomerCatalogueController({
    locale,
    t,
    products,
    rentals,
    settings,
    cart,
    setCart,
    dataAdapter,
  });

  return (
    <CustomerFrame
      title={t('document.catalogueTitle')}
      skipTo="catalogue"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <CustomerContentShell className="catalogue-page" id="catalogue">
        <div className="shell">
          <div className="catalogue-header">
            <CustomerPageIntro
              className="catalogue-intro"
              kicker={t('customer.catalogue.kicker')}
              title={t('customer.catalogue.title')}
              copy={t('customer.catalogue.copy')}
            />
          </div>

          <RentalSearchPanel
            t={t}
            ariaLabel={t('customer.search.aria')}
            query={catalogue.draftQuery}
            onQueryChange={catalogue.setDraftQuery}
            dates={catalogue.draftDates}
            onDatesChange={catalogue.setDraftDates}
            onSubmit={catalogue.applySearch}
            submitLabel={t('customer.search.submit')}
          />
          <p className="helper-text catalogue-period-help">{t('customer.search.periodHelp')}</p>
          {catalogue.dateError ? <p className="validation-message">{catalogue.dateError}</p> : null}
          {catalogue.catalogueError ? <p className="validation-message">{catalogue.catalogueError}</p> : null}
          {catalogue.showSyncPrompt ? (
            <div className="inline-alert warning date-sync-alert">
              <div>
                <strong>{t('customer.date.syncTitle')}</strong>
                <p>{t('customer.date.syncCopy')}</p>
              </div>
              <div className="inline-alert-actions">
                <button className="outline-button" type="button" onClick={() => catalogue.setShowSyncPrompt(false)}>
                  {t('customer.date.keep')}
                </button>
                <button className="secondary-button" type="button" onClick={catalogue.syncCartDates}>
                  {t('customer.date.sync')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="catalogue-toolbar">
            <CatalogueFilterBoard
              t={t}
              periodLabel={catalogue.periodLabel}
              filters={catalogue.filters}
              favoritesOnly={catalogue.favoritesOnly}
              favoritesCount={catalogue.favorites.length}
              activeFilter={catalogue.activeFilter}
              setActiveFilter={catalogue.setActiveFilter}
              activeFilterCount={catalogue.activeFilterCount}
              secondaryFilterCount={catalogue.secondaryFilterCount}
              activeFilterSummaries={catalogue.activeFilterSummaries}
              regionOptions={catalogue.regionOptions}
              typeOptions={catalogue.typeOptions}
              updateCatalogueParams={catalogue.updateCatalogueParams}
              clearFilters={catalogue.clearFilters}
              optionLabel={optionLabel}
            />
          </div>

          <CatalogueResults
            hasSearched={catalogue.hasSearched}
            t={t}
            locale={locale}
            appliedDates={catalogue.appliedDates}
            visibleProducts={catalogue.visibleProducts}
            displayedProducts={catalogue.displayedProducts}
            catalogueLoading={catalogue.catalogueLoading}
            favoritesOnly={catalogue.favoritesOnly}
            buildDetailTo={catalogue.buildDetailTo}
            rentals={rentals}
            availabilityByProduct={catalogue.availabilityByProduct}
            hasMoreProducts={catalogue.hasMoreProducts}
            sentinelRef={catalogue.sentinelRef}
          />
        </div>
      </CustomerContentShell>
    </CustomerFrame>
  );
}
