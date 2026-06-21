
import * as Dialog from '@radix-ui/react-dialog';
import { FileCheck2, FileText, Upload, XCircle } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Field, InfoBlock } from '../../shared';
import { DestructiveDialogShell } from './RentalDialogs';
import type { Rental, TFunction } from '../../../types/domain';
import type { RentalWorkflowCommands } from '../../../lib/rental-workflow';

const MAX_PAYMENT_PROOF_BYTES = 700 * 1024;

type PaymentPanelProps = {
  rental: Rental;
  t: TFunction;
  workflow: RentalWorkflowCommands;
  readOnly?: boolean;
};

export function PaymentPanel({ rental, t, workflow, readOnly = false }: PaymentPanelProps) {
  const proofControlId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement | null>(null);
  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const canReviewProof = !readOnly && rental.paymentStatus === 'attached';
  const proofName = rental.paymentProof?.name;
  const proofUrl = rental.paymentProof?.dataUrl;
  const proofIsImage = String(rental.paymentProof?.type ?? '').startsWith('image/') || String(proofUrl ?? '').startsWith('data:image/');
  const uploadLabelId = `${proofControlId}-label`;
  const uploadHelpId = `${proofControlId}-help`;
  const uploadErrorId = `${proofControlId}-error`;
  const proofReviewReason = canReviewProof ? t('admin.payment.reviewReady') : t('admin.payment.reviewDisabled');

  const attachProof = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PAYMENT_PROOF_BYTES) {
      setError(t('admin.payment.fileTooLarge'));
      event.target.value = '';
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      workflow.attachPaymentProof(rental.reference, {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: String(reader.result ?? ''),
        uploadedAt: new Date().toISOString(),
      });
      event.target.value = '';
    };
    reader.onerror = () => {
      setError(t('admin.payment.fileReadError'));
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const rejectProof = () => {
    const note = rejectReason.trim();
    if (!note) return;
    workflow.rejectPaymentProof(rental.reference, note);
    setRejectReason('');
    setRejectOpen(false);
  };

  return (
    <>
      <div className="content-panel compact-panel">
        <span className="section-kicker">{t('admin.payment.title')}</span>
        <div className="info-grid compact">
          <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
          <InfoBlock title={t('admin.payment.proof')} copy={t(`enum.payment.${rental.paymentStatus}`)} />
        </div>
        {proofName ? (
          <div className="payment-proof-file">
            <FileText aria-hidden="true" />
            <div>
              <strong>{proofName}</strong>
              <span>{formatFileSize(rental.paymentProof?.size)}</span>
            </div>
          </div>
        ) : (
          <p className="helper-text">{t('admin.payment.noProof')}</p>
        )}
        {proofUrl ? (
          <a className="payment-proof-preview" href={proofUrl} target="_blank" rel="noreferrer">
            {proofIsImage ? <img src={proofUrl} alt={proofName || t('admin.payment.proof')} /> : <FileText aria-hidden="true" />}
            <span>{t('admin.payment.openProof')}</span>
          </a>
        ) : null}
        {!readOnly ? (
          <>
            <input
              className="visually-hidden"
              id={`${proofControlId}-file`}
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              aria-labelledby={uploadLabelId}
              aria-describedby={`${uploadHelpId}${error ? ` ${uploadErrorId}` : ''}`}
              onChange={attachProof}
            />
            <div className="payment-upload-control" aria-labelledby={uploadLabelId} aria-describedby={`${uploadHelpId}${error ? ` ${uploadErrorId}` : ''}`}>
              <span className="section-kicker" id={uploadLabelId}>{t('admin.payment.uploadLabel')}</span>
              <p className="helper-text" id={uploadHelpId}>{t('admin.payment.uploadHelp')}</p>
              <p className="helper-text payment-review-reason">{proofReviewReason}</p>
              <div className="record-actions wide payment-review-actions">
                <button type="button" aria-describedby={uploadHelpId} onClick={() => fileInputRef.current?.click()}>
                  <Upload aria-hidden="true" />
                  {t('admin.payment.attach')}
                </button>
                <button type="button" disabled={!canReviewProof} onClick={() => workflow.verifyPaymentProof(rental.reference)}>
                  <FileCheck2 aria-hidden="true" />
                  {t('admin.payment.verify')}
                </button>
                <button
                  className="danger-action"
                  ref={rejectButtonRef}
                  type="button"
                  disabled={!canReviewProof}
                  onClick={() => setRejectOpen(true)}
                >
                  <XCircle aria-hidden="true" />
                  {t('admin.payment.reject')}
                </button>
              </div>
            </div>
          </>
        ) : null}
        {error ? <p className="validation-message" id={uploadErrorId} role="alert">{error}</p> : null}
      </div>
      <DestructiveDialogShell
        open={rejectOpen}
        setOpen={setRejectOpen}
        title={t('admin.payment.rejectDialogTitle')}
        description={t('admin.payment.rejectDialogCopy')}
        returnFocusRef={rejectButtonRef}
        actions={(
          <>
            <Dialog.Close asChild>
              <button className="outline-button" type="button">{t('common.cancel')}</button>
            </Dialog.Close>
            <button className="danger-button" type="button" disabled={!rejectReason.trim()} onClick={rejectProof}>
              {t('admin.payment.reject')}
            </button>
          </>
        )}
      >
        <div className="destructive-summary">
          <InfoBlock title={t('common.reference')} copy={rental.reference} />
          <InfoBlock title={t('admin.payment.method')} copy={t(`enum.paymentMethod.${rental.paymentMethod}`)} />
          <InfoBlock title={t('admin.payment.proof')} copy={proofName || t(`enum.payment.${rental.paymentStatus}`)} />
        </div>
        <Field label={t('admin.payment.rejectReason')}>
          <textarea rows={4} required value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
        </Field>
      </DestructiveDialogShell>
    </>
  );
}

function formatFileSize(size = 0): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
