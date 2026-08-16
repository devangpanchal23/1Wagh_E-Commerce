import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';

export function CheckoutButton({
  children = (
    <>
      <span>Proceed to Checkout</span>
      <ArrowRight className="w-4 h-4" />
    </>
  ),
  className = "w-full py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2",
  onProceed,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleClick = () => {
    if (user) {
      if (onProceed) {
        onProceed();
      } else {
        navigate('/checkout');
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (onProceed) {
      onProceed();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default CheckoutButton;
