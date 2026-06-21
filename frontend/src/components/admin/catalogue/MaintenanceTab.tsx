import { Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { DestructiveConfirmDialog, Field } from '../../shared';
import { formatDateRange } from '../../../lib/rental-utils';
import type { CatalogueEditorProps } from './catalogueEditorTypes';

export function MaintenanceTab({
  t,
  locale,
  productDraft,
  maintenanceOpen,
  setMaintenanceOpen,
  maintenanceDraft,
  setMaintenanceDraft,
  saveMaintenanceBlock,
  removeMaintenanceBlock,
}: Pick<
  CatalogueEditorProps,
  | 't'
  | 'locale'
  | 'productDraft'
  | 'maintenanceOpen'
  | 'setMaintenanceOpen'
  | 'maintenanceDraft'
  | 'setMaintenanceDraft'
  | 'saveMaintenanceBlock'
  | 'removeMaintenanceBlock'
>) {
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null);

  const confirmRemoveMaintenanceBlock = () => {
    if (pendingRemovalIndex === null) return;
    removeMaintenanceBlock(pendingRemovalIndex);
    setPendingRemovalIndex(null);
  };

  return (
    <div className="editor-section maintenance-panel flat-panel">
      <div className="maintenance-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.maintenance')}</span>
          <p>{t('admin.catalogue.maintenanceHelp')}</p>
        </div>
        <button className="outline-button" type="button" onClick={() => setMaintenanceOpen((open) => !open)}>
          <Wrench aria-hidden="true" />
          {maintenanceOpen ? t('common.cancel') : t('admin.catalogue.addMaintenance')}
        </button>
      </div>

      {productDraft.maintenanceBlocks.length > 0 ? (
        <div className="maintenance-list">
          {productDraft.maintenanceBlocks.map((block, index) => (
            <div className="maintenance-item maintenance-block-card" key={block.id ?? `${block.start}-${block.end}-${index}`}>
              <div>
                <strong>{formatDateRange(block, locale)}</strong>
                <span>{block.reason || t('admin.catalogue.maintenanceNoReason')}</span>
              </div>
              <button className="icon-button danger" type="button" onClick={() => setPendingRemovalIndex(index)} aria-label={t('admin.catalogue.removeMaintenance')}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <Wrench aria-hidden="true" />
          <strong>{t('admin.catalogue.noMaintenanceTitle')}</strong>
          <p>{t('admin.catalogue.noMaintenance')}</p>
        </div>
      )}

      {maintenanceOpen ? (
        <div className="maintenance-form maintenance-block-form">
          <div className="form-grid">
            <Field label={t('common.dateStart')}>
              <input type="date" value={maintenanceDraft.start} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, start: event.target.value }))} />
            </Field>
            <Field label={t('admin.catalogue.maintenanceEnd')}>
              <input type="date" value={maintenanceDraft.end} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, end: event.target.value }))} />
            </Field>
          </div>
          <Field label={t('common.notes')}>
            <input value={maintenanceDraft.reason} onChange={(event) => setMaintenanceDraft((current) => ({ ...current, reason: event.target.value }))} placeholder={t('admin.catalogue.maintenancePlaceholder')} />
          </Field>
          <button className="secondary-button full" type="button" onClick={saveMaintenanceBlock} disabled={!maintenanceDraft.start || !maintenanceDraft.end}>
            {t('common.save')}
          </button>
        </div>
      ) : null}
      <DestructiveConfirmDialog
        open={pendingRemovalIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemovalIndex(null);
        }}
        title={t('admin.common.confirmRemoveTitle')}
        description={t('admin.catalogue.confirmRemoveMaintenanceCopy')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.remove')}
        onConfirm={confirmRemoveMaintenanceBlock}
      />
    </div>
  );
}
