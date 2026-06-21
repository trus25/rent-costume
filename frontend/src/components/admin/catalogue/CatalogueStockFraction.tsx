import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ProductStockSummary } from '../../../lib/availability';
import type { TFunction } from '../../../types/domain';

export function CatalogueStockFraction({
  stock,
  t,
  showHealthy = false,
  className = '',
}: {
  stock: ProductStockSummary;
  t: TFunction;
  showHealthy?: boolean;
  className?: string;
}) {
  const { total, available } = stock;
  const ratio = total > 0 ? available / total : 0;
  if (!showHealthy && ratio > 0.3) return null;

  const tone = available <= 0 ? 'danger' : ratio <= 0.3 ? 'warning' : 'success';
  const Icon = available <= 0 ? XCircle : ratio <= 0.3 ? AlertTriangle : CheckCircle2;

  return (
    <span className={`status-badge ${tone} catalogue-stock-fraction ${className}`.trim()}>
      <Icon aria-hidden="true" />
      <span className="status-badge-label">{t('admin.catalogue.stockFraction', { available, total })}</span>
    </span>
  );
}
