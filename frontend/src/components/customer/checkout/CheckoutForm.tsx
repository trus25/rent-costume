import * as RadioGroup from '@radix-ui/react-radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Check, MapPin, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, type FieldPath, useForm } from 'react-hook-form';
import { Field, InfoBlock, PhoneField, StepProgress } from '../../shared';
import { CheckoutStepActions } from './CheckoutStepActions';
import { makeBookingSchema } from '../../../lib/rental-utils';
import type { BookingValues, RentalRequest, RequestCreateResult, TFunction } from '../../../types/domain';

type CheckoutStep = 'contact' | 'fulfillment' | 'review';

export function CheckoutForm({
  t,
  cartCount,
  createBooking,
  submittedRequest,
}: {
  t: TFunction;
  cartCount: number;
  createBooking: (values: BookingValues) => Promise<RequestCreateResult>;
  submittedRequest: RentalRequest | null;
}) {
  const checkoutStepOrder: CheckoutStep[] = ['contact', 'fulfillment', 'review'];
  const [activeStep, setActiveStep] = useState<CheckoutStep>('contact');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(() => makeBookingSchema(t), [t]);
  const showFailureToggle = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEMO_FAILURE === 'true';
  const {
    control,
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      fulfillment: 'pickup',
      pickupWindow: '10.00-12.00',
      returnWindow: '16.00-18.00',
      deliveryWindow: '09.00-11.00',
      address: '',
      notes: '',
    },
  });
  const fulfillment = watch('fulfillment');
  const values = watch();
  const activeStepIndex = checkoutStepOrder.indexOf(activeStep);
  const submittedReferences = submittedRequest?.groupedReferences ?? [];
  const activeStepFields: Record<CheckoutStep, FieldPath<BookingValues>[]> = {
    contact: ['name', 'phone', 'email'],
    fulfillment: fulfillment === 'delivery'
      ? ['fulfillment', 'address', 'deliveryWindow', 'returnWindow']
      : ['fulfillment', 'pickupWindow', 'returnWindow'],
    review: ['notes'],
  };
  const checkoutSteps = checkoutStepOrder.map((step, index) => ({
    key: step,
    label: t(`customer.checkout.step.${step}`),
    state: index < activeStepIndex ? 'done' : index === activeStepIndex ? 'current' : '',
    icon: index < activeStepIndex ? Check : undefined,
    marker: index + 1,
  }));

  const goNext = async () => {
    const valid = await trigger(activeStepFields[activeStep], { shouldFocus: true });
    if (!valid) return;
    setSubmitError('');
    setActiveStep(checkoutStepOrder[Math.min(activeStepIndex + 1, checkoutStepOrder.length - 1)]);
  };

  const goBack = () => {
    setSubmitError('');
    setActiveStep(checkoutStepOrder[Math.max(activeStepIndex - 1, 0)]);
  };

  const onSubmit = async (values: BookingValues) => {
    setSubmitError('');
    if (cartCount === 0) {
      setSubmitError(t('customer.checkout.emptyCart'));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (simulateFailure) {
      setSubmitError(t('customer.checkout.failureCopy'));
      return;
    }
    const result = await createBooking(values);
    if (result?.error) {
      setSubmitError(result.error);
      return;
    }
    reset();
    setActiveStep('contact');
  };

  return (
    <form className="checkout-card" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <span className="section-kicker">{t('customer.checkout.title')}</span>
        <h2>{t('customer.summary.continue')}</h2>
        <p>{t('customer.checkout.copy')}</p>
      </div>
      {!submittedRequest ? <StepProgress steps={checkoutSteps} ariaLabel={t('customer.checkout.stepsAria')} className="checkout-form-steps" /> : null}
      {!submittedRequest ? (
        <div className="checkout-mobile-submitbar">
          <CheckoutStepActions
            t={t}
            isFirst={activeStepIndex === 0}
            isLast={activeStepIndex === checkoutStepOrder.length - 1}
            isSubmitting={isSubmitting}
            cartCount={cartCount}
            onBack={goBack}
            onNext={goNext}
          />
        </div>
      ) : null}

      {!submittedRequest && activeStep === 'contact' ? (
        <section className="checkout-step-panel" aria-label={t('customer.checkout.step.contact')}>
          <div className="form-grid">
            <Field label={t('common.name')} error={errors.name?.message}>
              <input {...register('name')} autoComplete="name" />
            </Field>
            <PhoneField label={t('common.phone')} error={errors.phone?.message} inputProps={register('phone')} />
            <Field label={`${t('common.email')} (${t('common.optional')})`} error={errors.email?.message}>
              <input {...register('email')} autoComplete="email" type="email" />
            </Field>
          </div>
        </section>
      ) : null}

      {!submittedRequest && activeStep === 'fulfillment' ? (
        <section className="checkout-step-panel" aria-label={t('customer.checkout.step.fulfillment')}>
          <Controller
            control={control}
            name="fulfillment"
            render={({ field }) => (
              <RadioGroup.Root className="radio-grid" value={field.value} onValueChange={field.onChange}>
                <RadioGroup.Item className="radio-card" value="pickup">
                  <MapPin aria-hidden="true" />
                  <span>{t('enum.fulfillment.pickup')}</span>
                  <RadioGroup.Indicator className="radio-indicator" />
                </RadioGroup.Item>
                <RadioGroup.Item className="radio-card" value="delivery">
                  <Truck aria-hidden="true" />
                  <span>{t('enum.fulfillment.delivery')}</span>
                  <RadioGroup.Indicator className="radio-indicator" />
                </RadioGroup.Item>
              </RadioGroup.Root>
            )}
          />

          <div className="form-grid">
            {fulfillment === 'pickup' ? (
              <Field label={t('customer.checkout.pickupWindow')} error={errors.pickupWindow?.message}>
                <input {...register('pickupWindow')} />
              </Field>
            ) : (
              <>
                <Field label={t('common.address')} error={errors.address?.message}>
                  <input {...register('address')} autoComplete="street-address" />
                </Field>
                <Field label={t('customer.checkout.deliveryWindow')} error={errors.deliveryWindow?.message}>
                  <input {...register('deliveryWindow')} />
                </Field>
              </>
            )}
            <Field label={t('customer.checkout.returnWindow')} error={errors.returnWindow?.message}>
              <input {...register('returnWindow')} />
            </Field>
          </div>
        </section>
      ) : null}

      {!submittedRequest && activeStep === 'review' ? (
        <section className="checkout-step-panel" aria-label={t('customer.checkout.step.review')}>
          <div className="checkout-review-grid">
            <InfoBlock title={t('common.name')} copy={values.name || '-'} />
            <InfoBlock title={t('common.phone')} copy={values.phone || '-'} />
            <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${values.fulfillment}`)} />
            <InfoBlock
              title={t('common.window')}
              copy={values.fulfillment === 'delivery' ? values.deliveryWindow || '-' : values.pickupWindow || '-'}
            />
          </div>
          <Field label={`${t('common.notes')} (${t('common.optional')})`} error={errors.notes?.message}>
            <textarea {...register('notes')} rows={3} />
          </Field>

          {showFailureToggle ? (
            <label className="checkbox-row">
              <input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} />
              <span>{t('customer.checkout.simulateFailure')}</span>
            </label>
          ) : null}
        </section>
      ) : null}

      {submitError ? <p className="validation-message">{submitError}</p> : null}
      {!submittedRequest ? (
        <CheckoutStepActions
          className="checkout-submit-inline"
          t={t}
          isFirst={activeStepIndex === 0}
          isLast={activeStepIndex === checkoutStepOrder.length - 1}
          isSubmitting={isSubmitting}
          cartCount={cartCount}
          onBack={goBack}
          onNext={goNext}
        />
      ) : null}

      {submittedRequest ? (
        <div className="confirmation-panel" id="confirmation">
          <span className="status-badge success">
            <BadgeCheck aria-hidden="true" />
            <span className="status-badge-label">{t('customer.checkout.successTitle')}</span>
          </span>
          <h3>{t('customer.confirmation.title')}: {submittedReferences.length > 0 ? submittedReferences.join(', ') : submittedRequest.reference}</h3>
          {submittedReferences.length > 1 ? <p>{t('customer.checkout.splitByDate')}</p> : null}
          <p>{t('customer.checkout.successCopy')}</p>
          <div className="info-grid compact">
            <InfoBlock title={t('common.status')} copy={requestOutcomeLabel(submittedRequest)} />
            <InfoBlock title={t('customer.confirmation.next')} copy={t('customer.confirmation.nextCopy')} />
          </div>
        </div>
      ) : null}
    </form>
  );
}

function requestOutcomeLabel(request: RentalRequest) {
  if (request.outcome === 'accepted') return 'Accepted';
  if (request.outcome === 'rejected') return 'Rejected';
  return 'Pending';
}
