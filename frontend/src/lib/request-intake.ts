import { getVariantAvailability } from './availability';
import {
  activityText,
  appendActivity,
  hasRentalChanged,
  productName,
} from './rental-utils';
import type {
  ActivityItem,
  Product,
  Rental,
  RentalItem,
  RequestDetailsUpdateValues,
  RentalRequest,
  RequestItemOutcome,
  TFunction,
} from '../types/domain';

type RequestActivity = Omit<ActivityItem, 'id' | 'time'>;
const DEFAULT_OUTCOME_BALANCE_ERROR = 'Outcome quantities must total the requested quantity.';
const requestDetailsKeys = [
  'customerName',
  'phone',
  'email',
  'paymentStatus',
  'paymentMethod',
  'fulfillment',
  'start',
  'end',
  'pickupWindow',
  'returnWindow',
  'deliveryWindow',
  'address',
  'notes',
  'internalNotes',
  'staleHours',
  'deliveryFee',
  'deliveryNotes',
] as const satisfies ReadonlyArray<keyof RequestDetailsUpdateValues>;

export type RequestIntakeMutationResult = {
  requests: RentalRequest[];
  request?: RentalRequest;
  changed: boolean;
  error?: string;
};

export type RequestAcceptanceResult = {
  request?: RentalRequest;
  rental?: Rental;
  agreedItems?: RentalItem[];
  error?: string;
};

export function requestOutcomeTotal(outcome: RequestItemOutcome) {
  return (Number(outcome.acceptedQty) || 0) +
    (Number(outcome.substitutedQty) || 0) +
    (Number(outcome.removedByCustomerQty) || 0) +
    (Number(outcome.unfulfilledStockoutQty) || 0);
}

export function requestOutcomesAreBalanced(request: RentalRequest) {
  if (!Array.isArray(request.itemOutcomes) || request.itemOutcomes.length === 0) return true;
  return request.items.every((item, index) => {
    const outcome = request.itemOutcomes?.find((entry) => (
      entry.requestedProductId === item.productId && entry.requestedVariantId === item.variantId
    )) ?? request.itemOutcomes?.[index];
    return outcome ? requestOutcomeTotal(outcome) === (Number(item.qty) || 0) : false;
  });
}

export function agreedItemsFromRequest(request: RentalRequest): RentalItem[] {
  if (!Array.isArray(request.itemOutcomes) || request.itemOutcomes.length === 0) {
    return request.items.map((item) => ({ ...item }));
  }

  return mergeRentalItems(request.itemOutcomes.flatMap((outcome) => {
    const acceptedQty = Number(outcome.acceptedQty) || 0;
    const substitutedQty = Number(outcome.substitutedQty) || 0;
    const items: RentalItem[] = [];

    if (acceptedQty > 0) {
      items.push({
        productId: outcome.requestedProductId,
        variantId: outcome.requestedVariantId,
        qty: acceptedQty,
      });
    }

    if (substitutedQty > 0 && outcome.substituteProductId && outcome.substituteVariantId) {
      items.push({
        productId: outcome.substituteProductId,
        variantId: outcome.substituteVariantId,
        qty: substitutedQty,
      });
    }

    return items;
  }));
}

export function reviseRequestOutcomes(
  requests: RentalRequest[],
  reference: string,
  itemOutcomes: RequestItemOutcome[],
  options: { balanceError?: string } = {},
): RequestIntakeMutationResult {
  const existing = findPendingRequest(requests, reference);
  if ('error' in existing) return { requests, changed: false, error: existing.error };

  const request = { ...existing.request, itemOutcomes: itemOutcomes.map((outcome) => ({ ...outcome })) };
  if (!requestOutcomesAreBalanced(request)) {
    return { requests, request: existing.request, changed: false, error: options.balanceError ?? DEFAULT_OUTCOME_BALANCE_ERROR };
  }

  return replaceRequest(
    requests,
    reference,
    request,
    activityText('Revisi hasil permintaan disimpan.', 'Request outcome revision saved.'),
  );
}

export function rejectRequest(
  requests: RentalRequest[],
  reference: string,
  reason: string,
): RequestIntakeMutationResult {
  const existing = findPendingRequest(requests, reference);
  if ('error' in existing) return { requests, changed: false, error: existing.error };

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { requests, request: existing.request, changed: false, error: 'Rejection reason is required.' };
  }

  return replaceRequest(
    requests,
    reference,
    {
      ...existing.request,
      outcome: 'rejected',
      internalNotes: trimmedReason,
    },
    activityText(`Permintaan ditolak. Alasan: ${trimmedReason}`, `Request rejected. Reason: ${trimmedReason}`),
  );
}

