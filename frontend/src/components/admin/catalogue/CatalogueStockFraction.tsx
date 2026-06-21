import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { defaultDates } from '../../../mockData';
import { getVariantAvailability } from '../../../lib/rental-utils';
import type { Product, TFunction } from '../../../types/domain';

export function CatalogueStockFraction({
  product,
  t,
  showHealthy = false,
  className = '',
}: {
  product: Product;
  t: TFunction;
  showHealthy?: boolean;
  className?: string;
}) {
  const total = product.variants.reduce((sum, variant) => sum + (Number(variant.total) || 0), 0);
  const available = product.active
    ? product.variants.reduce((sum, variant) => sum + getVariantAvailability(product, variant.id, defaultDates), 0)
    : 0;
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
