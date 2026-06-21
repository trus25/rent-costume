import type { LucideIcon } from 'lucide-react';
import type {
  FulfillmentMethod,
  PaymentMethod,
  RentalLifecycle,
  Tone,
} from '../../../types/domain';

export type RentalFilter = 'all' | 'ready' | 'on_rent' | 'returned' | 'inspected' | 'completed';

export type RentalTransitionAction = {
  key: string;
  lifecycle?: RentalLifecycle;
  title?: string;
  copy?: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
  tone?: Tone;
  onClick: () => void;
};

export type NextRentalAction = Omit<RentalTransitionAction, 'key'> & {
  title: string;
  copy: string;
};

export type PaymentDeliveryDraft = {
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  fulfillment: FulfillmentMethod;
  address: string;
  pickupWindow: string;
  deliveryWindow: string;
  returnWindow: string;
  deliveryNotes: string;
};
