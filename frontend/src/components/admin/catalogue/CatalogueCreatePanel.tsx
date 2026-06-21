import { AdminCreatePanel } from '../common/AdminManagement';
import { Field, SelectField, type SelectOption } from '../../shared';
import type { StateSetter } from '../../../types/app';
import type { Locale, TFunction } from '../../../types/domain';
import type { CatalogueCreateDraft } from './catalogueEditorTypes';
import type { DraftNumber } from './catalogueAdminUtils';

export const categoryOptions = (locale: Locale): SelectOption[] => [
  { value: 'formal', label: locale === 'id' ? 'Formal' : 'Formal' },
  { value: 'accessory', label: locale === 'id' ? 'Aksesori' : 'Accessory' },
];

export const genderOptions = (t: TFunction): SelectOption[] => ['women', 'men', 'unisex', 'kids'].map((value) => ({
  value,
  label: t(`enum.gender.${value}`),
}));

export function CatalogueCreatePanel({
  t,
  locale,
  createDraft,
  setCreateDraft,
  onCreate,
  onClose,
  toNonNegativeDraftNumber,
  standalone = false,
}: {
  t: TFunction;
  locale: Locale;
  createDraft: CatalogueCreateDraft;
  setCreateDraft: StateSetter<CatalogueCreateDraft>;
  onCreate: () => void;
  onClose: () => void;
  toNonNegativeDraftNumber: (value: string | number) => DraftNumber;
  standalone?: boolean;
}) {
  return (
    <AdminCreatePanel
      id="catalogue-create-panel"
      kicker={t('admin.catalogue.add')}
      title={t('admin.catalogue.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
      standalone={standalone}
    >
      <div className="form-grid">
        <Field label={t('common.name')}>
          <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <Field label={t('admin.catalogue.meta')}>
          <input value={createDraft.meta} onChange={(event) => setCreateDraft((current) => ({ ...current, meta: event.target.value }))} />
        </Field>
        <SelectField
          label={t('admin.catalogue.category')}
          value={createDraft.category}
          onValueChange={(category) => setCreateDraft((current) => ({ ...current, category }))}
          options={categoryOptions(locale)}
        />
        <SelectField
          label={t('admin.catalogue.gender')}
          value={createDraft.gender}
          onValueChange={(gender) => setCreateDraft((current) => ({ ...current, gender }))}
          options={genderOptions(t)}
        />
        <Field label={t('admin.catalogue.price')}>
          <input type="number" min="0" value={createDraft.price} onChange={(event) => setCreateDraft((current) => ({ ...current, price: toNonNegativeDraftNumber(event.target.value) }))} />
        </Field>
        <Field label={t('admin.catalogue.newVariant')}>
          <input value={createDraft.variantLabel} onChange={(event) => setCreateDraft((current) => ({ ...current, variantLabel: event.target.value }))} />
        </Field>
        <Field label={t('admin.catalogue.totalQty')}>
          <input type="number" min="1" value={createDraft.total} onChange={(event) => setCreateDraft((current) => ({ ...current, total: event.target.value === '' ? '' : Number(event.target.value) }))} />
        </Field>
      </div>
      <div className="dialog-actions">
        <button className="outline-button" type="button" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="secondary-button" type="button" onClick={onCreate} disabled={!createDraft.name.trim() || !createDraft.variantLabel.trim()}>
          {t('common.save')}
        </button>
      </div>
    </AdminCreatePanel>
  );
}
