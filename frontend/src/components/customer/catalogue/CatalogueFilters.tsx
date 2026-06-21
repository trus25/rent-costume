import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpDown, Check, ChevronDown, DollarSign, Heart, MapPin, RotateCcw, SlidersHorizontal, Tags, Users, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { NavigateOptions } from 'react-router-dom';
import { Field } from '../../shared';
import type { TFunction } from '../../../types/domain';

const GENDER_OPTIONS = ['women', 'men', 'unisex', 'kids'] as const;
const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'availability'] as const;
const PRICE_MIN = 0;
const PRICE_MAX = 100_000_000;
const PRICE_STEP = 5_000;

type CatalogueFilters = {
  region: string;
  type: string;
  gender: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type ActiveFilterSummary = {
  key: string;
  label: string;
  value: string | number;
};

type ParamUpdates = Partial<Record<string, string | undefined | null>>;

type UpdateCatalogueParams = (updates: ParamUpdates, options?: NavigateOptions) => void;

type PriceDraft = {
  minPrice: string;
  maxPrice: string;
};

type MoreFilterDraft = PriceDraft & {
  favorites: boolean;
  gender: string;
  sort: string;
};

export function CatalogueFilterBoard({
  t,
  periodLabel,
  filters,
  favoritesOnly,
  favoritesCount,
  activeFilter,
  setActiveFilter,
  activeFilterCount,
  secondaryFilterCount,
  activeFilterSummaries,
  regionOptions,
  typeOptions,
  updateCatalogueParams,
  clearFilters,
  optionLabel,
}: {
  t: TFunction;
  periodLabel: string;
  filters: CatalogueFilters;
  favoritesOnly: boolean;
  favoritesCount: number;
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  activeFilterCount: number;
  secondaryFilterCount: number;
  activeFilterSummaries: ActiveFilterSummary[];
  regionOptions: string[];
  typeOptions: string[];
  updateCatalogueParams: UpdateCatalogueParams;
  clearFilters: () => void;
  optionLabel: (value: string, t: TFunction, prefix: string) => string;
}) {
  return (
    <div className="catalogue-filter-board">
      <div className="filter-board-head">
        <div>
          <span className="eyebrow">
            {t('customer.toolbar.kicker')}: {periodLabel}
          </span>
          <h2>{t('customer.toolbar.title')}</h2>
        </div>
        <button
          className="filter-reset-inline"
          type="button"
          onClick={clearFilters}
          disabled={activeFilterCount === 0}
        >
          <RotateCcw aria-hidden="true" />
          {t('customer.filters.clearAll')}
        </button>
      </div>

      <div className="filter-summary-row" aria-live="polite">
        <span className="filter-count-label">
          <SlidersHorizontal aria-hidden="true" />
          {activeFilterCount} {t('customer.filters.kicker')}
        </span>
        <div className="filter-summary-chips">
          {activeFilterSummaries.length > 0 ? (
            activeFilterSummaries.map((item) => (
              <span className="filter-summary-chip" key={item.key}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </span>
            ))
          ) : (
            <span className="filter-summary-chip quiet">
              <Check aria-hidden="true" />
              {t('customer.filters.all')}
            </span>
          )}
        </div>
      </div>

      <div className="filter-control-grid" aria-label={t('customer.filters.aria')}>
        <FilterButton filterKey="region" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.region')} valueLabel={optionLabel(filters.region, t, 'customer.filters.regionOption')} icon={MapPin} isApplied={filters.region !== 'all'} />
        <FilterButton filterKey="type" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.type')} valueLabel={optionLabel(filters.type, t, 'customer.filters.typeOption')} icon={Tags} isApplied={filters.type !== 'all'} />
        <FilterButton filterKey="more" activeFilter={activeFilter} setActiveFilter={setActiveFilter} label={t('customer.filters.kicker')} valueLabel={secondaryFilterCount > 0 ? `${secondaryFilterCount}` : t('customer.filters.all')} icon={SlidersHorizontal} isApplied={secondaryFilterCount > 0} />
      </div>

      <FilterPanel
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filters={filters}
        t={t}
        favoritesOnly={favoritesOnly}
        favoritesCount={favoritesCount}
        regionOptions={regionOptions}
        typeOptions={typeOptions}
        updateCatalogueParams={updateCatalogueParams}
        optionLabel={optionLabel}
      />
    </div>
  );
}

function FilterButton({
  filterKey,
  activeFilter,
  setActiveFilter,
  label,
  valueLabel,
  icon: Icon,
  isApplied,
}: {
  filterKey: string;
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  label: string;
  valueLabel: string;
  icon: LucideIcon;
  isApplied: boolean;
}) {
  const isOpen = activeFilter === filterKey;
  return (
    <button
      className={`filter-control-card ${isOpen ? 'open' : ''} ${isApplied ? 'selected' : ''}`}
      data-filter-key={filterKey}
      type="button"
      aria-expanded={isOpen}
      onClick={() => setActiveFilter(isOpen ? '' : filterKey)}
    >
      <span className="filter-card-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="filter-card-copy">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </span>
      <ChevronDown className="filter-card-chevron" aria-hidden="true" />
    </button>
  );
}

function FilterPanel({
  activeFilter,
  setActiveFilter,
  filters,
  t,
  favoritesOnly,
  favoritesCount,
  regionOptions,
  typeOptions,
  updateCatalogueParams,
  optionLabel,
}: {
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  filters: CatalogueFilters;
  t: TFunction;
  favoritesOnly: boolean;
  favoritesCount: number;
  regionOptions: string[];
  typeOptions: string[];
  updateCatalogueParams: UpdateCatalogueParams;
  optionLabel: (value: string, t: TFunction, prefix: string) => string;
}) {
  const [moreDraft, setMoreDraft] = useState<MoreFilterDraft>(() => createMoreFilterDraft(filters, favoritesOnly));

  useEffect(() => {
    if (activeFilter === 'more') {
      setMoreDraft(createMoreFilterDraft(filters, favoritesOnly));
    }
  }, [activeFilter, favoritesOnly, filters.gender, filters.maxPrice, filters.minPrice, filters.sort]);

  if (!activeFilter) return null;

  const applyValue = (key: string, value: string) => {
    updateCatalogueParams({ [key]: value }, { replace: false });
    setActiveFilter('');
  };

  const cancelMoreFilters = () => {
    setActiveFilter('');
  };
  const clearMoreDraft = () => {
    setMoreDraft(createEmptyMoreFilterDraft());
  };
  const draftActiveCount = countMoreDraftFilters(moreDraft);
  const applyMoreFilters = () => {
    const priceDraft = serializePriceDraft(moreDraft);
    updateCatalogueParams({
      favorites: moreDraft.favorites ? '1' : undefined,
      minPrice: priceDraft.minPrice,
      maxPrice: priceDraft.maxPrice,
      gender: moreDraft.gender,
      sort: moreDraft.sort,
      search: '1',
    }, { replace: false });
    setActiveFilter('');
  };
  const panelTitle = activeFilter === 'more' ? t('customer.filters.allFilters') : t(`customer.filters.panel.${activeFilter}`);

  return (
    <Dialog.Root modal={false} open={Boolean(activeFilter)} onOpenChange={(open: boolean) => {
      if (!open) setActiveFilter('');
    }}>
      <Dialog.Overlay className="filter-panel-scrim" />
      <Dialog.Content className="catalogue-filter-panel" aria-label={panelTitle}>
        <Dialog.Description className="visually-hidden">{panelTitle}</Dialog.Description>
        <div className="filter-panel-head">
          <div>
            <span className="section-kicker">{t('customer.filters.kicker')}</span>
            <Dialog.Title asChild>
              <strong>{panelTitle}</strong>
            </Dialog.Title>
          </div>
          <button className="icon-button" type="button" aria-label={t('common.close')} onClick={() => setActiveFilter('')}>
            <X aria-hidden="true" />
          </button>
        </div>

        {activeFilter === 'region' ? (
          <FilterOptionList
            options={['all', ...regionOptions]}
            selected={filters.region}
            labelFor={(value) => optionLabel(value, t, 'customer.filters.regionOption')}
            onSelect={(value) => applyValue('region', value)}
          />
        ) : null}

        {activeFilter === 'type' ? (
          <FilterOptionList
            options={['all', ...typeOptions]}
            selected={filters.type}
            labelFor={(value) => optionLabel(value, t, 'customer.filters.typeOption')}
            onSelect={(value) => applyValue('type', value)}
          />
        ) : null}

        {activeFilter === 'more' ? (
          <div className="more-filter-stack">
            <button
              className={`more-filter-toggle ${moreDraft.favorites ? 'selected' : ''}`}
              type="button"
              aria-pressed={moreDraft.favorites}
              onClick={() => setMoreDraft((current) => ({ ...current, favorites: !current.favorites }))}
            >
              <span className="filter-card-icon">
                <Heart aria-hidden="true" fill={moreDraft.favorites ? 'currentColor' : 'none'} />
              </span>
              <span>
                <strong>{t('customer.filters.favoritesOnly')}</strong>
                <small>{t('customer.filters.savedCount', { count: favoritesCount })}</small>
              </span>
            </button>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <DollarSign aria-hidden="true" />
                <strong>{t('customer.filters.price')}</strong>
              </div>
              <PriceFilterFields
                t={t}
                priceDraft={moreDraft}
                setPriceDraft={(priceDraft) => setMoreDraft((current) => ({ ...current, ...priceDraft }))}
              />
            </section>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <Users aria-hidden="true" />
                <strong>{t('customer.filters.gender')}</strong>
              </div>
              <FilterOptionList
                options={['all', ...GENDER_OPTIONS]}
                selected={moreDraft.gender}
                labelFor={(value) => optionLabel(value, t, 'enum.gender')}
                onSelect={(value) => setMoreDraft((current) => ({ ...current, gender: value }))}
              />
            </section>

            <section className="more-filter-section">
              <div className="more-filter-heading">
                <ArrowUpDown aria-hidden="true" />
                <strong>{t('customer.filters.sort')}</strong>
              </div>
              <FilterOptionList
                options={SORT_OPTIONS}
                selected={moreDraft.sort}
                labelFor={(value) => t(`customer.sort.${value}`)}
                onSelect={(value) => setMoreDraft((current) => ({ ...current, sort: value }))}
              />
            </section>
          </div>
        ) : null}

        {activeFilter === 'more' ? (
          <div className="filter-panel-actions">
            <div className="filter-panel-reset-row">
              <button className="text-button filter-reset-button" type="button" onClick={clearMoreDraft} disabled={draftActiveCount === 0}>
                <RotateCcw aria-hidden="true" />
                {t('customer.filters.clearAll')}
              </button>
              <span>{draftActiveCount} {t('customer.filters.activeCount')}</span>
            </div>
            <div className="filter-apply-actions">
              <button className="outline-button" type="button" onClick={cancelMoreFilters}>
                {t('common.cancel')}
              </button>
              <button className="primary-button" type="button" onClick={applyMoreFilters}>
                {t('common.apply')}
              </button>
            </div>
          </div>
        ) : null}
      </Dialog.Content>
    </Dialog.Root>
  );
}

function PriceFilterFields({
  t,
  priceDraft,
  setPriceDraft,
}: {
  t: TFunction;
  priceDraft: PriceDraft;
  setPriceDraft: (priceDraft: PriceDraft) => void;
}) {
  const updateMinPrice = (value: string) => {
    if (!value) {
      setPriceDraft({ ...priceDraft, minPrice: '' });
      return;
    }
    const nextMin = clampPriceValue(value, PRICE_MIN);
    const currentMax = priceNumberFromInput(priceDraft.maxPrice);
    setPriceDraft({
      ...priceDraft,
      minPrice: String(currentMax === null ? nextMin : Math.min(nextMin, currentMax)),
    });
  };
  const updateMaxPrice = (value: string) => {
    if (!value) {
      setPriceDraft({ ...priceDraft, maxPrice: '' });
      return;
    }
    const nextMax = clampPriceValue(value, PRICE_MAX);
    const currentMin = priceNumberFromInput(priceDraft.minPrice);
    setPriceDraft({
      ...priceDraft,
      maxPrice: String(currentMin === null ? nextMax : Math.max(nextMax, currentMin)),
    });
  };

  return (
    <div className="price-filter-fields">
      <Field label={t('customer.filters.minPrice')} htmlFor="catalogue-min-price">
        <span className="price-input-shell">
          <span className="price-input-prefix">Rp</span>
          <input
            id="catalogue-min-price"
            type="number"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            inputMode="numeric"
            placeholder={t('customer.filters.minPricePlaceholder')}
            value={priceDraft.minPrice}
            onChange={(event) => updateMinPrice(event.target.value)}
          />
        </span>
      </Field>
      <Field label={t('customer.filters.maxPrice')} htmlFor="catalogue-max-price">
        <span className="price-input-shell">
          <span className="price-input-prefix">Rp</span>
          <input
            id="catalogue-max-price"
            type="number"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            inputMode="numeric"
            placeholder={t('customer.filters.maxPricePlaceholder')}
            value={priceDraft.maxPrice}
            onChange={(event) => updateMaxPrice(event.target.value)}
          />
        </span>
      </Field>
    </div>
  );
}

function FilterOptionList({
  options,
  selected,
  labelFor,
  onSelect,
}: {
  options: readonly string[];
  selected: string;
  labelFor: (value: string) => string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="filter-option-list">
      {options.map((value) => {
        const isSelected = selected === value || (!selected && value === 'all');
        return (
          <button className={isSelected ? 'selected' : ''} type="button" key={value} aria-pressed={isSelected} onClick={() => onSelect(value)}>
            <span>{labelFor(value)}</span>
            {isSelected ? <Check aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function createMoreFilterDraft(filters: CatalogueFilters, favoritesOnly: boolean): MoreFilterDraft {
  return {
    minPrice: priceInputFromParam(filters.minPrice, PRICE_MIN),
    maxPrice: priceInputFromParam(filters.maxPrice, PRICE_MAX),
    favorites: favoritesOnly,
    gender: filters.gender || 'all',
    sort: filters.sort || 'relevance',
  };
}

function createEmptyMoreFilterDraft(): MoreFilterDraft {
  return {
    favorites: false,
    minPrice: '',
    maxPrice: '',
    gender: 'all',
    sort: 'relevance',
  };
}

function countMoreDraftFilters(draft: MoreFilterDraft) {
  const priceDraft = serializePriceDraft(draft);
  return [
    draft.favorites,
    Boolean(priceDraft.minPrice || priceDraft.maxPrice),
    draft.gender !== 'all',
    draft.sort !== 'relevance',
  ].filter(Boolean).length;
}

function priceInputFromParam(value: string, emptyValue: number) {
  if (!value) return '';
  const clamped = clampPriceValue(value, emptyValue);
  if (emptyValue === PRICE_MIN && clamped <= PRICE_MIN) return '';
  if (emptyValue === PRICE_MAX && clamped >= PRICE_MAX) return '';
  return String(clamped);
}

function serializePriceDraft(priceDraft: PriceDraft): Partial<PriceDraft> {
  const minPrice = priceNumberFromInput(priceDraft.minPrice) ?? PRICE_MIN;
  const maxPrice = priceNumberFromInput(priceDraft.maxPrice) ?? PRICE_MAX;
  const normalizedMin = Math.min(minPrice, maxPrice);
  const normalizedMax = Math.max(minPrice, maxPrice);
  return {
    minPrice: normalizedMin > PRICE_MIN ? String(normalizedMin) : undefined,
    maxPrice: normalizedMax < PRICE_MAX ? String(normalizedMax) : undefined,
  };
}

function priceNumberFromInput(value: string, fallback: number | null = null) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, parsed));
}

function clampPriceValue(value: string | number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, parsed));
}
