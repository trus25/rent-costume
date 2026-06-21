import { AdminCreatePanel } from '../common/AdminManagement';
import { Field, PhoneField } from '../../shared';
import type { StateSetter } from '../../../types/app';
import type { TFunction } from '../../../types/domain';
import type { NewClientDraft } from './clientAdminUtils';

type ClientCreatePanelProps = {
  t: TFunction;
  newClient: NewClientDraft;
  setNewClient: StateSetter<NewClientDraft>;
  onAdd: () => void;
  onClose: () => void;
  standalone?: boolean;
};

export function ClientCreatePanel({ t, newClient, setNewClient, onAdd, onClose, standalone = false }: ClientCreatePanelProps) {
  return (
    <AdminCreatePanel
      id="client-add-panel"
      className="client-create-panel"
      kicker={t('admin.clients.add')}
      title={t('admin.clients.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
      standalone={standalone}
    >
      <div className="form-grid client-form-grid">
        <Field label={t('common.name')}>
          <input value={newClient.name} onChange={(event) => setNewClient((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <PhoneField label={t('common.phone')} value={newClient.phone} onChange={(event) => setNewClient((current) => ({ ...current, phone: event.target.value }))} />
        <Field label={t('common.email')}>
          <input type="email" value={newClient.email} onChange={(event) => setNewClient((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <Field label={t('common.notes')} className="field-wide">
          <textarea rows={3} value={newClient.notes} onChange={(event) => setNewClient((current) => ({ ...current, notes: event.target.value }))} />
        </Field>
      </div>
      <div className="dialog-actions">
        <button className="outline-button" type="button" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="secondary-button" type="button" onClick={onAdd} disabled={!newClient.name.trim() || !newClient.phone.trim()}>
          {t('common.save')}
        </button>
      </div>
    </AdminCreatePanel>
  );
}
