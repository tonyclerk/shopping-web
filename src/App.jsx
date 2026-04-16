import { Navigate, Route, Routes } from "react-router-dom";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import TodaysOrdersScreen from "./screens/TodaysOrdersScreen.jsx";
import TodaysRevenueScreen from "./screens/TodaysRevenueScreen.jsx";
import OrderDetailsScreen from "./screens/OrderDetailsScreen.jsx";
import NotFoundScreen from "./screens/NotFoundScreen.jsx";
import OtpVerificationScreen from "./screens/OtpVerificationScreen.jsx";
import OnboardingScreen from "./screens/OnboardingScreen.jsx";
import CategoriesScreen from "./screens/CategoriesScreen.jsx";
import KycDocumentsScreen from "./screens/KycDocumentsScreen.jsx";
import ApprovalPendingScreen from "./screens/ApprovalPendingScreen.jsx";
import ProductManagementScreen from "./screens/ProductManagementScreen.jsx";
import OrderManagementScreen from "./screens/OrderManagementScreen.jsx";
import InventoryManagementScreen from "./screens/InventoryManagementScreen.jsx";
import AddStockScreen from "./screens/AddStockScreen.jsx";
import PaymentsScreen from "./screens/PaymentsScreen.jsx";
import ReturnsManagementScreen from "./screens/ReturnsManagementScreen.jsx";
import CancellationsScreen from "./screens/CancellationsScreen.jsx";
import PendingFulfillmentScreen from "./screens/PendingFulfillmentScreen.jsx";
import LowStockAlertsScreen from "./screens/LowStockAlertsScreen.jsx";
import EditProductScreen from "./screens/EditProductScreen.jsx";
import NotificationScreen from "./screens/NotificationScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import RequestCategoriesScreen from "./screens/RequestCategoriesScreen.jsx";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import WebLoginScreen from "./screens/WebLoginScreen.jsx";
import SignupScreen from "./screens/SignupScreen.jsx";
import useSellerSession from "./hooks/useSellerSession.js";
import { getSellerNextRoute, hasCompletedCategories, isBusinessInfoComplete } from "./utils/sellerProfile.js";

function RouteLoader() {
  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Loading</h1>
        <p className="subtitle">Checking your seller session...</p>
      </section>
    </main>
  );
}

function PublicOnlyRoute({ children }) {
  const { loading, user, seller } = useSellerSession();

  if (loading) return <RouteLoader />;
  if (user) return <Navigate to={getSellerNextRoute(seller ?? {})} replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { loading, user } = useSellerSession();

  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return children;
}

function OnboardingBusinessRoute({ children }) {
  const { loading, user, seller } = useSellerSession();

  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (isBusinessInfoComplete(seller ?? {})) {
    return <Navigate to={getSellerNextRoute(seller ?? {})} replace />;
  }

  return children;
}

function OnboardingCategoriesRoute({ children }) {
  const { loading, user, seller } = useSellerSession();

  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!isBusinessInfoComplete(seller ?? {})) return <Navigate to="/onboarding" replace />;
  if (hasCompletedCategories(seller ?? {})) {
    return <Navigate to={getSellerNextRoute(seller ?? {})} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><WelcomeScreen /></PublicOnlyRoute>} />
      <Route path="/welcome" element={<Navigate to="/" replace />} />
      <Route path="/auth/login" element={<PublicOnlyRoute><WebLoginScreen /></PublicOnlyRoute>} />
      <Route path="/auth/signup" element={<PublicOnlyRoute><SignupScreen /></PublicOnlyRoute>} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/verify-otp" element={<PublicOnlyRoute><OtpVerificationScreen /></PublicOnlyRoute>} />
      <Route path="/onboarding" element={<OnboardingBusinessRoute><OnboardingScreen /></OnboardingBusinessRoute>} />
      <Route path="/categories" element={<OnboardingCategoriesRoute><CategoriesScreen /></OnboardingCategoriesRoute>} />
      <Route path="/kyc-documents" element={<ProtectedRoute><KycDocumentsScreen /></ProtectedRoute>} />
      <Route path="/approval-pending" element={<ProtectedRoute><ApprovalPendingScreen /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
      <Route path="/todays-orders" element={<ProtectedRoute><TodaysOrdersScreen /></ProtectedRoute>} />
      <Route path="/todays-revenue" element={<ProtectedRoute><TodaysRevenueScreen /></ProtectedRoute>} />
      <Route path="/order-details" element={<ProtectedRoute><OrderDetailsScreen /></ProtectedRoute>} />
      <Route path="/pending-fulfillment" element={<ProtectedRoute><PendingFulfillmentScreen /></ProtectedRoute>} />
      <Route path="/low-stock-alerts" element={<ProtectedRoute><LowStockAlertsScreen /></ProtectedRoute>} />
      <Route path="/edit-product" element={<ProtectedRoute><EditProductScreen /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationScreen /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryManagementScreen /></ProtectedRoute>} />
      <Route path="/add-stock" element={<ProtectedRoute><AddStockScreen /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrderManagementScreen /></ProtectedRoute>} />
      <Route path="/cancellations" element={<ProtectedRoute><CancellationsScreen /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsScreen /></ProtectedRoute>} />
      <Route path="/returns" element={<ProtectedRoute><Navigate to="/returns-management" replace /></ProtectedRoute>} />
      <Route path="/returns-management" element={<ProtectedRoute><ReturnsManagementScreen /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
      <Route path="/request-categories" element={<ProtectedRoute><RequestCategoriesScreen /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
