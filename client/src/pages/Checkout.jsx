import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, CreditCard, CheckCircle2, AlertCircle, ArrowLeft, Lock, Receipt, FileText, Truck, Zap, MapPin, Save } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../api';
import { ProductImage } from '../components/ProductImage';
import { checkoutShippingAddressSchema, sanitizeText } from '../validations/profileSchema';

export function Checkout() {
  const { cartItems, subtotal, shippingFee, grandTotal, clearCart, appliedCoupon, couponDiscount } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    line1: '',
    line2: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [savedAddrData, setSavedAddrData] = useState(null);
  const [savedAddressesList, setSavedAddressesList] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showSavedAddrModal, setShowSavedAddrModal] = useState(false);
  const [usedSavedAddr, setUsedSavedAddr] = useState(false);
  const [showSaveAddrPrompt, setShowSaveAddrPrompt] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD | Razorpay
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Fetch saved addresses on mount if user is logged in
  useEffect(() => {
    if (!user) return; // Skip fetch for unauthenticated / guest users

    const fetchSavedAddress = async () => {
      try {
        const res = await fetchApi('/auth/saved-address');
        if (res && res.success && res.exists) {
          const list = res.addresses && res.addresses.length > 0 ? res.addresses : (res.savedAddress ? [res.savedAddress] : []);
          setSavedAddressesList(list);
          setSavedAddrData(list[0] || null);
          setShowSavedAddrModal(false);
        }
      } catch (err) {
        // Fail silently to empty form state
        console.warn('Saved address fetch failed silently:', err?.message);
      }
    };

    fetchSavedAddress();
  }, [user]);

  const handleSelectAddress = (item) => {
    if (!item) return;
    const l1 = item.line1 || item.street || '';
    const l2 = item.line2 || '';
    const fullStreet = l2 ? `${l1}, ${l2}` : l1;

    setAddress({
      name: item.fullName || user?.name || '',
      phone: String(item.mobileNumber || '').replace(/\D/g, ''),
      line1: l1,
      line2: l2,
      street: fullStreet,
      city: item.city || '',
      state: item.state || '',
      pincode: String(item.pincode || '').replace(/\D/g, ''),
    });
    setFieldErrors({});
    setSelectedAddressId(item.id);
    setUsedSavedAddr(true);
    addToast(`Selected "${item.label || 'Saved Address'}"!`, 'success');
  };

  const handleAcceptSavedAddress = () => {
    if (savedAddrData) {
      const l1 = savedAddrData.line1 || savedAddrData.street || '';
      const l2 = savedAddrData.line2 || '';
      const fullStreet = l2 ? `${l1}, ${l2}` : l1;

      setAddress({
        name: savedAddrData.fullName || user?.name || '',
        phone: String(savedAddrData.mobileNumber || '').replace(/\D/g, ''),
        line1: l1,
        line2: l2,
        street: fullStreet,
        city: savedAddrData.city || '',
        state: savedAddrData.state || '',
        pincode: String(savedAddrData.pincode || '').replace(/\D/g, ''),
      });
      setFieldErrors({});
      setUsedSavedAddr(true);
      addToast('Saved address details autofilled!', 'success');
    }
    setShowSavedAddrModal(false);
  };

  const handleDeclineSavedAddress = () => {
    setShowSavedAddrModal(false);
  };

  const handleSaveCurrentAddress = async () => {
    const activeL1 = address.line1 || address.street;
    if (!user || !activeL1 || !address.city || !address.pincode) return;
    try {
      setSavingAddress(true);
      await fetchApi('/auth/saved-address', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: address.name,
          mobileNumber: address.phone,
          line1: activeL1,
          line2: address.line2 || '',
          street: address.line2 ? `${activeL1}, ${address.line2}` : activeL1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        }),
      });
      addToast('Delivery address saved for faster checkout next time!', 'success');
      setShowSaveAddrPrompt(false);
    } catch (err) {
      addToast(err.message || 'Failed to save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!user) {
      addToast('Please login to place an order', 'info');
      navigate('/profile');
      return;
    }

    // Validate shipping address against Zod schema
    const parseResult = checkoutShippingAddressSchema.safeParse(address);
    if (!parseResult.success) {
      const errs = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (!errs[field]) errs[field] = issue.message;
      });
      setFieldErrors(errs);
      addToast('Please fix shipping address validation errors before placing order', 'error');
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const formattedItems = cartItems.map((item) => {
        const rawImg = item.product.images?.[0] || item.product.image || '';
        const imgUrl = typeof rawImg === 'string' ? rawImg : (rawImg?.url || '');

        return {
          product: item.product._id || item.product,
          name: item.product.name,
          image: imgUrl,
          price: item.product.price || item.price,
          qty: item.qty,
        };
      });

      const payload = {
        items: formattedItems,
        shippingAddress: address,
        paymentMethod,
        subtotal,
        shippingFee,
        discount: couponDiscount || 0,
        couponCode: appliedCoupon?.couponCode || '',
        total: grandTotal,
      };

      if (paymentMethod === 'Razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          addToast('Failed to load Razorpay payment SDK. Please check your connection.', 'error');
          setIsSubmitting(false);
          return;
        }

        // Step 1: Create Razorpay Order on Backend
        const razorpayOrderRes = await fetchApi('/orders/create-razorpay-order', {
          method: 'POST',
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
          }),
        });

        if (!razorpayOrderRes || !razorpayOrderRes.order_id) {
          throw new Error('Failed to create Razorpay payment order');
        }

        const razorpayKey = razorpayOrderRes.key;
        if (!razorpayKey) {
          throw new Error('Razorpay Key ID is not configured on server');
        }


        // Step 2: Open Razorpay Checkout Modal
        const options = {
          key: razorpayKey,
          amount: razorpayOrderRes.amount,
          currency: razorpayOrderRes.currency || 'INR',
          name: 'WAGH Mobile Accessories',
          description: 'Payment for WAGH Accessories Order',
          image: `${window.location.origin}/assets/branding/wagh-logo-2x.png`,
          order_id: razorpayOrderRes.order_id,
          handler: async function (response) {
            // Step 3: Verify Payment Signature on Backend
            try {
              setIsSubmitting(true);
              const verifyRes = await fetchApi('/orders/verify-razorpay-payment', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes && verifyRes.success) {
                // Submit order to database after verified payment
                const res = await fetchApi('/orders', {
                  method: 'POST',
                  body: JSON.stringify({
                    ...payload,
                    paymentMethod: 'Razorpay',
                    paymentStatus: 'Paid',
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  }),
                });

                if (res.success) {
                  setCompletedOrder(res.data);
                  clearCart();
                  addToast('Payment verified & order placed successfully!', 'success');
                }
              }
            } catch (verifyErr) {
              console.error('Signature verification error:', verifyErr);
              addToast(verifyErr.message || 'Payment verification failed.', 'error');
            } finally {
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: address.name || user?.name || user?.displayName || '',
            email: user?.email || '',
            contact: address.phone || '',
          },
          theme: {
            color: '#0D9488',
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              addToast('Razorpay payment modal closed', 'info');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failureResponse) {
          console.error('Razorpay Payment Failed:', failureResponse.error);
          setIsSubmitting(false);
          addToast(
            `Payment Failed: ${failureResponse.error?.description || 'Transaction was unsuccessful'}`,
            'error'
          );
        });

        rzp.open();
        return;
      }

      // COD Flow
      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setCompletedOrder(res.data);
        clearCart();
        addToast('Order placed successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Order failed to process', 'error');
    } finally {
      if (paymentMethod !== 'Razorpay') {
        setIsSubmitting(false);
      }
    }
  };

  // ORDER CONFIRMATION SCREEN
  // ORDER CONFIRMATION / DETAIL TRANSACTION SCREEN (Matches Reference Mockup)
  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        {/* Floating Green Success Badge as seen in reference image */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 bg-emerald-100/70 rounded-full flex items-center justify-center p-2 mx-auto animate-bounce">
            <div className="w-18 h-18 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark">
            Payment Successful!
          </h1>
          <p className="text-xs sm:text-sm text-wagh-muted font-sans mt-1.5">
            Successfully authorized order <span className="font-bold text-wagh-teal font-mono-tag">₹{completedOrder.total}</span> to WAGH Store
          </p>
        </div>

        {/* Detail Transaction Card (Matches Reference Image) */}
        <div className="bg-white p-6 rounded-3xl border border-wagh-border shadow-soft text-left space-y-4 font-mono-tag text-xs sm:text-sm">
          <h3 className="font-editorial text-lg font-bold text-wagh-dark border-b border-wagh-border/80 pb-3">
            Detail Transaction
          </h3>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Order Reference</span>
            <span className="font-bold text-wagh-dark font-mono-tag">{completedOrder.orderNumber || completedOrder.orderId}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Date</span>
            <span className="font-bold text-wagh-dark">
              {new Date(completedOrder.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Type of Transaction</span>
            <span className="font-bold text-wagh-dark">{completedOrder.paymentMethod || 'Online Transfer'}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Nominal</span>
            <span className="font-bold text-wagh-dark">₹{completedOrder.subtotal || completedOrder.total}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Shipping Fee</span>
            <span className="font-bold text-wagh-dark">{completedOrder.shippingFee === 0 ? 'FREE' : `₹${completedOrder.shippingFee}`}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Recipient Number</span>
            <span className="font-bold text-wagh-dark">{completedOrder.shippingAddress?.phone || '+91 90544 05305'}</span>
          </div>

          <div className="flex justify-between items-center text-wagh-muted">
            <span>Status</span>
            <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {completedOrder.paymentStatus || 'Success'}
            </span>
          </div>

          <div className="flex justify-between items-center text-base font-extrabold text-wagh-dark border-t border-wagh-border pt-3">
            <span>Total</span>
            <span className="text-wagh-teal">₹{completedOrder.total}</span>
          </div>
        </div>

        {user && !usedSavedAddr && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3 font-sans">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Save this address for faster checkout next time?</span>
            </div>
            <button
              type="button"
              onClick={handleSaveCurrentAddress}
              disabled={savingAddress}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingAddress ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        )}

        {/* Full width primary action buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Link
              to={`/orders/${completedOrder.orderNumber || completedOrder.orderId || completedOrder._id}/receipt/payment`}
              className="py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Payment Receipt</span>
            </Link>
            <Link
              to={`/orders/${completedOrder.orderNumber || completedOrder.orderId || completedOrder._id}/receipt/invoice`}
              className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Tax Invoice</span>
            </Link>
          </div>
          <Link
            to="/profile"
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md transition-all block text-center"
          >
            Close & Track Order
          </Link>
          <Link
            to="/shop"
            className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-wagh-dark font-bold text-xs transition-all block text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-wagh-dark">No items to checkout</h2>
        <Link to="/shop" className="inline-block px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex items-center gap-4 border-b border-wagh-border pb-4">
        <Link to="/cart" className="p-2 rounded-full hover:bg-gray-100 text-wagh-dark">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-editorial text-3xl font-extrabold text-wagh-dark">Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Shipping Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-4">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-wagh-teal" />
                <span>1. Shipping Address</span>
              </span>
              {savedAddrData && (
                <button
                  type="button"
                  onClick={handleAcceptSavedAddress}
                  className="text-xs text-wagh-teal hover:underline font-mono-tag font-bold flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Autofill Saved Address</span>
                </button>
              )}
            </h3>

            {savedAddressesList.length > 0 && (
              <div className="space-y-2.5 font-sans pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-wagh-teal">
                    <MapPin className="w-4 h-4" />
                    <span>Saved Addresses ({savedAddressesList.length} available):</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Click any address to autofill</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedAddressesList.map((item) => {
                    const isSelected = selectedAddressId === item.id || (address.line1 && address.line1 === item.line1);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectAddress(item)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                          isSelected
                            ? 'bg-wagh-teal/10 border-wagh-teal text-slate-900 ring-2 ring-wagh-teal/30 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="flex items-center gap-1.5">
                            <span className="capitalize">{item.label || 'Saved Address'}</span>
                            {item.isDefault && (
                              <span className="text-[10px] bg-wagh-teal text-white px-1.5 py-0.2 rounded-md font-mono-tag">Default</span>
                            )}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-wagh-teal shrink-0" />}
                        </div>
                        <p className="line-clamp-1 font-semibold text-slate-800">{item.line1 || item.street}</p>
                        {item.line2 && <p className="line-clamp-1 text-[11px] text-slate-500">{item.line2}</p>}
                        <p className="text-[11px] text-slate-500 font-mono-tag">{item.city}, {item.state} - {item.pincode}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAddress(item);
                          }}
                          className={`w-full mt-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-wagh-teal text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-wagh-teal/10 hover:text-wagh-teal'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Address Selected' : 'Use This Address'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address.name}
                  onChange={(e) => {
                    setAddress({ ...address, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  className={`w-full p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.name
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                      : 'border-wagh-border focus:ring-wagh-teal'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">
                  Phone Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="10-digit mobile number"
                  value={address.phone}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '');
                    setAddress({ ...address, phone: cleanVal });
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  className={`w-full p-2.5 rounded-xl border text-sm font-mono-tag transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.phone
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                      : 'border-wagh-border focus:ring-wagh-teal'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-mono-tag text-wagh-muted mb-1">
                    Address Line 1 (Flat, House No, Building) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Wagh Residency, B-35 Ram Krishna Society"
                    value={address.line1}
                    onChange={(e) => {
                      const newL1 = e.target.value;
                      const fullSt = address.line2 ? `${newL1}, ${address.line2}` : newL1;
                      setAddress({ ...address, line1: newL1, street: fullSt });
                      if (fieldErrors.line1) setFieldErrors((prev) => ({ ...prev, line1: null }));
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                      fieldErrors.line1
                        ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                        : 'border-wagh-border focus:ring-wagh-teal'
                    }`}
                  />
                  {fieldErrors.line1 && (
                    <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.line1}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono-tag text-wagh-muted mb-1">
                    Address Line 2 (Street, Area, Landmark)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near SG Highway, Opp. City Mall"
                    value={address.line2}
                    onChange={(e) => {
                      const newL2 = e.target.value;
                      const fullSt = newL2 ? `${address.line1}, ${newL2}` : address.line1;
                      setAddress({ ...address, line2: newL2, street: fullSt });
                      if (fieldErrors.line2) setFieldErrors((prev) => ({ ...prev, line2: null }));
                    }}
                    className={`w-full p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                      fieldErrors.line2
                        ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                        : 'border-wagh-border focus:ring-wagh-teal'
                    }`}
                  />
                  {fieldErrors.line2 && (
                    <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.line2}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => {
                    setAddress({ ...address, city: e.target.value });
                    if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: null }));
                  }}
                  className={`w-full p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.city
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                      : 'border-wagh-border focus:ring-wagh-teal'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono-tag text-wagh-muted mb-1">
                  State & Pincode (6 Digits) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={address.state}
                      onChange={(e) => {
                        setAddress({ ...address, state: e.target.value });
                        if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: null }));
                      }}
                      className={`w-full p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                        fieldErrors.state
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-wagh-border focus:ring-wagh-teal'
                      }`}
                    />
                    {fieldErrors.state && (
                      <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.state}</p>
                    )}
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="380015"
                      value={address.pincode}
                      onChange={(e) => {
                        const cleanPincode = e.target.value.replace(/\D/g, '');
                        setAddress({ ...address, pincode: cleanPincode });
                        if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: null }));
                      }}
                      className={`w-full p-2.5 rounded-xl border font-mono-tag transition-all focus:outline-none focus:ring-2 ${
                        fieldErrors.pincode
                          ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                          : 'border-wagh-border focus:ring-wagh-teal'
                      }`}
                    />
                    {fieldErrors.pincode && (
                      <p className="text-xs text-red-500 mt-1 font-mono-tag">{fieldErrors.pincode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options Section */}
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-4">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-wagh-teal" />
              <span>2. Payment Option</span>
            </h3>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'COD' ? 'border-wagh-teal bg-wagh-teal/5' : 'border-wagh-border hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={paymentMethod === 'COD'} readOnly className="w-4 h-4 text-wagh-teal" />
                  <div>
                    <div className="font-bold text-sm text-wagh-dark">Cash on Delivery (COD)</div>
                    <div className="text-xs text-wagh-muted">Pay cash directly when order arrives at door</div>
                  </div>
                </div>
                <span className="font-mono-tag text-xs font-bold text-wagh-teal bg-white px-2 py-1 rounded border">Standard</span>
              </label>

              <label
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'Razorpay' ? 'border-wagh-teal bg-wagh-teal/5' : 'border-wagh-border hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={paymentMethod === 'Razorpay'} readOnly className="w-4 h-4 text-wagh-teal" />
                  <div>
                    <div className="font-bold text-sm text-wagh-dark">Razorpay (UPI / NetBanking / Cards)</div>
                    <div className="text-xs text-wagh-muted">Instant payment gateway test mode</div>
                  </div>
                </div>
                <span className="font-mono-tag text-xs font-bold text-wagh-gold bg-wagh-dark px-2 py-1 rounded">Fast</span>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Order Review & Submit */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-6">
          <h3 className="font-editorial text-xl font-bold text-wagh-dark border-b border-wagh-border pb-3">
            Review Your Items
          </h3>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {cartItems.map((item) => (
              <div key={item.product._id || item.product} className="flex items-center gap-3.5 text-xs py-1">
                <ProductImage
                  src={item.product.images}
                  alt={item.product.name}
                  variant="thumbnail"
                  className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-wagh-dark text-sm truncate">{item.product.name}</h4>
                  <p className="text-wagh-muted font-mono-tag mt-0.5">Qty: {item.qty} × ₹{item.product.price || item.price}</p>
                </div>
                <span className="font-mono-tag font-extrabold text-wagh-teal text-sm shrink-0">₹{(item.product.price || item.price) * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-wagh-border pt-4 space-y-2 font-mono-tag text-xs">
            <div className="flex justify-between text-wagh-muted">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-wagh-muted">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-wagh-teal pt-2 border-t">
              <span>Total Payable</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 fill-white" />
            <span>{isSubmitting ? 'Processing Order...' : `Place Order — ₹${grandTotal}`}</span>
          </button>
        </div>

      </form>

      {/* SAVED ADDRESS REUSE MODAL */}
      {showSavedAddrModal && savedAddrData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-wagh-teal/10 text-wagh-teal flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Use Saved Delivery Address?</h3>
                <p className="text-xs text-slate-500">We found a saved address on your profile</p>
              </div>
            </div>

            {/* Address Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono-tag">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>{savedAddrData.fullName || user?.name || 'Saved Recipient'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-wagh-teal/10 text-wagh-teal font-sans">{savedAddrData.source || 'Saved Default'}</span>
              </div>
              <p className="text-slate-800 font-bold font-sans">{savedAddrData.line1 || savedAddrData.street}</p>
              {savedAddrData.line2 && (
                <p className="text-slate-600 font-sans">{savedAddrData.line2}</p>
              )}
              <p className="text-slate-700 font-sans">{savedAddrData.city}, {savedAddrData.state} - {savedAddrData.pincode}</p>
              {savedAddrData.mobileNumber && (
                <p className="text-slate-500 font-sans pt-1">📞 {savedAddrData.mobileNumber}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleAcceptSavedAddress}
                className="flex-1 py-3 px-4 bg-wagh-teal hover:bg-wagh-teal-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, use these details</span>
              </button>
              <button
                type="button"
                onClick={handleDeclineSavedAddress}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                No, use another
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
