export type Locale = 'id' | 'en';

export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export type TFunction = (key: string, params?: TranslationParams) => string;

export type LocalizedContent =
  | string
  | {
      sourceLocale?: Locale | string;
      source?: string;
      translations?: Record<string, string>;
    };

export type DateRange = {
  start: string;
  end: string;
};

export type ProductAvailabilityState =
  | 'available'
  | 'limited'
  | 'full'
  | 'partially_booked'
  | 'fully_booked'
  | 'unavailable';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

export type ProductImage = {
  id: string;
  src: string;
  alt: string;
  label: string;
  isCover: boolean;
  image?: string;
};

export type ProductVariant = {
  id: string;
  label: string;
  total: number | '';
  held: number;
  notes?: LocalizedContent;
  notesId?: string;
  notesEn?: string;
};

export type MaintenanceBlock = DateRange & {
  id?: string;
  reason?: string;
};

export type Product = {
  id: string;
  image: string;
  images?: Array<ProductImage | string>;
  category: string;
  region: string;
  gender?: string;
  active: boolean;
  name: LocalizedContent;
  meta: LocalizedContent;
  unitKey: string;
  alt?: LocalizedContent;
  price: number | '';
  availability?: ProductAvailabilityState;
  description?: LocalizedContent;
  variants: ProductVariant[];
  maintenanceBlocks: MaintenanceBlock[];
  descriptionId?: string;
  descriptionEn?: string;
  bundleId?: string;
  bundleEn?: string;
  measurementId?: string;
  measurementEn?: string;
  variantNotesId?: string;
  variantNotesEn?: string;
  nameId?: string;
  nameEn?: string;
  nameKey?: string;
  metaId?: string;
  metaEn?: string;
  metaKey?: string;
  altId?: string;
  altEn?: string;
  altKey?: string;
  copyKey?: string;
  detailAriaKey?: string;
  detailAria?: string;
  priceKey?: string;
};

export type CartItem = DateRange & {
  productId: string;
  variantId: string;
  qty: number;
};

export type CartLineItem = CartItem & {
  product: Product;
};

export type RentalItem = {
  productId: string;
  variantId: string;
  qty: number;
};

export type RequestItemOutcome = {
  requestedProductId: string;
  requestedVariantId: string;
  requestedQty: number;
  acceptedQty: number;
  substitutedQty: number;
  removedByCustomerQty: number;
  unfulfilledStockoutQty: number;
  substituteProductId?: string;
  substituteVariantId?: string;
};

export type RentalLifecycle =
  | 'confirmed'
  | 'preparing'
  | 'ready_pickup'
  | 'out_delivery'
  | 'on_rent'
  | 'returned'
  | 'inspected'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'missing' | 'attached' | 'verified' | 'rejected';

export type PaymentMethod = 'bank_transfer' | 'qris' | 'cash' | 'other';

export type FulfillmentMethod = 'pickup' | 'delivery';

export type ChecklistItem = {
  id: string;
  labelId: string;
  labelEn: string;
  done: boolean;
};

export type ActivityItem = {
  id: string;
  time: string;
  textId: string;
  textEn: string;
};

export type RequestOutcome = 'pending' | 'accepted' | 'rejected';

export type RentalRequest = DateRange & {
  reference: string;
  sourceChannel: 'customer' | 'staff';
  outcome: RequestOutcome;
  acceptedRentalReference?: string;
  customerName: string;
  phone: string;
  email: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fulfillment: FulfillmentMethod;
  pickupWindow: string;
  returnWindow: string;
  deliveryWindow: string;
  address: string;
  notes: string;
  internalNotes: string;
  staleHours: number;
  deliveryFee: number;
  deliveryNotes: string;
  items: RentalItem[];
  itemOutcomes?: RequestItemOutcome[];
  checklist: ChecklistItem[];
  activity: ActivityItem[];
  groupedReferences?: string[];
};

export type Rental = DateRange & {
  reference: string;
  sourceChannel?: 'customer' | 'staff';
  sourceRequestReference?: string;
  customerName: string;
  phone: string;
  email: string;
  lifecycle: RentalLifecycle;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fulfillment: FulfillmentMethod;
  pickupWindow: string;
  returnWindow: string;
  deliveryWindow: string;
  address: string;
  notes: string;
  internalNotes: string;
  staleHours: number;
  deliveryFee: number;
  deliveryNotes: string;
  items: RentalItem[];
  checklist: ChecklistItem[];
  activity: ActivityItem[];
  paymentProofName?: string;
  paymentProofSize?: number;
  paymentProofUploadedAt?: string;
  paymentVerifiedAt?: string;
  paymentProof?: {
    name: string;
    size: number;
    type: string;
    dataUrl: string;
    uploadedAt: string;
  };
  groupedReferences?: string[];
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalRentals: number;
  lastContact: string;
  notes: string;
};

