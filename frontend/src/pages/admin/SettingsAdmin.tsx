import { useEffect, useState, type FormEvent } from 'react';
import {
  SettingsPageLayout,
} from '../../components/admin/common/AdminManagement';
import {
  HomeContentEditor,
  SettingsSectionHeader,
  SettingsToggleCard,
  type HomeContentLocalizedField,
  type HomeContentValueField,
} from '../../components/admin/settings/SettingsPanels';
import { Field } from '../../components/shared';
import { normalizeHomeContent } from '../../mockData';
import { toSourceContent } from '../../lib/rental-utils';
import type { StateSetter } from '../../types/app';
import type { DataAdapter, HomeArticle, HomeTestimonial, LocalizedContent, Settings, TFunction } from '../../types/domain';

type SettingsAdminProps = {
  t: TFunction;
  settings: Settings;
  setSettings: StateSetter<Settings>;
  dataAdapter?: DataAdapter;
};

type ArticleLocalizedField = keyof Pick<HomeArticle, 'label' | 'title' | 'copy'>;
type TestimonialLocalizedField = keyof Pick<HomeTestimonial, 'quote' | 'name'>;
type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const settingsSectionIds = [
  'settings-brand',
  'settings-policy',
  'settings-home-hero',
  'settings-catalogue-copy',
  'settings-guide-articles',
  'settings-testimonials',
  'settings-location',
  'settings-toggles',
] as const;

type SettingsSectionId = typeof settingsSectionIds[number];

const settingsSectionLabelKeys: Record<SettingsSectionId, string> = {
  'settings-brand': 'admin.settings.section.brand',
  'settings-policy': 'admin.settings.section.policy',
  'settings-home-hero': 'admin.settings.section.homeHero',
  'settings-catalogue-copy': 'admin.settings.section.catalogueCopy',
  'settings-guide-articles': 'admin.settings.section.guideArticles',
  'settings-testimonials': 'admin.settings.section.testimonials',
  'settings-location': 'admin.settings.section.location',
  'settings-toggles': 'admin.settings.section.toggles',
};

const settingsMobileSectionLinks = [
  { id: 'settings-brand', labelKey: 'admin.settings.mobileSection.brand' },
  { id: 'settings-policy', labelKey: 'admin.settings.mobileSection.policy' },
  { id: 'settings-home-hero', labelKey: 'admin.settings.mobileSection.home' },
  { id: 'settings-toggles', labelKey: 'admin.settings.mobileSection.toggles' },
] as const;

const homeSectionIds: SettingsSectionId[] = [
  'settings-home-hero',
  'settings-catalogue-copy',
  'settings-guide-articles',
  'settings-testimonials',
  'settings-location',
];

