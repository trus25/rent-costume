import { useEffect, useMemo, useRef, type Dispatch, type MouseEvent, type SetStateAction } from 'react';
import { Clock3, History, Mail, MessageCircle, MoreHorizontal, Pencil, Phone, PhoneCall } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet';
import { RecordActionBar } from '../common/AdminManagement';
import { RentalItems } from '../rentals/RentalRecordComponents';
import { EmptyState, Field, InfoBlock, PhoneField, StatusPill } from '../../shared';
import { formatDateRange } from '../../../lib/rental-utils';
import type { StateSetter } from '../../../types/app';
import type { Client, Locale, Product, Rental, TFunction } from '../../../types/domain';
import {
  clientInitials,
  getClientStatus,
  groupHistoryByLifecycle,
  phoneHref,
  type ClientRentalSummary,
  type PhoneDestination,
} from './clientAdminUtils';

type ClientDetailPanelProps = {
  t: TFunction;
  locale: Locale;
  selected: Client | null;
  draft: Client | null;
  setDraft: Dispatch<SetStateAction<Client | null>>;
  editMode: boolean;
  setEditMode: StateSetter<boolean>;
  onSave: () => void;
  saveMessage: string;
  history: Rental[];
  products: Product[];
  summary?: ClientRentalSummary;
  onRequestDelete: (client: Client) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
};

type ClientDetailContentProps = Omit<ClientDetailPanelProps, 'className'> & {
  showCloseButton: boolean;
};

export function ClientDetailPanel({
  className = '',
  showCloseButton = false,
  ...props
}: ClientDetailPanelProps) {
  if (!props.selected || !props.draft) return null;

  return (
    <section
      className={`record-panel feature-panel clients-detail-panel client-detail-page-panel ${className}`.trim()}
      aria-label={props.t('admin.clients.title')}
    >
      <ClientDetailContent {...props} showCloseButton={showCloseButton} />
    </section>
  );
}

type ClientDetailSheetProps = Omit<ClientDetailPanelProps, 'className' | 'showCloseButton'> & {
  open: boolean;
  onClose: () => void;
  presentation?: 'sheet' | 'page';
};

export function ClientDetailSheet({
  open,
  onClose,
  presentation = 'sheet',
  ...props
}: ClientDetailSheetProps) {
  if (presentation === 'page') {
    return <ClientDetailPanel {...props} onClose={onClose} showCloseButton={false} />;
  }
  if (!props.selected || !props.draft) return null;

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      role="dialog"
      modal={false}
      mountWhenClosed
      className="record-panel feature-panel clients-detail-panel"
      backdropClassName="clients-detail-backdrop"
      ariaLabel={props.t('admin.clients.title')}
      closeLabel={props.t('common.close')}
    >
      <ClientDetailContent {...props} onClose={onClose} showCloseButton />
    </AdminBottomSheet>
  );
}

