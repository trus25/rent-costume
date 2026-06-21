import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { defaultDates } from '../../../mockData';
import { resetMobileDetailScroll } from '../../../lib/mobile-detail';
import type { DataAdapter, FulfillmentMethod, Product, RentalRequest, RequestDetailsUpdateValues, RequestItemOutcome, TFunction } from '../../../types/domain';
import type {
  RequestActiveFilter,
  RequestActiveFilterKey,
  NewRequestDraft,
  RequestFulfillmentFilter,
  RequestPaymentFilter,
  RequestSortMode,
  RequestTab,
} from './requestTypes';

export const requestTabs: RequestTab[] = ['all', 'stale', 'delivery'];
export const fulfillmentFilters: RequestFulfillmentFilter[] = ['all', 'pickup', 'delivery'];
export const paymentFilters: RequestPaymentFilter[] = ['all', 'missing', 'attached', 'verified', 'rejected'];
export const sortModes: RequestSortMode[] = ['stale', 'newest', 'date'];

type UseRequestsAdminControllerParams = {
  t: TFunction;
  requests: RentalRequest[];
  products: Product[];
  dataAdapter: DataAdapter;
  detailReference?: string;
  onOpenDetail?: (reference: string) => void;
  onCloseDetail?: () => void;
  onCreateSuccess?: (request: RentalRequest) => void;
};

type SearchParamUpdates = Record<string, string>;

