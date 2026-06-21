import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DestructiveConfirmDialog, Field } from '../../shared';
import { contentSource } from '../../../lib/rental-utils';
import type { CatalogueEditorProps } from './catalogueEditorTypes';

export function VariantsTab({
  t,
  variants,
  variantErrors,
  newVariant,
  newVariantErrors,
  setNewVariant,
  setNewVariantErrors,
  updateVariant,
  adjustVariantTotal,
  removeVariant,
  addVariant,
  variantLabelRef,
  updateSource,
  stockSummary,
}: Pick<
  CatalogueEditorProps,
  | 't'
  | 'newVariant'
  | 'newVariantErrors'
  | 'setNewVariant'
  | 'setNewVariantErrors'
  | 'updateVariant'
  | 'adjustVariantTotal'
  | 'removeVariant'
  | 'addVariant'
  | 'variantLabelRef'
  | 'updateSource'
  | 'stockSummary'
> & {
  variants: CatalogueEditorProps['productDraft']['variants'];
  variantErrors: CatalogueEditorProps['variantErrors'];
}) {
  const [pendingRemovalId, setPendingRemovalId] = useState('');

  const confirmRemoveVariant = () => {
    if (!pendingRemovalId) return;
    removeVariant(pendingRemovalId);
    setPendingRemovalId('');
  };

  return (
    <div className="editor-section">
      <div className="editor-section-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.variantInventory')}</span>
          <h3>{t('admin.catalogue.variantHelp')}</h3>
          <p>{t('admin.catalogue.stockHelp')}</p>
        </div>
      </div>
      <div className="variant-management">
        {variants.map((variant) => {
          const errors = variantErrors[variant.id] ?? {};
          const held = stockSummary.variants.find((entry) => entry.variantId === variant.id)?.held ?? 0;
          const total = Number(variant.total) || 0;
          const available = Math.max(0, total - held);
          return (
            <div className="variant-row variant-admin-row variant-card" key={variant.id}>
              <Field label={t('admin.catalogue.variantLabel')} error={errors.label} errorId={`variant-${variant.id}-label-error`}>
                <input
                  value={variant.label}
                  aria-invalid={Boolean(errors.label)}
                  aria-describedby={errors.label ? `variant-${variant.id}-label-error` : undefined}
                  onChange={(event) => updateVariant(variant.id, { label: event.target.value })}
                />
              </Field>
              <Field label={t('admin.catalogue.totalQty')} error={errors.total} errorId={`variant-${variant.id}-total-error`}>
                <input
                  type="number"
                  min={Math.max(1, held)}
                  value={variant.total}
                  aria-invalid={Boolean(errors.total)}
                  aria-describedby={errors.total ? `variant-${variant.id}-total-error` : undefined}
                  onChange={(event) => updateVariant(variant.id, { total: event.target.value })}
                />
              </Field>
              <Field label={t('admin.catalogue.variantNotes')}>
                <textarea
                  rows={2}
                  value={contentSource(variant.notes, variant.notesId ?? variant.notesEn ?? '')}
                  onChange={(event) => updateVariant(variant.id, { notes: updateSource(variant.notes, event.target.value) })}
                />
              </Field>
              <div className="variant-availability-readout">
                <span>{t('admin.catalogue.availableQty')}</span>
                <strong>{t('admin.catalogue.stockFraction', { available, total })}</strong>
                <small>{t('admin.catalogue.heldQty', { count: held })}</small>
              </div>
              <div className="quantity-control variant-stock-control">
                <button type="button" onClick={() => adjustVariantTotal(variant.id, -1)} aria-label={t('admin.catalogue.decreaseVariant')}>
                  <Minus aria-hidden="true" />
                </button>
                <button type="button" onClick={() => adjustVariantTotal(variant.id, 1)} aria-label={t('admin.catalogue.increaseVariant')}>
                  <Plus aria-hidden="true" />
                </button>
                <button className="icon-button danger" type="button" onClick={() => setPendingRemovalId(variant.id)} aria-label={t('admin.catalogue.removeVariant')} disabled={variants.length <= 1}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}

        {variants.length <= 1 ? <p className="helper-text">{t('admin.catalogue.requiredFirstVariant')}</p> : null}

        <div className="variant-row variant-admin-row variant-card add-variant-row">
          <Field label={t('admin.catalogue.newVariant')} error={newVariantErrors.label} errorId="new-variant-label-error">
            <input
              ref={variantLabelRef}
              value={newVariant.label}
              aria-invalid={Boolean(newVariantErrors.label)}
              aria-describedby={newVariantErrors.label ? 'new-variant-label-error' : undefined}
              onPointerDown={() => setNewVariantErrors((current) => ({ ...current, label: '' }))}
              onChange={(event) => {
                setNewVariant((current) => ({ ...current, label: event.target.value }));
                if (newVariantErrors.label) setNewVariantErrors((current) => ({ ...current, label: '' }));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addVariant();
                }
              }}
              placeholder="XXL"
            />
          </Field>
          <Field label={t('admin.catalogue.totalQty')} error={newVariantErrors.total} errorId="new-variant-total-error">
            <input
              type="number"
              min="1"
              value={newVariant.total}
              aria-invalid={Boolean(newVariantErrors.total)}
              aria-describedby={newVariantErrors.total ? 'new-variant-total-error' : undefined}
              onPointerDown={() => setNewVariantErrors((current) => ({ ...current, total: '' }))}
              onChange={(event) => {
                setNewVariant((current) => ({ ...current, total: event.target.value === '' ? '' : Number(event.target.value) }));
                if (newVariantErrors.total) setNewVariantErrors((current) => ({ ...current, total: '' }));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addVariant();
                }
              }}
            />
          </Field>
          <Field label={t('admin.catalogue.variantNotes')}>
            <textarea
              rows={2}
              value={newVariant.notes}
              onChange={(event) => setNewVariant((current) => ({ ...current, notes: event.target.value }))}
            />
          </Field>
          <button className="outline-button add-variant-button" type="button" onClick={addVariant}>
            <Plus aria-hidden="true" />
            {t('admin.catalogue.addVariant')}
          </button>
        </div>
      </div>
      <DestructiveConfirmDialog
        open={Boolean(pendingRemovalId)}
        onOpenChange={(open) => {
          if (!open) setPendingRemovalId('');
        }}
        title={t('admin.common.confirmRemoveTitle')}
        description={t('admin.catalogue.confirmRemoveVariantCopy')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.remove')}
        onConfirm={confirmRemoveVariant}
      />
    </div>
  );
}
