import { useLocation, type Location } from 'react-router-dom';

export function useCheckoutLink(): { to: { pathname: string; search: string }; state?: { backgroundLocation: Location } } {
  const location = useLocation();
  return {
    to: { pathname: '/checkout', search: location.search },
    state: location.pathname === '/checkout' ? undefined : { backgroundLocation: location },
  };
}
