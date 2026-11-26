import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import { RequireAdmin, RequireAuth } from './routes/ProtectedRoutes.jsx';

import AboutPage from './pages/customer/AboutPage.jsx';
import CartPage from './pages/customer/CartPage.jsx';
import CheckoutPage from './pages/customer/CheckoutPage.jsx';
import ContactPage from './pages/customer/ContactPage.jsx';
import HomePage from './pages/customer/HomePage.jsx';
import LoginPage from './pages/customer/LoginPage.jsx';
import MenuPage from './pages/customer/MenuPage.jsx';
import MyOrdersPage from './pages/customer/MyOrdersPage.jsx';
import OffersPage from './pages/customer/OffersPage.jsx';
import OrderDetailPage from './pages/customer/OrderDetailPage.jsx';
import ProductDetailPage from './pages/customer/ProductDetailPage.jsx';
import ProfilePage from './pages/customer/ProfilePage.jsx';
import RegisterPage from './pages/customer/RegisterPage.jsx';
import ReviewsPage from './pages/customer/ReviewsPage.jsx';

import AdminInventoryPage from './pages/admin/AdminInventoryPage.jsx';
import AdminMenuPage from './pages/admin/AdminMenuPage.jsx';
import AdminOffersPage from './pages/admin/AdminOffersPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminOverviewPage from './pages/admin/AdminOverviewPage.jsx';
import AdminReviewsPage from './pages/admin/AdminReviewsPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <Routes>
                {/* Customer Storefront Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/product/:idOrSlug" element={<ProductDetailPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  <Route
                    path="/checkout"
                    element={
                      <RequireAuth>
                        <CheckoutPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <ProfilePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <RequireAuth>
                        <MyOrdersPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <RequireAuth>
                        <OrderDetailPage />
                      </RequireAuth>
                    }
                  />
                </Route>

                {/* Protected Admin Dashboard Routes */}
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="menu" element={<AdminMenuPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="offers" element={<AdminOffersPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
