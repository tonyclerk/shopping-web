import { Navigate, Route, Routes } from "react-router-dom";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import TodaysOrdersScreen from "./screens/TodaysOrdersScreen.jsx";
import TodaysRevenueScreen from "./screens/TodaysRevenueScreen.jsx";
import OrderDetailsScreen from "./screens/OrderDetailsScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/verify-otp" element={<OtpVerificationScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/categories" element={<CategoriesScreen />} />
      <Route path="/kyc-documents" element={<KycDocumentsScreen />} />
      <Route path="/approval-pending" element={<ApprovalPendingScreen />} />
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/todays-orders" element={<TodaysOrdersScreen />} />
      <Route path="/todays-revenue" element={<TodaysRevenueScreen />} />
      <Route path="/order-details" element={<OrderDetailsScreen />} />
      <Route path="/pending-fulfillment" element={<PendingFulfillmentScreen />} />
      <Route path="/low-stock-alerts" element={<LowStockAlertsScreen />} />
      <Route path="/edit-product" element={<EditProductScreen />} />
      <Route path="/notifications" element={<NotificationScreen />} />
      <Route path="/products" element={<ProductManagementScreen />} />
      <Route path="/inventory" element={<InventoryManagementScreen />} />
      <Route path="/add-stock" element={<AddStockScreen />} />
      <Route path="/orders" element={<OrderManagementScreen />} />
      <Route path="/cancellations" element={<CancellationsScreen />} />
      <Route path="/payments" element={<PaymentsScreen />} />
      <Route path="/returns" element={<Navigate to="/returns-management" replace />} />
      <Route path="/returns-management" element={<ReturnsManagementScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/request-categories" element={<RequestCategoriesScreen />} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
