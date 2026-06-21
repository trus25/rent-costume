import type { MouseEvent } from 'react';
import type { TFunction } from '../../../types/domain';

export function CheckoutStepActions({
  className = '',
  t,
  isFirst,
  isLast,
  isSubmitting,
  cartCount,
  onBack,
  onNext,
}: {
  className?: string;
  t: TFunction;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting: boolean;
  cartCount: number;
  onBack: () => void;
  onNext: () => void | Promise<void>;
}) {
  return (
    <div className={`checkout-step-actions ${className}`.trim()}>
      {!isFirst ? (
        <button className="outline-button" type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          onBack();
        }} disabled={isSubmitting}>
          {t('customer.checkout.back')}
        </button>
      ) : null}
      {isLast ? (
        <button className="primary-button" type="submit" disabled={cartCount === 0 || isSubmitting}>
          {isSubmitting ? t('common.loading') : t('customer.checkout.submit')}
        </button>
      ) : (
        <button className="primary-button" type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          onNext();
        }}>
          {t('customer.checkout.next')}
        </button>
      )}
    </div>
  );
}
