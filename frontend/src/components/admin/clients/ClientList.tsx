import { type MouseEvent } from 'react';
import { ChevronRight, Clock3, MessageCircle, Phone, Search } from 'lucide-react';
import { EmptyState, EntityCard, EntityList } from '../../shared';
import type { Client, TFunction } from '../../../types/domain';
import {
  clientInitials,
  getClientStatus,
  phoneHref,
  type ClientRentalSummary,
  type ClientStatus,
  type PhoneDestination,
} from './clientAdminUtils';

type ClientListProps = {
  clients: Client[];
  selectedId?: string;
  summariesByClientId: Record<string, ClientRentalSummary>;
  t: TFunction;
  onView: (clientId: string) => void;
};

export function ClientList({ clients, selectedId, summariesByClientId, t, onView }: ClientListProps) {
  return (
    <EntityList className="management-list padded client-directory-list">
      {clients.length === 0 ? (
        <EmptyState title={t('admin.clients.emptyTitle')} copy={t('admin.clients.emptyCopy')} icon={Search} />
      ) : (
        clients.map((client) => {
          const summary = summariesByClientId[client.id];
          const selected = selectedId === client.id;
          const openLabel = `${t('admin.clients.openDetail')} ${client.name}`;

          return (
            <EntityCard
              as="article"
              className={`management-card client-card ${selected ? 'selected' : ''}`}
              selected={selected}
              aria-current={selected ? 'true' : undefined}
              key={client.id}
              avatar={(
                <span className="client-avatar" aria-hidden="true">
                  <span>{clientInitials(client.name)}</span>
                </span>
              )}
              meta={<ClientCardMeta client={client} summary={summary} t={t} />}
              actions={(
                <button className="icon-button client-card-detail-action" type="button" aria-label={openLabel} onClick={() => onView(client.id)}>
                  <ChevronRight aria-hidden="true" />
                </button>
              )}
            >
              <div className="client-card-main">
                <button className="client-card-name" type="button" aria-label={openLabel} onClick={() => onView(client.id)}>
                  <strong>{client.name}</strong>
                </button>
                <PhoneLink phone={client.phone} destination="whatsapp" />
              </div>
            </EntityCard>
          );
        })
      )}
    </EntityList>
  );
}

type ClientCardMetaProps = {
  client: Client;
  summary?: ClientRentalSummary;
  t: TFunction;
};

function ClientCardMeta({ client, summary, t }: ClientCardMetaProps) {
  const clientStatus = getClientStatus(summary, t);
  const totalRentals = summary?.totalRentals ?? client.totalRentals;

  return (
    <div className="client-card-meta">
      <span>
        {t('admin.clients.totalRentals')}: <strong>{totalRentals}</strong>
      </span>
      {clientStatus ? <ClientStatusBadge status={clientStatus} /> : null}
    </div>
  );
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`status-badge ${status.tone}`}>
      <Clock3 aria-hidden="true" />
      <span className="status-badge-label">{status.label}</span>
    </span>
  );
}

type PhoneLinkProps = {
  phone: string;
  destination?: PhoneDestination;
};

function PhoneLink({ phone, destination = 'whatsapp' }: PhoneLinkProps) {
  const visiblePhone = String(phone ?? '').trim();
  if (!visiblePhone) return <span>-</span>;

  const href = phoneHref(visiblePhone, destination);
  const destinationLabel = destination === 'whatsapp' ? 'WhatsApp' : 'Call';
  const Icon = destination === 'whatsapp' ? MessageCircle : Phone;

  return (
    <a
      className="phone-link"
      href={href}
      target={destination === 'whatsapp' ? '_blank' : undefined}
      rel={destination === 'whatsapp' ? 'noreferrer' : undefined}
      aria-label={`${destinationLabel} ${visiblePhone}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
    >
      <Icon aria-hidden="true" />
      <span>{visiblePhone}</span>
    </a>
  );
}
