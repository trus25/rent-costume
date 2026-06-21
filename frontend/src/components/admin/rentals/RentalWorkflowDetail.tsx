import {
  AlertTriangle,
  ClipboardCheck,
  CreditCard,
  PackageCheck,
  Settings,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PaymentPanel } from './PaymentPanel';
import { ActivityLog, Checklist, RentalItems } from './RentalRecordComponents';
import { Field, InfoBlock, MobileDetailShell, SelectField, StatusPill } from '../../shared';
import { formatDateRange } from '../../../lib/rental-utils';
import type { StateSetter } from '../../../types/app';
import type { FulfillmentMethod, Locale, PaymentMethod, Product, Rental, RentalLifecycle, TFunction } from '../../../types/domain';
import type { RentalWorkflowCommands } from '../../../lib/rental-workflow';
import type {
  NextRentalAction,
  PaymentDeliveryDraft,
  RentalTransitionAction,
} from './rentalWorkflowTypes';

type RentalWorkflowDetailProps = {
  selected: Rental;
  t: TFunction;
  locale: Locale;
  products: Product[];
  workflow: RentalWorkflowCommands;
  onBack: () => void;
  nextAction: NextRentalAction | null;
  manualTransitions: RentalTransitionAction[];
  NextActionIcon: LucideIcon;
  isCompleted: boolean;
  canComplete: boolean;
  requireVerifiedProof: boolean;
  correctionOpen: boolean;
  setCorrectionOpen: StateSetter<boolean>;
  setOverrideOpen: StateSetter<boolean>;
  planningEditable: boolean;
  showChecklist: boolean;
};

