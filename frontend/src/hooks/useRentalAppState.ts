import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from './useI18n';
import { usePersistentState } from './usePersistentState';
import { createLocalDataAdapter } from '../lib/data-adapter';
import { normalizeProductContent, stableJson } from '../lib/product-content';
import { getVariantAvailability } from '../lib/availability';
import { getCartItems } from '../lib/rental-utils';
import {
  defaultDates,
  initialClients,
  initialNotifications,
  initialProducts,
  initialRequests,
  initialRentals,
  initialSettings,
  normalizeHomeContent,
} from '../mockData';
import type { AppState } from '../types/app';
import type { BookingValues, CartItem, DateRange, Product, Rental, RentalRequest, StaffSession } from '../types/domain';

const defaultStaffSession: StaffSession = {
  isAuthenticated: false,
  username: '',
};

const defaultCart: CartItem[] = [
  { productId: 'batik', variantId: 'M', qty: 1, start: defaultDates.start, end: defaultDates.end },
  { productId: 'melayu', variantId: 'L', qty: 1, start: defaultDates.start, end: defaultDates.end },
];

export function useRentalAppState() {
  const i18n = useI18n();
  const [products, setProducts] = usePersistentState('cr-v2-products', initialProducts);
  const [rentals, setRentals] = usePersistentState('cr-v2-rentals', initialRentals);
  const [requests, setRequests] = usePersistentState('cr-v2-requests', initialRequests);
  const [clients, setClients] = usePersistentState('cr-v2-clients', initialClients);
  const [notifications, setNotifications] = usePersistentState('cr-v2-notifications', initialNotifications);
  const [settings, setSettings] = usePersistentState('cr-v2-settings-v2', initialSettings);
  const [staffSession, setStaffSession] = usePersistentState('cr-v2-staff-session', defaultStaffSession);
  const [cart, setCart] = usePersistentState('cr-v2-request-cart', defaultCart);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<RentalRequest | null>(null);

  useEffect(() => {
    setProducts((current) => mergeInitialProducts(current));
  }, [setProducts]);

  useEffect(() => {
    setSettings((current) => {
      const normalizedHomeContent = normalizeHomeContent(current.homeContent);
      if (stableJson(current.homeContent) === stableJson(normalizedHomeContent)) return current;
      const next = { ...current, homeContent: normalizedHomeContent };
      return next;
    });
  }, [setSettings]);

  const safeStaffSession: StaffSession =
    staffSession && typeof staffSession === 'object'
      ? { isAuthenticated: Boolean(staffSession.isAuthenticated), username: typeof staffSession.username === 'string' ? staffSession.username : '' }
      : defaultStaffSession;

  const cartItems = useMemo(() => getCartItems(cart, products), [cart, products]);
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.qty, 0),
    [cartItems],
  );
  const dataAdapter = useMemo(
    () => createLocalDataAdapter({
      getState: () => ({ products, rentals, requests, clients, notifications, settings }),
      setProducts,
      setRentals,
      setRequests,
      setClients,
      setNotifications,
      setSettings,
      t: i18n.t,
      locale: i18n.locale,
    }),
    [clients, i18n.locale, i18n.t, notifications, products, rentals, requests, settings, setClients, setNotifications, setProducts, setRentals, setRequests, setSettings],
  );

  const addCartItem = useCallback((product: Product, variantId: string, dates: DateRange, availability: number) => {
    setSubmittedRequest(null);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.variantId === variantId);
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, qty: Math.min(item.qty + 1, availability), start: dates.start, end: dates.end } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          variantId,
          qty: 1,
          start: dates.start,
          end: dates.end,
        },
      ];
    });
  }, [setCart]);

  const updateCartQty = useCallback((target: CartItem, delta: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.productId !== target.productId || item.variantId !== target.variantId) return item;
          const product = products.find((entry) => entry.id === item.productId);
          const max = product ? Math.max(1, getVariantAvailability(product, item.variantId, { start: item.start, end: item.end }, rentals)) : 1;
          return { ...item, qty: Math.max(1, Math.min(max, item.qty + delta)) };
        })
        .filter((item) => item.qty > 0),
    );
  }, [products, rentals, setCart]);

  const removeCartItem = useCallback((target: CartItem) => {
    setCart((current) => current.filter((item) => item.productId !== target.productId || item.variantId !== target.variantId));
  }, [setCart]);

  const createBooking = useCallback(async (values: BookingValues) => {
    const result = await dataAdapter.requests.create({ values, cart });
    if (result?.request) {
      const createdRequests = result.requests ?? [result.request];
      setSubmittedRequest(
        createdRequests.length > 1
          ? { ...result.request, groupedReferences: createdRequests.map((request) => request.reference) }
          : result.request,
      );
      setCart([]);
    }
    return result;
  }, [cart, dataAdapter, setCart]);

  const openRequestSheet = useCallback(() => setRequestSheetOpen(true), []);

  const appState: AppState = useMemo(() => ({
    ...i18n,
    products,
    setProducts,
    rentals,
    requests,
    setRequests,
    setRentals,
    clients,
    setClients,
    notifications,
    setNotifications,
    settings,
    setSettings,
    staffSession: safeStaffSession,
    setStaffSession,
    cart,
    setCart,
    addCartItem,
    onOpenCart: openRequestSheet,
    dataAdapter,
  }), [
    addCartItem,
    cart,
    clients,
    dataAdapter,
    i18n,
    notifications,
    openRequestSheet,
    products,
    rentals,
    requests,
    safeStaffSession,
    setCart,
    setClients,
    setNotifications,
    setProducts,
    setRequests,
    setRentals,
    setSettings,
    setStaffSession,
    settings,
  ]);

  return {
    appState,
    cartCount: cart.length,
    cartItems,
    cartTotal,
    createBooking,
    removeCartItem,
    requestSheetOpen,
    setRequestSheetOpen,
    submittedRequest,
    updateCartQty,
  };
}

function mergeInitialProducts(current: Product[]) {
  const byId = new Map(current.map((product) => [product.id, product]));
  let changed = false;
  const normalized = current.map((product) => {
    const initialProduct = initialProducts.find((entry) => entry.id === product.id);
    const nextProduct = normalizeProductContent(product, initialProduct);
    if (stableJson(nextProduct) !== stableJson(product)) changed = true;
    return nextProduct;
  });
  const missing = initialProducts.filter((product) => !byId.has(product.id)).map((product) => normalizeProductContent(product, product));
  if (missing.length > 0) changed = true;
  return changed ? [...normalized, ...missing] : current;
}
