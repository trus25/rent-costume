import { ChevronRight, Search } from 'lucide-react';
import { CatalogueStockFraction } from './CatalogueStockFraction';
import { EmptyState } from '../../shared';
import {
  productAlt,
  productCoverImage,
  productMeta,
  productName,
} from '../../../lib/rental-utils';
import type { Product, TFunction } from '../../../types/domain';

export function CatalogueProductList({
  products,
  selectedId,
  isDirty,
  t,
  onSelect,
}: {
  products: Product[];
  selectedId?: string;
  isDirty: boolean;
  t: TFunction;
  onSelect: (productId: string) => void;
}) {
  return (
    <div className="management-list padded">
      {products.length === 0 ? (
        <EmptyState title={t('admin.catalogue.noProducts')} copy={t('admin.catalogue.noProductsCopy')} icon={Search} />
      ) : (
        products.map((product) => (
          <button
            className={`management-card catalogue-record ${selectedId === product.id ? 'selected' : ''}`}
            type="button"
            key={product.id}
            aria-current={selectedId === product.id ? 'true' : undefined}
            onClick={() => onSelect(product.id)}
          >
            <img src={productCoverImage(product, t)} alt={productAlt(product, t)} />
            <div className="catalogue-card-main">
              <div className="catalogue-card-copy">
                <strong>{productName(product, t)}</strong>
                <span>{productMeta(product, t)}</span>
              </div>
              <div className="catalogue-card-status">
                <span className={`status-badge ${product.active ? 'success' : 'warning'} catalogue-active-badge`}>
                  <span aria-hidden="true" />
                  <span className="status-badge-label">{product.active ? t('admin.catalogue.activeShort') : t('admin.catalogue.inactiveShort')}</span>
                </span>
                <CatalogueStockFraction product={product} t={t} showHealthy />
                {isDirty && selectedId === product.id ? <em className="dirty-badge">{t('admin.catalogue.unsavedBadge')}</em> : null}
              </div>
            </div>
            <ChevronRight className="catalogue-card-chevron" aria-hidden="true" />
          </button>
        ))
      )}
    </div>
  );
}
