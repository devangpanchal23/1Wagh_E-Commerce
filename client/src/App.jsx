import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnnouncementBar from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { SearchOverlay } from './components/SearchOverlay';
import { MobileDrawer } from './components/MobileDrawer';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminGateway } from './components/AdminGateway';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
const Home = React.lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Shop = React.lazy(() => import('./pages/Shop').then((module) => ({ default: module.Shop })));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetail })));
const Cart = React.lazy(() => import('./pages/Cart').then((module) => ({ default: module.Cart })));
const Checkout = React.lazy(() => import('./pages/Checkout').then((module) => ({ default: module.Checkout })));
const About = React.lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = React.lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const Profile = React.lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })));
const Admin = React.lazy(() => import('./pages/Admin').then((module) => ({ default: module.Admin })));
const PaymentReceipt = React.lazy(() => import('./pages/PaymentReceipt'));
const PurchaseInvoice = React.lazy(() => import('./pages/PurchaseInvoice'));
const SignInPage = React.lazy(() => import('./pages/SignInPage'));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage'));
const VerifyOtpPage = React.lazy(() => import('./pages/VerifyOtpPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const NotFound = React.lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import ScrollToTop from './components/ScrollToTop';

function EmailVerificationBanner() {
  const { user, resendEmailVerification } = useAuth();

  if (!user || user.emailVerified || !user.email) return null;

  return (
    <div className="bg-amber-500 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-inner">
      <span>Please verify your email address ({user.email}).</span>
      <button
        onClick={resendEmailVerification}
        className="underline hover:text-amber-100 font-bold ml-1 transition-colors cursor-pointer"
      >
        Resend Verification Link
      </button>
    </div>
  );
}

function MainAppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenAuthModal = () => setAuthModalOpen(true);
    window.addEventListener('wagh:open-auth-modal', handleOpenAuthModal);
    return () => window.removeEventListener('wagh:open-auth-modal', handleOpenAuthModal);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-wagh-bg font-sans selection:bg-wagh-teal selection:text-white">
      <ScrollToTop />
      <AnnouncementBar />
      <EmailVerificationBanner />

      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      <LoginModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <main className="flex-1">
        <React.Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="h-8 w-56 rounded bg-slate-200 animate-pulse" /><div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">{Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[4/5] rounded-2xl bg-slate-200 animate-pulse" />)}</div></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/receipt/payment"
            element={
              <ProtectedRoute>
                <PaymentReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/receipt/invoice"
            element={
              <ProtectedRoute>
                <PurchaseInvoice />
              </ProtectedRoute>
            }
          />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<Navigate to="/sign-in" replace />} />
          <Route
            path="/admin"
            element={
              <AdminGateway>
                <Admin />
              </AdminGateway>
            }
          />
          {/* Catch-all Wildcard Route for 404 Not Found Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </React.Suspense>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ErrorBoundary>
              <MainAppLayout />
            </ErrorBoundary>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
