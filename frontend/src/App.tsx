import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import UserMobileLayout from './layouts/UserMobileLayout';
import PartnerLayout from './layouts/PartnerLayout';
import AdminWebLayout from './layouts/AdminWebLayout';

import WelcomePage from './pages/auth/WelcomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import ExplorePage from './pages/user/ExplorePage';
import LocationDetailPage from './pages/user/LocationDetailPage';
import CheckoutPage from './pages/user/CheckoutPage';
import MyReservationsPage from './pages/user/MyReservationsPage';
import ActiveReservationPage from './pages/user/ActiveReservationPage';
import LockerLocatePage from './pages/user/LockerLocatePage';
import SupportPage from './pages/user/SupportPage';
import ProfilePage from './pages/user/ProfilePage';

import PartnerApplyPage from './pages/partner/PartnerApplyPage';
import PartnerDashboardPage from './pages/partner/PartnerDashboardPage';
import CreateLocationPage from './pages/partner/CreateLocationPage';
import ManageLockersPage from './pages/partner/ManageLockersPage';
import PartnerReservationsPage from './pages/partner/PartnerReservationsPage';
import PartnerFinancialPage from './pages/partner/PartnerFinancialPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPartnersPage from './pages/admin/AdminPartnersPage';
import AdminLocationsPage from './pages/admin/AdminLocationsPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Usuário */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <UserMobileLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="explore" replace />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="locations/:id" element={<LocationDetailPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="reservations" element={<MyReservationsPage />} />
        <Route path="reservations/:id" element={<ActiveReservationPage />} />
        <Route path="reservations/:id/locate" element={<LockerLocatePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Solicitação para virar parceiro */}
      <Route
        path="/partner/apply"
        element={
          <RequireAuth>
            <UserMobileLayout />
          </RequireAuth>
        }
      >
        <Route index element={<PartnerApplyPage />} />
      </Route>

      {/* Parceiro */}
      <Route
        path="/partner"
        element={
          <RequireAuth role="PARTNER">
            <PartnerLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PartnerDashboardPage />} />
        <Route path="locations/new" element={<CreateLocationPage />} />
        <Route path="locations/:id/lockers" element={<ManageLockersPage />} />
        <Route path="reservations" element={<PartnerReservationsPage />} />
        <Route path="financial" element={<PartnerFinancialPage />} />
      </Route>

      {/* Administrador */}
      <Route
        path="/admin"
        element={
          <RequireAuth role="ADMIN">
            <AdminWebLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="partners" element={<AdminPartnersPage />} />
        <Route path="locations" element={<AdminLocationsPage />} />
        <Route path="reservations" element={<AdminReservationsPage />} />
        <Route path="incidents" element={<AdminIncidentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
