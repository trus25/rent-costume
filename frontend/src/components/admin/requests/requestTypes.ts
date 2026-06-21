import type { FulfillmentMethod, PaymentStatus } from '../../../types/domain';

export type RequestTab = 'all' | 'stale' | 'delivery';

export type RequestFulfillmentFilter = 'all' | FulfillmentMethod;

export type RequestPaymentFilter = 'all' | PaymentStatus;

export type RequestSortMode = 'stale' | 'newest' | 'date';

export type RequestActiveFilterKey = 'query' | 'fulfillment' | 'payment' | 'sort';

export type RequestActiveFilter = {
  key: RequestActiveFilterKey;
  label: string;
  value: string;
};

export type NewRequestDraft = {
  customerName: string;
  phone: string;
  email: string;
  start: string;
  end: string;
  fulfillment: FulfillmentMethod;
  productId: string;
  variantId: string;
  qty: number | string;
  notes: string;
};
