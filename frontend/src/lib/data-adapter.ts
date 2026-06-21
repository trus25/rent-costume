import { defaultDates } from '../mockData';
import {
  availabilityRank,
  getProductAvailability,
  getProductDayAvailability,
} from './availability';
import {
  addDays,
  dayCount,
  normalizePhone,
  productMeta,
  productName,
  upsertClient,
} from './rental-utils';
import {
  acceptRequestIntoRental,
  editRequestDetails,
  rejectRequest,
  reviseRequestOutcomes,
} from './request-intake';
import type {
  AvailabilityBatchParams,
  AvailabilityRow,
  BookingValues,
  CartItem,
  CatalogueListParams,
  Client,
  DataAdapter,
  DateRange,
  Locale,
  Notification,
  Product,
  ProductAvailabilityState,
  Rental,
  RentalRequest,
  Settings,
  TFunction,
} from '../types/domain';
import type { StateSetter } from '../types/app';

const PUBLIC_AVAILABILITY_TTL_MS = 45_000;
const MAX_PUBLIC_AVAILABILITY_DAYS = 90;
const RENTALS_STORAGE_KEY = 'cr-v2-rentals';
const REQUESTS_STORAGE_KEY = 'cr-v2-requests';
const availabilityCache = new Map<string, { rows: AvailabilityRow[]; expiresAt: number }>();

type ReferencedRecord = {
  reference: string;
};

function assertActive(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Request cancelled', 'AbortError');
  }
}

function cacheKey({ productIds, variantIds, start, end }: Required<Pick<AvailabilityBatchParams, 'productIds' | 'start' | 'end'>> & Pick<AvailabilityBatchParams, 'variantIds'>) {
  return JSON.stringify({
    productIds: [...new Set(productIds)].sort(),
    variantIds: variantIds ? [...new Set(variantIds)].sort() : [],
    start,
    end,
  });
}