export function useRequestsAdminController({
  t,
  requests,
  products,
  dataAdapter,
  detailReference,
  onOpenDetail,
  onCloseDetail,
  onCreateSuccess,
}: UseRequestsAdminControllerParams) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab: RequestTab = isRequestTab(tabParam) ? tabParam : 'all';
  const initialQuery = searchParams.get('q') ?? '';
  const fulfillmentParam = searchParams.get('fulfillment');
  const paymentParam = searchParams.get('payment');
  const sortParam = searchParams.get('sort');
  const initialFulfillmentFilter: RequestFulfillmentFilter = isFulfillmentFilter(fulfillmentParam) ? fulfillmentParam : 'all';
  const initialPaymentFilter: RequestPaymentFilter = isPaymentFilter(paymentParam) ? paymentParam : 'all';
  const initialSortMode: RequestSortMode = isSortMode(sortParam) ? sortParam : 'stale';
  const [tab, setTab] = useState<RequestTab>(initialTab);
  const [selectedRef, setSelectedRef] = useState<string | undefined>(detailReference ?? requests.find((request) => request.outcome === 'pending')?.reference);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(initialQuery || fulfillmentParam || paymentParam || (sortParam && initialSortMode !== 'stale')));
  const isDetailViewOpen = Boolean(detailReference);
  const [query, setQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [fulfillmentFilter, setFulfillmentFilter] = useState<RequestFulfillmentFilter>(initialFulfillmentFilter);
  const [appliedFulfillmentFilter, setAppliedFulfillmentFilter] = useState<RequestFulfillmentFilter>(initialFulfillmentFilter);
  const [paymentFilter, setPaymentFilter] = useState<RequestPaymentFilter>(initialPaymentFilter);
  const [appliedPaymentFilter, setAppliedPaymentFilter] = useState<RequestPaymentFilter>(initialPaymentFilter);
  const [sortMode, setSortMode] = useState<RequestSortMode>(initialSortMode);
  const [appliedSortMode, setAppliedSortMode] = useState<RequestSortMode>(initialSortMode);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [newRequest, setNewRequest] = useState<NewRequestDraft>(() => makeBlankRequest(products));

  const requestCounts = useMemo(() => {
    const requested = requests.filter((request) => request.outcome === 'pending');
    return {
      all: requested.length,
      stale: requested.filter((request) => request.staleHours >= 24).length,
      delivery: requested.filter((request) => request.fulfillment === 'delivery').length,
    };
  }, [requests]);
  const baseFiltered = requests.filter((request) => {
    if (tab === 'stale') return request.outcome === 'pending' && request.staleHours >= 24;
    if (tab === 'delivery') return request.outcome === 'pending' && request.fulfillment === 'delivery';
    return request.outcome === 'pending';
  });
  const filtered = baseFiltered
    .filter((request) => {
      const normalized = appliedQuery.trim().toLowerCase();
      const matchesQuery =
        !normalized ||
        request.reference.toLowerCase().includes(normalized) ||
        request.customerName.toLowerCase().includes(normalized) ||
        request.phone.toLowerCase().includes(normalized);
      const matchesFulfillment = appliedFulfillmentFilter === 'all' || request.fulfillment === appliedFulfillmentFilter;
      const matchesPayment = appliedPaymentFilter === 'all' || request.paymentStatus === appliedPaymentFilter;
      return matchesQuery && matchesFulfillment && matchesPayment;
    })
    .sort((a, b) => sortRequests(a, b, appliedSortMode));
  const selectedInQueue = filtered.find((request) => request.reference === selectedRef);
  const selectedByReference = detailReference ? requests.find((request) => request.reference === detailReference) : undefined;
  const selected = detailReference ? selectedByReference : selectedInQueue ?? filtered[0];
  const canMutateRequest = selected?.outcome === 'pending';
  const selectedRequestProduct = products.find((product) => product.id === newRequest.productId) ?? products[0];
  const selectedRequestVariant = selectedRequestProduct?.variants.find((variant) => variant.id === newRequest.variantId) ?? selectedRequestProduct?.variants[0];
  const activeFilters = useMemo<RequestActiveFilter[]>(() => {
    const filters: RequestActiveFilter[] = [];
    const trimmedQuery = appliedQuery.trim();
    if (trimmedQuery) {
      filters.push({ key: 'query', label: t('admin.requests.filterSearch'), value: trimmedQuery });
    }
    if (appliedFulfillmentFilter !== 'all') {
      filters.push({ key: 'fulfillment', label: t('admin.table.fulfillment'), value: t(`enum.fulfillment.${appliedFulfillmentFilter}`) });
    }
    if (appliedPaymentFilter !== 'all') {
      filters.push({ key: 'payment', label: t('admin.table.payment'), value: t(`enum.payment.${appliedPaymentFilter}`) });
    }
    if (appliedSortMode !== 'stale') {
      filters.push({ key: 'sort', label: t('admin.tools.sort'), value: t(`admin.tools.sort.${appliedSortMode}`) });
    }
    return filters;
  }, [appliedFulfillmentFilter, appliedPaymentFilter, appliedQuery, appliedSortMode, t]);

  useEffect(() => {
    if (detailReference) setSelectedRef(detailReference);
  }, [detailReference]);

  useEffect(() => {
    if (isDetailViewOpen) resetMobileDetailScroll();
  }, [isDetailViewOpen, selected?.reference]);

  const updateParams = (updates: SearchParamUpdates, options: { replace?: boolean } = { replace: true }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all' || (key === 'sort' && value === 'stale')) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, options);
  };

  const handleTabChange = (value: string) => {
    if (!isRequestTab(value)) return;
    setTab(value);
    updateParams({ tab: value });
  };

  const applyFilters = () => {
    const nextQuery = query.trim();
    setQuery(nextQuery);
    setAppliedQuery(nextQuery);
    setAppliedFulfillmentFilter(fulfillmentFilter);
    setAppliedPaymentFilter(paymentFilter);
    setAppliedSortMode(sortMode);
    setFiltersOpen(false);
    updateParams({
      q: nextQuery,
      fulfillment: fulfillmentFilter,
      payment: paymentFilter,
      sort: sortMode,
    });
  };

  const clearFilters = () => {
    setQuery('');
    setFulfillmentFilter('all');
    setPaymentFilter('all');
    setSortMode('stale');
    setAppliedQuery('');
    setAppliedFulfillmentFilter('all');
    setAppliedPaymentFilter('all');
    setAppliedSortMode('stale');
    setFiltersOpen(false);
    updateParams({ q: '', fulfillment: '', payment: '', sort: '' });
  };

  const clearActiveFilter = (key: RequestActiveFilterKey) => {
    const nextQuery = key === 'query' ? '' : appliedQuery;
    const nextFulfillment = key === 'fulfillment' ? 'all' : appliedFulfillmentFilter;
    const nextPayment = key === 'payment' ? 'all' : appliedPaymentFilter;
    const nextSort = key === 'sort' ? 'stale' : appliedSortMode;
    setQuery(nextQuery);
    setFulfillmentFilter(nextFulfillment);
    setPaymentFilter(nextPayment);
    setSortMode(nextSort);
    setAppliedQuery(nextQuery);
    setAppliedFulfillmentFilter(nextFulfillment);
    setAppliedPaymentFilter(nextPayment);
    setAppliedSortMode(nextSort);
    updateParams({
      q: nextQuery.trim(),
      fulfillment: nextFulfillment,
      payment: nextPayment,
      sort: nextSort,
    });
  };

  const selectRequest = (reference: string | undefined, { openDetail = true }: { openDetail?: boolean } = {}) => {
    if (!reference) return;
    setSelectedRef(reference);
    if (openDetail) onOpenDetail?.(reference);
  };

  const closeDetailView = () => {
    onCloseDetail?.();
  };

  useEffect(() => {
    const targetTab = searchParams.get('tab');
    const targetFulfillment = searchParams.get('fulfillment');
    const targetPayment = searchParams.get('payment');
    const targetSort = searchParams.get('sort');
    const nextQuery = searchParams.get('q') ?? '';
    const nextFulfillment = isFulfillmentFilter(targetFulfillment) ? targetFulfillment : 'all';
    const nextPayment = isPaymentFilter(targetPayment) ? targetPayment : 'all';
    const nextSort = isSortMode(targetSort) ? targetSort : 'stale';
    if (isRequestTab(targetTab) && targetTab !== tab) setTab(targetTab);
    setQuery(nextQuery);
    setAppliedQuery(nextQuery);
    setFulfillmentFilter(nextFulfillment);
    setAppliedFulfillmentFilter(nextFulfillment);
    setPaymentFilter(nextPayment);
    setAppliedPaymentFilter(nextPayment);
    setSortMode(nextSort);
    setAppliedSortMode(nextSort);
  }, [searchParams, tab]);

  useEffect(() => {
    if (detailReference) return;
    if (filtered.length > 0 && !filtered.some((rental) => rental.reference === selectedRef)) {
      setSelectedRef(filtered[0].reference);
    }
  }, [detailReference, filtered, selectedRef]);

  useEffect(() => {
    if (products.length === 0) return;
    setNewRequest((current) => {
      const product = products.find((entry) => entry.id === current.productId) ?? products[0];
      const variantExists = product.variants.some((variant) => variant.id === current.variantId);
      if (current.productId === product.id && variantExists) return current;
      return { ...current, productId: product.id, variantId: product.variants[0]?.id ?? '' };
    });
  }, [products]);

  const rejectSelected = async (reason: string) => {
    if (!selected) return;
    const result = await dataAdapter.requests.reject({ reference: selected.reference, reason });
    if (result?.error) {
      setAddError(result.error);
      return;
    }
    if (result?.request) setSelectedRef(result.request.reference);
  };

  const acceptRequest = async (request: RentalRequest) => {
    if (!request || request.outcome !== 'pending') return;
    const result = await dataAdapter.requests.accept({ reference: request.reference });
    if (result?.error) {
      setAddError(result.error);
      return;
    }
    if (result?.request) setSelectedRef(result.request.reference);
  };

  const editRequest = (request: RentalRequest) => {
    selectRequest(request.reference);
    setEditOpen(true);
  };

  const rejectRequest = (request: RentalRequest) => {
    selectRequest(request.reference);
    setRejectOpen(true);
  };

  const saveOutcomeRevision = async (reference: string, itemOutcomes: RequestItemOutcome[]) => {
    const result = await dataAdapter.requests.revise({ reference, itemOutcomes });
    if (result?.error) {
      setAddError(result.error);
      return;
    }
    if (result?.request) setSelectedRef(result.request.reference);
  };

  const saveRequestDetails = async (reference: string, values: RequestDetailsUpdateValues) => {
    const result = await dataAdapter.requests.edit({ reference, values });
    if (result?.error) {
      setAddError(result.error);
      return;
    }
    if (result?.request) setSelectedRef(result.request.reference);
  };

  const updateNewRequest = (updates: Partial<NewRequestDraft>) => {
    setAddError('');
    setNewRequest((current) => ({ ...current, ...updates }));
  };

  const handleNewRequestProduct = (productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    updateNewRequest({ productId, variantId: product?.variants[0]?.id ?? '' });
  };

  const createRequest = async () => {
    if (!selectedRequestProduct || !selectedRequestVariant) {
      setAddError(t('admin.requests.itemRequired'));
      return;
    }
    if (!newRequest.customerName.trim() || !newRequest.phone.trim()) {
      setAddError(t('admin.requests.requiredCustomer'));
      return;
    }
    if (!newRequest.start || !newRequest.end || newRequest.end < newRequest.start) {
      setAddError(t('admin.requests.invalidDates'));
      return;
    }

    const qty = Math.max(1, Number(newRequest.qty) || 1);

    const result = await dataAdapter.requests.create({
      source: 'staff',
      values: {
        name: newRequest.customerName.trim(),
        phone: newRequest.phone.trim(),
        email: newRequest.email.trim(),
        fulfillment: newRequest.fulfillment,
        pickupWindow: newRequest.fulfillment === 'pickup' ? '10.00-12.00' : '',
        returnWindow: '16.00-18.00',
        deliveryWindow: newRequest.fulfillment === 'delivery' ? '09.00-11.00' : '',
        address: '',
        notes: newRequest.notes.trim(),
      },
      cart: [
        {
          productId: selectedRequestProduct.id,
          variantId: selectedRequestVariant.id,
          qty,
          start: newRequest.start,
          end: newRequest.end,
        },
      ],
    });

    if (result?.error) {
      setAddError(result.error);
      return;
    }

    if (result?.request) {
      setTab('all');
      setQuery('');
      setFulfillmentFilter('all');
      setPaymentFilter('all');
      setSortMode('stale');
      setAppliedQuery('');
      setAppliedFulfillmentFilter('all');
      setAppliedPaymentFilter('all');
      setAppliedSortMode('stale');
      setSelectedRef(result.request.reference);
      setAddOpen(false);
      setAddError('');
      setNewRequest(makeBlankRequest(products));
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'all');
      next.delete('q');
      next.delete('fulfillment');
      next.delete('payment');
      next.delete('sort');
      setSearchParams(next, { replace: true });
      onCreateSuccess?.(result.request);
    }
  };

  const closeAddPanel = () => {
    setAddOpen(false);
    setAddError('');
  };

  return {
    tab,
    requestCounts,
    activeFilters,
    selected,
    canMutateRequest,
    selectedRequestProduct,
    filtered,
    filtersOpen,
    setFiltersOpen,
    isDetailViewOpen,
    query,
    setQuery,
    fulfillmentFilter,
    setFulfillmentFilter,
    paymentFilter,
    setPaymentFilter,
    sortMode,
    setSortMode,
    rejectOpen,
    setRejectOpen,
    editOpen,
    setEditOpen,
    addOpen,
    setAddOpen,
    addError,
    newRequest,
    handleTabChange,
    applyFilters,
    clearFilters,
    clearActiveFilter,
    selectRequest,
    closeDetailView,
    rejectSelected,
    acceptRequest,
    editRequest,
    rejectRequest,
    saveOutcomeRevision,
    saveRequestDetails,
    updateNewRequest,
    handleNewRequestProduct,
    createRequest,
    closeAddPanel,
  };
}

