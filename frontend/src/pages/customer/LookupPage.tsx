import { LookupSection } from '../../components/customer/lookup/CustomerLookupSection';
import CustomerFrame from './CustomerFrame';
import type { CartItem, DataAdapter, Locale, Notification, Product, Rental, Settings, TFunction } from '../../types/domain';
import type { StateSetter } from '../../types/app';

export default function LookupPage({
  locale,
  setLocale,
  t,
  settings,
  cart,
  rentals,
  products,
  setNotifications,
  dataAdapter,
  onOpenCart,
}: {
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
  settings: Settings;
  cart: CartItem[];
  rentals: Rental[];
  products: Product[];
  setNotifications: StateSetter<Notification[]>;
  dataAdapter: DataAdapter;
  onOpenCart: () => void;
}) {
  return (
    <CustomerFrame
      title={t('document.lookupTitle')}
      skipTo="lookup-page"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <LookupSection t={t} locale={locale} rentals={rentals} products={products} setNotifications={setNotifications} dataAdapter={dataAdapter} />
    </CustomerFrame>
  );
}
