import {
  BadgeCheck,
  CheckCircle,
  ClipboardList,
  Clock,
  CircleSlash,
  LayoutDashboard,
  LoaderCircle,
  PackageCheck,
  RotateCcw,
  SlidersHorizontal,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentStatus, ProductAvailabilityState, RentalLifecycle, Tone } from '../types/domain';

export type AdminSectionId = 'requests' | 'rentals' | 'catalogue' | 'clients' | 'settings';

export const lifecycleTone: Record<RentalLifecycle, Tone> = {
  requested: 'warning',
  confirmed: 'success',
  preparing: 'info',
  ready_pickup: 'info',
  out_delivery: 'info',
  on_rent: 'warning',
  returned: 'success',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

export const lifecycleIcon: Record<RentalLifecycle, LucideIcon> = {
  requested: Clock,
  confirmed: CheckCircle,
  preparing: LoaderCircle,
  ready_pickup: PackageCheck,
  out_delivery: Truck,
  on_rent: Truck,
  returned: RotateCcw,
  completed: BadgeCheck,
  rejected: XCircle,
  cancelled: XCircle,
};

export const paymentTone: Record<PaymentStatus, Tone> = {
  missing: 'danger',
  attached: 'info',
  verified: 'success',
  rejected: 'danger',
};

export const availabilityIcon: Partial<Record<ProductAvailabilityState, LucideIcon>> = {
  available: CheckCircle,
  limited: Clock,
  partially_booked: Clock,
  full: CircleSlash,
  fully_booked: CircleSlash,
  unavailable: XCircle,
};

export type AdminNavItem = {
  id: AdminSectionId;
  key: string;
  mobileKey: string;
  icon: LucideIcon;
  path: string;
};

export const adminNav: AdminNavItem[] = [
  { id: 'requests', key: 'admin.nav.requests', mobileKey: 'admin.nav.short.requests', icon: ClipboardList, path: '/admin/requests' },
  { id: 'rentals', key: 'admin.nav.rentals', mobileKey: 'admin.nav.short.rentals', icon: PackageCheck, path: '/admin/rentals' },
  { id: 'catalogue', key: 'admin.nav.catalogue', mobileKey: 'admin.nav.short.catalogue', icon: LayoutDashboard, path: '/admin/catalogue' },
  { id: 'clients', key: 'admin.nav.clients', mobileKey: 'admin.nav.short.clients', icon: Users, path: '/admin/clients' },
  { id: 'settings', key: 'admin.nav.settings', mobileKey: 'admin.nav.short.settings', icon: SlidersHorizontal, path: '/admin/settings' },
];