export default function SettingsAdmin({ t, settings, setSettings, dataAdapter }: SettingsAdminProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('settings-brand');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [draft, setDraft] = useState<Settings>(settings);
  const homeContent = normalizeHomeContent(draft.homeContent);
  const normalizedDraft: Settings = { ...draft, homeContent };
  const hasChanges = JSON.stringify(normalizedDraft) !== JSON.stringify(settings);
  const resolvedCustomerTagline = draft.customerTaglineCustom || t(draft.customerTaglineKey);
  const resolvedStaffTagline = draft.staffTaglineCustom || t(draft.staffTaglineKey);
  const saveStatus = hasChanges && saveState === 'idle' ? 'unsaved' : saveState;
  const announcesStatus = hasInteracted && (saveStatus === 'unsaved' || saveStatus === 'saved' || saveStatus === 'error');
  const canSave = hasChanges && saveStatus !== 'saving';
  const isHomeSectionActive = homeSectionIds.includes(activeSection);

  useEffect(() => {
    if (!hasInteracted || saveState === 'saving') return;
    if (hasChanges && saveState !== 'unsaved') {
      setSaveState('unsaved');
    } else if (!hasChanges && saveState === 'unsaved') {
      setSaveState('idle');
    }
  }, [hasChanges, hasInteracted, saveState]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];

        if (visibleEntry && settingsSectionIds.includes(visibleEntry.target.id as SettingsSectionId)) {
          setActiveSection(visibleEntry.target.id as SettingsSectionId);
        }
      },
      { rootMargin: '-24% 0px -62% 0px', threshold: [0, 0.2, 0.5] },
    );

    settingsSectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const markEdited = () => {
    setHasInteracted(true);
    setSaveState((current) => (current === 'saving' ? current : 'unsaved'));
  };

  const updateDraft = (updater: (current: Settings) => Settings) => {
    markEdited();
    setDraft(updater);
  };

  const updateHomeContent = (field: HomeContentLocalizedField, value: string) => {
    updateDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      return {
        ...current,
        homeContent: {
          ...merged,
          [field]: updateSource(merged[field] as LocalizedContent, value),
        },
      };
    });
  };

  const updateHomeValue = (field: HomeContentValueField, value: string) => {
    updateDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      return {
        ...current,
        homeContent: {
          ...merged,
          [field]: value,
        },
      };
    });
  };

  function updateHomeList(listName: 'articles', index: number, field: ArticleLocalizedField, value: string): void;
  function updateHomeList(listName: 'testimonials', index: number, field: TestimonialLocalizedField, value: string): void;
  function updateHomeList(
    listName: 'articles' | 'testimonials',
    index: number,
    field: ArticleLocalizedField | TestimonialLocalizedField,
    value: string,
  ) {
    updateDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      if (listName === 'articles') {
        const articleField = field as ArticleLocalizedField;
        const articles = merged.articles.map((item, itemIndex) => (
          itemIndex === index ? { ...item, [articleField]: updateSource(item[articleField], value) } : item
        ));
        return {
          ...current,
          homeContent: {
            ...merged,
            articles,
          },
        };
      }

      const testimonialField = field as TestimonialLocalizedField;
      const testimonials = merged.testimonials.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [testimonialField]: updateSource(item[testimonialField], value) } : item
      ));
      return {
        ...current,
        homeContent: {
          ...merged,
          testimonials,
        },
      };
    });
  }

  const updateHomeListValue = (
    listName: 'testimonials',
    index: number,
    field: keyof Pick<HomeTestimonial, 'photoUrl'>,
    value: string,
  ) => {
    updateDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      const nextList = merged[listName].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ));
      return {
        ...current,
        homeContent: {
          ...merged,
          [listName]: nextList,
        },
      };
    });
  };

  const saveAllSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasInteracted(true);
    if (!hasChanges || saveState === 'saving') return;

    setSaveState('saving');
    try {
      if (dataAdapter) {
        await dataAdapter.admin.settings.save(normalizedDraft);
      }
      setSettings(normalizedDraft);
      setDraft(normalizedDraft);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  return (
    <SettingsPageLayout className={`settings-form settings-editor-layout ${hasChanges ? 'has-pending-save' : ''}`} onSubmit={saveAllSettings}>
      <div className="settings-rail">
        <nav className="settings-section-index" aria-label={t('admin.settings.sectionIndex')}>
          <span className="section-kicker">{t('admin.settings.sectionIndex')}</span>
          <div className="settings-index-links settings-index-links-mobile">
            {settingsMobileSectionLinks.map((section) => (
              <a
                href={`#${section.id}`}
                key={section.id}
                aria-current={
                  activeSection === section.id || (section.id === 'settings-home-hero' && isHomeSectionActive)
                    ? 'location'
                    : undefined
                }
                onClick={() => setActiveSection(section.id)}
              >
                {t(section.labelKey)}
              </a>
            ))}
          </div>
          <div className="settings-index-links settings-index-links-desktop">
            {settingsSectionIds.map((sectionId) => (
              <a
                href={`#${sectionId}`}
                key={sectionId}
                aria-current={activeSection === sectionId ? 'location' : undefined}
                onClick={() => setActiveSection(sectionId)}
              >
                {t(settingsSectionLabelKeys[sectionId])}
              </a>
            ))}
          </div>
        </nav>

        <div className={`settings-savebar ${hasChanges ? 'is-active' : 'is-idle'} is-${saveStatus}`}>
          <div className="settings-savebar-copy">
            <span className="section-kicker">{t('admin.settings.statusTitle')}</span>
            <span
              className={`settings-savebar-status ${saveStatus}`}
              role={announcesStatus ? 'status' : undefined}
              aria-live={announcesStatus ? 'polite' : undefined}
            >
              {settingsStatusLabel(saveStatus, t)}
            </span>
            <small>{t('admin.settings.saveHelp')}</small>
          </div>
          <button className="primary-button" type="submit" disabled={!canSave} aria-label={t('admin.settings.saveAll')}>
            {saveStatus === 'saving' ? t('admin.settings.saving') : t('admin.settings.saveAll')}
          </button>
        </div>
      </div>

      <div className="settings-editor">
        <section className="content-panel setting-section settings-brand-policy-section" id="settings-brand" data-settings-section>
          <div className="settings-section-layout has-preview">
            <div className="settings-section-main">
              <SettingsSectionHeader
                kicker={t('admin.settings.title')}
                title={t('admin.settings.brandPolicyTitle')}
                copy={t('admin.settings.brandPolicyCopy')}
              />
              <div className="form-grid">
                <Field label={t('admin.settings.brandName')} htmlFor="settings-brand-name">
                  <input
                    id="settings-brand-name"
                    value={draft.brandName}
                    placeholder="Costume Rental"
                    onChange={(event) => updateDraft((current) => ({ ...current, brandName: event.target.value }))}
                  />
                </Field>
                <Field label={t('admin.settings.customerTagline')} htmlFor="settings-customer-tagline">
                  <input
                    id="settings-customer-tagline"
                    value={resolvedCustomerTagline}
                    placeholder={t(draft.customerTaglineKey)}
                    onChange={(event) => updateDraft((current) => ({ ...current, customerTaglineCustom: event.target.value }))}
                  />
                </Field>
                <Field label={t('admin.settings.staffTagline')} htmlFor="settings-staff-tagline">
                  <input
                    id="settings-staff-tagline"
                    value={resolvedStaffTagline}
                    placeholder={t(draft.staffTaglineKey)}
                    onChange={(event) => updateDraft((current) => ({ ...current, staffTaglineCustom: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="settings-policy-subsection" id="settings-policy" data-settings-section>
                <SettingsSectionHeader
                  kicker={t('admin.settings.homeContent')}
                  title={t('admin.settings.section.policy')}
                  copy={t('admin.settings.policySectionCopy')}
                />
                <Field label={t('admin.settings.policy')} htmlFor="settings-policy-copy" hint={t('admin.settings.policyHelp')} hintId="settings-policy-copy-help" className="field-wide">
                  <textarea
                    id="settings-policy-copy"
                    rows={4}
                    value={draft.policy || t(draft.policyKey ?? 'admin.settings.defaultPolicy')}
                    aria-describedby="settings-policy-copy-help"
                    onChange={(event) => updateDraft((current) => ({ ...current, policy: event.target.value }))}
                  />
                </Field>
              </div>
            </div>
            <aside className="settings-preview-panel settings-brand-preview" aria-label={t('admin.settings.brandPreview')}>
              <span className="settings-brand-mark" aria-hidden="true">{draft.brandName.trim().slice(0, 2) || 'CR'}</span>
              <div className="settings-preview-copy">
                <span className="section-kicker">{t('admin.settings.brandPreview')}</span>
                <h3 className="font-bold">{draft.brandName}</h3>
                <p className="text-sm text-[var(--muted)]">{resolvedCustomerTagline}</p>
                <small>{resolvedStaffTagline}</small>
              </div>
            </aside>
          </div>
        </section>

        <HomeContentEditor
          t={t}
          homeContent={homeContent}
          sectionIds={{
            hero: 'settings-home-hero',
            catalogue: 'settings-catalogue-copy',
            articles: 'settings-guide-articles',
            testimonials: 'settings-testimonials',
            location: 'settings-location',
          }}
          updateHomeContent={updateHomeContent}
          updateHomeValue={updateHomeValue}
          updateHomeList={updateHomeList}
          updateHomeListValue={updateHomeListValue}
        />
        <section className="content-panel setting-section" id="settings-toggles" data-settings-section>
          <SettingsSectionHeader
            kicker={t('admin.settings.policy')}
            title={t('admin.settings.section.toggles')}
            copy={t('admin.settings.togglesCopy')}
          />
          <div className="settings-toggle-grid">
            <SettingsToggleCard
              title={t('admin.settings.publicCatalogue')}
              copy={t('admin.settings.publicCatalogueCopy')}
              checked={draft.publicCatalogue}
              checkedLabel={t('admin.settings.toggleOn')}
              uncheckedLabel={t('admin.settings.toggleOff')}
              onCheckedChange={(checked) => updateDraft((current) => ({ ...current, publicCatalogue: checked }))}
            />
            <SettingsToggleCard
              title={t('admin.settings.requireProof')}
              copy={t('admin.settings.requireProofCopy')}
              checked={draft.requireVerifiedProof}
              checkedLabel={t('admin.settings.toggleOn')}
              uncheckedLabel={t('admin.settings.toggleOff')}
              onCheckedChange={(checked) => updateDraft((current) => ({ ...current, requireVerifiedProof: checked }))}
            />
          </div>
        </section>
      </div>
    </SettingsPageLayout>
  );
}

function updateSource(content: LocalizedContent, source: string): LocalizedContent {
  return {
    ...toSourceContent(content),
    source,
  };
}

function settingsStatusLabel(saveState: SaveState, t: TFunction) {
  if (saveState === 'saved') return t('admin.settings.saved');
  if (saveState === 'error') return t('admin.settings.saveError');
  if (saveState === 'saving') return t('admin.settings.saving');
  if (saveState === 'unsaved') return t('admin.settings.unsaved');
  return t('admin.settings.noChanges');
}
