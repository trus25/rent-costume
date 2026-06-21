import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { CATALOGUE_MAX_IMAGE_COUNT, MAX_IMAGE_SIZE } from './catalogueEditorUtils';
import { DestructiveConfirmDialog } from '../../shared';
import { productAlt, productName } from '../../../lib/rental-utils';
import type { CatalogueEditorProps } from './catalogueEditorTypes';
import type { ProductImage } from '../../../types/domain';

export function MediaTab({
  t,
  productDraft,
  mediaItems,
  updateMediaItems,
  makeMediaId,
  readFileAsDataUrl,
}: Pick<CatalogueEditorProps, 't' | 'productDraft' | 'mediaItems' | 'updateMediaItems' | 'makeMediaId' | 'readFileAsDataUrl'>) {
  const [urlDraft, setUrlDraft] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState(mediaItems[0]?.id ?? '');
  const [removeImageOpen, setRemoveImageOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImage = mediaItems.find((image) => image.id === selectedMediaId) ?? mediaItems[0] ?? null;
  const selectedIndex = selectedImage ? mediaItems.findIndex((image) => image.id === selectedImage.id) : -1;

  useEffect(() => {
    if (mediaItems.length === 0) {
      if (selectedMediaId) setSelectedMediaId('');
      return;
    }
    if (!mediaItems.some((image) => image.id === selectedMediaId)) {
      setSelectedMediaId(mediaItems[0].id);
    }
  }, [mediaItems, selectedMediaId]);

  const addUrlImage = () => {
    const src = urlDraft.trim();
    if (!src) {
      setMediaError(t('admin.catalogue.errorImageUrl'));
      window.requestAnimationFrame(() => urlInputRef.current?.focus());
      return;
    }
    if (mediaItems.length >= CATALOGUE_MAX_IMAGE_COUNT) {
      setMediaError(t('admin.catalogue.errorImageCount', { count: CATALOGUE_MAX_IMAGE_COUNT }));
      return;
    }
    const id = makeMediaId();
    setMediaError('');
    updateMediaItems((current) => [
      ...current,
      {
        id,
        src,
        alt: productAlt(productDraft, t),
        label: `${productName(productDraft, t)} ${current.length + 1}`,
        isCover: current.length === 0,
      },
    ]);
    setSelectedMediaId(id);
    setUrlDraft('');
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    const availableSlots = CATALOGUE_MAX_IMAGE_COUNT - mediaItems.length;
    if (availableSlots <= 0) {
      setMediaError(t('admin.catalogue.errorImageCount', { count: CATALOGUE_MAX_IMAGE_COUNT }));
      return;
    }

    const accepted: File[] = [];
    for (const file of files.slice(0, availableSlots)) {
      if (!file.type.startsWith('image/')) {
        setMediaError(t('admin.catalogue.errorImageType'));
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setMediaError(t('admin.catalogue.errorImageSize'));
        continue;
      }
      accepted.push(file);
    }
    if (files.length > availableSlots) setMediaError(t('admin.catalogue.errorImageCount', { count: CATALOGUE_MAX_IMAGE_COUNT }));
    if (accepted.length === 0) return;

    const dataUrls = await Promise.all(accepted.map(readFileAsDataUrl));
    const nextItems: ProductImage[] = dataUrls.map((src, index) => ({
      id: makeMediaId(),
      src,
      alt: productAlt(productDraft, t),
      label: accepted[index].name || `${productName(productDraft, t)} ${mediaItems.length + index + 1}`,
      isCover: mediaItems.length === 0 && index === 0,
    }));
    updateMediaItems((current) => [
      ...current,
      ...nextItems.map((item, index) => ({
        ...item,
        label: accepted[index].name || `${productName(productDraft, t)} ${current.length + index + 1}`,
        isCover: current.length === 0 && index === 0,
      })),
    ]);
    setSelectedMediaId(nextItems[0]?.id ?? selectedMediaId);
  };

  const selectAdjacentImage = (delta: number) => {
    if (selectedIndex < 0) return;
    const nextImage = mediaItems[selectedIndex + delta];
    if (nextImage) setSelectedMediaId(nextImage.id);
  };

  const removeSelectedImage = () => {
    if (!selectedImage) return;
    const fallback = mediaItems[selectedIndex + 1] ?? mediaItems[selectedIndex - 1] ?? null;
    updateMediaItems((current) => current.filter((item) => item.id !== selectedImage.id));
    setSelectedMediaId(fallback?.id ?? '');
  };

  return (
    <div className="editor-section media-editor">
      <div className="editor-section-head">
        <div>
          <span className="section-kicker">{t('admin.catalogue.mediaTitle')}</span>
          <h3>{t('admin.catalogue.mediaCopy')}</h3>
          <p>{t('admin.catalogue.coverHelp')}</p>
        </div>
      </div>

      <div className="media-toolbar media-upload-row">
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={handleFiles} />
        <div className="media-upload-control">
          <button className="outline-button" type="button" aria-describedby="catalogue-media-upload-help" onClick={() => fileInputRef.current?.click()}>
            <Upload aria-hidden="true" />
            {t('admin.catalogue.imageUpload')}
          </button>
          <small id="catalogue-media-upload-help">{t('admin.catalogue.imageUploadHelp')}</small>
        </div>
        <div className="field-control">
          <span>{t('admin.catalogue.imageUrl')}</span>
          <div className="url-add-row">
            <input
              ref={urlInputRef}
              value={urlDraft}
              aria-invalid={Boolean(mediaError)}
              aria-describedby={mediaError ? 'catalogue-media-error' : undefined}
              onPointerDown={() => {
                if (mediaError) setMediaError('');
              }}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                if (mediaError) setMediaError('');
              }}
              placeholder="https://example.com/costume.jpg"
            />
            <button className="secondary-button" type="button" onClick={addUrlImage}>
              <Link2 aria-hidden="true" />
              {t('admin.catalogue.addImageUrl')}
            </button>
          </div>
          {mediaError ? <small className="validation-message" id="catalogue-media-error">{mediaError}</small> : null}
        </div>
      </div>

      {mediaItems.length === 0 ? (
        <div className="empty-state compact-empty">
          <ImagePlus aria-hidden="true" />
          <strong>{t('admin.catalogue.noMedia')}</strong>
          <p>{t('admin.catalogue.noMediaCopy')}</p>
        </div>
      ) : (
        <div className="media-carousel-card media-gallery-frame" aria-label={t('admin.catalogue.mediaGridAria')}>
          <div className="media-carousel-stage">
            <div className="media-carousel-image media-preview">
              <img src={selectedImage?.src} alt={productAlt(productDraft, t)} />
              {selectedImage?.isCover ? <span>{t('admin.catalogue.cover')}</span> : null}
              <button className="media-carousel-arrow previous" type="button" onClick={() => selectAdjacentImage(-1)} disabled={selectedIndex <= 0} aria-label={t('admin.catalogue.previousImage')}>
                <ArrowLeft aria-hidden="true" />
              </button>
              <button className="media-carousel-arrow next" type="button" onClick={() => selectAdjacentImage(1)} disabled={selectedIndex >= mediaItems.length - 1} aria-label={t('admin.catalogue.nextImage')}>
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>

          {selectedImage ? (
            <div className="media-carousel-meta">
              {selectedIndex >= 0 ? (
                <span className="media-carousel-count" aria-live="polite">
                  {t('admin.catalogue.selectedImage', { index: selectedIndex + 1, total: mediaItems.length })}
                </span>
              ) : null}
              <div className="media-actions">
                <button className="outline-button" type="button" onClick={() => updateMediaItems((current) => current.map((item) => ({ ...item, isCover: item.id === selectedImage.id })))} disabled={selectedImage.isCover}>
                  <CheckCircle2 aria-hidden="true" />
                  {t('admin.catalogue.setCover')}
                </button>
                <button className="icon-button danger" type="button" onClick={() => setRemoveImageOpen(true)} aria-label={t('admin.catalogue.removeImage')}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="media-thumb-strip">
            {mediaItems.map((image, index) => {
              const selected = selectedImage?.id === image.id;
              return (
                <button
                  className={`media-thumb-button image-badge ${selected ? 'selected' : ''}`}
                  type="button"
                  key={image.id}
                  aria-current={selected ? 'true' : undefined}
                  aria-label={t(selected ? 'admin.catalogue.currentImage' : 'admin.catalogue.selectImage', { index: index + 1, total: mediaItems.length })}
                  aria-pressed={selected}
                  onClick={() => setSelectedMediaId(image.id)}
                >
                  <img src={image.src} alt={productAlt(productDraft, t)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <DestructiveConfirmDialog
        open={removeImageOpen}
        onOpenChange={setRemoveImageOpen}
        title={t('admin.common.confirmRemoveTitle')}
        description={t('admin.catalogue.confirmRemoveImageCopy')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.remove')}
        onConfirm={removeSelectedImage}
      />
    </div>
  );
}
