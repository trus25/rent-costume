import type { AdminSectionId } from '../constants/ui';

export type AdminSubroute =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'detail'; id: string }
  | { kind: 'invalid' };

const newRouteSections: AdminSectionId[] = ['requests', 'catalogue', 'clients'];
const detailRouteSections: AdminSectionId[] = ['requests', 'rentals', 'catalogue', 'clients'];

export function parseAdminSubroute(section: AdminSectionId, splat = ''): AdminSubroute {
  const parts = splat.split('/').filter(Boolean).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });

  if (parts.length === 0) return { kind: 'list' };
  if (parts.length !== 1) return { kind: 'invalid' };

  const [segment] = parts;
  if (segment === 'new') {
    return newRouteSections.includes(section) ? { kind: 'new' } : { kind: 'invalid' };
  }

  return detailRouteSections.includes(section) ? { kind: 'detail', id: segment } : { kind: 'invalid' };
}

export function adminListPath(section: AdminSectionId, search = '') {
  return `/admin/${section}${normalizeSearch(search)}`;
}

export function adminNewPath(section: AdminSectionId, search = '') {
  return `/admin/${section}/new${normalizeSearch(search)}`;
}

export function adminDetailPath(section: AdminSectionId, id: string, search = '') {
  return `/admin/${section}/${encodeURIComponent(id)}${normalizeSearch(search)}`;
}

export function searchWithout(search: string, keys: string[]) {
  const params = new URLSearchParams(search);
  keys.forEach((key) => params.delete(key));
  return normalizeSearch(params.toString());
}

function normalizeSearch(search: string) {
  if (!search) return '';
  return search.startsWith('?') ? search : `?${search}`;
}
