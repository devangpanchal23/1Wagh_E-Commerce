import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Percent, Lock, Unlock, Search, RefreshCw, UserCheck } from 'lucide-react';
import { fetchAdminApi } from '../../api';
import { useToast } from '../../context/ToastContext';

export function AdminCoupons() {
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minCartValue: '0',
    maxDiscountCap: '',
    expiryDate: '',
    usageLimit: '',
    usageLimitPerUser: '1',
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminApi('/admin/coupons');
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const defaultExpiry = tomorrow.toISOString().split('T')[0];

    setForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minCartValue: '0',
      maxDiscountCap: '',
      expiryDate: defaultExpiry,
      usageLimit: '',
      usageLimitPerUser: '1',
    });
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    const formattedDate = coupon.expiryDate
      ? new Date(coupon.expiryDate).toISOString().split('T')[0]
      : '';

    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue !== undefined ? String(coupon.discountValue) : '',
      minCartValue: coupon.minCartValue !== undefined ? String(coupon.minCartValue) : '0',
      maxDiscountCap: coupon.maxDiscountCap ? String(coupon.maxDiscountCap) : '',
      expiryDate: formattedDate,
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      usageLimitPerUser: coupon.usageLimitPerUser ? String(coupon.usageLimitPerUser) : '1',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.code.trim() || !form.discountValue || !form.expiryDate) {
      addToast('Please fill in Code, Discount Value, and Expiry Date.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minCartValue: Number(form.minCartValue || 0),
        maxDiscountCap: form.maxDiscountCap ? Number(form.maxDiscountCap) : null,
        expiryDate: form.expiryDate,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : 1,
      };

      if (editingCoupon) {
        const res = await fetchAdminApi(`/admin/coupons/${editingCoupon._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          addToast(`Coupon '${res.data.code}' updated successfully!`, 'success');
          setShowModal(false);
          loadCoupons();
        }
      } else {
        const res = await fetchAdminApi('/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          addToast(`Coupon '${res.data.code}' created as draft!`, 'success');
          setShowModal(false);
          loadCoupons();
        }
      }
    } catch (err) {
      addToast(err.message || 'Error saving coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (coupon) => {
    try {
      const res = await fetchAdminApi(`/admin/coupons/${coupon._id}/publish`, {
        method: 'PATCH',
      });
      if (res.success) {
        addToast(`Coupon '${coupon.code}' is now published & live!`, 'success');
        loadCoupons();
      }
    } catch (err) {
      addToast(err.message || 'Failed to publish coupon', 'error');
    }
  };

  const handleUnpublish = async (coupon) => {
    try {
      const res = await fetchAdminApi(`/admin/coupons/${coupon._id}/unpublish`, {
        method: 'PATCH',
      });
      if (res.success) {
        addToast(`Coupon '${coupon.code}' reverted to draft!`, 'info');
        loadCoupons();
      }
    } catch (err) {
      addToast(err.message || 'Failed to deactivate coupon', 'error');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${coupon.code}'?`)) return;
    try {
      const res = await fetchAdminApi(`/admin/coupons/${coupon._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        addToast(`Coupon '${coupon.code}' deleted.`, 'info');
        loadCoupons();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete coupon', 'error');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <span>Coupon & Promo Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, publish, and control per-user usage limits and cart value discount coupons.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2 font-sans text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p>Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3 font-sans text-xs">
            <Tag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No coupons found</p>
            <p>Click "Create Coupon" to add your first promotion discount code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min. Cart Value</th>
                  <th className="py-3.5 px-4">Max. Cap</th>
                  <th className="py-3.5 px-4">Per User Limit</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4">Usage (Used / Total)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredCoupons.map((coupon) => {
                    const isExpired = new Date() > new Date(coupon.expiryDate);
                    const isLimitReached = coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit;
                    const isDraft = coupon.status === 'draft';
                    const isPublished = coupon.status === 'published';

                    return (
                      <tr key={coupon._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono-tag font-bold text-slate-900">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80">
                            {coupon.code}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-800">
                          {coupon.discountType === 'percentage' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              {coupon.discountValue}% OFF
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              ₹{coupon.discountValue} FLAT
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-mono-tag">
                          ₹{(coupon.minCartValue || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono-tag">
                          {coupon.maxDiscountCap ? `₹${coupon.maxDiscountCap.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-medium">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            {coupon.usageLimitPerUser || 1} / user
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 font-mono-tag text-slate-700">
                          {coupon.usageCount || 0} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              EXPIRED
                            </span>
                          ) : isLimitReached ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              LIMIT REACHED
                            </span>
                          ) : isDraft ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              DRAFT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              PUBLISHED
                            </span>
                          )}
                        </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft ? (
                            <button
                              onClick={() => handlePublish(coupon)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition-all border border-emerald-200 cursor-pointer"
                              title="Publish Coupon"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(coupon)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px] font-bold transition-all border border-slate-200 cursor-pointer"
                              title="Revert to Draft"
                            >
                              Unpublish
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAVE20, WAGH100"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tag focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value ({form.discountType === 'percentage' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 200'}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Cart Value (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={form.minCartValue}
                    onChange={(e) => setForm({ ...form, minCartValue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional cap for %"
                    value={form.maxDiscountCap}
                    onChange={(e) => setForm({ ...form, maxDiscountCap: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Total cap"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Per User Limit *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1"
                    value={form.usageLimitPerUser}
                    onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Draft Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
