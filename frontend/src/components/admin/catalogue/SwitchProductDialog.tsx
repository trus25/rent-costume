import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import type { TFunction } from '../../../types/domain';

export function SwitchProductDialog({
  t,
  open,
  onStay,
  onDiscard,
  onSave,
  saving,
}: {
  t: TFunction;
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
  saving: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen: boolean) => {
      if (!nextOpen) onStay();
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content destructive-dialog">
          <div className="dialog-icon danger">
            <AlertTriangle aria-hidden="true" />
          </div>
          <Dialog.Title>{t('admin.catalogue.switchTitle')}</Dialog.Title>
          <Dialog.Description className="dialog-description">{t('admin.catalogue.switchCopy')}</Dialog.Description>
          <div className="dialog-actions switch-product-actions">
            <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 aria-hidden="true" className="spin-icon" /> : <Save aria-hidden="true" />}
              {t('admin.catalogue.saveAndSwitch')}
            </button>
            <button className="outline-button" type="button" onClick={onStay}>{t('admin.catalogue.stay')}</button>
            <button className="danger-button" type="button" onClick={onDiscard}>{t('admin.catalogue.discardSwitch')}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
