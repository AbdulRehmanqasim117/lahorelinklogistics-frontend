import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import ProtectedRoute from "./src/components/ProtectedRoute";
import { ToastProvider } from "./src/contexts/ToastContext";

// Pages
import Login from "./pages/Login.jsx";
import CeoDashboard from "./pages/CeoDashboard.jsx";
import CeoUsers from "./pages/CeoUsers.jsx";
import CeoOrders from "./pages/CeoOrders.jsx";
import CeoIntegratedOrders from "./pages/CeoIntegratedOrders.jsx";
import CeoLogistics from "./pages/CeoLogistics.jsx";
import CeoCompanyProfile from "./pages/CeoCompanyProfile.jsx";
import CeoCompanyFinance from "./pages/CeoCompanyFinance.jsx";
import CeoAssignByScan from "./pages/CeoAssignByScan.jsx";
import CeoRiders from "./pages/CeoRiders.jsx";
import CeoRiderSettlements from "./pages/CeoRiderSettlements.jsx";
import WarehouseScan from "./pages/WarehouseScan.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import ManagerAllOrders from "./pages/ManagerAllOrders.jsx";
import ManagerRiders from "./pages/ManagerRiders.jsx";
import ManagerCommission from "./pages/ManagerCommission.jsx";
import ManagerInvoice from "./pages/ManagerInvoice.jsx";
import ManagerLogistics from "./pages/ManagerLogistics.jsx";
import InvoicePrint from "./pages/InvoicePrint.jsx";
import ShipperDashboard from "./pages/ShipperDashboard.jsx";
import ShipperOrderDetail from "./pages/ShipperOrderDetail.jsx";
import CeoOrderDetail from "./pages/CeoOrderDetail.jsx";
import ShipperIntegrations from "./pages/ShipperIntegrations.jsx";
import ShipperIntegratedOrders from "./pages/ShipperIntegratedOrders.jsx";
import ShipperFinance from "./pages/ShipperFinance.jsx";
import ShipperPendingApproval from "./pages/ShipperPendingApproval.jsx";
import LabelPrint from "./pages/LabelPrint.jsx";
import RiderDashboard from "./pages/RiderDashboard.jsx";
import RiderHistory from "./pages/RiderHistory.jsx";
import RiderTaskDetail from "./pages/RiderTaskDetail.jsx";
import RiderScanAssign from "./pages/RiderScanAssign.jsx";
import RiderFinance from "./pages/RiderFinance.jsx";
import SignupShipper from "./pages/SignupShipper.jsx";
import SignupRider from "./pages/SignupRider.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ScannerPage from "./pages/ScannerPage.jsx";

// Handle OAuth callback
const AuthCallback = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const role = params.get("role");
    const name = params.get("name");
    const email = params.get("email");
    const id = params.get("id");

    if (token) {
      // Store user data and update auth context
      const userData = { token, role, name, email, id };
      login(userData);

      // Clean up URL
      params.delete("token");
      params.delete("role");
      params.delete("name");
      params.delete("email");
      params.delete("id");

      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);

      // Redirect based on role
      const redirectPath =
        role === "CEO"
          ? "/dashboard/ceo"
          : role === "MANAGER"
            ? "/manager/dashboard"
            : role === "SHIPPER"
              ? "/shipper/dashboard"
              : "/rider/dashboard";
      navigate(redirectPath);
    } else {
      navigate("/");
    }
  }, [location, login, navigate]);

  return <div>Authenticating...</div>;
};

// Main App component
const AppContent = () => {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in and trying to access auth pages
  const AuthRedirect = ({ children }) => {
    if (user) {
      const redirectPath =
        user.role === "CEO"
          ? "/dashboard/ceo"
          : user.role === "MANAGER"
            ? "/manager/dashboard"
            : user.role === "SHIPPER"
              ? "/shipper/dashboard"
              : "/rider/dashboard";
      return <Navigate to={redirectPath} replace />;
    }
    return children;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Auth routes - only accessible when not logged in */}
      <Route
        path="/"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />

      <Route
        path="/signup/shipper"
        element={
          <AuthRedirect>
            <SignupShipper />
          </AuthRedirect>
        }
      />

      <Route
        path="/signup/rider"
        element={
          <AuthRedirect>
            <SignupRider />
          </AuthRedirect>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <AuthRedirect>
            <ForgotPassword />
          </AuthRedirect>
        }
      />

      <Route
        path="/reset-password"
        element={
          <AuthRedirect>
            <ResetPassword />
          </AuthRedirect>
        }
      />

      {/* Protected CEO routes */}
      <Route
        path="/dashboard/ceo"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/users"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/orders"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/integrated-orders"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoIntegratedOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/orders/:id"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoOrderDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/commission"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <ManagerCommission />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/finance/riders"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <ManagerRiders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/finance/company"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoCompanyFinance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/finance/invoice"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <ManagerInvoice />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/logistics"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoLogistics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/company-profile"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoCompanyProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/warehouse-scan"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <WarehouseScan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/scanner"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <ScannerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/assign-scan"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoAssignByScan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/riders"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoRiders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo/riders/:id/settlements"
        element={
          <ProtectedRoute allowedRoles={["CEO"]}>
            <CeoRiderSettlements />
          </ProtectedRoute>
        }
      />

      {/* Protected Manager routes */}
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/orders"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerAllOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/riders"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerRiders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/commission"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerCommission />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/finance/invoice"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerInvoice />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/logistics"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerLogistics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/warehouse-scan"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <WarehouseScan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoice-print/:id"
        element={
          <ProtectedRoute allowedRoles={["MANAGER", "CEO"]} noLayout>
            <InvoicePrint />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/scanner"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ScannerPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Shipper routes */}
      <Route
        path="/shipper/dashboard"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipper/orders"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipper/create"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipper/orders/:id"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperOrderDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipper/order/:id"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperOrderDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipper/integrations"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperIntegrations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipper/integrated-orders"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperIntegratedOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipper/finance"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]}>
            <ShipperFinance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pending-approval"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]} noLayout>
            <ShipperPendingApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipper/pending-approval"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]} noLayout>
            <ShipperPendingApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="/label-print/:id"
        element={
          <ProtectedRoute allowedRoles={["SHIPPER"]} noLayout>
            <LabelPrint />
          </ProtectedRoute>
        }
      />

      {/* Protected Rider routes */}
      <Route
        path="/rider/dashboard"
        element={
          <ProtectedRoute allowedRoles={["RIDER"]}>
            <RiderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/history"
        element={
          <ProtectedRoute allowedRoles={["RIDER"]}>
            <RiderHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/task/:id"
        element={
          <ProtectedRoute allowedRoles={["RIDER"]}>
            <RiderTaskDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/scan"
        element={
          <ProtectedRoute allowedRoles={["RIDER"]}>
            <RiderScanAssign />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/finance"
        element={
          <ProtectedRoute allowedRoles={["RIDER"]}>
            <RiderFinance />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate
              to={
                user.role === "CEO"
                  ? "/dashboard/ceo"
                  : user.role === "MANAGER"
                    ? "/manager/dashboard"
                    : user.role === "SHIPPER"
                      ? "/shipper/dashboard"
                      : "/rider/dashboard"
              }
              replace
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
};

// Main App wrapper with AuthProvider
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
