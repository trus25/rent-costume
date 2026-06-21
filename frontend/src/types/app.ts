import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import type {
  CartItem,
  CartLineItem,
  Client,
  DataAdapter,
  DateRange,
  Locale,
  Notification,
  Product,
  Rental,
  RentalRequest,
  Settings,
  StaffSession,
  TFunction,
} from './domain';

export type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type I18nState = {
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
};

export type AppState = I18nState & {
  products: Product[];
  setProducts: StateSetter<Product[]>;
  rentals: Rental[];
  setRentals: StateSetter<Rental[]>;
  requests: RentalRequest[];
  setRequests: StateSetter<RentalRequest[]>;
  clients: Client[];
  setClients: StateSetter<Client[]>;
  notifications: Notification[];
  setNotifications: StateSetter<Notification[]>;
  settings: Settings;
  setSettings: StateSetter<Settings>;
  staffSession: StaffSession;
  setStaffSession: StateSetter<StaffSession>;
  cart: CartItem[];
  setCart: StateSetter<CartItem[]>;
  addCartItem: (product: Product, variantId: string, dates: DateRange, availability: number) => void;
  onOpenCart: () => void;
  dataAdapter: DataAdapter;
};

export type CustomerPageProps = AppState;

export type AdminPageProps = AppState;

export type CheckoutProps = {
  cartItems: CartLineItem[];
  cartTotal: number;
  cartCount: number;
  onQty: (target: CartItem, delta: number) => void;
  onRemove: (target: CartItem) => void;
};

export type ChildrenProps = {
  children?: ReactNode;
};

export type InputRef = RefObject<HTMLInputElement | null>;
