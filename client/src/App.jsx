import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
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
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import PaymentReceipt from './pages/PaymentReceipt';
import PurchaseInvoice from './pages/PurchaseInvoice';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import NotFound from './pages/NotFound';

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
        className="underline hover:text-amber-100 font-bold ml-1 transition-colors"
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
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
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
      </main>

      <Footer />
    </div>
  );
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGFzaGluZy1tdWxlLTQuY2xlcmsuYWNjb3VudHMuZGV2JA==';

function ClerkProviderWithRoutes({ children }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <ClerkProviderWithRoutes>
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
    </ClerkProviderWithRoutes>
  );
}