function nextReference(records: ReferencedRecord[]) {
  const highest = records
    .map((record) => Number(String(record.reference).replace(/^CR-/i, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 145);
  return `CR-${String(highest + 1).padStart(4, '0')}`;
}

function nextReferenceAt(records: ReferencedRecord[], offset = 1) {
  const highest = records
    .map((record) => Number(String(record.reference).replace(/^CR-/i, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 145);
  return `CR-${String(highest + offset).padStart(4, '0')}`;
}

function readStoredRentals(fallback: Rental[]): Rental[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(RENTALS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed as Rental[] : fallback;
  } catch {
    return fallback;
  }
}

function readStoredRequests(fallback: RentalRequest[]): RentalRequest[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(REQUESTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function mergeByReference<T extends ReferencedRecord>(primary: T[] = [], secondary: T[] = []): T[] {
  const seen = new Set();
  return [...primary, ...secondary].filter((record) => {
    if (!record?.reference || seen.has(record.reference)) return false;
    seen.add(record.reference);
    return true;
  });
}

function groupCartByDate(cart: CartItem[]) {
  const groups = new Map<string, DateRange & { items: CartItem[] }>();
  cart.forEach((item) => {
    const key = `${item.start}|${item.end}`;
    const current = groups.get(key) ?? {
      start: item.start,
      end: item.end,
      items: [],
    };
    current.items.push(item);
    groups.set(key, current);
  });
  return [...groups.values()];
}

function toCatalogueItemSearch(product: Product, t: TFunction) {
  return `${productName(product, t)} ${productMeta(product, t)} ${product.region} ${product.category} ${product.gender ?? 'unisex'}`.toLowerCase();
}

function sortCatalogueItems(items: Product[], sort: string, dates: DateRange, rentals: Rental[]) {
  const sorted = [...items];
  if (sort === 'price_asc') return sorted.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price_desc') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === 'availability') {
    return sorted.sort((a, b) => availabilityRank(getProductAvailability(a, dates, rentals)) - availabilityRank(getProductAvailability(b, dates, rentals)));
  }
  return sorted;
}

function makeNotification({
  tone,
  titleId,
  titleEn,
  copyId,
  copyEn,
  targetRoute,
}: Omit<Notification, 'id'>): Notification {
  return {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tone,
    titleId,
    titleEn,
    copyId,
    copyEn,
    targetRoute,
  };
}

type LocalDataState = {
  products: Product[];
  rentals: Rental[];
  requests: RentalRequest[];
  clients: Client[];
  notifications: Notification[];
  settings: Settings;
};

type CreateLocalDataAdapterInput = {
  getState: () => LocalDataState;
  setProducts: StateSetter<Product[]>;
  setRentals: StateSetter<Rental[]>;
  setRequests: StateSetter<RentalRequest[]>;
  setClients: StateSetter<Client[]>;
  setNotifications: StateSetter<Notification[]>;
  setSettings: StateSetter<Settings>;
  t: TFunction;
  locale: Locale;
};

export function createLocalDataAdapter({
  getState,
  setProducts,
  setRentals,
  setRequests,
  setClients,
  setNotifications,
  setSettings,
  t,
  locale,
}: CreateLocalDataAdapterInput): DataAdapter {
  return {
    catalogue: {
      async list({
        q = '',
        category = 'all',
        region = 'all',
        type = 'all',
        gender = 'all',
        minPrice = '',
        maxPrice = '',
        sort = 'relevance',
        start = defaultDates.start,
        end = defaultDates.end,
        page = 1,
        pageSize = 24,
        signal,
      }: CatalogueListParams = {}) {
        assertActive(signal);
        const { products, settings, rentals } = getState();
        if (!settings.publicCatalogue) return { items: [], total: 0, page, pageSize, dates: { start, end } };

        const normalized = q.trim().toLowerCase();
        const selectedType = type !== 'all' ? type : category;
        const parsedMinPrice = Number(minPrice);
        const parsedMaxPrice = Number(maxPrice);
        const hasMinPrice = Number.isFinite(parsedMinPrice) && minPrice !== '';
        const hasMaxPrice = Number.isFinite(parsedMaxPrice) && maxPrice !== '';
        const filtered = products.filter((product) => {
          const categoryMatches = selectedType === 'all' || product.category === selectedType;
          const regionMatches = region === 'all' || product.region === region;
          const genderMatches = gender === 'all' || (product.gender ?? 'unisex') === gender;
          const minMatches = !hasMinPrice || Number(product.price) >= parsedMinPrice;
          const maxMatches = !hasMaxPrice || Number(product.price) <= parsedMaxPrice;
          return product.active &&
            categoryMatches &&
            regionMatches &&
            genderMatches &&
            minMatches &&
            maxMatches &&
            (!normalized || toCatalogueItemSearch(product, t).includes(normalized));
        });
        const sorted = sortCatalogueItems(filtered, sort, { start, end }, rentals);
        const offset = Math.max(0, (Number(page) || 1) - 1) * pageSize;
        assertActive(signal);
        return {
          items: sorted.slice(offset, offset + pageSize),
          total: sorted.length,
          page,
          pageSize,
          dates: { start, end },
        };
      },
    },

    availability: {
      async batch({ productIds = [], variantIds, start = defaultDates.start, end = defaultDates.end, signal }: AvailabilityBatchParams = {}) {
        assertActive(signal);
        const ids = [...new Set(productIds)].filter(Boolean);
        if (ids.length === 0) return [];

        const days = dayCount(start, end);
        if (days > MAX_PUBLIC_AVAILABILITY_DAYS) {
          throw new Error(`Availability window exceeds ${MAX_PUBLIC_AVAILABILITY_DAYS} days.`);
        }

        const key = cacheKey({ productIds: ids, variantIds, start, end });
        const cached = availabilityCache.get(key);
        if (cached && cached.expiresAt > Date.now()) return cached.rows;

        const { products, rentals } = getState();
        const selectedProducts = products.filter((product) => ids.includes(product.id));
        const selectedVariants = variantIds ? new Set(variantIds) : null;
        const rows: AvailabilityRow[] = [];

        for (let offset = 0; offset < days; offset += 1) {
          const date = addDays(start, offset);
          selectedProducts.forEach((product) => {
            const dayAvailability = getProductDayAvailability(product, date, rentals);
            dayAvailability.variants
              .filter((variant) => !selectedVariants || selectedVariants.has(variant.variantId))
              .forEach((variant) => {
                rows.push({
                  date,
                  productId: product.id,
                  variantId: variant.variantId,
                  total: variant.total,
                  booked: variant.booked,
                  available: variant.available,
                  state: variant.state,
                });
              });
          });
        }

        assertActive(signal);
        availabilityCache.set(key, { rows, expiresAt: Date.now() + PUBLIC_AVAILABILITY_TTL_MS });
        return rows;
      },

      clear() {
        availabilityCache.clear();
      },
    },

    requests: {
      async create({ values, cart, source = 'customer' }: { values: BookingValues; cart: CartItem[]; source?: 'customer' | 'staff' }) {
        const { rentals, requests } = getState();
        const latestRentals = mergeByReference(readStoredRentals(rentals), rentals);
        const latestRequests = mergeByReference(readStoredRequests(requests), requests);

        const createdByStaff = source === 'staff';
        const groupedCart = groupCartByDate(cart);
        const existingReferences = [...latestRentals, ...latestRequests];
        const createdRequests: RentalRequest[] = groupedCart.map((group, index) => {
          const reference = groupedCart.length === 1 ? nextReference(existingReferences) : nextReferenceAt(existingReferences, index + 1);
          const requestedItems = group.items.map(({ productId, variantId, qty }) => ({ productId, variantId, qty }));
          return {
            reference,
            sourceChannel: source,
            outcome: 'pending',
            customerName: values.name,
            phone: values.phone,
            email: values.email,
            paymentStatus: 'missing' as const,
            paymentMethod: 'bank_transfer' as const,
            fulfillment: values.fulfillment,
            start: group.start ?? defaultDates.start,
            end: group.end ?? defaultDates.end,
            pickupWindow: values.pickupWindow,
            returnWindow: values.returnWindow,
            deliveryWindow: values.deliveryWindow,
            address: values.address,
            notes: values.notes,
            internalNotes: groupedCart.length > 1
              ? locale === 'id'
                ? 'Pesanan pelanggan dipisah otomatis karena item memakai tanggal sewa berbeda.'
                : 'Customer order was split automatically because items use different rental dates.'
              : '',
            staleHours: 0,
            deliveryFee: 0,
            deliveryNotes: '',
            items: requestedItems,
            checklist: [
              { id: 'confirm-size', labelId: 'Konfirmasi ukuran', labelEn: 'Confirm size', done: false },
              { id: 'availability-check', labelId: 'Cek ketersediaan', labelEn: 'Availability check', done: false },
            ],
            activity: [
              {
                id: `a-${Date.now()}-${index}`,
                time: createdByStaff
                  ? locale === 'id' ? '28 Mei 2026 09.00' : 'May 28, 2026 09:00'
                  : locale === 'id' ? '27 Mei 2026 14.30' : 'May 27, 2026 14:30',
                textId: createdByStaff
                  ? 'Permintaan dibuat staf. Kanal sumber: Staff.'
                  : groupedCart.length > 1
                    ? 'Permintaan pelanggan dibuat dari pengiriman pesanan dan dipisah berdasarkan tanggal. Kanal sumber: Customer.'
                    : 'Permintaan pelanggan dibuat dari situs pelanggan. Kanal sumber: Customer.',
                textEn: createdByStaff
                  ? 'Request created by staff. Source channel: Staff.'
                  : groupedCart.length > 1
                    ? 'Customer request created from order submission and split by date. Source channel: Customer.'
                    : 'Customer request created from the customer site. Source channel: Customer.',
              },
            ],
          };
        });

        setRequests((current) => {
          const currentLatest = mergeByReference(readStoredRequests(current), current);
          const createdReferences = new Set(createdRequests.map((request) => request.reference));
          return [
            ...createdRequests,
            ...currentLatest.filter((request) => !createdReferences.has(request.reference)),
          ];
        });
        setClients((current) => createdRequests.reduce((nextClients, request) => upsertClient(nextClients, request), current));
        setNotifications((current) => [
          ...createdRequests.map((request) =>
            makeNotification({
              tone: 'warning',
              titleId: 'Permintaan baru masuk',
              titleEn: 'New request received',
              copyId: `${request.reference} menunggu ditinjau staf.`,
              copyEn: `${request.reference} is waiting for staff review.`,
              targetRoute: `/admin/requests/${encodeURIComponent(request.reference)}`,
            }),
          ),
          ...current,
        ]);
        availabilityCache.clear();
        return { request: createdRequests[0], requests: createdRequests };
      },

      async edit({ reference, values }) {
        const { requests } = getState();
        const latestRequests = mergeByReference(readStoredRequests(requests), requests);
        const result = editRequestDetails(latestRequests, reference, values);
        if (result.error) return { error: result.error };
        if (result.changed) {
          setRequests(result.requests);
          availabilityCache.clear();
        }
        return { ok: true, request: result.request };
      },

      async revise({ reference, itemOutcomes }) {
        const { requests } = getState();
        const latestRequests = mergeByReference(readStoredRequests(requests), requests);
        const result = reviseRequestOutcomes(latestRequests, reference, itemOutcomes, {
          balanceError: t('admin.requests.outcomeBalanceError'),
        });
        if (result.error) return { error: result.error };
        if (result.changed) {
          setRequests(result.requests);
          availabilityCache.clear();
        }
        return { ok: true, request: result.request };
      },

      async reject({ reference, reason }) {
        const { requests } = getState();
        const latestRequests = mergeByReference(readStoredRequests(requests), requests);
        const result = rejectRequest(latestRequests, reference, reason);
        if (result.error) return { error: result.error };
        if (result.changed) {
          setRequests(result.requests);
          availabilityCache.clear();
        }
        return { ok: true, request: result.request };
      },

      async accept({ reference }: { reference: string }) {
        const { products, rentals, requests } = getState();
        const latestRentals = mergeByReference(readStoredRentals(rentals), rentals);
        const latestRequests = mergeByReference(readStoredRequests(requests), requests);
        const request = latestRequests.find((entry) => entry.reference === reference);

        const rentalReference = nextReference([...latestRentals, ...latestRequests]);
        if (!request) return { error: 'Request is no longer pending.' };
        const result = acceptRequestIntoRental({
          request,
          products,
          rentals: latestRentals,
          rentalReference,
          t,
        });
        if (result.error) return { error: result.error };
        if (!result.request || !result.rental) return { error: 'Request could not be accepted.' };
        const acceptedRequest = result.request;
        const rental = result.rental;

        setRequests((current) => {
          const currentLatest = mergeByReference(readStoredRequests(current), current);
          return currentLatest.map((entry) => (entry.reference === request.reference ? acceptedRequest : entry));
        });
        setRentals((current) => {
          const currentLatest = mergeByReference(readStoredRentals(current), current);
          return [rental, ...currentLatest.filter((entry) => entry.reference !== rental.reference)];
        });
        setClients((current) => upsertClient(current, rental));
        availabilityCache.clear();
        return { ok: true, request: acceptedRequest, rental };
      },

      async change({ reference, customerName, phone, changeType, changeNotes }: { reference: string; customerName?: string; phone: string; changeType: string; changeNotes: string }) {
        setNotifications((current) => [
          makeNotification({
            tone: changeType === 'cancel' ? 'warning' : 'info',
            titleId: 'Pelanggan meminta perubahan pesanan',
            titleEn: 'Customer requested an order change',
            copyId: `${reference} - ${customerName || phone}: ${changeNotes || changeType}.`,
            copyEn: `${reference} - ${customerName || phone}: ${changeNotes || changeType}.`,
            targetRoute: `/admin/requests/${encodeURIComponent(reference)}`,
          }),
          ...current,
        ]);
        return { ok: true };
      },
    },

    lookup: {
      async recover({ phone, name, hint }: { phone: string; name?: string; hint?: string }) {
        const displayName = name?.trim() || t('customer.lookup.recoveryUnknownName');
        const normalizedPhone = normalizePhone(phone);
        setNotifications((current) => [
          makeNotification({
            tone: 'info',
            titleId: 'Pelanggan butuh bantuan kode',
            titleEn: 'Customer needs reference help',
            copyId: `${displayName} meminta bantuan mencari kode untuk ${phone}${hint ? ` (${hint})` : ''}.`,
            copyEn: `${displayName} asked for reference help for ${phone}${hint ? ` (${hint})` : ''}.`,
            targetRoute: `/admin/clients?phone=${encodeURIComponent(normalizedPhone)}`,
          }),
          ...current,
        ]);
        return { ok: true };
      },
    },

    admin: {
      products: {
        async save(product: Product) {
          setProducts((current) => current.map((entry) => (entry.id === product.id ? product : entry)));
          availabilityCache.clear();
          return { ok: true, product };
        },
      },
      rentals: {
        async save(rental: Rental) {
          setRentals((current) => current.map((entry) => (entry.reference === rental.reference ? rental : entry)));
          availabilityCache.clear();
          return { ok: true, rental };
        },
      },
      clients: {
        async save(client: Client) {
          setClients((current) => current.map((entry) => (entry.id === client.id ? client : entry)));
          return { ok: true, client };
        },
      },
      settings: {
        async save(settings: Settings) {
          setSettings(settings);
          return { ok: true, settings };
        },
      },
    },
  };
}
