import { Plus, X } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AdminFeatureGrid({ className = '', detailOpen = false, children }: { className?: string; detailOpen?: boolean; children: ReactNode }) {
  return (
    <div className={`admin-feature-grid ${className} ${detailOpen ? 'detail-open' : ''}`.trim()}>
      {children}
    </div>
  );
}

export function AdminWorkQueueLayout({
  as: Element = 'div',
  className = '',
  detailOpen = false,
  baseWindow = false,
  featureGrid = false,
  children,
}: {
  as?: ElementType;
  className?: string;
  detailOpen?: boolean;
  baseWindow?: boolean;
  featureGrid?: boolean;
  children: ReactNode;
}) {
  return (
    <Element
      className={`${baseWindow ? 'base-window' : ''} ${featureGrid ? 'admin-feature-grid' : ''} admin-work-queue-layout ${className} ${detailOpen ? 'detail-open' : ''}`.trim()}
    >
      {children}
    </Element>
  );
}

export function InventoryEditorLayout({ className = '', detailOpen = false, children }: { className?: string; detailOpen?: boolean; children: ReactNode }) {
  return (
    <AdminFeatureGrid className={`inventory-editor-layout ${className}`.trim()} detailOpen={detailOpen}>
      {children}
    </AdminFeatureGrid>
  );
}

export function EntityDirectoryLayout({ className = '', detailOpen = false, children }: { className?: string; detailOpen?: boolean; children: ReactNode }) {
  return (
    <AdminFeatureGrid className={`entity-directory-layout ${className}`.trim()} detailOpen={detailOpen}>
      {children}
    </AdminFeatureGrid>
  );
}

export function SettingsPageLayout({
  className = '',
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  return (
    <form className={`settings-grid settings-page-layout ${className}`.trim()} {...props}>
      {children}
    </form>
  );
}

export function AdminMetricStrip({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`ops-metrics admin-metric-strip ${className}`.trim()}>{children}</div>;
}

export function AdminAlertBanner({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`ops-alert-banner admin-alert-banner ${className}`.trim()}>{children}</div>;
}

export function RecordActionBar({
  className = '',
  label,
  status,
  primary,
  secondary,
  destructive,
  children,
}: {
  className?: string;
  label?: string;
  status?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  destructive?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`record-actions record-action-bar ${className}`.trim()} role="group" aria-label={label}>
      {status ? <span className="record-action-status">{status}</span> : null}
      {children}
      {primary ? <div className="record-action-group primary">{primary}</div> : null}
      {secondary ? <div className="record-action-group secondary">{secondary}</div> : null}
      {destructive ? <div className="record-action-group destructive">{destructive}</div> : null}
    </div>
  );
}

export function AdminListWindow({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`base-window management-window ${className}`.trim()}>
      {children}
    </section>
  );
}

export function AdminViewBar({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`view-bar ${className}`.trim()}>
      {children}
    </div>
  );
}

export function AdminCreateAction({
  label,
  open = false,
  controls,
  onToggle,
  to,
  className = '',
}: {
  label: string;
  open?: boolean;
  controls?: string;
  onToggle?: () => void;
  to?: string;
  className?: string;
}) {
  const content = (
    <>
      <Plus aria-hidden="true" />
      {label}
    </>
  );
  const buttonClass = `primary-button desktop-create-action ${open ? 'active' : ''} ${className}`.trim();

  if (to) {
    return (
      <Link className={buttonClass} to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={buttonClass}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-pressed={open}
      onClick={onToggle}
    >
      {content}
    </button>
  );
}

export function AdminCreateFab({
  label,
  open = false,
  controls,
  onToggle,
  to,
  className = '',
}: {
  label: string;
  open?: boolean;
  controls?: string;
  onToggle?: () => void;
  to?: string;
  className?: string;
}) {
  const content = (
    <>
      <Plus aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </>
  );
  const buttonClass = `primary-button mobile-fab ${open ? 'active' : ''} ${className}`.trim();

  if (to) {
    return (
      <Link className={buttonClass} to={to} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={buttonClass}
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-pressed={open}
      aria-label={label}
      onClick={onToggle}
    >
      {content}
    </button>
  );
}

export function AdminCreatePanel({
  id,
  kicker,
  title,
  closeLabel,
  onClose,
  className = '',
  standalone = false,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  standalone?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`content-panel compact-panel ${standalone ? 'admin-page-create-panel' : ''} ${className}`.trim()} id={id}>
      <div className={`panel-form-head ${standalone ? 'standalone' : ''}`.trim()}>
        <div>
          <span className="section-kicker">{kicker}</span>
          <h3>{title}</h3>
        </div>
        {!standalone ? (
          <button className="icon-button" type="button" aria-label={closeLabel} onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
