import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, OidcLoginPage, UsagePage, SupportPage, SupportSuccessPage, SupportCancelPage } from './pages';
import { ProtectedRoute, DashboardLayout, ProfilePage, PasskeysPage, RelyingPartiesPage } from './components';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oidc/login" element={<OidcLoginPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="passkeys" element={<PasskeysPage />} />
          <Route path="relying-parties" element={<RelyingPartiesPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="support/success" element={<SupportSuccessPage />} />
          <Route path="support/cancel" element={<SupportCancelPage />} />
        </Route>

        {/* Default route - redirect to dashboard (ProtectedRoute will handle auth check) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
