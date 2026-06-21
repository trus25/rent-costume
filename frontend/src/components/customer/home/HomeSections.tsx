import * as Tabs from '@radix-ui/react-tabs';
import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Ruler,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RentalSearchPanel } from './RentalSearchPanel';
import {
  formatRupiah,
  localizeContent,
  productAlt,
  productCoverImage,
  productDescription,
  productMeta,
  productName,
} from '../../../lib/rental-utils';
import { getProductAvailability } from '../../../lib/availability';
import { StatusPill } from '../../shared';
import type { DateRange, HomeArticle, HomeContent, HomeTestimonial, Locale, Product, Rental, TFunction } from '../../../types/domain';

type HomeSearchDraft = DateRange & { q: string };

type HomeCollection = {
  value: string;
  label: string;
  products: Product[];
};

type HomeHeroSectionProps = {
  t: TFunction;
  locale: Locale;
  homeContent: HomeContent;
  heroImage: string;
  heroImageAlt: string;
  activeProductCount: number;
  totalAvailableUnits: number;
  draft: HomeSearchDraft;
  setDraft: Dispatch<SetStateAction<HomeSearchDraft>>;
  rentalPeriod: string;
  dateError: string;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
};

export function HomeHeroSection({
  t,
  locale,
  homeContent,
  heroImage,
  heroImageAlt,
  activeProductCount,
  totalAvailableUnits,
  draft,
  setDraft,
  rentalPeriod,
  dateError,
  onSubmit,
}: HomeHeroSectionProps) {
  return (
    <section
      className="customer-home-hero"
      id="customer-home"
      style={heroImageStyle(heroImage)}
      aria-label={heroImageAlt || undefined}
    >
      <div className="shell home-hero-inner">
        <div className="home-hero-copy">
          <span className="section-kicker">{localizeContent(homeContent.heroKicker, locale)}</span>
          <h1>{localizeContent(homeContent.heroTitle, locale)}</h1>
          <p>{localizeContent(homeContent.heroCopy, locale)}</p>
          <div className="home-hero-actions" aria-label={t('customer.home.heroActionsAria')}>
            <Link className="home-lookup-link" to="/lookup">
              <BadgeCheck aria-hidden="true" />
              {t('customer.home.lookupCta')}
            </Link>
          </div>
          <div className="home-hero-stats" aria-label={t('customer.home.statsAria')}>
            <span>
              <strong>{activeProductCount}</strong>
              {t('customer.home.statActive')}
            </span>
            <span>
              <strong>{totalAvailableUnits}</strong>
              {t('customer.home.statUnits')}
            </span>
            <span>
              <strong>
                <Clock3 aria-hidden="true" />
              </strong>
              {t('customer.home.statReview')}
            </span>
          </div>
        </div>
        <RentalSearchPanel
          as="form"
          className="home-search-panel hero-search-panel"
          ariaLabel={t('customer.home.searchAria')}
          t={t}
          query={draft.q}
          onQueryChange={(q: string) => setDraft((current) => ({ ...current, q }))}
          dates={draft}
          onDatesChange={(dates: DateRange) => setDraft((current) => ({ ...current, ...dates }))}
          onSubmit={onSubmit}
          submitLabel={t('customer.home.searchCta')}
          periodSummary={t('customer.home.periodSummary', { range: rentalPeriod })}
          error={dateError}
        >
          <div className="home-search-heading">
            <span className="section-kicker">{t('customer.home.searchKicker')}</span>
            <strong>{t('customer.home.searchTitle')}</strong>
            <p>{t('customer.home.searchHint')}</p>
          </div>
        </RentalSearchPanel>
      </div>
    </section>
  );
}

function heroImageStyle(heroImage: string): CSSProperties | undefined {
  if (!heroImage) return undefined;
  return { '--home-hero-image': `url(${JSON.stringify(heroImage)})` } as CSSProperties;
}

