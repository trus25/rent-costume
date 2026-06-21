import { MessageCircle, Trash2 } from 'lucide-react';
import AdminBottomSheet, { AdminSheetHeader } from '../common/AdminBottomSheet';
import { InfoBlock } from '../../shared';
import type { Client, TFunction } from '../../../types/domain';
import { phoneHref } from './clientAdminUtils';

type ClientDeleteConfirmSheetProps = {
  t: TFunction;
  target: Client | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClientDeleteConfirmSheet({ t, target, open, onCancel, onConfirm }: ClientDeleteConfirmSheetProps) {
  if (!target) return null;

  return (
    <AdminBottomSheet
      open={open}
      onClose={onCancel}
      role="dialog"
      className="dialog-content destructive-dialog client-delete-dialog"
      ariaLabel={t('admin.clients.deleteTitle')}
      closeLabel={t('common.close')}
    >
      <AdminSheetHeader
        kicker={t('admin.clients.moreActions')}
        title={t('admin.clients.deleteTitle')}
        closeLabel={t('common.close')}
        onClose={onCancel}
      />
      <div className="destructive-summary client-delete-summary">
        <InfoBlock title={t('common.name')} copy={target.name} />
        <InfoBlock title={t('common.phone')} copy={<PhoneLink phone={target.phone} />} />
      </div>
      <p className="destructive-warning">{t('admin.clients.deleteCopy')}</p>
      <div className="dialog-actions client-delete-actions">
        <button className="danger-button" type="button" onClick={onConfirm}>
          <Trash2 aria-hidden="true" />
          {t('admin.clients.deleteConfirm')}
        </button>
        <button className="outline-button" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </AdminBottomSheet>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return <span>-</span>;

  return (
    <a
      className="phone-link"
      href={phoneHref(visiblePhone, 'whatsapp')}
      target="_blank"
      rel="noreferrer"
      aria-label={`WhatsApp ${visiblePhone}`}
    >
      <MessageCircle aria-hidden="true" />
      <span>{visiblePhone}</span>
    </a>
  );
}
