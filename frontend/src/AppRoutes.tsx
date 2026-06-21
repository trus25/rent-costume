import { Navigate, Route, Routes, useLocation, useNavigate, type Location } from 'react-router-dom';
import { CheckoutModal, RequestSummarySheet } from './components/customer/checkout/CustomerCheckoutComponents';
import { useRentalAppState } from './hooks/useRentalAppState';
import CustomerCataloguePage from './pages/customer/CustomerCataloguePage';
import CustomerHomePage from './pages/customer/CustomerHomePage';
import CheckoutRoutePage from './pages/customer/CheckoutRoutePage';
import LookupPage from './pages/customer/LookupPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import { PublicRequestsPage, RequestIntakePage } from './pages/customer/RequestIntakePage';
import AdminShell from './pages/admin/AdminShell';
import StaffLoginPage from './pages/admin/StaffLoginPage';
import type { StaffSession } from './types/domain';

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = routeState?.backgroundLocation;
  const {
    appState,
    cartCount,
    cartItems,
    cartTotal,
    createBooking,
    removeCartItem,
    requestSheetOpen,
    setRequestSheetOpen,
    submittedRequest,
    updateCartQty,
  } = useRentalAppState();

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<CustomerHomePage {...appState} />} />
        <Route path="/catalogue" element={<CustomerCataloguePage {...appState} />} />
        <Route path="/costumes/:productId" element={<ProductDetailPage {...appState} />} />
        <Route path="/lookup" element={<LookupPage {...appState} />} />
        <Route path="/requests" element={<PublicRequestsPage {...appState} />} />
        <Route path="/requests/new" element={<RequestIntakePage {...appState} />} />
        <Route
          path="/checkout"
          element={
            <CheckoutRoutePage
              {...appState}
              cartItems={cartItems}
              cartTotal={cartTotal}
              cartCount={cartCount}
              onQty={updateCartQty}
              onRemove={removeCartItem}
              createBooking={createBooking}
              submittedRequest={submittedRequest}
            />
          }
        />
        <Route path="/admin/login" element={<StaffLoginPage {...appState} />} />
        <Route path="/admin" element={<AdminIndex staffSession={appState.staffSession} />} />
        <Route
          path="/admin/:section/*"
          element={
            appState.staffSession.isAuthenticated ? (
              <AdminShell {...appState} />
            ) : (
              <AdminLoginRedirect />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <RequestSummarySheet
        open={requestSheetOpen}
        onOpenChange={setRequestSheetOpen}
        t={appState.t}
        locale={appState.locale}
        cartItems={cartItems}
        cartTotal={cartTotal}
        cartCount={cartCount}
        onQty={updateCartQty}
        onRemove={removeCartItem}
        createBooking={createBooking}
        submittedRequest={submittedRequest}
      />

      {location.pathname === '/checkout' && backgroundLocation ? (
        <CheckoutModal
          open
          onOpenChange={(open: boolean) => {
            if (open) return;
            if (backgroundLocation) {
              navigate(-1);
            } else {
              navigate({ pathname: '/catalogue', search: location.search });
            }
          }}
          t={appState.t}
          locale={appState.locale}
          cartItems={cartItems}
          cartTotal={cartTotal}
          cartCount={cartCount}
          onQty={updateCartQty}
          onRemove={removeCartItem}
          createBooking={createBooking}
          submittedRequest={submittedRequest}
        />
      ) : null}
    </>
  );
}

function AdminIndex({ staffSession }: { staffSession: StaffSession }) {
  const location = useLocation();
  return staffSession.isAuthenticated
    ? <Navigate to={`/admin/requests${location.search}`} replace />
    : <Navigate to={`/admin/login${location.search}`} replace />;
}

function AdminLoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/admin/login${location.search}`} replace />;
}

export default AppRoutes;
