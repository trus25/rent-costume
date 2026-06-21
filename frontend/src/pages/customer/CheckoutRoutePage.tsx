import { ShoppingBag } from 'lucide-react';
import { CartSummary, CheckoutForm } from '../../components/customer/checkout/CustomerCheckoutComponents';
import CustomerFrame from './CustomerFrame';
import type { BookingValues, CartItem, CartLineItem, Locale, RentalRequest, RequestCreateResult, Settings, TFunction } from '../../types/domain';
import type { StateSetter } from '../../types/app';

export default function CheckoutRoutePage({
  locale,
  setLocale,
  t,
  settings,
  cart,
  cartItems,
  cartTotal,
  cartCount,
  onQty,
  onRemove,
  createBooking,
  submittedRequest,
  onOpenCart,
}: {
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
  settings: Settings;
  cart: CartItem[];
  cartItems: CartLineItem[];
  cartTotal: number;
  cartCount: number;
  onQty: (target: CartItem, delta: number) => void;
  onRemove: (target: CartItem) => void;
  createBooking: (values: BookingValues) => Promise<RequestCreateResult>;
  submittedRequest: RentalRequest | null;
  onOpenCart: () => void;
}) {
  return (
    <CustomerFrame
      title={t('document.checkoutTitle')}
      skipTo="checkout-route"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <section className="checkout-route-page checkout-shell" id="checkout-route">
        <div className="shell checkout-route-layout">
          <div className="checkout-route-head">
            <ShoppingBag aria-hidden="true" />
            <span className="section-kicker">{t('customer.checkout.routeKicker')}</span>
            <h1>{t('customer.checkout.routeTitle')}</h1>
            <p>{t('customer.checkout.routeCopy')}</p>
          </div>
          <div className="checkout-modal-layout checkout-panel route-checkout-layout">
            <CheckoutForm t={t} cartCount={cartCount} createBooking={createBooking} submittedRequest={submittedRequest} />
            <CartSummary cartItems={cartItems} cartTotal={cartTotal} t={t} locale={locale} onQty={onQty} onRemove={onRemove} />
          </div>
        </div>
      </section>
    </CustomerFrame>
  );
}
