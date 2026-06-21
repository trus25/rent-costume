import * as Switch from '@radix-ui/react-switch';
import { Field, SelectField } from '../../shared';
import {
  contentSource,
  formatRupiah,
  productDescription,
  productMeta,
  productName,
} from '../../../lib/rental-utils';
import type { CatalogueEditorProps } from './catalogueEditorTypes';

export function DetailsTab({
  t,
  locale,
  productDraft,
  detailErrors,
  updateDraft,
  categoryOptions,
  genderOptions,
  toNonNegativeDraftNumber,
  toNonNegativeNumber,
  updateSource,
}: Pick<
  CatalogueEditorProps,
  | 't'
  | 'locale'
  | 'productDraft'
  | 'detailErrors'
  | 'updateDraft'
  | 'categoryOptions'
  | 'genderOptions'
  | 'toNonNegativeDraftNumber'
  | 'toNonNegativeNumber'
  | 'updateSource'
>) {
  return (
    <div className="editor-section">
      <div className="editor-section-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.detailsTitle')}</span>
          <h3>{t('admin.catalogue.detailsCopy')}</h3>
        </div>
        <div className="info-block compact-info">
          <span>{t('admin.catalogue.publicPrice')}</span>
          <strong>{formatRupiah(toNonNegativeNumber(productDraft.price))}</strong>
        </div>
      </div>
      <div className="catalogue-edit-grid editor-field-grid">
        <Field label={t('common.name')} error={detailErrors.name} errorId="catalogue-name-error">
          <input
            value={productName(productDraft, t)}
            aria-invalid={Boolean(detailErrors.name)}
            aria-describedby={detailErrors.name ? 'catalogue-name-error' : undefined}
            onChange={(event) => updateDraft({
              name: event.target.value,
              alt: event.target.value,
            })}
          />
        </Field>
        <Field label={t('admin.catalogue.meta')}>
          <input value={productMeta(productDraft, t)} onChange={(event) => updateDraft({ meta: event.target.value })} />
        </Field>
        <SelectField
          label={t('admin.catalogue.category')}
          value={productDraft.category}
          onValueChange={(category) => updateDraft({ category })}
          options={categoryOptions}
        />
        <SelectField
          label={t('admin.catalogue.gender')}
          value={productDraft.gender ?? 'unisex'}
          onValueChange={(gender) => updateDraft({ gender })}
          options={genderOptions}
        />
        <Field label={t('admin.catalogue.price')}>
          <input
            type="number"
            min="0"
            value={productDraft.price}
            onChange={(event) => updateDraft({ price: toNonNegativeDraftNumber(event.target.value) })}
          />
        </Field>
        <Field label={t('admin.catalogue.description')}>
          <textarea
            rows={3}
            value={contentSource(productDraft.description, productDescription(productDraft, locale, t))}
            onChange={(event) => updateDraft({ description: updateSource(productDraft.description, event.target.value) })}
          />
        </Field>
      </div>
      <label className="switch-row catalogue-visibility">
        <span>
          <strong>{productDraft.active ? t('admin.catalogue.active') : t('admin.catalogue.inactive')}</strong>
          <small>{t('admin.catalogue.visibilityHelp')}</small>
        </span>
        <Switch.Root
          className="switch"
          checked={productDraft.active}
          aria-label={t('admin.catalogue.visibilitySwitch')}
          onCheckedChange={(checked) => updateDraft({ active: checked })}
        >
          <Switch.Thumb className="switch-thumb" />
        </Switch.Root>
      </label>
    </div>
  );
}