export type Notification = {
  id: string;
  tone: Tone;
  titleId: string;
  titleEn: string;
  copyId: string;
  copyEn: string;
  targetRoute: string;
  resolved?: boolean;
};

export type HomeArticle = {
  label: LocalizedContent;
  title: LocalizedContent;
  copy: LocalizedContent;
};

export type HomeTestimonial = {
  quote: LocalizedContent;
  name: LocalizedContent;
  photoUrl: string;
};

export type HomeContent = {
  heroImageUrl: string;
  heroImageAlt: LocalizedContent;
  heroKicker: LocalizedContent;
  heroTitle: LocalizedContent;
  heroCopy: LocalizedContent;
  catalogueKicker: LocalizedContent;
  catalogueTitle: LocalizedContent;
  catalogueCopy: LocalizedContent;
  articlesKicker: LocalizedContent;
  articlesTitle: LocalizedContent;
  testimonialsKicker: LocalizedContent;
  testimonialsTitle: LocalizedContent;
  locationTitle: LocalizedContent;
  locationAddress: LocalizedContent;
  locationMapEmbed: string;
  locationMapUrl: string;
  articles: HomeArticle[];
  testimonials: HomeTestimonial[];
};

export type Settings = {
  brandName: string;
  customerTaglineKey: string;
  staffTaglineKey: string;
  customerTaglineCustom: string;
  staffTaglineCustom: string;
  defaultLocale: Locale;
  policyKey: string;
  policy: string;
  publicCatalogue: boolean;
  requireVerifiedProof: boolean;
  homeContent: HomeContent;
};

export type StaffSession = {
  isAuthenticated: boolean;
  username: string;
};

export type BookingValues = {
  name: string;
  phone: string;
  email: string;
  fulfillment: FulfillmentMethod;
  pickupWindow: string;
  returnWindow: string;
  deliveryWindow: string;
  address: string;
  notes: string;
};

export type LookupChangeValues = {
  reference: string;
  phone: string;
  changeType: string;
  changeNotes: string;
};

export type AvailabilityRow = {
  date: string;
  productId: string;
  variantId: string;
  total: number;
  booked: number;
  available: number;
  state: ProductAvailabilityState;
};

export type ProductDayAvailability = Omit<AvailabilityRow, 'variantId'> & {
  variants: Array<AvailabilityRow & { label: string }>;
};

export type CatalogueListParams = Partial<DateRange> & {
  q?: string;
  category?: string;
  region?: string;
  type?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};

export type CatalogueListResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  dates: DateRange;
};

export type AvailabilityBatchParams = Partial<DateRange> & {
  productIds?: string[];
  variantIds?: string[];
  signal?: AbortSignal;
};

export type RequestCreateResult = {
  request?: RentalRequest;
  requests?: RentalRequest[];
  error?: string;
};

export type RequestAcceptResult = {
  ok?: true;
  request?: RentalRequest;
  rental?: Rental;
  error?: string;
};

export type RequestDetailsUpdateValues = Partial<Pick<
  RentalRequest,
  | 'customerName'
  | 'phone'
  | 'email'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'fulfillment'
  | 'start'
  | 'end'
  | 'pickupWindow'
  | 'returnWindow'
  | 'deliveryWindow'
  | 'address'
  | 'notes'
  | 'internalNotes'
  | 'staleHours'
  | 'deliveryFee'
  | 'deliveryNotes'
>>;

export type RequestMutationResult = {
  ok?: true;
  request?: RentalRequest;
  error?: string;
};

export type DataAdapter = {
  catalogue: {
    list(params?: CatalogueListParams): Promise<CatalogueListResult>;
  };
  availability: {
    batch(params?: AvailabilityBatchParams): Promise<AvailabilityRow[]>;
    clear(): void;
  };
  requests: {
    create(input: { values: BookingValues; cart: CartItem[]; source?: 'customer' | 'staff' }): Promise<RequestCreateResult>;
    edit(input: { reference: string; values: RequestDetailsUpdateValues }): Promise<RequestMutationResult>;
    revise(input: { reference: string; itemOutcomes: RequestItemOutcome[] }): Promise<RequestMutationResult>;
    reject(input: { reference: string; reason: string }): Promise<RequestMutationResult>;
    accept(input: { reference: string }): Promise<RequestAcceptResult>;
    change(input: { reference: string; customerName?: string; phone: string; changeType: string; changeNotes: string }): Promise<{ ok: true }>;
  };
  lookup: {
    recover(input: { phone: string; name?: string; hint?: string }): Promise<{ ok: true }>;
  };
  admin: {
    products: {
      save(product: Product): Promise<{ ok: true; product: Product }>;
    };
    rentals: {
      save(rental: Rental): Promise<{ ok: true; rental: Rental }>;
    };
    clients: {
      save(client: Client): Promise<{ ok: true; client: Client }>;
    };
    settings: {
      save(settings: Settings): Promise<{ ok: true; settings: Settings }>;
    };
  };
};
