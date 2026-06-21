import { AdminCreatePanel } from '../common/AdminManagement';
import { Field, PhoneField, SelectField } from '../../shared';
import { productName } from '../../../lib/rental-utils';
import type { Product, TFunction } from '../../../types/domain';
import type { NewRequestDraft } from './requestTypes';

type RequestCreatePanelProps = {
  t: TFunction;
  products: Product[];
  newRequest: NewRequestDraft;
  updateNewRequest: (updates: Partial<NewRequestDraft>) => void;
  selectedRequestProduct?: Product;
  handleNewRequestProduct: (productId: string) => void;
  addError: string;
  createRequest: () => void;
  onClose: () => void;
  standalone?: boolean;
};

export function RequestCreatePanel({
  t,
  products,
  newRequest,
  updateNewRequest,
  selectedRequestProduct,
  handleNewRequestProduct,
  addError,
  createRequest,
  onClose,
  standalone = false,
}: RequestCreatePanelProps) {
  return (
    <AdminCreatePanel
      id="request-add-panel"
      className="request-add-panel"
      kicker={t('admin.requests.add')}
      title={t('admin.requests.addHelp')}
      closeLabel={t('common.close')}
      onClose={onClose}
      standalone={standalone}
    >
      <div className="form-grid">
        <Field label={t('common.name')}>
          <input value={newRequest.customerName} onChange={(event) => updateNewRequest({ customerName: event.target.value })} />
        </Field>
        <PhoneField label={t('common.phone')} value={newRequest.phone} onChange={(event) => updateNewRequest({ phone: event.target.value })} />
        <Field label={t('common.email')}>
          <input type="email" value={newRequest.email} onChange={(event) => updateNewRequest({ email: event.target.value })} />
        </Field>
        <Field label={t('common.dateStart')}>
          <input type="date" value={newRequest.start} onChange={(event) => updateNewRequest({ start: event.target.value })} />
        </Field>
        <Field label={t('common.dateEnd')}>
          <input type="date" value={newRequest.end} onChange={(event) => updateNewRequest({ end: event.target.value })} />
        </Field>
        <SelectField
          label={t('admin.table.item')}
          value={newRequest.productId}
          onValueChange={handleNewRequestProduct}
          options={products.map((product) => ({ value: product.id, label: productName(product, t) }))}
        />
        <SelectField
          label={t('admin.catalogue.variantLabel')}
          value={newRequest.variantId}
          onValueChange={(variantId) => updateNewRequest({ variantId })}
          options={(selectedRequestProduct?.variants ?? []).map((variant) => ({ value: variant.id, label: variant.label }))}
        />
        <Field label={t('common.qty')}>
          <input type="number" min="1" value={newRequest.qty} onChange={(event) => updateNewRequest({ qty: event.target.value })} />
        </Field>
        <SelectField
          label={t('admin.table.fulfillment')}
          value={newRequest.fulfillment}
          onValueChange={(fulfillment) => updateNewRequest({ fulfillment: fulfillment as NewRequestDraft['fulfillment'] })}
          options={[
            { value: 'pickup', label: t('enum.fulfillment.pickup') },
            { value: 'delivery', label: t('enum.fulfillment.delivery') },
          ]}
        />
        <Field label={t('common.notes')}>
          <input value={newRequest.notes} onChange={(event) => updateNewRequest({ notes: event.target.value })} />
        </Field>
      </div>
      {addError ? <p className="validation-message" role="alert">{addError}</p> : null}
      <div className="dialog-actions">
        <button className="outline-button" type="button" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="secondary-button" type="button" onClick={createRequest} disabled={!newRequest.customerName.trim() || !newRequest.phone.trim()}>
          {t('admin.requests.createDraft')}
        </button>
      </div>
    </AdminCreatePanel>
  );
}
