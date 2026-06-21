import { useId, type ReactNode } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Field } from '../../shared';
import { contentSource } from '../../../lib/rental-utils';
import type { HomeArticle, HomeContent, HomeTestimonial, TFunction } from '../../../types/domain';

export type HomeContentLocalizedField =
  | 'heroImageAlt'
  | 'heroKicker'
  | 'heroTitle'
  | 'heroCopy'
  | 'catalogueKicker'
  | 'catalogueTitle'
  | 'catalogueCopy'
  | 'articlesKicker'
  | 'articlesTitle'
  | 'testimonialsKicker'
  | 'testimonialsTitle'
  | 'locationAddress';

export type HomeContentValueField = 'heroImageUrl' | 'locationMapEmbed' | 'locationMapUrl';
export type HomeListUpdater = {
  (listName: 'articles', index: number, field: keyof Pick<HomeArticle, 'label' | 'title' | 'copy'>, value: string): void;
  (listName: 'testimonials', index: number, field: keyof Pick<HomeTestimonial, 'quote' | 'name'>, value: string): void;
};
export type HomeListValueUpdater = (
  listName: 'testimonials',
  index: number,
  field: keyof Pick<HomeTestimonial, 'photoUrl'>,
  value: string,
) => void;

type SettingsSectionHeaderProps = {
  kicker: string;
  title: string;
  copy?: string;
};

