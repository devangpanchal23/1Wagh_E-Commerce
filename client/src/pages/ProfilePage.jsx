import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileDetailsForm } from '../components/profile/ProfileDetailsForm';
import { AddressBook } from '../components/profile/AddressBook';
import { ShieldCheck, AlertCircle, RefreshCw, LogOut, Package, Heart, User as UserIcon, Receipt, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { fetchApi } from '../api';

export function ProfilePage() {
  const { user, logout, profileLoading, profileError, updateUserProfile, refreshProfile } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);

  // Tab state: 'profile' | 'orders' | 'wishlist'
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sync local profile state from AuthContext once MongoDB data is loaded
  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  // Load orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      const loadOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await fetchApi('/orders/myorders');
          if (res && res.success) {
            setOrders(res.data || []);
          }
        } catch (e) {
          console.error('Error fetching order history:', e);
        } finally {
          setLoadingOrders(false);
        }
      };
      loadOrders();
    }
  }, [activeTab, user]);

  // Handler to update profile details (email, phone, birthdate, age, gender)
  const handleSaveDetails = async (updatedFields) => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const previousProfile = profile;
    setProfile((prev) => ({ ...prev, ...updatedFields }));

    try {
      const res = await updateUserProfile(updatedFields);
      if (res?.success) {
        setProfile((prev) => ({
          ...prev,
          ...updatedFields,
          phone: updatedFields.phone || prev?.phone || '',
          phoneNumber: updatedFields.phone || prev?.phoneNumber || '',
          mobileNumber: updatedFields.phone || prev?.mobileNumber || '',
        }));
      } else {
        setProfile(previousProfile);
      }
      return res;
    } catch (err) {
      console.error('Error saving profile details:', err);
      setProfile(previousProfile);
      return { success: false, message: err.message || 'Failed to update profile.' };
    }
  };

  // Handler to update profile image URL
  const handleUpdateProfileImage = async (imageUrl) => {
    if (!user) return;

    setProfile((prev) => ({ ...prev, profileImageUrl: imageUrl }));
    try {
      await updateUserProfile({ profileImageUrl: imageUrl });
    } catch (err) {
      console.error('Error updating profile photo:', err);
    }
  };

  // Handler to save updated address array
  const handleSaveAddresses = async (newAddresses) => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const previousAddresses = profile?.addresses || [];
    setProfile((prev) => ({ ...prev, addresses: newAddresses }));

    try {
      const res = await updateUserProfile({ addresses: newAddresses });
      if (res?.success) {
        setProfile((prev) => ({ ...prev, addresses: newAddresses }));
      } else {
        setProfile((prev) => ({ ...prev, addresses: previousAddresses }));
      }
      return res;
    } catch (err) {
      console.error('Error saving address book:', err);
      setProfile((prev) => ({ ...prev, addresses: previousAddresses }));
      return { success: false, message: err.message || 'Failed to save address.' };
    }
  };

  // Render Skeleton / Loading state until MongoDB profile is hydrated
  if ((profileLoading && !user?.profileLoaded) || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="bg-white p-8 rounded-3xl border border-wagh-border flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-wagh-border space-y-6">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Render Error state only when profile never loaded from database
  if (profileError && !user?.profileLoaded) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Unable to Access Private Workspace</h2>
          <p className="text-sm text-wagh-muted">{profileError}</p>
        </div>
        <button
          onClick={() => refreshProfile().then(() => window.location.reload())}
          className="px-6 py-3 rounded-full bg-wagh-teal text-white text-xs font-bold hover:bg-wagh-teal-dark transition-all inline-flex items-center gap-2 shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading Profile</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <ProfileHeader
        profile={profile}
        user={user}
        onUpdateProfileImage={handleUpdateProfileImage}
      />

      {/* Main Content Tabs & Actions */}
      <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row border-b border-wagh-border bg-gray-50/80 px-3 sm:px-6 justify-between items-stretch sm:items-center gap-2">
          <div className="flex items-center overflow-x-auto custom-scrollbar flex-1 whitespace-nowrap -mb-[1px]">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 sm:py-4 px-3 sm:px-5 font-mono-tag text-[11px] sm:text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'profile'
                  ? 'border-wagh-teal text-wagh-teal bg-white shadow-xs'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Profile & Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 sm:py-4 px-3 sm:px-5 font-mono-tag text-[11px] sm:text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'orders'
                  ? 'border-wagh-teal text-wagh-teal bg-white shadow-xs'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-3 sm:py-4 px-3 sm:px-5 font-mono-tag text-[11px] sm:text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'wishlist'
                  ? 'border-wagh-teal text-wagh-teal bg-white shadow-xs'
                  : 'border-transparent text-wagh-muted hover:text-wagh-dark'
              }`}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Wishlist ({wishlist.length})</span>
            </button>
          </div>

          <div className="py-2 flex items-center justify-end shrink-0">
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-full bg-red-50 text-wagh-error font-mono-tag text-xs font-bold hover:bg-red-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* TAB 1: Profile Details & Address Book */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <ProfileDetailsForm
                profile={profile}
                onSaveDetails={handleSaveDetails}
              />

              <AddressBook
                addresses={profile?.addresses || []}
                onSaveAddresses={handleSaveAddresses}
              />

              {/* Security Privacy Callout */}
              <div className="p-4 rounded-2xl bg-wagh-teal/5 border border-wagh-teal/20 text-xs text-wagh-dark flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-wagh-teal shrink-0" />
                <span>
                  <strong>Data Privacy Guaranteed:</strong> Your profile data and address book are strictly protected by encrypted authentication & secure MongoDB database access. No unauthorized party or visitor can view or modify your data.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Order History */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {loadingOrders ? (
                <p className="text-xs font-mono-tag text-wagh-muted py-8 text-center">Loading your order history...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-10 h-10 text-wagh-muted mx-auto" />
                  <p className="text-lg font-semibold text-wagh-dark">No orders placed yet</p>
                  <p className="text-xs text-wagh-muted">Browse our collection of chargers, cables, and power banks.</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="mt-2 px-6 py-2.5 rounded-full bg-wagh-teal text-white text-xs font-bold shadow-md hover:bg-wagh-teal-dark transition-all"
                  >
                    Explore Shop
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className="p-6 rounded-2xl border border-wagh-border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-wagh-border pb-3 gap-2">
                      <div>
                        <span className="font-mono-tag font-bold text-wagh-teal text-sm">{order.orderNumber || order.orderId}</span>
                        <span className="text-xs text-wagh-muted block font-mono-tag">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 rounded-full bg-wagh-teal/10 text-wagh-teal text-xs font-mono-tag font-bold">
                          {order.orderStatus}
                        </span>
                        <span className="font-mono-tag font-extrabold text-wagh-dark">
                          ₹{order.total}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded bg-gray-50 border p-1" />
                          <div className="flex-1 truncate">
                            <span className="font-bold text-wagh-dark">{item.name}</span>
                            <span className="text-wagh-muted block">Qty: {item.qty} × ₹{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-wagh-border/60 flex flex-wrap items-center justify-end gap-2 text-xs">
                      <Link
                        to={`/orders/${order.orderNumber || order.orderId || order._id}/receipt/payment`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Payment Receipt</span>
                      </Link>
                      <Link
                        to={`/orders/${order.orderNumber || order.orderId || order._id}/receipt/invoice`}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tax Invoice</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div>
              {wishlist.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Heart className="w-10 h-10 text-wagh-muted mx-auto" />
                  <p className="text-base font-semibold text-wagh-dark">Your wishlist is empty</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="px-6 py-2.5 rounded-full bg-wagh-teal text-white text-xs font-bold"
                  >
                    Start Saving Items
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