function makeBlankRequest(products: Product[]): NewRequestDraft {
  const firstProduct = products[0];
  return {
    customerName: '',
    phone: '',
    email: '',
    start: defaultDates.start,
    end: defaultDates.end,
    fulfillment: 'pickup' as FulfillmentMethod,
    productId: firstProduct?.id ?? '',
    variantId: firstProduct?.variants[0]?.id ?? '',
    qty: 1,
    notes: '',
  };
}

function sortRequests(a: RentalRequest, b: RentalRequest, sortMode: RequestSortMode): number {
  if (sortMode === 'date') return a.start.localeCompare(b.start) || b.reference.localeCompare(a.reference);
  if (sortMode === 'newest') return b.reference.localeCompare(a.reference);
  return b.staleHours - a.staleHours || b.reference.localeCompare(a.reference);
}

function isRequestTab(value: string | null): value is RequestTab {
  return requestTabs.includes(value as RequestTab);
}

function isFulfillmentFilter(value: string | null): value is RequestFulfillmentFilter {
  return fulfillmentFilters.includes(value as RequestFulfillmentFilter);
}

function isPaymentFilter(value: string | null): value is RequestPaymentFilter {
  return paymentFilters.includes(value as RequestPaymentFilter);
}

function isSortMode(value: string | null): value is RequestSortMode {
  return sortModes.includes(value as RequestSortMode);
}
