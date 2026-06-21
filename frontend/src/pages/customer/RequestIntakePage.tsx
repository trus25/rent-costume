import { type FormEvent, type KeyboardEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardList } from 'lucide-react';
import { Field, StatusPill } from '../../components/shared';
import { defaultDates } from '../../mockData';
import {
  formatDateRange,
  getVariantAvailability,
  productName,
  variantLabel,
} from '../../lib/rental-utils';
import CustomerFrame, { CustomerContentShell, CustomerPageIntro } from './CustomerFrame';
import type { AppState } from '../../types/app';
import type { Product, Rental, RentalRequest, TFunction } from '../../types/domain';

type RequestPageProps = Pick<
  AppState,
  'locale' | 'setLocale' | 't' | 'settings' | 'cart' | 'onOpenCart' | 'products' | 'rentals' | 'requests' | 'dataAdapter'
>;

type SourceChannel = 'customer' | 'staff';

export function RequestIntakePage({
  locale,
  setLocale,
  t,
  settings,
  cart,
  onOpenCart,
  products,
  rentals,
  dataAdapter,
}: RequestPageProps) {
  const navigate = useNavigate();
  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const [sourceChannel, setSourceChannel] = useState<SourceChannel>('staff');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [start, setStart] = useState(defaultDates.start);
  const [end, setEnd] = useState(defaultDates.end);
  const [itemQuery, setItemQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(activeProducts[0]?.id ?? '');
  const [selectedVariantId, setSelectedVariantId] = useState(activeProducts[0]?.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  const selectedProduct = activeProducts.find((product) => product.id === selectedProductId);
  const matchingProducts = activeProducts.filter((product) => {
    const query = itemQuery.trim().toLowerCase();
    if (!query) return true;
    return productName(product, t).toLowerCase().includes(query);
  });
  const showOptions = itemQuery.trim().length > 0 && matchingProducts.length > 0;

  const selectProduct = (product: Product) => {
    const variant = firstRequestableVariant(product, { start, end }, rentals);
    setSelectedProductId(product.id);
    setSelectedVariantId(variant?.id ?? product.variants[0]?.id ?? '');
    setItemQuery(productName(product, t));
    setError('');
  };

  const handleOptionKey = (event: KeyboardEvent<HTMLLIElement>, product: Product) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectProduct(product);
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const product = selectedProduct;
    const variant = product?.variants.find((entry) => entry.id === selectedVariantId) ?? product?.variants[0];
    const qty = Math.max(1, Number(quantity) || 1);

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError('Customer name, phone, and address are required.');
      return;
    }
    if (!product || !variant) {
      setError('Requested item is required.');
      return;
    }
    if (!start || !end || end < start) {
      setError('Requested dates are invalid.');
      return;
    }

    const result = await dataAdapter.requests.create({
      source: sourceChannel,
      values: {
        name: customerName.trim(),
        phone: phone.trim(),
        email: '',
        fulfillment: 'pickup',
        pickupWindow: '10.00-12.00',
        returnWindow: '16.00-18.00',
        deliveryWindow: '',
        address: address.trim(),
        notes: '',
      },
      cart: [
        {
          productId: product.id,
          variantId: variant.id,
          qty,
          start,
          end,
        },
      ],
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate('/requests');
  };

  return (
    <CustomerFrame
      title="Create Request"
      skipTo="request-intake"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <CustomerContentShell className="request-intake-page" id="request-intake">
        <div className="shell request-page-layout">
          <CustomerPageIntro
            kicker="Request intake"
            title="Create request"
            copy="Record customer details, source channel, requested items, and dates before staff acceptance."
          />

          <form className="checkout-card public-request-form" onSubmit={submitRequest}>
            <div className="form-grid">
              <Field label="Source Channel">
                <select value={sourceChannel} onChange={(event) => setSourceChannel(event.target.value as SourceChannel)}>
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                </select>
              </Field>
              <Field label="Customer Name">
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" />
              </Field>
              <Field label="Address">
                <input value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" />
              </Field>
              <Field label="Requested start">
                <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
              </Field>
              <Field label="Requested end">
                <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
              </Field>
              <Field label="Requested item" htmlFor="requested-item-search" className="field-wide">
                <div className="request-item-picker">
                  <input
                    id="requested-item-search"
                    role="combobox"
                    aria-controls="requested-item-options"
                    aria-expanded={showOptions}
                    aria-autocomplete="list"
                    value={itemQuery}
                    onChange={(event) => {
                      setItemQuery(event.target.value);
                      setError('');
                    }}
                    placeholder="Search costume"
                    autoComplete="off"
                  />
                  {showOptions ? (
                    <ul className="request-item-options" id="requested-item-options" role="listbox" aria-label="Requested item options">
                      {matchingProducts.slice(0, 6).map((product) => (
                        <li
                          role="option"
                          aria-selected={product.id === selectedProductId}
                          tabIndex={0}
                          key={product.id}
                          onClick={() => selectProduct(product)}
                          onKeyDown={(event) => handleOptionKey(event, product)}
                        >
                          <span>{productName(product, t)}</span>
                          <small>{product.region} - {product.category}</small>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Field>
              <Field label="Quantity">
                <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </Field>
            </div>

            {selectedProduct ? (
              <div className="request-selection-summary" aria-live="polite">
                <CheckCircle aria-hidden="true" />
                <span>
                  {productName(selectedProduct, t)} - {variantLabel(t, selectedVariantId)} x {Math.max(1, Number(quantity) || 1)}
                </span>
              </div>
            ) : null}
            {error ? <p className="validation-message" role="alert">{error}</p> : null}
            <div className="dialog-actions">
              <Link className="outline-button" to="/requests">
                View requests
              </Link>
              <button className="secondary-button" type="submit">
                Save Request
              </button>
            </div>
          </form>
        </div>
      </CustomerContentShell>
    </CustomerFrame>
  );
}

export function PublicRequestsPage({
  locale,
  setLocale,
  t,
  settings,
  cart,
  onOpenCart,
  products,
  requests,
}: RequestPageProps) {
  const pendingRequests = requests.filter((request) => request.outcome === 'pending');

  return (
    <CustomerFrame
      title="Requests"
      skipTo="request-list"
      settings={settings}
      locale={locale}
      setLocale={setLocale}
      t={t}
      cartCount={cart.length}
      onOpenCart={onOpenCart}
    >
      <CustomerContentShell className="request-list-page" id="request-list">
        <div className="shell request-page-layout">
          <CustomerPageIntro
            kicker="Requests"
            title="Pending requests"
            copy="Requests stay pending until staff accepts them into rentals."
          />

          <div className="request-public-actions">
            <Link className="secondary-button" to="/requests/new">
              New request
            </Link>
          </div>

          <div className="request-public-list">
            {pendingRequests.length === 0 ? (
              <article className="request-public-card empty">
                <ClipboardList aria-hidden="true" />
                <strong>No pending requests</strong>
                <p>Create a request to review source channel, requested items, and dates.</p>
              </article>
            ) : (
              pendingRequests.map((request) => (
                <article className="request-public-card" key={request.reference}>
                  <div className="request-public-card-head">
                    <div>
                      <span className="section-kicker">{request.reference}</span>
                      <h2>{request.customerName}</h2>
                    </div>
                    <StatusPill value="Pending" t={t} tone="warning" />
                  </div>
                  <dl className="request-public-details">
                    <div>
                      <dt>Source Channel</dt>
                      <dd>{sourceChannelLabel(request)}</dd>
                    </div>
                    <div>
                      <dt>Requested Items</dt>
                      <dd>{requestItemLabel(request, products, t)}</dd>
                    </div>
                    <div>
                      <dt>Requested Dates</dt>
                      <dd>
                        <span>{request.start}</span>
                        <span>{request.end}</span>
                        <small>{formatDateRange(request, locale)}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{request.phone}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </div>
      </CustomerContentShell>
    </CustomerFrame>
  );
}

function sourceChannelLabel(request: RentalRequest) {
  return request.sourceChannel === 'staff' ? 'Staff' : 'Customer';
}

function firstRequestableVariant(product: Product, dates: { start: string; end: string }, rentals: Rental[]) {
  return (
    product.variants.find(
      (variant) =>
        getVariantAvailability(product, variant.id, dates, rentals) > 0 &&
        getVariantAvailability(product, variant.id, dates) > 0,
    ) ??
    product.variants.find((variant) => getVariantAvailability(product, variant.id, dates, rentals) > 0) ??
    product.variants[0]
  );
}

function requestItemLabel(request: RentalRequest, products: Product[], t: TFunction) {
  return request.items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const name = product ? productName(product, t) : item.productId;
      return `${name} - ${variantLabel(t, item.variantId)} x ${item.qty}`;
    })
    .join(', ');
}
