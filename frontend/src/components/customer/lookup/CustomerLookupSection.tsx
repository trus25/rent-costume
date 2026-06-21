
import * as Select from '@radix-ui/react-select';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { EmptyState, Field, InfoBlock, PhoneField, StatusPill } from '../../shared';
import { formatDateRange, formatRupiah, makeLookupSchema, normalizePhone, productAlt, productName, variantLabel } from '../../../lib/rental-utils';
import type { DataAdapter, Locale, LookupChangeValues, Notification, Product, Rental, TFunction } from '../../../types/domain';
import type { StateSetter } from '../../../types/app';

export function LookupSection({
  t,
  locale,
  rentals,
  products,
  setNotifications,
  dataAdapter,
}: {
  t: TFunction;
  locale: Locale;
  rentals: Rental[];
  products: Product[];
  setNotifications?: StateSetter<Notification[]>;
  dataAdapter?: DataAdapter;
}) {
  const [result, setResult] = useState<Rental | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [changeSent, setChangeSent] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryDraft, setRecoveryDraft] = useState({ phone: '', name: '', hint: '' });
  const lookupResultRef = useRef<HTMLDivElement | null>(null);
  const schema = useMemo(() => makeLookupSchema(t), [t]);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<LookupChangeValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference: 'CR-0142', phone: '+62 812 0000 0142', changeType: 'reschedule', changeNotes: '' },
  });

  useEffect(() => {
    if (!result && !notFound) return;
    const node = lookupResultRef.current;
    if (!node) return;
    window.requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'start', behavior: 'smooth' });
      node.focus({ preventScroll: true });
    });
  }, [result, notFound]);

  const onLookup = ({ reference, phone }: LookupChangeValues) => {
    const match = rentals.find((rental) => rental.reference.toLowerCase() === reference.toLowerCase() && normalizePhone(rental.phone) === normalizePhone(phone));
    setResult(match ?? null);
    setNotFound(!match);
    setChangeSent(false);
  };

  const submitRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = recoveryDraft.phone.trim();
    if (!phone) return;
    setRecoveryLoading(true);
    setRecoveryError('');
    const name = recoveryDraft.name.trim() || t('customer.lookup.recoveryUnknownName');
    const hint = recoveryDraft.hint.trim();
    try {
      if (dataAdapter) {
        await dataAdapter.lookup.recover({ phone, name, hint });
      } else {
        setNotifications?.((current) => [
          {
            id: `lookup-recovery-${Date.now()}`,
            tone: 'info',
            titleId: 'Pelanggan butuh bantuan kode',
            titleEn: 'Customer needs reference help',
            copyId: `${name} meminta bantuan mencari kode untuk ${phone}${hint ? ` (${hint})` : ''}.`,
            copyEn: `${name} asked for reference help for ${phone}${hint ? ` (${hint})` : ''}.`,
            targetRoute: `/admin/clients?phone=${encodeURIComponent(normalizePhone(phone))}`,
          },
          ...current,
        ]);
      }
      setRecoverySent(true);
      setRecoveryDraft({ phone: '', name: '', hint: '' });
    } catch {
      setRecoveryError(t('customer.lookup.recoveryError'));
    } finally {
      setRecoveryLoading(false);
    }
  };

  const submitChange = handleSubmit(async (values) => {
    if (!result) return;
    setChangeError('');
    setChangeSent(false);
    try {
      if (dataAdapter) {
        await dataAdapter.requests.change({
          reference: result.reference,
          customerName: result.customerName,
          phone: result.phone,
          changeType: values.changeType,
          changeNotes: values.changeNotes,
        });
      } else {
        setNotifications?.((current) => [
          {
            id: `lookup-change-${Date.now()}`,
            tone: values.changeType === 'cancel' ? 'warning' : 'info',
            titleId: 'Pelanggan meminta perubahan pesanan',
            titleEn: 'Customer requested an order change',
            copyId: `${result.reference} - ${result.customerName}: ${values.changeNotes || values.changeType}.`,
            copyEn: `${result.reference} - ${result.customerName}: ${values.changeNotes || values.changeType}.`,
            targetRoute: `/admin/requests/${encodeURIComponent(result.reference)}`,
          },
          ...current,
        ]);
      }
      setChangeSent(true);
    } catch {
      setChangeError(t('customer.lookup.changeError'));
    }
  });

  return (
    <section className="lookup-section lookup-shell" id="lookup-page">
      <div className="shell lookup-feature">
        <div className="lookup-card">
          <div>
            <span className="section-kicker">{t('customer.lookup.kicker')}</span>
            <h2>{t('customer.lookup.title')}</h2>
            <p>{t('customer.lookup.copy')}</p>
          </div>
          <form className="lookup-fields" aria-label={t('customer.lookup.aria')} onSubmit={handleSubmit(onLookup)}>
            <Field label={t('customer.lookup.refLabel')} error={errors.reference?.message}>
              <input {...register('reference')} />
            </Field>
            <PhoneField label={t('customer.lookup.phoneLabel')} error={errors.phone?.message} inputProps={register('phone')} />
            <button className="secondary-button" type="submit">
              {t('customer.lookup.submit')}
            </button>
          </form>
          <div className="lookup-recovery">
            <button className="text-button" type="button" onClick={() => setRecoveryOpen((open) => !open)}>
              {recoveryOpen ? t('common.close') : t('customer.lookup.forgotCode')}
            </button>
            {recoveryOpen ? (
              <form className="recovery-fields" onSubmit={submitRecovery}>
                <PhoneField
                  label={t('customer.lookup.recoveryPhone')}
                  value={recoveryDraft.phone}
                  onChange={(event) => setRecoveryDraft((current) => ({ ...current, phone: event.target.value }))}
                  required
                />
                <Field label={t('customer.lookup.recoveryName')}>
                  <input
                    value={recoveryDraft.name}
                    onChange={(event) => setRecoveryDraft((current) => ({ ...current, name: event.target.value }))}
                    autoComplete="name"
                  />
                </Field>
                <Field label={t('customer.lookup.recoveryHint')}>
                  <input
                    value={recoveryDraft.hint}
                    onChange={(event) => setRecoveryDraft((current) => ({ ...current, hint: event.target.value }))}
                  />
                </Field>
                <button className="outline-button" type="submit" disabled={recoveryLoading}>
                  {recoveryLoading ? t('common.loading') : t('customer.lookup.recoverySubmit')}
                </button>
              </form>
            ) : null}
            {recoverySent ? <p className="success-message">{t('customer.lookup.recoverySent')}</p> : null}
            {recoveryError ? <p className="validation-message">{recoveryError}</p> : null}
          </div>
        </div>

        {notFound || result ? (
          <div className="lookup-feedback-region" ref={lookupResultRef} tabIndex={-1}>
            {notFound ? <EmptyState title={t('customer.lookup.notFound')} copy={t('common.retry')} icon={AlertTriangle} /> : null}
            {result ? (
              <div className="lookup-result lookup-result-card">
                <div>
                  <span className="section-kicker">{t('customer.lookup.resultTitle')}</span>
                  <h2>{result.reference}</h2>
                  <div className="inline-status">
                    <StatusPill type="lifecycle" value={result.lifecycle} t={t} />
                    <StatusPill type="payment" value={result.paymentStatus} t={t} />
                  </div>
                </div>
                <div className="info-grid">
                  <InfoBlock title={t('common.name')} copy={result.customerName} />
                  <InfoBlock title={t('admin.table.dates')} copy={formatDateRange(result, locale)} />
                  <InfoBlock title={t('admin.table.fulfillment')} copy={t(`enum.fulfillment.${result.fulfillment}`)} />
                  <InfoBlock title={t('common.address')} copy={result.address || '-'} />
                </div>
                <div className="summary-card compact-card">
                  {result.items.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId);
                    return product ? (
                      <div className="summary-item" key={`${item.productId}-${item.variantId}`}>
                        <img src={product.image} alt={productAlt(product, t)} />
                        <div>
                          <strong>{productName(product, t)}</strong>
                          <span>{variantLabel(t, item.variantId)} x {item.qty}</span>
                        </div>
                        <b>{formatRupiah((Number(product.price) || 0) * item.qty)}</b>
                      </div>
                    ) : null;
                  })}
                </div>
                <form className="change-request-form lookup-change-request-form" onSubmit={submitChange}>
                  <div>
                    <span className="section-kicker">{t('customer.lookup.changeTitle')}</span>
                    <p>{t('customer.lookup.changeCopy')}</p>
                  </div>
                  <Controller
                    control={control}
                    name="changeType"
                    render={({ field }) => (
                      <Select.Root value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger className="select-trigger" aria-label={t('customer.lookup.changeTitle')}>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="select-content">
                            {['cancel', 'reschedule', 'items', 'contact'].map((type) => (
                              <Select.Item className="select-item" value={type} key={type}>
                                <Select.ItemText>{t(`enum.change.${type}`)}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    )}
                  />
                  <Field label={t('common.notes')} error={errors.changeNotes?.message}>
                    <textarea {...register('changeNotes')} rows={3} />
                  </Field>
                  <button className="outline-button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('common.loading') : t('customer.lookup.changeSubmit')}
                  </button>
                  {changeSent ? <p className="success-message">{t('customer.lookup.changeSent')}</p> : null}
                  {changeError ? <p className="validation-message">{changeError}</p> : null}
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
