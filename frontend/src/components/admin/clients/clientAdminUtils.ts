import { normalizePhone } from '../../../lib/rental-utils';
import type { Rental, TFunction } from '../../../types/domain';

export type NewClientDraft = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export type ClientRentalSummary = {
  totalRentals: number;
  activeCount: number;
  overdueCount: number;
  latestLifecycle?: Rental['lifecycle'];
};

export type ClientStatus = {
  label: string;
  tone: 'info' | 'warning';
};

export type PhoneDestination = 'whatsapp' | 'call';

export function getClientStatus(summary: ClientRentalSummary | undefined, t: TFunction): ClientStatus | null {
  if (!summary) return null;
  if (summary.overdueCount > 0) {
    return {
      tone: 'warning',
      label: summary.overdueCount > 1 ? `${t('admin.clients.status.overdue')} (${summary.overdueCount})` : t('admin.clients.status.overdue'),
    };
  }
  if (summary.activeCount > 0) {
    return {
      tone: 'info',
      label: summary.activeCount > 1 ? `${t('admin.clients.status.active')} (${summary.activeCount})` : t('admin.clients.status.active'),
    };
  }
  return null;
}

export function phoneHref(phone: string, destination: PhoneDestination) {
  const normalized = normalizePhone(phone);
  if (destination === 'whatsapp' && normalized) return `https://wa.me/${normalized}`;
  if (normalized) return `tel:+${normalized}`;
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function groupHistoryByLifecycle(history: Rental[]) {
  return history.reduce<Array<{ lifecycle: Rental['lifecycle']; rentals: Rental[] }>>((groups, rental) => {
    const existing = groups.find((group) => group.lifecycle === rental.lifecycle);
    if (existing) {
      existing.rentals.push(rental);
      return groups;
    }
    return [...groups, { lifecycle: rental.lifecycle, rentals: [rental] }];
  }, []);
}

export function clientInitials(name = ''): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'C'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