export function SettingsSectionHeader({ kicker, title, copy }: SettingsSectionHeaderProps) {
  return (
    <div className="settings-section-head">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

type HomeContentEditorProps = {
  t: TFunction;
  homeContent: HomeContent;
  sectionIds: {
    hero: string;
    catalogue: string;
    articles: string;
    testimonials: string;
    location: string;
  };
  updateHomeContent: (field: HomeContentLocalizedField, value: string) => void;
  updateHomeValue: (field: HomeContentValueField, value: string) => void;
  updateHomeList: HomeListUpdater;
  updateHomeListValue: HomeListValueUpdater;
};

export function HomeContentEditor({
  t,
  homeContent,
  sectionIds,
  updateHomeContent,
  updateHomeValue,
  updateHomeList,
  updateHomeListValue,
}: HomeContentEditorProps) {
  return (
    <>
      <HomeEditorGroup
        id={sectionIds.hero}
        kicker={t('admin.settings.homeContent')}
        title={t('admin.settings.section.homeHero')}
        copy={t('admin.settings.homeHeroSectionCopy')}
        preview={<HomeHeroReadout t={t} homeContent={homeContent} />}
      >
        <div className="form-grid home-editor-grid">
          <Field label={t('admin.settings.homeHeroImageUrl')} hint={t('admin.settings.homeHeroImageHelp')}>
            <input
              type="text"
              inputMode="url"
              value={homeContent.heroImageUrl}
              onChange={(event) => updateHomeValue('heroImageUrl', event.target.value)}
              placeholder={t('admin.settings.homeHeroImagePlaceholder')}
            />
          </Field>
          <SettingsTextareaField
            label={t('admin.settings.homeHeroImageAlt')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={2}
            value={contentSource(homeContent.heroImageAlt)}
            onChange={(value) => updateHomeContent('heroImageAlt', value)}
          />
          <Field label={t('admin.settings.homeHeroKicker')}>
            <input value={contentSource(homeContent.heroKicker)} onChange={(event) => updateHomeContent('heroKicker', event.target.value)} />
          </Field>
          <SettingsTextareaField
            label={t('admin.settings.homeHeroTitle')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={2}
            value={contentSource(homeContent.heroTitle)}
            onChange={(value) => updateHomeContent('heroTitle', value)}
          />
          <SettingsTextareaField
            label={t('admin.settings.homeHeroCopy')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={3}
            value={contentSource(homeContent.heroCopy)}
            onChange={(value) => updateHomeContent('heroCopy', value)}
          />
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup id={sectionIds.catalogue} kicker={t('admin.settings.homeContent')} title={t('admin.settings.section.catalogueCopy')} copy={t('admin.settings.homeCatalogueSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <Field label={t('admin.settings.homeCatalogueKicker')}>
            <input value={contentSource(homeContent.catalogueKicker)} onChange={(event) => updateHomeContent('catalogueKicker', event.target.value)} />
          </Field>
          <SettingsTextareaField
            label={t('admin.settings.homeCatalogueTitle')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={2}
            value={contentSource(homeContent.catalogueTitle)}
            onChange={(value) => updateHomeContent('catalogueTitle', value)}
          />
          <SettingsTextareaField
            label={t('admin.settings.homeCatalogueCopy')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={3}
            value={contentSource(homeContent.catalogueCopy)}
            onChange={(value) => updateHomeContent('catalogueCopy', value)}
          />
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup id={sectionIds.articles} kicker={t('admin.settings.homeContent')} title={t('admin.settings.section.guideArticles')} copy={t('admin.settings.homeGuideSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <Field label={t('admin.settings.homeArticlesKicker')}>
            <input value={contentSource(homeContent.articlesKicker)} onChange={(event) => updateHomeContent('articlesKicker', event.target.value)} />
          </Field>
          <SettingsTextareaField
            label={t('admin.settings.homeArticlesTitle')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={2}
            value={contentSource(homeContent.articlesTitle)}
            onChange={(value) => updateHomeContent('articlesTitle', value)}
          />
        </div>

        <div className="home-content-admin-list">
          {homeContent.articles.map((article, index) => (
            <div className="home-content-admin-item" key={`article-${index}`}>
              <span className="section-kicker">{t('admin.settings.homeArticle', { count: index + 1 })}</span>
              <div className="form-grid home-editor-grid">
                <Field label={t('admin.settings.homeLabel')}>
                  <input value={contentSource(article.label)} onChange={(event) => updateHomeList('articles', index, 'label', event.target.value)} />
                </Field>
                <SettingsTextareaField
                  label={t('admin.settings.homeTitle')}
                  hint={t('admin.settings.sourceTextHelp')}
                  rows={2}
                  value={contentSource(article.title)}
                  onChange={(value) => updateHomeList('articles', index, 'title', value)}
                />
                <SettingsTextareaField
                  label={t('admin.settings.homeCopy')}
                  hint={t('admin.settings.sourceTextHelp')}
                  rows={3}
                  value={contentSource(article.copy)}
                  onChange={(value) => updateHomeList('articles', index, 'copy', value)}
                />
              </div>
            </div>
          ))}
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup id={sectionIds.testimonials} kicker={t('admin.settings.homeContent')} title={t('admin.settings.section.testimonials')} copy={t('admin.settings.homeTestimonialsSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <Field label={t('admin.settings.homeTestimonialsKicker')}>
            <input value={contentSource(homeContent.testimonialsKicker)} onChange={(event) => updateHomeContent('testimonialsKicker', event.target.value)} />
          </Field>
          <SettingsTextareaField
            label={t('admin.settings.homeTestimonialsTitle')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={2}
            value={contentSource(homeContent.testimonialsTitle)}
            onChange={(value) => updateHomeContent('testimonialsTitle', value)}
          />
        </div>

        <div className="home-content-admin-list">
          {homeContent.testimonials.map((testimonial, index) => (
            <div className="home-content-admin-item" key={`testimonial-${index}`}>
              <span className="section-kicker">{t('admin.settings.homeTestimonial', { count: index + 1 })}</span>
              <div className="form-grid home-editor-grid">
                <SettingsTextareaField
                  label={t('admin.settings.homeQuote')}
                  hint={t('admin.settings.sourceTextHelp')}
                  rows={3}
                  value={contentSource(testimonial.quote)}
                  onChange={(value) => updateHomeList('testimonials', index, 'quote', value)}
                />
                <Field label={t('admin.settings.homeName')}>
                  <input value={contentSource(testimonial.name)} onChange={(event) => updateHomeList('testimonials', index, 'name', event.target.value)} />
                </Field>
                <Field label={t('admin.settings.homeBuyerPhotoUrl')} hint={t('admin.settings.homeBuyerPhotoUrlHelp')}>
                  <input
                    type="text"
                    inputMode="url"
                    value={testimonial.photoUrl}
                    onChange={(event) => updateHomeListValue('testimonials', index, 'photoUrl', event.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup id={sectionIds.location} kicker={t('admin.settings.homeContent')} title={t('admin.settings.section.location')} copy={t('admin.settings.homeLocationSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <SettingsTextareaField
            label={t('admin.settings.homeLocationMapEmbed')}
            hint={t('admin.settings.homeLocationMapEmbedHelp')}
            rows={3}
            value={homeContent.locationMapEmbed}
            onChange={(value) => updateHomeValue('locationMapEmbed', value)}
          />
          <Field label={t('admin.settings.homeLocationMapUrl')} hint={t('admin.settings.homeLocationMapUrlHelp')}>
            <input
              type="text"
              inputMode="url"
              value={homeContent.locationMapUrl}
              onChange={(event) => updateHomeValue('locationMapUrl', event.target.value)}
            />
          </Field>
          <SettingsTextareaField
            label={t('admin.settings.homeLocationAddress')}
            hint={t('admin.settings.sourceTextHelp')}
            rows={3}
            value={contentSource(homeContent.locationAddress)}
            onChange={(value) => updateHomeContent('locationAddress', value)}
          />
        </div>
      </HomeEditorGroup>
    </>
  );
}

type HomeEditorGroupProps = {
  id: string;
  kicker: string;
  title: string;
  copy: string;
  preview?: ReactNode;
  children: ReactNode;
};

function HomeEditorGroup({ id, kicker, title, copy, preview, children }: HomeEditorGroupProps) {
  return (
    <section className="content-panel setting-section home-content-admin-group" id={id} data-settings-section>
      <div className={`settings-section-layout ${preview ? 'has-preview' : ''}`.trim()}>
        <div className="settings-section-main">
          <SettingsSectionHeader kicker={kicker} title={title} copy={copy} />
          {children}
        </div>
        {preview}
      </div>
    </section>
  );
}

type SettingsFieldProps = {
  label: string;
  hint: string;
  rows: number;
  value: string | undefined;
  onChange: (value: string) => void;
};

function SettingsTextareaField({ label, hint, rows, value, onChange }: SettingsFieldProps) {
  const textareaId = useId();
  const hintId = `${textareaId}-hint`;

  return (
    <Field label={label} className="field-wide" htmlFor={textareaId} hint={hint} hintId={hintId}>
      <textarea
        id={textareaId}
        rows={rows}
        value={value}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

type SettingsToggleCardProps = {
  title: string;
  copy: string;
  checked: boolean;
  checkedLabel: string;
  uncheckedLabel: string;
  onCheckedChange: (checked: boolean) => void;
};

export function SettingsToggleCard({ title, copy, checked, checkedLabel, uncheckedLabel, onCheckedChange }: SettingsToggleCardProps) {
  const titleId = useId();
  const copyId = useId();
  const stateLabel = checked ? checkedLabel : uncheckedLabel;

  return (
    <div className={`settings-toggle-card ${checked ? 'is-checked' : 'is-unchecked'}`.trim()}>
      <span className="settings-toggle-copy">
        <strong id={titleId}>{title}</strong>
        <small id={copyId}>{copy}</small>
        <span className="settings-toggle-state">{stateLabel}</span>
      </span>
      <Switch.Root
        className="switch"
        type="button"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={titleId}
        aria-describedby={copyId}
      >
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </div>
  );
}

function HomeHeroReadout({ t, homeContent }: { t: TFunction; homeContent: HomeContent }) {
  const imageUrl = homeContent.heroImageUrl.trim();
  const title = contentSource(homeContent.heroTitle);
  const copy = contentSource(homeContent.heroCopy);

  return (
    <aside className="settings-preview-panel home-hero-readout" aria-label={t('admin.settings.homeHeroPreview')}>
      {imageUrl ? (
        <img className="settings-preview-image" src={imageUrl} alt="" />
      ) : (
        <div className="settings-preview-image settings-image-placeholder" aria-hidden="true">
          {t('admin.settings.homeHeroImageFallback')}
        </div>
      )}
      <div className="settings-preview-copy">
        <span className="section-kicker">{t('admin.settings.homeHeroPreview')}</span>
        <strong>{title || t('admin.settings.homeHeroSection')}</strong>
        <p>{copy || t('admin.settings.homeHeroSectionCopy')}</p>
      </div>
    </aside>
  );
}
