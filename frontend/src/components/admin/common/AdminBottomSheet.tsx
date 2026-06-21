import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ElementType, ReactNode, RefObject } from 'react';

export default function AdminBottomSheet({
  as: Element = 'section',
  open,
  onClose,
  children,
  ariaLabel,
  description,
  role,
  id,
  modal = true,
  mountWhenClosed = false,
  className = '',
  backdropClassName = '',
  closeLabel = 'Close',
  returnFocusRef,
}: {
  as?: ElementType;
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  ariaLabel?: string;
  description?: string;
  role?: string;
  id?: string;
  modal?: boolean;
  mountWhenClosed?: boolean;
  className?: string;
  backdropClassName?: string;
  closeLabel?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const resolvedDescription = description ?? ariaLabel;
  const panelRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(open);
  const persistentNonModal = mountWhenClosed && !modal;
  const [persistentPanelInline, setPersistentPanelInline] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 820px)').matches : false
  ));

  useEffect(() => {
    if (!persistentNonModal || typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 820px)');
    const syncInlineState = () => setPersistentPanelInline(mediaQuery.matches);
    syncInlineState();
    mediaQuery.addEventListener('change', syncInlineState);
    return () => mediaQuery.removeEventListener('change', syncInlineState);
  }, [persistentNonModal]);

  useEffect(() => {
    if (!open || !persistentNonModal || !panelRef.current) return;
    const focusTarget = panelRef.current.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    window.requestAnimationFrame(() => {
      (focusTarget ?? panelRef.current)?.focus();
    });
  }, [open, persistentNonModal]);

  useEffect(() => {
    if (!persistentNonModal) {
      wasOpenRef.current = open;
      return;
    }
    if (wasOpenRef.current && !open) {
      window.requestAnimationFrame(() => {
        returnFocusRef?.current?.focus();
      });
    }
    wasOpenRef.current = open;
  }, [open, persistentNonModal, returnFocusRef]);

  if (!open && !mountWhenClosed) return null;

  const hideClosedPersistentPanel = persistentNonModal && !open && !persistentPanelInline;

  const panelProps: Record<string, string | boolean> = {
    className: `bottom-sheet-panel ${open ? 'open' : ''} ${className}`.trim(),
  };

  if (id) panelProps.id = id;
  if (ariaLabel) panelProps['aria-label'] = ariaLabel;
  if (role) panelProps.role = role;
  if (role === 'dialog' && modal && open) panelProps['aria-modal'] = 'true';
  if (hideClosedPersistentPanel) {
    panelProps['aria-hidden'] = 'true';
    panelProps.inert = true;
  }

  const backdrop =
    open && persistentNonModal && !persistentPanelInline ? (
      <button
        className={`bottom-sheet-backdrop open ${backdropClassName}`.trim()}
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
      />
    ) : open ? (
      <Dialog.Overlay className={`bottom-sheet-backdrop open ${backdropClassName}`.trim()} aria-label={closeLabel} />
    ) : null;

  const sheetContent = (
    <>
      {backdrop}
      <Dialog.Content
        asChild
        forceMount={mountWhenClosed || undefined}
        onCloseAutoFocus={(event) => {
          if (!returnFocusRef?.current) return;
          event.preventDefault();
          returnFocusRef.current.focus();
        }}
      >
        <Element
          {...panelProps}
          ref={(node: HTMLElement | null) => {
            panelRef.current = node;
          }}
        >
          {ariaLabel ? <Dialog.Title className="visually-hidden">{ariaLabel}</Dialog.Title> : null}
          {resolvedDescription ? <Dialog.Description className="visually-hidden">{resolvedDescription}</Dialog.Description> : null}
          {children}
        </Element>
      </Dialog.Content>
    </>
  );

  return (
    <Dialog.Root
      open={open}
      modal={modal}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen && open) onClose?.();
      }}
    >
      {persistentNonModal ? sheetContent : <Dialog.Portal>{sheetContent}</Dialog.Portal>}
    </Dialog.Root>
  );
}

export function AdminSheetHeader({
  kicker,
  title,
  closeLabel = 'Close',
  onClose,
  className = 'bottom-sheet-header',
  closeButtonClassName = '',
  groupTitle = true,
  showCloseButton = true,
}: {
  kicker?: string;
  title?: string;
  closeLabel?: string;
  onClose?: () => void;
  className?: string;
  closeButtonClassName?: string;
  groupTitle?: boolean;
  showCloseButton?: boolean;
}) {
  const titleContent = (
    <>
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
      {title ? <strong>{title}</strong> : null}
    </>
  );

  return (
    <div className={className}>
      {groupTitle ? <div>{titleContent}</div> : titleContent}
      {showCloseButton && onClose ? (
        <button className={`icon-button ${closeButtonClassName}`.trim()} type="button" aria-label={closeLabel} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
