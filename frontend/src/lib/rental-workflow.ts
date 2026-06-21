import {
  activityText,
  appendActivity,
  applyItemHoldDelta,
  hasRentalChanged,
  shouldReleaseHold,
} from './rental-utils';
import type {
  ActivityItem,
  Product,
  Rental,
  RentalLifecycle,
} from '../types/domain';

export type RentalActivity = Omit<ActivityItem, 'id' | 'time'>;
export type RentalPatch = Partial<Rental>;
export type RentalUpdater = RentalPatch | ((rental: Rental) => Rental);
export type RentalPaymentProof = NonNullable<Rental['paymentProof']>;

export type PaymentDeliveryUpdate = Pick<
  Rental,
  | 'paymentMethod'
  | 'deliveryFee'
  | 'fulfillment'
  | 'address'
  | 'pickupWindow'
  | 'deliveryWindow'
  | 'returnWindow'
  | 'deliveryNotes'
>;

type LifecycleMutationGuard = {
  reference: string;
  at: number;
};

type RentalWorkflowHost = {
  getRentals: () => Rental[];
  getProducts: () => Product[];
  setRentals: (rentals: Rental[]) => void;
  setProducts: (products: Product[]) => void;
  getLifecycleMutation: () => LifecycleMutationGuard;
  setLifecycleMutation: (guard: LifecycleMutationGuard) => void;
  now?: () => number;
};

export type RentalWorkflowCommands = {
  transitionLifecycle: (reference: string, lifecycle: RentalLifecycle) => void;
  overrideLifecycle: (reference: string, lifecycle: RentalLifecycle, reason: string) => void;
  savePaymentDelivery: (reference: string, values: PaymentDeliveryUpdate) => void;
  toggleChecklistItem: (reference: string, itemId: string) => void;
  attachPaymentProof: (reference: string, proof: RentalPaymentProof) => void;
  verifyPaymentProof: (reference: string) => void;
  rejectPaymentProof: (reference: string, reason: string) => void;
};

type RentalWorkflowUpdateInput = {
  rentals: Rental[];
  products: Product[];
  reference: string;
  updater: RentalUpdater;
  activity?: RentalActivity;
  lifecycleMutation: LifecycleMutationGuard;
  now: number;
  duplicateLifecycleWindowMs?: number;
};

type RentalWorkflowUpdateResult = {
  rentals: Rental[];
  products: Product[];
  rental?: Rental;
  changed: boolean;
  productsChanged: boolean;
  lifecycleMutation?: LifecycleMutationGuard;
};

export function createRentalWorkflow({
  getRentals,
  getProducts,
  setRentals,
  setProducts,
  getLifecycleMutation,
  setLifecycleMutation,
  now = () => Date.now(),
}: RentalWorkflowHost): RentalWorkflowCommands {
  const commit = (reference: string, updater: RentalUpdater, activity?: RentalActivity) => {
    const result = applyRentalWorkflowUpdate({
      rentals: getRentals(),
      products: getProducts(),
      reference,
      updater,
      activity,
      lifecycleMutation: getLifecycleMutation(),
      now: now(),
    });

    if (!result.changed) return;
    if (result.lifecycleMutation) setLifecycleMutation(result.lifecycleMutation);
    if (result.productsChanged) setProducts(result.products);
    setRentals(result.rentals);
  };

  return {
    transitionLifecycle(reference, lifecycle) {
      commit(reference, { lifecycle }, rentalLifecycleActivity(lifecycle));
    },
    overrideLifecycle(reference, lifecycle, reason) {
      commit(
        reference,
        { lifecycle, internalNotes: reason },
        activityText(`Koreksi admin: ${reason}`, `Admin correction: ${reason}`),
      );
    },
    savePaymentDelivery(reference, values) {
      commit(reference, values, activityText('Detail pembayaran dan ambil/antar diperbarui.', 'Payment and fulfillment details updated.'));
    },
    toggleChecklistItem(reference, itemId) {
      commit(
        reference,
        (rental) => ({
          ...rental,
          checklist: rental.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
        }),
        activityText('Daftar cek diperbarui.', 'Checklist updated.'),
      );
    },
    attachPaymentProof(reference, proof) {
      commit(
        reference,
        {
          paymentStatus: 'attached',
          paymentProof: proof,
        },
        activityText('Bukti bayar diunggah.', 'Payment proof uploaded.'),
      );
    },
    verifyPaymentProof(reference) {
      commit(reference, { paymentStatus: 'verified' }, activityText('Bukti bayar diverifikasi.', 'Payment proof verified.'));
    },
    rejectPaymentProof(reference, reason) {
      commit(
        reference,
        (rental) => ({
          ...rental,
          paymentStatus: 'rejected',
          internalNotes: rental.internalNotes ? `${rental.internalNotes}\n${reason}` : reason,
        }),
        activityText(`Bukti bayar ditolak: ${reason}`, `Payment proof rejected: ${reason}`),
      );
    },
  };
}

export function applyRentalWorkflowUpdate({
  rentals,
  products,
  reference,
  updater,
  activity,
  lifecycleMutation,
  now,
  duplicateLifecycleWindowMs = 650,
}: RentalWorkflowUpdateInput): RentalWorkflowUpdateResult {
  const existing = rentals.find((rental) => rental.reference === reference);
  if (!existing) return { rentals, products, changed: false, productsChanged: false };

  const preview: Rental = typeof updater === 'function' ? updater(existing) : { ...existing, ...updater };
  if (!hasRentalChanged(existing, preview)) {
    return { rentals, products, rental: existing, changed: false, productsChanged: false };
  }

  const lifecycleChanged = existing.lifecycle !== preview.lifecycle;
  if (lifecycleChanged && lifecycleMutation.reference === reference && now - lifecycleMutation.at < duplicateLifecycleWindowMs) {
    return { rentals, products, rental: existing, changed: false, productsChanged: false };
  }

  const nextProducts = shouldReleaseHold(existing.lifecycle, preview.lifecycle)
    ? applyItemHoldDelta(products, existing.items, -1)
    : products;
  const nextRental = activity ? appendActivity(preview, activity) : preview;

  return {
    rentals: rentals.map((rental) => (rental.reference === reference ? nextRental : rental)),
    products: nextProducts,
    rental: nextRental,
    changed: true,
    productsChanged: nextProducts !== products,
    lifecycleMutation: lifecycleChanged ? { reference, at: now } : undefined,
  };
}

export function rentalLifecycleActivity(lifecycle: RentalLifecycle): RentalActivity {
  if (lifecycle === 'ready_pickup') return activityText('Barang siap diambil.', 'Items marked ready.');
  if (lifecycle === 'out_delivery' || lifecycle === 'on_rent') return activityText('Barang keluar ke pelanggan.', 'Items released to customer.');
  if (lifecycle === 'returned') return activityText('Barang sudah kembali.', 'Items marked returned.');
  if (lifecycle === 'completed') return activityText('Sewa selesai.', 'Rental completed.');
  if (lifecycle === 'preparing') return activityText('Status dikoreksi ke persiapan.', 'Status corrected to preparing.');
  return activityText('Status pesanan dikoreksi.', 'Rental status corrected.');
}

export const RentalWorkflow = {
  applyRentalWorkflowUpdate,
  createRentalWorkflow,
  rentalLifecycleActivity,
};
