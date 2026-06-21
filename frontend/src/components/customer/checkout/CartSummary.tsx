import { Info, Minus, Plus, ShoppingBag } from 'lucide-react';
import { EmptyState } from '../../shared';
import {
  formatDate,
  formatRupiah,
  productAlt,
  productCoverImage,
  productName,
  variantLabel,
} from '../../../lib/rental-utils';
import type { CartItem, CartLineItem, Locale, TFunction } from '../../../types/domain';

export function CartSummary({
  cartItems,
  cartTotal,
  t,
  locale,
  onQty,
  onRemove,
}: {
  cartItems: CartLineItem[];
  cartTotal: number;
  t: TFunction;
  locale: Locale;
  onQty: (target: CartItem, delta: number) => void;
  onRemove: (target: CartItem) => void;
}) {
  const handleDecrease = (item: CartLineItem) => {
    if (item.qty <= 1) {
      onRemove(item);
      return;
    }

    onQty(item, -1);
  };

  return (
    <aside className="summary-card cart-card cart-summary-shell" aria-label={t('customer.summary.aria')}>
      <p className="cart-advisory">
        <Info aria-hidden="true" />
        <span>{t('customer.cart.copy')}</span>
      </p>

      <div className="order-summary-card">
        <div className="summary-header">
          <span className="cart-summary-title">
            <span className="cart-summary-icon" aria-hidden="true">
              <ShoppingBag />
            </span>
            <span className="eyebrow">{t('customer.cart.title')}</span>
          </span>
          <strong>{formatRupiah(cartTotal)}</strong>
        </div>

        {cartItems.length === 0 ? (
          <EmptyState title={t('customer.cart.empty')} copy={t('customer.cart.syncNotice')} icon={ShoppingBag} />
        ) : (
          <div className="cart-summary-items">
            {cartItems.map((item) => {
              const title = productName(item.product, t);
              const start = formatDate(item.start, locale);
              const end = formatDate(item.end, locale);
              const price = formatRupiah((Number(item.product.price) || 0) * item.qty);
              const decrementLabel =
                item.qty <= 1 ? t('customer.cart.removeItem', { item: title }) : t('customer.cart.decreaseQuantity', { item: title });

              return (
                <div className="summary-item editable" key={`${item.product.id}-${item.variantId}-${item.start}-${item.end}`}>
                  <div className="cart-item-main">
                    <img src={productCoverImage(item.product, t)} alt={productAlt(item.product, t)} />
                    <div className="cart-item-copy">
                      <strong>{title}</strong>
                      <span className="cart-item-meta">
                        {variantLabel(t, item.variantId)} | {t('customer.cart.itemDates', { start, end })}
                      </span>
                      <b className="cart-item-price">{price}</b>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control segmented" aria-label={t('customer.cart.quantityControl', { item: title })}>
                      <button type="button" onClick={() => handleDecrease(item)} aria-label={decrementLabel}>
                        <Minus aria-hidden="true" />
                      </button>
                      <span className="quantity-value" aria-live="polite">
                        {item.qty}
                      </span>
                      <button type="button" onClick={() => onQty(item, 1)} aria-label={t('customer.cart.increaseQuantity', { item: title })}>
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="summary-total">
          <span>{t('customer.summary.totalLabel')}</span>
          <strong>{formatRupiah(cartTotal)}</strong>
        </div>
      </div>
    </aside>
  );
}
