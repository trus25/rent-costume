import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AdminCreateAction,
  AdminCreateFab,
  AdminListWindow,
  AdminViewBar,
} from '../../components/admin/common/AdminManagement';
import { ClientCreatePanel } from '../../components/admin/clients/ClientCreatePanel';
import { ClientDeleteConfirmSheet } from '../../components/admin/clients/ClientDeleteConfirmSheet';
import { ClientDetailPanel } from '../../components/admin/clients/ClientDetailPanel';
import { ClientList } from '../../components/admin/clients/ClientList';
import {
  type ClientRentalSummary,
  type NewClientDraft,
} from '../../components/admin/clients/clientAdminUtils';
import { SearchInput } from '../../components/shared';
import { adminDetailPath, adminListPath, adminNewPath, type AdminSubroute } from '../../lib/admin-routes';
import { BLOCKING_LIFECYCLES, normalizePhone } from '../../lib/rental-utils';
import { resetMobileDetailScroll } from '../../lib/mobile-detail';
import type { StateSetter } from '../../types/app';
import type { Client, DataAdapter, Locale, Product, Rental, TFunction } from '../../types/domain';

type ClientsAdminProps = {
  t: TFunction;
  locale: Locale;
  clients: Client[];
  setClients: StateSetter<Client[]>;
  rentals: Rental[];
  products: Product[];
  dataAdapter?: DataAdapter;
  route: AdminSubroute;
};

