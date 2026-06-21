import { ArrowLeft, ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import type { Dispatch, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusPill } from '../../shared';
import { ProductAvailabilityCalendar } from './ProductAvailabilityCalendar';
import {
  findNextAvailableWindow,
  formatDateRange,
  formatRupiah,
  productAlt,
  productDescription,
  productGallery,
  productMeta,
  productName,
  selectedVariantNotes,
  variantLabel,
} from '../../../lib/rental-utils';
import { getMaintenanceReason, getProductAvailability, getVariantAvailability } from '../../../lib/availability';
import type { CartItem, DataAdapter, DateRange, Locale, Product, Rental, TFunction } from '../../../types/domain';

export function ProductDetail({
  product,
  selectedVariantId,
  setSelectedVariantId,
  dates,
  locale,
  t,
  onAdd,
  selectedAvailability,
  cart,
  rentals,
  dataAdapter,
  isFavorite,
  onFavoriteToggle,
}: {
  product: Product;
  selectedVariantId: string;
  setSelectedVariantId: Dispatch<SetStateAction<string>>;
  dates: DateRange;
  locale: Locale;
  t: TFunction;
  onAdd: () => void;
  selectedAvailability: number;
  cart: CartItem[];
  rentals: Rental[];
  dataAdapter?: DataAdapter;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}) {
  const availability = getProductAvailability(product, dates, rentals);
  const maintenanceReason = availability === 'unavailable' ? getMaintenanceReason(product, dates) : '';
  const isInCart = cart.some((item) => item.productId === product.id && item.variantId === selectedVariantId);
  const canAdd = Boolean(selectedVariantId && selectedAvailability > 0);
  const nextWindow = selectedVariantId && selectedAvailability <= 0 ? findNextAvailableWindow(product, selectedVariantId, dates, rentals) : null;
  const images = useMemo(() => productGallery(product, t), [product, t]);
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id ?? '');
  const previousProductIdRef = useRef(product.id);
  const [favoriteNotice, setFavoriteNotice] = useState(false);
  const selectedImageIndex = images.findIndex((image) => image.id === selectedImageId);
  const activeImageIndex = selectedImageIndex >= 0 ? selectedImageIndex : 0;
  const selectedImage = images[activeImageIndex];
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const selectedVariantText = variantLabel(t, selectedVariant?.label ?? selectedVariantId);
  const description = productDescription(product, locale, t);
  const variantNotes = selectedVariantNotes(product, selectedVariantId, locale, t);
  const variantNoteText = variantNoteForDisplay(variantNotes, selectedVariantText, locale);
  const dateRangeText = formatDateRange(dates, locale);

  useEffect(() => {
    const productChanged = previousProductIdRef.current !== product.id;
    previousProductIdRef.current = product.id;
    setSelectedImageId((currentId) => {
      if (productChanged) return images[0]?.id ?? '';
      if (currentId && images.some((image) => image.id === currentId)) return currentId;
      return images[0]?.id ?? '';
    });
  }, [product.id, images]);

  useEffect(() => {
    if (!favoriteNotice) return undefined;
    const timeoutId = window.setTimeout(() => setFavoriteNotice(false), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [favoriteNotice]);

  const handleFavoriteToggle = () => {
    onFavoriteToggle();
    setFavoriteNotice(true);
  };

  const selectAdjacentImage = (delta: number) => {
    setSelectedImageId((currentId) => {
      const currentIndex = images.findIndex((image) => image.id === currentId);
      const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextImage = images[normalizedIndex + delta];
      return nextImage?.id ?? currentId;
    });
  };

  const handleCarouselPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, delta: number) => {
    if (event.button !== 0) return;
    selectAdjacentImage(delta);
  };

  const handleCarouselClick = (event: ReactMouseEvent<HTMLButtonElement>, delta: number) => {
    if (event.detail !== 0) return;
    selectAdjacentImage(delta);
  };

  return (
    <section className="product-detail product-detail-shell" id="product-detail">
      <div className="shell product-detail-layout product-detail-layout-shell">
        <div className="product-detail-main">
          <div className={`detail-gallery product-media-gallery ${images.length > 1 ? '' : 'single-image'}`} aria-label={t('customer.detail.galleryAria')}>
            <div className="detail-photo">
              <img src={selectedImage?.src ?? product.image} alt={selectedImage?.alt ?? productAlt(product, t)} />
              {images.length > 1 ? (
                <>
                  <button
                    className="detail-carousel-arrow previous"
                    type="button"
                    onPointerDown={(event) => handleCarouselPointerDown(event, -1)}
                    onClick={(event) => handleCarouselClick(event, -1)}
                    disabled={activeImageIndex <= 0}
                    aria-label={t('customer.detail.previousImage')}
                  >
                    <ArrowLeft aria-hidden="true" />
                  </button>
                  <button
                    className="detail-carousel-arrow next"
                    type="button"
                    onPointerDown={(event) => handleCarouselPointerDown(event, 1)}
                    onClick={(event) => handleCarouselClick(event, 1)}
                    disabled={activeImageIndex >= images.length - 1}
                    aria-label={t('customer.detail.nextImage')}
                  >
                    <ArrowRight aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="thumb-rail" aria-label={t('customer.detail.thumbsAria')}>
                {images.map((thumb) => (
                  <button
                    className={`thumb-button ${selectedImage?.id === thumb.id ? 'selected' : ''}`}
                    type="button"
                    key={thumb.id}
                    aria-label={t('customer.detail.thumbSelect', { item: thumb.label })}
                    aria-pressed={selectedImage?.id === thumb.id}
                    onClick={() => setSelectedImageId(thumb.id)}
                  >
                    <img src={thumb.src} alt={thumb.alt} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="detail-purchase detail-purchase-panel" aria-label={t('customer.detail.panelAria')}>
          <div className="detail-heading">
            <h1>{productName(product, t)}</h1>
            <div className="detail-meta-row">
              <p className="product-meta">{productMeta(product, t)}</p>
              <StatusPill type="availability" value={availability} t={t} />
            </div>
            <strong className="detail-price">
              {formatRupiah(product.price)}
              <span>{t(product.unitKey)}</span>
            </strong>
          </div>

          <div className="option-group">
            <span className="visually-hidden">{t('customer.detail.variantLabel')}</span>
            <div className="variant-grid variant-selector" aria-label={t('customer.detail.variantAria')}>
              {product.variants.map((variant) => {
                const available = getVariantAvailability(product, variant.id, dates, rentals);
                return (
                  <button
                    className={`${selectedVariantId === variant.id ? 'selected' : ''} ${available <= 0 ? 'disabled' : ''}`}
                    type="button"
                    key={variant.id}
                    disabled={available <= 0}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    <span>{variantLabel(t, variant.label)}</span>
                    <small>{t('customer.detail.availableCount', { count: available })}</small>
                  </button>
                );
              })}
            </div>
            <p className={canAdd ? 'helper-text' : 'validation-message'}>
              {canAdd
                ? `${selectedVariantText}: ${variantNoteText}`
                : maintenanceReason
                  ? t('customer.detail.unavailableReason', { reason: maintenanceReason })
                  : t('customer.detail.unavailable')}
            </p>
            {selectedVariantId && selectedAvailability <= 0 ? (
              <p className="helper-text availability-suggestion">
                {nextWindow
                  ? t('customer.calendar.nextWindow', { range: formatDateRange(nextWindow, locale) })
                  : t('customer.calendar.noNextWindow')}
              </p>
            ) : null}
          </div>

          <div className="detail-quick-actions">
            <div className="detail-action-row detail-cta-bar">
              <button
                className={`icon-button favorite-button detail-save-button ${isFavorite ? 'selected' : ''}`}
                type="button"
                aria-label={isFavorite ? t('customer.detail.favoriteSaved') : t('customer.detail.favorite')}
                aria-pressed={isFavorite}
                onClick={handleFavoriteToggle}
              >
                <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button className="secondary-button detail-add-button" type="button" disabled={!canAdd} onClick={onAdd}>
                <ShoppingCart aria-hidden="true" />
                {isInCart ? t('customer.status.added') : t('customer.detail.add')}
              </button>
            </div>
            <p className="helper-text detail-stock-advisory">{t('customer.detail.staffConfirms')}</p>
            {favoriteNotice ? <p className="success-message favorite-feedback">{t('customer.detail.favoriteUndo')}</p> : null}
          </div>
        </aside>

        <div className="product-detail-info-grid" aria-label={t('customer.detail.infoAria')}>
          <article className="detail-info-block">
            <span className="option-label">{t('customer.detail.included')}</span>
            <p className="detail-copy">{description}</p>
          </article>
        </div>
      </div>

      <div className="shell product-availability-shell">
        <div className="availability-section-head">
          <h2>{t('customer.detail.availabilityTitle')}</h2>
        </div>
        <ProductAvailabilityCalendar
          product={product}
          selectedVariantId={selectedVariantId}
          dates={dates}
          locale={locale}
          t={t}
          rentals={rentals}
          dataAdapter={dataAdapter}
        />
      </div>

      <div className="product-detail-mobile-bar" role="region" aria-label={t('customer.detail.mobileActionAria')}>
        <div className="mobile-purchase-summary">
          <strong>
            {formatRupiah(product.price)}
            <span>{t(product.unitKey)}</span>
          </strong>
          <small>{selectedVariantText ? `${selectedVariantText}, ${dateRangeText}` : dateRangeText}</small>
        </div>
        <button
          className={`icon-button favorite-button ${isFavorite ? 'selected' : ''}`}
          type="button"
          aria-label={isFavorite ? t('customer.detail.favoriteSaved') : t('customer.detail.favorite')}
          aria-pressed={isFavorite}
          onClick={handleFavoriteToggle}
        >
          <Heart aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button className="secondary-button mobile-add-button" type="button" disabled={!canAdd} onClick={onAdd}>
          <ShoppingCart aria-hidden="true" />
          {isInCart ? t('customer.status.added') : t('customer.detail.add')}
        </button>
        {favoriteNotice ? <p className="success-message favorite-feedback product-detail-mobile-feedback">{t('customer.detail.favoriteUndo')}</p> : null}
      </div>
    </section>
  );
}

function variantNoteForDisplay(note: string, variantText: string, locale: Locale) {
  const escapedVariant = variantText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withoutDuplicatePrefix = note.trim().replace(new RegExp(`^${escapedVariant}\\s*:\\s*`, 'i'), '').trim();
  if (locale !== 'id') return withoutDuplicatePrefix;
  return withoutDuplicatePrefix.replace(/\bkamen pinggang adjustable\b/gi, 'kamen pinggang bisa disesuaikan');
}