export function RentalWorkflowDetail({
  selected,
  t,
  locale,
  products,
  workflow,
  onBack,
  nextAction,
  manualTransitions,
  NextActionIcon,
  isCompleted,
  canComplete,
  requireVerifiedProof,
  correctionOpen,
  setCorrectionOpen,
  setOverrideOpen,
  planningEditable,
  showChecklist,
}: RentalWorkflowDetailProps) {
  const nextActionDesktopReasonId = `${selected.reference}-next-action-desktop-reason`;
  const nextActionMobileReasonId = `${selected.reference}-next-action-mobile-reason`;
  const nextActionReason = nextAction?.disabledReason ?? nextAction?.copy;
  const showPaymentWarning = requireVerifiedProof && selected.lifecycle === 'inspected' && selected.paymentStatus !== 'verified';

  return (
    <MobileDetailShell
      className="rental-detail-view rental-detail-shell"
      backLabel={t('admin.nav.rentals')}
      title={selected.reference}
      onBack={onBack}
      actionLabel={t('admin.common.detailActions')}
      actionClassName="rental-detail-actionbar"
      actions={nextAction && !isCompleted ? (
        <div className="rental-mobile-next-action">
          <button
            type="button"
            disabled={nextAction.disabled}
            aria-describedby={nextAction.disabled ? nextActionMobileReasonId : undefined}
            onClick={nextAction.onClick}
          >
            <NextActionIcon aria-hidden="true" />
            {nextAction.label}
          </button>
          {nextAction.disabled ? <p id={nextActionMobileReasonId}>{nextActionReason}</p> : null}
        </div>
      ) : null}
    >
      <section className="record-panel feature-panel rental-workspace" aria-label={t('admin.rentals.workflowAria')}>
        <div className="rental-command-card">
          <div className="rental-command-copy">
            <span className="eyebrow">{t('admin.rentals.currentOrder')}</span>
            <h2>{selected.reference}</h2>
            <p>
              <UserRound aria-hidden="true" />
              {selected.customerName} - {formatDateRange(selected, locale)}
            </p>
            <div className="inline-status">
              <StatusPill type="lifecycle" value={selected.lifecycle} t={t} />
              <StatusPill type="payment" value={selected.paymentStatus} t={t} />
              <StatusPill type="fulfillment" value={selected.fulfillment} t={t} />
            </div>
          </div>

          <div className={`next-action-card ${nextAction?.tone ?? 'info'}`}>
            <span>{t('admin.rentals.nextAction')}</span>
            <strong>{nextAction?.title}</strong>
            <p>{nextAction?.copy}</p>
            {nextAction?.disabled ? (
              <p className="next-action-disabled-reason" id={nextActionDesktopReasonId}>
                {nextActionReason}
              </p>
            ) : null}
            {nextAction && !isCompleted ? (
              <button
                className="primary-button rental-primary-action"
                type="button"
                disabled={nextAction.disabled}
                aria-describedby={nextAction.disabled ? nextActionDesktopReasonId : undefined}
                onClick={nextAction.onClick}
              >
                <NextActionIcon aria-hidden="true" />
                {nextAction.label}
              </button>
            ) : null}
          </div>
        </div>

        {showPaymentWarning ? (
          <div className="inline-alert warning rental-blocker-alert" role="status">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>{t('admin.rentals.paymentPendingTitle')}</strong>
              <p>{t('admin.rentals.paymentPendingCopy')}</p>
            </div>
          </div>
        ) : null}

        {isCompleted ? (
          <div className="inline-alert warning rental-blocker-alert" role="status">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>{t('admin.rentals.completedLockedTitle')}</strong>
              <p>{t('admin.rentals.completedLockedCopy')}</p>
            </div>
          </div>
        ) : null}

        <LifecycleRoadmap rental={selected} t={t} />

        <div className="rental-detail-grid">
          <section className="rental-section">
            <div className="rental-section-head">
              <PackageCheck aria-hidden="true" />
              <div>
                <span className="section-kicker">{t('admin.rentals.itemsTitle')}</span>
                <p>{t('admin.rentals.itemsHelp')}</p>
              </div>
            </div>
            <RentalItems rental={selected} products={products} t={t} />
          </section>

          <section className="rental-section">
            <div className="rental-section-head">
              <CreditCard aria-hidden="true" />
              <div>
                <span className="section-kicker">{t('admin.rentals.paymentTitle')}</span>
                <p>{selected.paymentStatus === 'verified' ? t('admin.rentals.paymentReady') : t('admin.rentals.paymentBlocked')}</p>
              </div>
            </div>
            <PaymentDeliveryEditor
              rental={selected}
              t={t}
              workflow={workflow}
              paymentEditable={!isCompleted}
              planningEditable={planningEditable}
            />
          </section>
        </div>

        {!isCompleted && showChecklist ? (
          <section className="rental-section">
            <div className="rental-section-head">
              <ClipboardCheck aria-hidden="true" />
              <div>
                <span className="section-kicker">{t('admin.rentals.checklist')}</span>
                <p>{t('admin.rentals.checklistHelp')}</p>
              </div>
            </div>
            <Checklist rental={selected} locale={locale} onToggle={(itemId) => workflow.toggleChecklistItem(selected.reference, itemId)} t={t} />
          </section>
        ) : null}

        <PaymentPanel rental={selected} t={t} workflow={workflow} readOnly={isCompleted} />

        {!isCompleted && manualTransitions.length > 0 ? (
          <div className="manual-correction">
            <button
              className="manual-correction-toggle"
              type="button"
              aria-expanded={correctionOpen}
              onClick={() => setCorrectionOpen((open) => !open)}
            >
              <Settings aria-hidden="true" />
              <span>{t('admin.rentals.manualActions')}</span>
            </button>
            {correctionOpen ? (
              <div className="manual-correction-panel">
                <p>{t('admin.rentals.manualActionsHelp')}</p>
                <div className="record-actions wide secondary-action-grid">
                  {manualTransitions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button type="button" disabled={action.disabled} title={action.disabled ? t('admin.rentals.completeBlocked') : undefined} onClick={action.onClick} key={action.key}>
                        <Icon aria-hidden="true" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isCompleted ? (
          <div className="manual-correction override-gate">
            <div className="manual-correction-panel">
              <p>{t('admin.rentals.overrideConsequence')}</p>
              <button className="ghost-button" type="button" onClick={() => setOverrideOpen(true)}>
                <Settings aria-hidden="true" />
                {t('admin.rentals.override')}
              </button>
            </div>
          </div>
        ) : null}

        <ActivityLog rental={selected} locale={locale} t={t} />
      </section>
    </MobileDetailShell>
  );
}

type PaymentDeliveryEditorProps = {
  rental: Rental;
  t: TFunction;
  workflow: RentalWorkflowCommands;
  paymentEditable: boolean;
  planningEditable: boolean;
};

function PaymentDeliveryEditor({ rental, t, workflow, paymentEditable, planningEditable }: PaymentDeliveryEditorProps) {
  const [draft, setDraft] = useState(() => makePaymentDraft(rental));
  const paymentMethods: PaymentMethod[] = ['bank_transfer', 'qris', 'cash', 'other'];
  const paymentMethodOptions = paymentMethods.map((method) => ({
    value: method,
    label: t(`enum.paymentMethod.${method}`),
  }));
  const fulfillments: FulfillmentMethod[] = ['pickup', 'delivery'];
  const fulfillmentOptions = fulfillments.map((fulfillment) => ({
    value: fulfillment,
    label: t(`enum.fulfillment.${fulfillment}`),
  }));

  useEffect(() => {
    setDraft(makePaymentDraft(rental));
  }, [rental.reference]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(makePaymentDraft(rental));
  const updateDraft = (patch: Partial<PaymentDeliveryDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const saveDraft = () => {
    workflow.savePaymentDelivery(rental.reference, draft);
  };

  if (!paymentEditable && !planningEditable) {
    return (
      <div className="info-grid payment-delivery-readout">
        <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
        <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
        <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${rental.fulfillment}`)} />
        <InfoBlock title={t('admin.rentals.deliveryFee')} copy={String(rental.deliveryFee ?? 0)} />
        <InfoBlock title={rental.fulfillment === 'delivery' ? t('common.address') : t('customer.checkout.pickupWindow')} copy={rental.fulfillment === 'delivery' ? rental.address || '-' : rental.pickupWindow || '-'} />
        <InfoBlock title={t('customer.checkout.returnWindow')} copy={rental.returnWindow || '-'} />
        {rental.fulfillment === 'delivery' ? <InfoBlock title={t('customer.checkout.deliveryWindow')} copy={rental.deliveryWindow || '-'} /> : null}
        <InfoBlock title={t('admin.rentals.deliveryNotes')} copy={rental.deliveryNotes || '-'} />
      </div>
    );
  }

  return (
    <div className="payment-delivery-form">
      {paymentEditable ? (
        <SelectField
          label={t('admin.payment.method')}
          value={draft.paymentMethod}
          onValueChange={(paymentMethod) => updateDraft({ paymentMethod: paymentMethod as PaymentMethod })}
          options={paymentMethodOptions}
        />
      ) : (
        <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
      )}
      <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
      {planningEditable ? (
        <>
          <Field label={t('admin.rentals.deliveryFee')}>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={draft.deliveryFee ?? 0}
              onChange={(event) => updateDraft({ deliveryFee: Math.max(0, Number(event.target.value) || 0) })}
            />
          </Field>
          <SelectField
            label={t('admin.table.fulfillment')}
            value={draft.fulfillment}
            onValueChange={(fulfillment) => updateDraft({ fulfillment: fulfillment as FulfillmentMethod })}
            options={fulfillmentOptions}
          />
          {draft.fulfillment === 'delivery' ? (
            <>
              <Field label={t('common.address')}>
                <input value={draft.address ?? ''} onChange={(event) => updateDraft({ address: event.target.value })} />
              </Field>
              <Field label={t('customer.checkout.deliveryWindow')}>
                <input value={draft.deliveryWindow ?? ''} onChange={(event) => updateDraft({ deliveryWindow: event.target.value })} />
              </Field>
            </>
          ) : (
            <Field label={t('customer.checkout.pickupWindow')}>
              <input value={draft.pickupWindow ?? ''} onChange={(event) => updateDraft({ pickupWindow: event.target.value })} />
            </Field>
          )}
          <Field label={t('customer.checkout.returnWindow')}>
            <input value={draft.returnWindow ?? ''} onChange={(event) => updateDraft({ returnWindow: event.target.value })} />
          </Field>
          <Field label={t('admin.rentals.deliveryNotes')}>
            <input value={draft.deliveryNotes ?? ''} onChange={(event) => updateDraft({ deliveryNotes: event.target.value })} />
          </Field>
        </>
      ) : (
        <div className="info-grid payment-delivery-readout payment-delivery-static">
          <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${rental.fulfillment}`)} />
          <InfoBlock title={t('admin.rentals.deliveryFee')} copy={String(rental.deliveryFee ?? 0)} />
          <InfoBlock title={rental.fulfillment === 'delivery' ? t('common.address') : t('customer.checkout.pickupWindow')} copy={rental.fulfillment === 'delivery' ? rental.address || '-' : rental.pickupWindow || '-'} />
          <InfoBlock title={t('customer.checkout.returnWindow')} copy={rental.returnWindow || '-'} />
          {rental.fulfillment === 'delivery' ? <InfoBlock title={t('customer.checkout.deliveryWindow')} copy={rental.deliveryWindow || '-'} /> : null}
          <InfoBlock title={t('admin.rentals.deliveryNotes')} copy={rental.deliveryNotes || '-'} />
        </div>
      )}
      <button className="secondary-button full payment-delivery-save" type="button" disabled={!dirty} onClick={saveDraft}>
        {t('common.save')}
      </button>
    </div>
  );
}

function makePaymentDraft(rental: Rental): PaymentDeliveryDraft {
  return {
    paymentMethod: rental.paymentMethod,
    deliveryFee: rental.deliveryFee ?? 0,
    fulfillment: rental.fulfillment,
    address: rental.address ?? '',
    pickupWindow: rental.pickupWindow ?? '',
    deliveryWindow: rental.deliveryWindow ?? '',
    returnWindow: rental.returnWindow ?? '',
    deliveryNotes: rental.deliveryNotes ?? '',
  };
}

type LifecycleRoadmapProps = {
  rental: Rental;
  t: TFunction;
};

function LifecycleRoadmap({ rental, t }: LifecycleRoadmapProps) {
  const steps: RentalLifecycle[] = ['confirmed', 'preparing', 'ready_pickup', rental.fulfillment === 'delivery' ? 'out_delivery' : 'on_rent', 'returned', 'inspected', 'completed'];
  const currentIndex = steps.indexOf(rental.lifecycle);

  return (
    <ol className="checkout-steps lifecycle-roadmap" aria-label={t('admin.rentals.lifecycleAria')}>
      {steps.map((step, index) => {
        const state = currentIndex === -1
          ? 'upcoming'
          : index < currentIndex
            ? 'done'
            : index === currentIndex
              ? 'current'
              : 'upcoming';
        const stateLabel = t(`admin.rentals.roadmapState.${state}`);

        return (
          <li
            className={`checkout-step lifecycle-step ${state}`.trim()}
            aria-current={state === 'current' ? 'step' : undefined}
            key={step}
          >
            <span aria-hidden="true">{index + 1}</span>
            <strong>{t(`enum.lifecycle.${step}`)}</strong>
            <small>{stateLabel}</small>
          </li>
        );
      })}
    </ol>
  );
}