export function editRequestDetails(
  requests: RentalRequest[],
  reference: string,
  values: RequestDetailsUpdateValues,
): RequestIntakeMutationResult {
  const existing = findPendingRequest(requests, reference);
  if ('error' in existing) return { requests, changed: false, error: existing.error };

  return replaceRequest(
    requests,
    reference,
    {
      ...existing.request,
      ...pickRequestDetails(values),
    },
    activityText('Permintaan diperbarui.', 'Request updated.'),
  );
}

export function acceptRequestIntoRental({
  request,
  products,
  rentals,
  rentalReference,
  t,
}: {
  request: RentalRequest;
  products: Product[];
  rentals: Rental[];
  rentalReference: string;
  t: TFunction;
}): RequestAcceptanceResult {
  if (request.outcome !== 'pending') {
    return { error: 'Request is no longer pending.' };
  }

  if (!requestOutcomesAreBalanced(request)) {
    return { error: t('admin.requests.outcomeBalanceError') };
  }

  const agreedItems = agreedItemsFromRequest(request);
  const blockedItem = agreedItems.find((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) return true;
    return getVariantAvailability(product, item.variantId, request, rentals) < item.qty;
  });

  if (blockedItem) {
    const product = products.find((entry) => entry.id === blockedItem.productId);
    return {
      agreedItems,
      error: t('customer.checkout.stockChanged', {
        item: product ? productName(product, t) : blockedItem.productId,
      }),
    };
  }

  const acceptedRequest = appendActivity(
    {
      ...request,
      outcome: 'accepted' as const,
      acceptedRentalReference: rentalReference,
    },
    activityText('Permintaan diterima dan dibuat menjadi rental.', 'Request accepted and converted into a rental.'),
  );

  const rental = appendActivity(
    {
      reference: rentalReference,
      sourceRequestReference: request.reference,
      sourceChannel: request.sourceChannel,
      customerName: request.customerName,
      phone: request.phone,
      email: request.email,
      lifecycle: 'confirmed' as const,
      paymentStatus: request.paymentStatus,
      paymentMethod: request.paymentMethod,
      fulfillment: request.fulfillment,
      start: request.start,
      end: request.end,
      pickupWindow: request.pickupWindow,
      returnWindow: request.returnWindow,
      deliveryWindow: request.deliveryWindow,
      address: request.address,
      notes: request.notes,
      internalNotes: request.internalNotes
        ? `${request.internalNotes}\nSource request: ${request.reference}`
        : `Source request: ${request.reference}`,
      staleHours: 0,
      deliveryFee: request.deliveryFee,
      deliveryNotes: request.deliveryNotes,
      items: agreedItems.map((item) => ({ ...item })),
      checklist: request.checklist.map((item) => ({ ...item })),
      activity: acceptedRequest.activity,
    },
    activityText(`Rental dibuat dari permintaan ${request.reference}.`, `Rental created from request ${request.reference}.`),
  );

  return { request: acceptedRequest, rental, agreedItems };
}

function mergeRentalItems(items: RentalItem[]) {
  const merged = new Map<string, RentalItem>();
  items.forEach((item) => {
    if (item.qty <= 0) return;
    const key = `${item.productId}|${item.variantId}`;
    const current = merged.get(key);
    merged.set(key, current ? { ...current, qty: current.qty + item.qty } : { ...item });
  });
  return [...merged.values()];
}

function findPendingRequest(requests: RentalRequest[], reference: string) {
  const request = requests.find((entry) => entry.reference === reference);
  if (!request || request.outcome !== 'pending') {
    return { error: 'Request is no longer pending.' } as const;
  }
  return { request } as const;
}

function replaceRequest(
  requests: RentalRequest[],
  reference: string,
  next: RentalRequest,
  activity?: RequestActivity,
): RequestIntakeMutationResult {
  const existing = requests.find((request) => request.reference === reference);
  if (!existing) return { requests, changed: false, error: 'Request was not found.' };
  if (!hasRentalChanged(existing, next)) return { requests, request: existing, changed: false };

  const request = activity ? appendActivity(next, activity) : next;
  return {
    requests: requests.map((entry) => (entry.reference === reference ? request : entry)),
    request,
    changed: true,
  };
}

function pickRequestDetails(values: RequestDetailsUpdateValues): RequestDetailsUpdateValues {
  return Object.fromEntries(
    requestDetailsKeys
      .filter((key) => Object.prototype.hasOwnProperty.call(values, key))
      .map((key) => [key, values[key]]),
  ) as RequestDetailsUpdateValues;
}

export const RequestIntake = {
  acceptRequestIntoRental,
  agreedItemsFromRequest,
  editRequestDetails,
  rejectRequest,
  requestOutcomeTotal,
  requestOutcomesAreBalanced,
  reviseRequestOutcomes,
};