export function HomeTrustSection({ t }: { t: TFunction }) {
  const trustItems = [
    { icon: CalendarDays, title: t('customer.home.trustDateTitle'), copy: t('customer.home.trustDateCopy') },
    { icon: CheckCircle2, title: t('customer.home.trustStockTitle'), copy: t('customer.home.trustStockCopy') },
    { icon: Truck, title: t('customer.home.trustFulfillmentTitle'), copy: t('customer.home.trustFulfillmentCopy') },
  ];

  return (
    <section className="home-trust-strip" aria-label={t('customer.home.trustAria')}>
      <div className="shell home-trust-grid">
        {trustItems.map((item) => (
          <article className="home-trust-item trust-item" key={item.title}>
            <item.icon aria-hidden="true" />
            <div>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomeFeaturedSection({
  t,
  locale,
  collections,
  defaultCollection,
  draft,
  rentals,
  catalogueSearch,
  getAvailableUnits,
}: {
  t: TFunction;
  locale: Locale;
  collections: HomeCollection[];
  defaultCollection: string;
  draft: HomeSearchDraft;
  rentals: Rental[];
  catalogueSearch: string;
  getAvailableUnits: (product: Product, dates: DateRange, rentals: Rental[]) => number;
}) {
  return (
    <section className="home-section home-featured-section">
      <div className="shell">
        <div className="home-featured-head">
          <div>
            <span className="section-kicker">{t('customer.home.featuredKicker')}</span>
            <h2>{t('customer.home.featuredTitle')}</h2>
            <p>{t('customer.home.featuredCopy')}</p>
          </div>
        </div>

        <Tabs.Root className="home-collection-tabs" defaultValue={defaultCollection}>
          <Tabs.List className="home-tab-list" aria-label={t('customer.home.tabsAria')}>
            {collections.map((collection) => (
              <Tabs.Trigger className="home-tab-trigger" value={collection.value} key={collection.value}>
                {collection.label}
                <span>{collection.products.length}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {collections.map((collection) => (
            <Tabs.Content className="home-tab-panel" value={collection.value} key={collection.value}>
              {collection.products.length > 0 ? (
                <div className="home-product-grid">
                  {collection.products.map((product) => (
                    <HomeProductCard
                      product={product}
                      dates={draft}
                      locale={locale}
                      t={t}
                      rentals={rentals}
                      catalogueSearch={catalogueSearch}
                      getAvailableUnits={getAvailableUnits}
                      key={product.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="home-empty-note">{t('customer.home.featuredEmpty')}</p>
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}

export function HomeGuideSection({ homeContent, articles, locale }: { homeContent: HomeContent; articles: HomeArticle[]; locale: Locale }) {
  const guideIcons = [Ruler, CalendarCheck, ShieldCheck];

  return (
    <section className="home-section home-guide-section">
      <div className="shell home-guide-layout">
        <div className="home-section-head">
          <span className="section-kicker">{localizeContent(homeContent.articlesKicker, locale)}</span>
          <h2>{localizeContent(homeContent.articlesTitle, locale)}</h2>
        </div>
        <div className="home-card-grid home-guide-list">
          {articles.map((article, index) => {
            const GuideIcon = guideIcons[index];
            return (
              <article className="home-article-card article-card" key={`home-article-${index}`}>
                {GuideIcon ? (
                  <span className="home-guide-icon" aria-hidden="true">
                    <GuideIcon />
                  </span>
                ) : null}
                <span>{localizeContent(article.label, locale)}</span>
                <h3>{localizeContent(article.title, locale)}</h3>
                <p>{localizeContent(article.copy, locale)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeTestimonialsSection({ t, homeContent, testimonials, locale }: { t: TFunction; homeContent: HomeContent; testimonials: HomeTestimonial[]; locale: Locale }) {
  return (
    <section className="home-section home-testimonials">
      <div className="shell">
        <div className="home-section-head">
          <span className="section-kicker">{localizeContent(homeContent.testimonialsKicker, locale)}</span>
          <h2>{localizeContent(homeContent.testimonialsTitle, locale)}</h2>
        </div>
        <div className="home-card-grid">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard testimonial={testimonial} locale={locale} index={index} key={`home-testimonial-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeLocationSection({
  t,
  homeContent,
  locale,
  locationAddress,
  locationMapSrc,
  locationMapUrl,
}: {
  t: TFunction;
  homeContent: HomeContent;
  locale: Locale;
  locationAddress: string;
  locationMapSrc: string;
  locationMapUrl: string;
}) {
  const title = localizeContent(homeContent.locationTitle, locale);

  return (
    <section className="home-section home-location-section">
      <div className="shell home-location-layout">
        <div className="home-location-copy">
          <span className="section-kicker">{t('customer.home.lookupCta')}</span>
          <h2>{title}</h2>
          <p>{locationAddress}</p>
          <a className="secondary-button home-location-action" href={locationMapUrl} target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" />
            {t('customer.home.openMaps')}
          </a>
        </div>
        <div className="home-map-frame location-panel">
          <div className="home-map-fallback" aria-hidden="true">
            <span>
              <MapPin />
            </span>
            <strong>{title}</strong>
            <small>{locationAddress}</small>
          </div>
          <iframe
            title={title}
            src={locationMapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, locale, index }: { testimonial: HomeTestimonial; locale: Locale; index: number }) {
  const reviewer = splitReviewerLabel(localizeContent(testimonial.name, locale));
  const photoUrl = String(testimonial.photoUrl ?? '').trim();

  return (
    <figure className="testimonial-card">
      <div className="testimonial-stars" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <Star key={starIndex} />
        ))}
      </div>
      <blockquote>{localizeContent(testimonial.quote, locale)}</blockquote>
      <figcaption className="testimonial-person">
        <span className={`testimonial-avatar testimonial-avatar-${index + 1} ${photoUrl ? 'has-photo' : ''}`} aria-hidden="true">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.parentElement?.classList.remove('has-photo');
                event.currentTarget.remove();
              }}
            />
          ) : null}
          <span>{reviewer.initial}</span>
        </span>
        <span>
          <strong>{reviewer.name}</strong>
          {reviewer.detail ? <small>{reviewer.detail}</small> : null}
        </span>
      </figcaption>
    </figure>
  );
}

function HomeProductCard({
  product,
  dates,
  locale,
  t,
  rentals,
  catalogueSearch,
  getAvailableUnits,
}: {
  product: Product;
  dates: DateRange;
  locale: Locale;
  t: TFunction;
  rentals: Rental[];
  catalogueSearch: string;
  getAvailableUnits: (product: Product, dates: DateRange, rentals: Rental[]) => number;
}) {
  const availability = getProductAvailability(product, dates, rentals);
  const units = getAvailableUnits(product, dates, rentals);
  const detailTo = { pathname: `/costumes/${product.id}`, search: catalogueSearch };

  return (
    <article className="home-product-card customer-product-card">
      <Link className="home-product-media" to={detailTo} aria-label={t('customer.product.detailAria', { product: productName(product, t) })}>
        <img src={productCoverImage(product, t)} alt={productAlt(product, t)} loading="lazy" />
        <StatusPill type="availability" value={availability} t={t} />
      </Link>
      <div className="home-product-body">
        <span className="product-meta">{productMeta(product, t)}</span>
        <h3>{productName(product, t)}</h3>
        <p>{productDescription(product, locale, t)}</p>
        <div className="home-product-footer">
          <span>{t('customer.home.fromPrice', { price: formatRupiah(product.price) })}</span>
          <Link className="text-button" to={detailTo}>
            {t('customer.home.viewProduct')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <small className={units > 0 ? 'home-product-stock' : 'home-product-stock unavailable'}>
          {units > 0 ? t('customer.home.availableUnits', { count: units }) : t('customer.home.unavailableNow')}
        </small>
      </div>
    </article>
  );
}

function splitReviewerLabel(value: string) {
  const [name, ...detailParts] = String(value || '').split(',');
  const fallbackName = name.trim() || 'Customer';
  return {
    name: fallbackName,
    detail: detailParts.join(',').trim(),
    initial: fallbackName.charAt(0).toUpperCase(),
  };
}