export default function ClientsAdmin({ t, locale, clients, setClients, rentals, products, dataAdapter, route }: ClientsAdminProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const listPath = adminListPath('clients', location.search);
  const detailClientId = route.kind === 'detail' ? route.id : undefined;
  const [query, setQuery] = useState(searchParams.get('phone') ?? '');
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<NewClientDraft>({ name: '', phone: '', email: '', notes: '' });
  const [draft, setDraft] = useState<Client | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const normalizedQuery = normalizePhone(query);
  const visibleQuery = query.trim().toLowerCase();
  const summariesByClientId = useMemo(() => buildClientSummaries(clients, rentals), [clients, rentals]);
  const filtered = useMemo(() => clients.filter((client) => {
    const visiblePhone = String(client.phone ?? '').toLowerCase();
    const normalizedPhone = normalizePhone(client.phone);
    return (
      !visibleQuery ||
      client.name.toLowerCase().includes(visibleQuery) ||
      visiblePhone.includes(visibleQuery) ||
      (normalizedQuery.length > 0 && normalizedPhone.includes(normalizedQuery))
    );
  }), [clients, normalizedQuery, visibleQuery]);
  const selected = detailClientId ? clients.find((client) => client.id === detailClientId) ?? null : null;
  const selectedSummary = selected ? summariesByClientId[selected.id] : undefined;
  const history = useMemo(() => (
    selected
      ? rentals
          .filter((rental) => normalizePhone(rental.phone) === normalizePhone(selected.phone))
          .sort(compareRentalRecency)
      : []
  ), [rentals, selected?.phone]);

  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) setQuery(phone);
  }, [searchParams]);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      setEditMode(false);
      return;
    }
    setDraft(selected);
    setEditMode(false);
  }, [selected?.id]);

  useEffect(() => {
    if (route.kind === 'detail') resetMobileDetailScroll();
  }, [route.kind, selected?.id]);

  const saveClient = async () => {
    if (!draft?.id) return;
    const nextClient: Client = { ...draft };
    if (dataAdapter) {
      await dataAdapter.admin.clients.save(nextClient);
    } else {
      setClients((current) => current.map((client) => (client.id === draft.id ? nextClient : client)));
    }
    setEditMode(false);
    setSaveMessage(t('admin.clients.saved'));
    window.setTimeout(() => setSaveMessage(''), 2400);
  };

  const addClient = () => {
    if (!newClient.name.trim() || !newClient.phone.trim()) return;
    const client: Client = {
      id: `client-${Date.now()}`,
      name: newClient.name.trim(),
      phone: newClient.phone.trim(),
      email: newClient.email.trim(),
      notes: newClient.notes.trim(),
      totalRentals: 0,
      lastContact: locale === 'id' ? '27 Mei 2026' : 'May 27, 2026',
    };
    setClients((current) => [client, ...current]);
    setNewClient({ name: '', phone: '', email: '', notes: '' });
    navigate(adminDetailPath('clients', client.id), { replace: true });
  };

  const confirmDeleteClient = () => {
    if (!deleteTarget) return;
    const remainingClients = clients.filter((client) => client.id !== deleteTarget.id);
    setClients(remainingClients);
    if (detailClientId === deleteTarget.id) {
      setDraft(null);
      setEditMode(false);
      navigate(listPath, { replace: true });
    }
    setDeleteTarget(null);
    setSaveMessage(t('admin.clients.deleted'));
    window.setTimeout(() => setSaveMessage(''), 2400);
  };

  if (route.kind === 'new') {
    return (
      <section className="admin-route-page client-create-page">
        <ClientCreatePanel
          t={t}
          newClient={newClient}
          setNewClient={setNewClient}
          onAdd={addClient}
          onClose={() => navigate(listPath)}
          standalone
        />
      </section>
    );
  }

  if (route.kind === 'detail') {
    if (!selected) return <Navigate to={listPath} replace />;

    return (
      <section className="admin-route-page client-detail-page">
        <ClientDetailPanel
          t={t}
          locale={locale}
          selected={selected}
          draft={draft}
          setDraft={setDraft}
          editMode={editMode}
          setEditMode={setEditMode}
          onClose={() => navigate(listPath)}
          onSave={saveClient}
          saveMessage={saveMessage}
          history={history}
          products={products}
          summary={selectedSummary}
          onRequestDelete={setDeleteTarget}
        />
        <ClientDeleteConfirmSheet
          t={t}
          target={deleteTarget}
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteClient}
        />
      </section>
    );
  }

  return (
    <section className="clients-list-page">
      <AdminListWindow>
        <AdminViewBar>
          <SearchInput value={query} onChange={setQuery} placeholder={t('common.search')} clearLabel={t('common.clear')} />
          <AdminCreateAction label={t('admin.clients.add')} to={adminNewPath('clients', location.search)} />
        </AdminViewBar>
        <AdminCreateFab label={t('admin.clients.add')} to={adminNewPath('clients', location.search)} />
        <ClientList
          clients={filtered}
          selectedId={undefined}
          summariesByClientId={summariesByClientId}
          t={t}
          onView={(clientId) => navigate(adminDetailPath('clients', clientId, location.search))}
        />
      </AdminListWindow>
    </section>
  );
}

function buildClientSummaries(clients: Client[], rentals: Rental[]): Record<string, ClientRentalSummary> {
  return clients.reduce<Record<string, ClientRentalSummary>>((summaries, client) => {
    const clientPhone = normalizePhone(client.phone);
    const clientRentals = rentals.filter((rental) => normalizePhone(rental.phone) === clientPhone);
    const activeRentals = clientRentals.filter((rental) => BLOCKING_LIFECYCLES.includes(rental.lifecycle));
    const overdueRentals = clientRentals.filter((rental) => rental.lifecycle === 'on_rent');
    const latestRental = [...clientRentals].sort(compareRentalRecency)[0];

    summaries[client.id] = {
      totalRentals: Math.max(client.totalRentals ?? 0, clientRentals.length),
      activeCount: activeRentals.length,
      overdueCount: overdueRentals.length,
      latestLifecycle: latestRental?.lifecycle,
    };

    return summaries;
  }, {});
}

function compareRentalRecency(a: Rental, b: Rental) {
  return `${b.end}-${b.start}-${b.reference}`.localeCompare(`${a.end}-${a.start}-${a.reference}`);
}