function ClientDetailContent({
  t,
  locale,
  selected,
  draft,
  setDraft,
  editMode,
  setEditMode,
  onClose,
  onSave,
  saveMessage,
  history,
  products,
  summary,
  onRequestDelete,
  showCloseButton,
}: ClientDetailContentProps) {
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const wasEditingRef = useRef(editMode);
  const recentHistory = useMemo(() => history.slice(0, 2), [history]);
  const olderHistory = useMemo(() => history.slice(2), [history]);
  const recentHistoryGroups = useMemo(() => groupHistoryByLifecycle(recentHistory), [recentHistory]);
  const olderHistoryGroups = useMemo(() => groupHistoryByLifecycle(olderHistory), [olderHistory]);

  useEffect(() => {
    if (editMode) {
      window.requestAnimationFrame(() => firstFieldRef.current?.focus());
    } else if (wasEditingRef.current) {
      window.requestAnimationFrame(() => editButtonRef.current?.focus());
    }
    wasEditingRef.current = editMode;
  }, [editMode]);

  if (!selected || !draft) return null;

  const clientStatus = getClientStatus(summary, t);
  const totalRentals = summary?.totalRentals ?? selected.totalRentals;
  const saveDisabled = !draft.name.trim() || !draft.phone.trim();
  const updateDraftField = (field: 'name' | 'phone' | 'email' | 'notes', value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  return (
    <>
      <AdminSheetHeader
        className="record-panel-head"
        kicker={t('admin.clients.title')}
        title={draft.name}
        closeLabel={t('common.close')}
        onClose={onClose}
        closeButtonClassName="client-detail-close"
        groupTitle={false}
        showCloseButton={showCloseButton}
      />

      {editMode ? (
        <div className="content-panel compact-panel client-edit-panel">
          <div className="form-grid client-form-grid">
            <Field label={t('common.name')}>
              <input ref={firstFieldRef} value={draft.name} onChange={(event) => updateDraftField('name', event.target.value)} />
            </Field>
            <PhoneField label={t('common.phone')} value={draft.phone} onChange={(event) => updateDraftField('phone', event.target.value)} />
            <Field label={t('common.email')}>
              <input type="email" value={draft.email || ''} onChange={(event) => updateDraftField('email', event.target.value)} />
            </Field>
            <Field label={t('common.notes')} className="field-wide">
              <textarea rows={4} value={draft.notes || ''} onChange={(event) => updateDraftField('notes', event.target.value)} />
            </Field>
          </div>
          <RecordActionBar
            className="wide client-edit-actions"
            label={t('admin.clients.editDetails')}
            primary={<button type="button" onClick={onSave} disabled={saveDisabled}>{t('common.save')}</button>}
            secondary={<button type="button" onClick={() => { setDraft(selected); setEditMode(false); }}>{t('common.cancel')}</button>}
          />
        </div>
      ) : (
        <>
          <div className="client-relationship-head">
            <div className="client-identity-block">
              <span className="client-avatar client-avatar-large" aria-hidden="true">
                <span>{clientInitials(selected.name)}</span>
              </span>
              <div className="client-identity-copy">
                <strong>{selected.name}</strong>
                <span>{t('admin.clients.totalRentals')}: {totalRentals}</span>
                {clientStatus ? <ClientStatusBadge status={clientStatus} /> : null}
              </div>
            </div>
            <div className="client-contact-actions" aria-label={t('admin.clients.contactActions')}>
              <ContactActionLink phone={selected.phone} destination="whatsapp" label={t('admin.clients.whatsapp')} />
              <ContactActionLink phone={selected.phone} destination="call" label={t('admin.clients.call')} />
              {selected.email ? (
                <a className="outline-button client-contact-link" href={`mailto:${selected.email}`} aria-label={`${t('common.email')} ${selected.email}`}>
                  <Mail aria-hidden="true" />
                  {t('common.email')}
                </a>
              ) : null}
              <button ref={editButtonRef} className="outline-button client-edit-action" type="button" onClick={() => setEditMode(true)}>
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </button>
            </div>
          </div>

          <div className="info-grid client-info-grid">
            <PhoneInfoBlock title={t('common.phone')} phone={selected.phone} />
            <InfoBlock title={t('common.email')} copy={selected.email || '-'} />
            <InfoBlock title={t('admin.clients.lastContact')} copy={selected.lastContact || '-'} />
            <InfoBlock title={t('admin.clients.recentStatus')} copy={summary?.latestLifecycle ? t(`enum.lifecycle.${summary.latestLifecycle}`) : '-'} />
          </div>

          <section className="client-notes-panel" aria-labelledby="client-notes-heading">
            <div className="client-section-head">
              <span className="section-kicker" id="client-notes-heading">{t('common.notes')}</span>
            </div>
            <p>{selected.notes || '-'}</p>
          </section>

          <section className="client-secondary-actions" aria-label={t('admin.clients.secondaryActions')}>
            <button className="outline-button client-overflow-action" type="button" onClick={() => onRequestDelete(selected)}>
              <MoreHorizontal aria-hidden="true" />
              {t('admin.clients.moreActions')}
            </button>
          </section>
        </>
      )}

      <div className={`client-save-feedback ${saveMessage ? 'visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {saveMessage}
      </div>

      <section className="client-history-section" aria-labelledby="client-history-heading">
        <div className="client-section-head">
          <span className="section-kicker" id="client-history-heading">{t('admin.clients.history')}</span>
          <strong>{history.length}</strong>
        </div>
        {recentHistoryGroups.length === 0 ? (
          <EmptyState title={t('admin.clients.historyEmptyTitle')} copy={t('admin.clients.historyEmptyCopy')} icon={History} />
        ) : (
          recentHistoryGroups.map((group) => (
            <section className="client-history-group" key={group.lifecycle} aria-label={t(`enum.lifecycle.${group.lifecycle}`)}>
              <div className="client-history-group-head">
                <StatusPill type="lifecycle" value={group.lifecycle} t={t} />
                <span>{group.rentals.length}</span>
              </div>
              <div className="client-history-list">
                {group.rentals.map((rental) => (
                  <article className="history-card client-history-card" key={rental.reference}>
                    <div className="history-card-head">
                      <strong>{rental.reference}</strong>
                      <span>{formatDateRange(rental, locale)}</span>
                    </div>
                    <RentalItems rental={rental} products={products} t={t} compact />
                    <div className="history-card-status">
                      <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
                      <StatusPill type="payment" value={rental.paymentStatus} t={t} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
        {olderHistoryGroups.length > 0 ? (
          <details className="client-history-older">
            <summary>
              <span>{t('admin.clients.olderRentals')}</span>
              <strong>{olderHistory.length}</strong>
            </summary>
            <div className="client-history-older-content">
              {olderHistoryGroups.map((group) => (
                <section className="client-history-group" key={group.lifecycle} aria-label={t(`enum.lifecycle.${group.lifecycle}`)}>
                  <div className="client-history-group-head">
                    <StatusPill type="lifecycle" value={group.lifecycle} t={t} />
                    <span>{group.rentals.length}</span>
                  </div>
                  <div className="client-history-list">
                    {group.rentals.map((rental) => (
                      <article className="history-card client-history-card" key={rental.reference}>
                        <div className="history-card-head">
                          <strong>{rental.reference}</strong>
                          <span>{formatDateRange(rental, locale)}</span>
                        </div>
                        <RentalItems rental={rental} products={products} t={t} compact />
                        <div className="history-card-status">
                          <StatusPill type="lifecycle" value={rental.lifecycle} t={t} />
                          <StatusPill type="payment" value={rental.paymentStatus} t={t} />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </>
  );
}

function ClientStatusBadge({ status }: { status: NonNullable<ReturnType<typeof getClientStatus>> }) {
  return (
    <span className={`status-badge ${status.tone}`}>
      <Clock3 aria-hidden="true" />
      <span className="status-badge-label">{status.label}</span>
    </span>
  );
}

type PhoneInfoBlockProps = {
  title: string;
  phone: string;
};

function PhoneInfoBlock({ title, phone }: PhoneInfoBlockProps) {
  return (
    <div className="info-block">
      <span>{title}</span>
      <strong>
        <PhoneLink phone={phone} destination="whatsapp" />
      </strong>
    </div>
  );
}

type PhoneLinkProps = {
  phone: string;
  destination?: PhoneDestination;
};

function PhoneLink({ phone, destination = 'whatsapp' }: PhoneLinkProps) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return <span>-</span>;

  const href = phoneHref(visiblePhone, destination);
  const destinationLabel = destination === 'whatsapp' ? 'WhatsApp' : 'Call';
  const Icon = destination === 'whatsapp' ? MessageCircle : Phone;

  return (
    <a
      className="phone-link"
      href={href}
      target={destination === 'whatsapp' ? '_blank' : undefined}
      rel={destination === 'whatsapp' ? 'noreferrer' : undefined}
      aria-label={`${destinationLabel} ${visiblePhone}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
    >
      <Icon aria-hidden="true" />
      <span>{visiblePhone}</span>
    </a>
  );
}

type ContactActionLinkProps = {
  phone: string;
  destination: PhoneDestination;
  label: string;
};

function ContactActionLink({ phone, destination, label }: ContactActionLinkProps) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return null;

  const href = phoneHref(visiblePhone, destination);
  const destinationLabel = destination === 'whatsapp' ? 'WhatsApp' : 'Call';
  const Icon = destination === 'whatsapp' ? MessageCircle : PhoneCall;

  return (
    <a
      className={`${destination === 'whatsapp' ? 'secondary-button' : 'outline-button'} client-contact-link`}
      href={href}
      target={destination === 'whatsapp' ? '_blank' : undefined}
      rel={destination === 'whatsapp' ? 'noreferrer' : undefined}
      aria-label={`${destinationLabel} ${visiblePhone}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </a>
  );
}
