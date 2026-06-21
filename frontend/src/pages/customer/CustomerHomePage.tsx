import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeFeaturedSection,
  HomeGuideSection,
  HomeHeroSection,
  HomeLocationSection,
  HomeTestimonialsSection,
  HomeTrustSection,
} from '../../components/customer/home/HomeSections';
import { defaultDates, normalizeHomeContent } from '../../mockData';
import {
  formatDateRange,
  getVariantAvailability,
  localizeContent,
  productAlt,
  productCoverImage,
  validateDates,
} from '../../lib/rental-utils';
import CustomerFrame from './CustomerFrame';
import type { CartItem, DateRange, Locale, Product, Rental, Settings, TFunction } from '../../types/domain';
import type { StateSetter } from '../../types/app';

type HomeSearchDraft = DateRange & { q: string };

type CustomerHomePageProps = {
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
  products: Product[];
  rentals: Rental[];
  settings: Settings;
  cart: CartItem[];
  onOpenCart: () => void;
};

export default function CustomerHomePage({
  locale,
  setLocale,
  t,
  products,
  rentals = [],
  settings,
  cart,
  onOpenCart,
}: CustomerHomePageProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState({ q: '', start: defaultDates.start, end: defaultDates.end });
  const [dateError, setDateError] = useState('');
  const heroProduct = products.find((product) => product.active) ?? products[0];
  const homeContent = normalizeHomeContent(settings.homeContent);
  const fallbackHeroImage = heroProduct ? productCoverImage(heroProduct, t) : '';
  const fallbackHeroAlt = heroProduct ? productAlt(heroProduct, t) : '';
  const heroImage = homeContent.heroImageUrl.trim() || fallbackHeroImage;
  const heroImageAlt = localizeContent(homeContent.heroImageAlt, locale, fallbackHeroAlt) || fallbackHeroAlt;
  const articles = homeContent.articles.slice(0, 3);
  const testimonials = homeContent.testimonials.slice(0, 3);
  const locationAddress = localizeContent(homeContent.locationAddress, locale);
  const locationMapSrc = resolveMapEmbedSource(homeContent.locationMapEmbed, locationAddress);
  const locationMapUrl = resolveMapLink(homeContent.locationMapUrl, locationAddress);
  const rentalPeriod = formatDateRange({ start: draft.start, end: draft.end }, locale);
  const activeProducts = products.filter((product) => product.active);
  const totalAvailableUnits = activeProducts.reduce((total, product) => total + availableUnits(product, draft, rentals), 0);
  const catalogueSearch = buildCatalogueSearch(draft);
  const collections = buildHomeCollections(activeProducts, t);
  const defaultCollection = collections.find((collection) => collection.products.length > 0)?.value ?? collections[0]?.value;

  const submitSearch = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const error = validateDates({ start: draft.start, end: draft.end });
    setDateError(error ? t(error) : '');
    if (error) return;

    const params = new URLSearchParams({
      search: '1',
      start: draft.start,
      end: draft.end,
    });
    if (draft.q.trim()) params.set('q', draft.q.trim());
    navigate({ pathname: '/catalogue', search: `?${params.toString()}` });
  };

  return (
    <CustomerFrame
      title={t('document.customerTitle')}
      skipTo="customer-home"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <HomeHeroSection
        t={t}
        locale={locale}
        homeContent={homeContent}
        heroImage={heroImage}
        heroImageAlt={heroImageAlt}
        activeProductCount={activeProducts.length}
        totalAvailableUnits={totalAvailableUnits}
        draft={draft}
        setDraft={setDraft}
        rentalPeriod={rentalPeriod}
        dateError={dateError}
        onSubmit={submitSearch}
      />
      <HomeTrustSection t={t} />
      <HomeFeaturedSection
        t={t}
        locale={locale}
        collections={collections}
        defaultCollection={defaultCollection}
        draft={draft}
        rentals={rentals}
        catalogueSearch={catalogueSearch}
        getAvailableUnits={availableUnits}
      />
      <HomeGuideSection homeContent={homeContent} articles={articles} locale={locale} />
      <HomeTestimonialsSection t={t} homeContent={homeContent} testimonials={testimonials} locale={locale} />
      <HomeLocationSection
        t={t}
        homeContent={homeContent}
        locale={locale}
        locationAddress={locationAddress}
        locationMapSrc={locationMapSrc}
        locationMapUrl={locationMapUrl}
      />
    </CustomerFrame>
  );
}

function resolveMapEmbedSource(value: string, address: string) {
  const fallback = `https://www.google.com/maps?q=${encodeURIComponent(address || 'Denpasar, Bali')}&output=embed`;
  const source = extractIframeSource(value) || String(value ?? '').trim();
  return isSafeGoogleMapUrl(source) ? source : fallback;
}

function resolveMapLink(value: string, address: string) {
  const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'Denpasar, Bali')}`;
  const source = String(value ?? '').trim();
  return isSafeGoogleMapUrl(source) ? source : fallback;
}

function extractIframeSource(value: string) {
  const match = String(value ?? '').match(/\ssrc=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? '';
}

function isSafeGoogleMapUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname.includes('google.') || url.hostname === 'maps.app.goo.gl');
  } catch {
    return false;
  }
}

function buildCatalogueSearch(draft: HomeSearchDraft) {
  const params = new URLSearchParams({
    search: '1',
    start: draft.start,
    end: draft.end,
  });
  if (draft.q.trim()) params.set('q', draft.q.trim());
  return `?${params.toString()}`;
}

function buildHomeCollections(products: Product[], t: TFunction) {
  return [
    {
      value: 'formal',
      label: t('customer.home.tab.formal'),
      products: products.filter((product) => product.category === 'formal' && !product.id.includes('tari')).slice(0, 4),
    },
    {
      value: 'dance',
      label: t('customer.home.tab.dance'),
      products: products.filter((product) => product.id.includes('tari') || product.region === 'dance').slice(0, 4),
    },
    {
      value: 'accessory',
      label: t('customer.home.tab.accessory'),
      products: products.filter((product) => product.category === 'accessory').slice(0, 4),
    },
  ];
}

function availableUnits(product: Product, dates: DateRange, rentals: Rental[]) {
  return product.variants.reduce((sum, variant) => sum + getVariantAvailability(product, variant.id, dates, rentals), 0);
}
