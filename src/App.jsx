import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import ChildwatchPublicPage from "./pages/ChildwatchPublicPage";
import PublicReport from "./pages/PublicReport";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminSignup from "./pages/AdminSignup";
import Register from "./pages/Register";
import AdminDashboard from "./pages/Admindashboard";
import Reporter from "./pages/Reporter";
import PoliceDashboard from "./pages/PoliceDashboard";
import SocialWorkerDashboard from "./pages/SocialWorkerDashboard";
import HealthcareDashboard from "./pages/HealthCareDashboard";
import CommunityDashboard from "./pages/CommunityDashboard";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ReloadPrompt from "./components/ReloadPrompt";
import InstallPrompt from "./components/InstallPrompt";

function App() {
  return (
    <>
      <InstallPrompt />
      <ReloadPrompt />
      <Routes>
        {/* Public */}
      <Route path="/" element={<ChildwatchPublicPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/report" element={<PublicReport />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Reporter / Parent */}
      <Route element={<ProtectedRoute requiredRole="user" />}>
        <Route path="/reporter/dashboard" element={<Reporter />} />
      </Route>

      {/* Community Member */}
      <Route element={<ProtectedRoute requiredRole="user" />}>
        <Route path="/community/dashboard" element={<CommunityDashboard />} />
      </Route>

      {/* Police Officer */}
      <Route element={<ProtectedRoute requiredRole="Police" />}>
        <Route path="/police/dashboard" element={<PoliceDashboard />} />
      </Route>

      {/* Social Worker */}
      <Route element={<ProtectedRoute requiredRole="Social Worker" />}>
        <Route path="/social/dashboard" element={<SocialWorkerDashboard />} />
      </Route>

      {/* Healthcare Provider */}
      <Route element={<ProtectedRoute requiredRole="Hospital" />}>
        <Route path="/health/dashboard" element={<HealthcareDashboard />} />
      </Route>

      {/* Institution Admin */}
      <Route element={<ProtectedRoute requiredRole="user" />}>
        <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
