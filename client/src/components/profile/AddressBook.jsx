import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle, Home, Briefcase, Star, X, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { addressSchema, sanitizeText } from '../../validations/profileSchema';

export function AddressBook({ addresses = [], onSaveAddresses }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  const { addToast } = useToast();

  const resetForm = () => {
    setFormData({
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: addresses.length === 0, // default if first address
    });
    setErrors({});
    setEditingId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setFormData({
      label: addr.label || 'Home',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      isDefault: !!addr.isDefault,
    });
    setErrors({});
    setEditingId(addr.id);
    setIsModalOpen(true);
  };

  const validate = () => {
    const parseResult = addressSchema.safeParse(formData);
    if (!parseResult.success) {
      const errs = {};
      parseResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (!errs[fieldName]) {
          errs[fieldName] = issue.message;
        }
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fill out all required address fields correctly.', 'error');
      return;
    }

    setSaving(true);

    const addressId =
      editingId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `addr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

    const newAddressObj = {
      id: addressId,
      label: sanitizeText(formData.label),
      line1: sanitizeText(formData.line1),
      line2: sanitizeText(formData.line2),
      city: sanitizeText(formData.city),
      state: sanitizeText(formData.state),
      pincode: formData.pincode.replace(/\D/g, ''),
      isDefault: formData.isDefault || addresses.length === 0,
    };

    let updatedList = [];
    if (editingId) {
      updatedList = addresses.map((item) => (item.id === editingId ? newAddressObj : item));
    } else {
      updatedList = [...addresses, newAddressObj];
    }

    // Enforce ONLY one address isDefault: true at a time
    if (newAddressObj.isDefault) {
      updatedList = updatedList.map((item) => ({
        ...item,
        isDefault: item.id === addressId,
      }));
    } else {
      // If no default exists at all, ensure at least first address is default
      const hasDefault = updatedList.some((item) => item.isDefault);
      if (!hasDefault && updatedList.length > 0) {
        updatedList[0].isDefault = true;
      }
    }

    // Optimistic UI response: close modal and reset form immediately!
    setIsModalOpen(false);
    resetForm();
    addToast(editingId ? 'Address updated!' : 'Address added!', 'success');

    // Perform Firestore write in background without blocking UI modal
    onSaveAddresses(updatedList).then((res) => {
      if (res && !res.success) {
        addToast(res.message || 'Failed to sync address to server.', 'error');
      }
    }).catch((err) => {
      console.error('Background address save error:', err);
      addToast('Error saving address to cloud.', 'error');
    });
  };

  const handleDeleteAddress = async (idToDelete) => {
    let updatedList = addresses.filter((item) => item.id !== idToDelete);

    // If we deleted default address and remaining addresses exist, make first one default
    if (updatedList.length > 0) {
      const hasDefault = updatedList.some((item) => item.isDefault);
      if (!hasDefault) {
        updatedList[0].isDefault = true;
      }
    }

    setDeleteConfirmId(null);
    addToast('Address deleted.', 'info');

    // Perform Firestore write in background
    onSaveAddresses(updatedList).then((res) => {
      if (res && !res.success) {
        addToast(res.message || 'Failed to delete address on server.', 'error');
      }
    }).catch((err) => {
      console.error('Background address delete error:', err);
      addToast('Error deleting address on cloud.', 'error');
    });
  };

  const handleSetDefault = async (addrId) => {
    const updatedList = addresses.map((item) => ({
      ...item,
      isDefault: item.id === addrId,
    }));
    try {
      const res = await onSaveAddresses(updatedList);
      if (res && res.success) {
        addToast('Default delivery address updated.', 'success');
      }
    } catch (err) {
      console.error('Set default address error:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-wagh-border p-6 sm:p-8 shadow-soft space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-wagh-border pb-4">
        <div>
          <h3 className="font-editorial text-xl font-bold text-wagh-dark">Saved Delivery Addresses</h3>
          <p className="text-xs text-wagh-muted font-mono-tag">Manage shipping destinations for quick checkout</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-full bg-wagh-teal text-white font-extrabold text-xs hover:bg-wagh-teal-dark transition-all duration-200 shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards List */}
      {addresses.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-wagh-border rounded-2xl p-6 bg-gray-50/50">
          <MapPin className="w-10 h-10 text-wagh-muted mx-auto mb-3" />
          <p className="font-semibold text-wagh-dark text-base">No addresses saved yet</p>
          <p className="text-xs text-wagh-muted mt-1 max-w-sm mx-auto">
            Add a home or office address to save time during checkout on your WAGH orders.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 px-5 py-2 rounded-full bg-wagh-teal/10 text-wagh-teal font-bold text-xs hover:bg-wagh-teal hover:text-white transition-colors"
          >
            + Add First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between space-y-4 ${
                addr.isDefault
                  ? 'border-wagh-teal bg-wagh-teal/5 shadow-sm'
                  : 'border-wagh-border hover:border-wagh-teal/50 bg-white'
              }`}
            >
              <div className="space-y-2 min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="px-2.5 py-0.5 rounded-md bg-wagh-dark text-white font-mono-tag font-bold text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded-md bg-wagh-gold text-wagh-dark font-mono-tag font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 fill-wagh-dark" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(addr)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(addr.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm font-medium text-wagh-dark leading-relaxed space-y-0.5">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p className="text-wagh-muted">{addr.line2}</p>}
                  <p className="text-xs text-wagh-muted font-mono-tag pt-1">
                    {addr.city}, {addr.state} - <span className="font-bold text-wagh-dark">{addr.pincode}</span>
                  </p>
                </div>
              </div>

              {!addr.isDefault && (
                <div className="pt-2 border-t border-wagh-border/60">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-mono-tag font-bold text-wagh-teal hover:underline flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Set as default address</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-wagh-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-wagh-border space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h4 className="font-editorial text-xl font-bold text-wagh-dark">
                {editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
                  Address Label <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormData({ ...formData, label: lbl })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono-tag font-bold transition-all ${
                        formData.label === lbl
                          ? 'bg-wagh-teal text-white shadow-sm'
                          : 'bg-gray-100 text-wagh-dark hover:bg-gray-200'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Custom Tag"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-wagh-border text-xs focus:outline-none focus:ring-1 focus:ring-wagh-teal"
                  />
                </div>
                {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
              </div>

              {/* Line 1 */}
              <div>
                <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
                  Address Line 1 (Flat, House No, Building) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Wagh residency"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
                {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
              </div>

              {/* Line 2 */}
              <div>
                <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
                  Address Line 2 (Street, Area, Landmark)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near SG Highway"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ahmedabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Gujarat"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
                  Pincode (6 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="380015"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full p-3 rounded-xl border border-wagh-border text-sm font-mono-tag focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>

              {/* Default Address Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-wagh-teal focus:ring-wagh-teal"
                />
                <label htmlFor="isDefault" className="text-xs font-semibold text-wagh-dark cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-full bg-gray-100 text-wagh-dark text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-wagh-teal text-white text-xs font-extrabold hover:bg-wagh-teal-dark transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-wagh-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-wagh-border space-y-4 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-editorial text-lg font-bold text-wagh-dark">Delete Address?</h4>
              <p className="text-xs text-wagh-muted mt-1">
                Are you sure you want to delete this address from your saved address book?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-gray-100 text-wagh-dark text-xs font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAddress(deleteConfirmId)}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressBook;
