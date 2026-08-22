import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, ShieldCheck, Lock, Key, Package, ShoppingBag, Users, DollarSign,
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, LogOut, Calendar, Filter,
  Clock, TrendingUp, Search, ChevronDown, ChevronRight, CheckCircle, Truck, XCircle, X, Check, Ruler,
  Upload, Image as ImageIcon, Layers, Grid, ArrowUp, ArrowDown, FileText, List, Table, Crop, RefreshCw, HardDrive, Eye
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { fetchAdminApi } from '../api';
import { AdminLoginForm } from '../components/AdminLoginForm';
import { ImageCropModal } from '../components/admin/ImageCropModal';
import { GoogleDrivePickerButton } from '../components/GoogleDrivePickerButton';
import { AdminCoupons } from '../components/admin/AdminCoupons';
import { AdminCustomers } from '../components/admin/AdminCustomers';
import { Tag } from 'lucide-react';

// Custom Order Status Dropdown Component
function OrderStatusDropdown({ currentStatus, onStatusChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statuses = [
    {
      id: 'Processing',
      label: 'Processing',
      icon: Clock,
      colorClass: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
      badgeClass: 'bg-amber-100 text-amber-900',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'Shipped',
      label: 'Shipped',
      icon: Truck,
      colorClass: 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100',
      badgeClass: 'bg-blue-100 text-blue-900',
      dotColor: 'bg-blue-500',
    },
    {
      id: 'Delivered',
      label: 'Delivered (Completed)',
      icon: CheckCircle2,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:emerald-100',
      badgeClass: 'bg-emerald-100 text-emerald-900',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'Cancelled',
      label: 'Cancelled',
      icon: XCircle,
      colorClass: 'bg-rose-50 text-rose-800 border-rose-300 hover:rose-100',
      badgeClass: 'bg-rose-100 text-rose-900',
      dotColor: 'bg-rose-500',
    },
  ];

  const activeStatus = statuses.find(
    (s) => s.id === currentStatus || (s.id === 'Delivered' && currentStatus === 'Completed')
  ) || statuses[0];

  const ActiveIcon = activeStatus.icon;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${activeStatus.colorClass}`}
      >
        <span className={`w-2 h-2 rounded-full ${activeStatus.dotColor} animate-pulse`} />
        <ActiveIcon className="w-4 h-4 shrink-0" />
        <span className="font-sans">{activeStatus.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-fade-in p-1.5 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Update Order Status
          </div>
          {statuses.map((s) => {
            const SIcon = s.icon;
            const isSelected = s.id === activeStatus.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onStatusChange(s.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SIcon className="w-4 h-4 text-slate-500" />
                  <span>{s.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Admin() {

  const { addToast } = useToast();
  const navigate = useNavigate();

  // Product & Order Modal View States
  const [selectedViewProduct, setSelectedViewProduct] = useState(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Standalone Admin token & auth state (completely isolated from customer auth)
  const [adminAuthenticated, setAdminAuthenticated] = useState(
    () => !!(localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token'))
  );

  const [activeTab, setActiveTab] = useState('orders'); // orders | dashboard | products
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    lastYearRevenue: 0,
    lastYearTotalOrders: 0,
    lastYearCompletedOrders: 0,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Date Filtering & Categorization State
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'year' | 'last_year' | 'selected_day'
  const [selectedDate, setSelectedDate] = useState(''); // 'YYYY-MM-DD'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Product Form Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'images' | 'sections'
  const [imageSourceTab, setImageSourceTab] = useState('upload'); // 'upload' | 'gallery'

  // Image Upload, Gallery & Crop State
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [reCropIndex, setReCropIndex] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    category: '',
    brand: 'WAGH',
    stock: 100,
    images: [],
    outputPower: '',
    dimensions: '',
    size: '',
    warranty: '',
    compatibility: '',
    cableLength: '',
    height: '',
    width: '',
    color: '',
    material: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    hasVariants: false,
    variants: [],
    sections: [],
  });

  // Category Creation Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    try {
      setCreatingCategory(true);
      const res = await fetchAdminApi('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim(),
        }),
      });

      if (res.success && res.data) {
        addToast(`Category '${res.data.name}' ready!`, 'success');

        // Refresh categories list
        const catRes = await fetchAdminApi('/admin/categories');
        if (catRes && catRes.success) {
          setCategories(catRes.data);
        }

        // Auto select newly created category in product form
        setProductForm((prev) => ({
          ...prev,
          category: res.data._id || prev.category,
        }));

        setNewCategoryName('');
        setNewCategoryDesc('');
        setShowCategoryModal(false);
      }
    } catch (err) {
      addToast(err.message || 'Failed to create category', 'error');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category '${name}'?`)) return;
    try {
      const res = await fetchAdminApi(`/admin/categories/${id}`, { method: 'DELETE' });
      if (res.success) {
        addToast(`Category '${name}' deleted`, 'info');
        const catRes = await fetchAdminApi('/admin/categories');
        if (catRes && catRes.success) setCategories(catRes.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete category', 'error');
    }
  };



  const loadAdminData = async () => {
    setLoading(true);
    setDataError(null);
    try {
      const [statsRes, prodRes, orderRes, catRes] = await Promise.all([
        fetchAdminApi('/admin/stats'),
        fetchAdminApi('/admin/products'),
        fetchAdminApi('/admin/orders'),
        fetchAdminApi('/admin/categories'),
      ]);

      if (statsRes && statsRes.success) setStats(statsRes.data);
      if (prodRes && prodRes.success) setProducts(prodRes.data);
      if (orderRes && orderRes.success) setOrders(orderRes.data);
      if (catRes && catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setDataError(err.message || 'Failed to fetch admin dashboard data');
      if (err.message?.includes('token') || err.message?.includes('authorization') || err.message?.includes('expired')) {
        handleLockAdminSession();
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify token & initial fetch
  useEffect(() => {
    const checkAdminSession = async () => {
      const token = localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token');
      if (!token) {
        setAdminAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const verifyRes = await fetchAdminApi('/admin/verify');
        if (verifyRes && verifyRes.success) {
          setAdminAuthenticated(true);
          await loadAdminData();
        } else {
          handleLockAdminSession();
        }
      } catch (err) {
        handleLockAdminSession();
      }
    };

    checkAdminSession();
  }, []);

  const handleLockAdminSession = async () => {
    try {
      await fetchAdminApi('/admin/logout', { method: 'POST' }).catch(() => {});
    } catch (err) {
      // Ignore network error on logout
    }
    localStorage.removeItem('wagh_admin_token');
    sessionStorage.removeItem('wagh_admin_token');
    setAdminAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
    addToast('Admin portal session locked', 'info');
  };

  // Filter Orders Logic
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();

    // 1. Date Period Filter
    if (dateFilter === 'today') {
      const isToday =
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear();
      if (!isToday) return false;
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      if (orderDate < oneWeekAgo) return false;
    } else if (dateFilter === 'month') {
      const isThisMonth =
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear();
      if (!isThisMonth) return false;
    } else if (dateFilter === 'year') {
      if (orderDate.getFullYear() !== now.getFullYear()) return false;
    } else if (dateFilter === 'last_year') {
      if (orderDate.getFullYear() !== now.getFullYear() - 1) return false;
    } else if (dateFilter === 'selected_day' && selectedDate) {
      const formattedOrderDay = orderDate.toISOString().split('T')[0];
      if (formattedOrderDay !== selectedDate) return false;
    }

    // 2. Order Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Delivered' && !['Delivered', 'Completed'].includes(order.orderStatus)) return false;
      if (statusFilter !== 'Delivered' && order.orderStatus !== statusFilter) return false;
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = order.orderId?.toLowerCase().includes(query) || order.orderNumber?.toLowerCase().includes(query);
      const matchName = order.shippingAddress?.name?.toLowerCase().includes(query);
      const matchPhone = order.shippingAddress?.phone?.toLowerCase().includes(query);
      if (!matchId && !matchName && !matchPhone) return false;
    }

    return true;
  });

  // Categorize Orders by Date Group
  const categorizedOrders = filteredOrders.reduce((acc, order) => {
    const d = new Date(order.createdAt);
    const dateKey = d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (!acc[dateKey]) {
      acc[dateKey] = {
        dateString: dateKey,
        rawDate: d,
        totalSales: 0,
        completedCount: 0,
        orders: [],
      };
    }

    acc[dateKey].orders.push(order);
    acc[dateKey].totalSales += order.total || 0;
    if (['Delivered', 'Completed'].includes(order.orderStatus)) {
      acc[dateKey].completedCount += 1;
    }
    return acc;
  }, {});

  const dateGroups = Object.values(categorizedOrders).sort((a, b) => b.rawDate - a.rawDate);

  const filterPeriodSales = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const filterPeriodCompleted = filteredOrders.filter((o) => ['Delivered', 'Completed'].includes(o.orderStatus)).length;

  const handleLoginSuccess = async () => {
    setAdminAuthenticated(true);
    await loadAdminData();
  };

  if (!adminAuthenticated) {
    return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />;
  }


  const fetchMediaGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetchAdminApi('/admin/media');
      if (res && res.success) {
        setGalleryImages(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load media gallery:', err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const processImageFile = (file) => {
    if (!file) return;

    if (productForm.images?.length >= 4) {
      addToast('Maximum 4 images allowed per product.', 'error');
      return;
    }

    if (!/\.(jpg|jpeg|png|webp|svg)$/i.test(file.name) && !file.type?.startsWith('image/')) {
      addToast('Invalid file format. Please upload JPG, PNG, WEBP, or SVG images.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('File too large. Maximum size is 5MB.', 'error');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setReCropIndex(null);
    setShowCropModal(true);
  };

  const handleSelectLocalFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropModal(false);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', croppedFile);

      const token = localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token');
      const response = await fetch('/api/v1/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const res = await response.json();
      if (res && res.success) {
        addToast('Image uploaded successfully!', 'success');
        const newImgObj = {
          url: res.data.url,
          publicId: res.data.publicId,
          filename: res.data.filename,
          isPrimary: productForm.images.length === 0,
        };

        if (reCropIndex !== null) {
          const updated = [...productForm.images];
          updated[reCropIndex] = newImgObj;
          setProductForm((prev) => ({ ...prev, images: updated }));
        } else {
          setProductForm((prev) => ({ ...prev, images: [...prev.images, newImgObj] }));
        }
        await fetchMediaGallery();
      } else {
        addToast(res.message || 'Upload failed', 'error');
      }
    } catch (err) {
      addToast('Upload failed', 'error');
    } finally {
      setUploadingImage(false);
      setReCropIndex(null);
    }
  };

  const handleSelectGalleryImage = (mediaItem) => {
    if (productForm.images?.length >= 4) {
      addToast('Maximum 4 images allowed per product.', 'error');
      return;
    }

    const exists = productForm.images.some(
      (img) => (typeof img === 'string' ? img === mediaItem.url : img.url === mediaItem.url)
    );
    if (exists) {
      addToast('Image already added to gallery', 'info');
      return;
    }

    const newImgObj = {
      url: mediaItem.url,
      publicId: mediaItem.publicId,
      filename: mediaItem.filename,
      isPrimary: productForm.images.length === 0,
    };
    setProductForm((prev) => ({ ...prev, images: [...prev.images, newImgObj] }));
    addToast('Added image from Cloud gallery', 'success');
  };


  const handleSetPrimaryImage = (idx) => {
    const updated = productForm.images.map((img, i) => {
      const obj = typeof img === 'string' ? { url: img } : { ...img };
      return { ...obj, isPrimary: i === idx };
    });

    // Re-order so primary image is first
    const primaryItem = updated[idx];
    const rest = updated.filter((_, i) => i !== idx);
    setProductForm((prev) => ({ ...prev, images: [primaryItem, ...rest] }));
    addToast('Primary image updated', 'info');
  };

  const handleRemoveImage = (idx) => {
    const updated = productForm.images.filter((_, i) => i !== idx);
    setProductForm((prev) => ({ ...prev, images: updated }));
  };

  const handleReCropExisting = (imgItem, idx) => {
    const url = typeof imgItem === 'string' ? imgItem : imgItem.url;
    setCropImageSrc(url);
    setReCropIndex(idx);
    setShowCropModal(true);
  };

  const handleAddSection = (type = 'specifications') => {
    const newSection = {
      title: type === 'specifications' || type === 'table' ? 'Specifications' : type === 'keyFeatures' || type === 'list' ? 'Key Features' : 'Product Details',
      type: type,
      items: type !== 'text' && type !== 'details' ? [{ label: 'Feature', value: 'Details', order: 0 }] : [],
      content: '',
      order: (productForm.sections || []).length,
    };
    setProductForm((prev) => ({ ...prev, sections: [...(prev.sections || []), newSection] }));
  };


  const handleRemoveSection = (secIdx) => {
    setProductForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== secIdx),
    }));
  };

  const handleMoveSection = (secIdx, direction) => {
    const sections = [...productForm.sections];
    const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[secIdx];
    sections[secIdx] = sections[targetIdx];
    sections[targetIdx] = temp;
    setProductForm((prev) => ({ ...prev, sections }));
  };

  const handleAddVariantColor = () => {
    setProductForm((prev) => {
      const curVars = prev.variants || [];
      const newColorName = curVars.length === 0 ? 'Black' : curVars.length === 1 ? 'White' : `Color ${curVars.length + 1}`;
      const newHex = curVars.length === 0 ? '#000000' : curVars.length === 1 ? '#FFFFFF' : '#0F4B3F';
      const basePrice = Number(prev.price) || 499;
      const baseMrp = Number(prev.mrp) || 999;
      const baseStock = Number(prev.stock) || 50;

      return {
        ...prev,
        hasVariants: true,
        variants: [
          ...curVars,
          {
            variantId: null,
            color: { name: newColorName, hex: newHex, swatchImage: '' },
            images: prev.images.length > 0 ? [...prev.images] : [],
            sizes: [
              {
                sku: `WAGH-${newColorName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-1`,
                label: 'Standard',
                price: basePrice,
                mrp: baseMrp,
                stock: baseStock,
              },
            ],
          },
        ],
      };
    });
  };

  const handleRemoveVariantColor = (vIdx) => {
    setProductForm((prev) => {
      const updated = (prev.variants || []).filter((_, idx) => idx !== vIdx);
      return {
        ...prev,
        variants: updated,
        hasVariants: updated.length > 0,
      };
    });
  };

  const handleUpdateColorField = (vIdx, field, val) => {
    setProductForm((prev) => {
      const updated = [...(prev.variants || [])];
      updated[vIdx] = {
        ...updated[vIdx],
        color: {
          ...updated[vIdx].color,
          [field]: val,
        },
      };
      return { ...prev, variants: updated };
    });
  };

  const handleAddVariantSize = (vIdx) => {
    setProductForm((prev) => {
      const updated = [...(prev.variants || [])];
      const colorName = updated[vIdx]?.color?.name || 'VAR';
      const curSizes = updated[vIdx]?.sizes || [];
      const basePrice = Number(prev.price) || 499;
      const baseMrp = Number(prev.mrp) || 999;
      const baseStock = Number(prev.stock) || 50;

      const newSku = `WAGH-${colorName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${curSizes.length + 1}`;
      updated[vIdx] = {
        ...updated[vIdx],
        sizes: [
          ...curSizes,
          {
            sku: newSku,
            label: curSizes.length === 0 ? 'Standard' : curSizes.length === 1 ? '2M+2M' : `Option ${curSizes.length + 1}`,
            price: basePrice,
            mrp: baseMrp,
            stock: baseStock,
          },
        ],
      };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariantSize = (vIdx, sIdx) => {
    setProductForm((prev) => {
      const updated = [...(prev.variants || [])];
      updated[vIdx].sizes = updated[vIdx].sizes.filter((_, idx) => idx !== sIdx);
      return { ...prev, variants: updated };
    });
  };

  const handleUpdateSizeField = (vIdx, sIdx, field, val) => {
    setProductForm((prev) => {
      const updated = [...(prev.variants || [])];
      const curSizes = [...updated[vIdx].sizes];
      curSizes[sIdx] = {
        ...curSizes[sIdx],
        [field]: field === 'price' || field === 'mrp' || field === 'stock' ? Number(val) : val,
      };
      updated[vIdx].sizes = curSizes;
      return { ...prev, variants: updated };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        mrp: Number(productForm.mrp),
        category: productForm.category || categories[0]?._id || '',
        brand: productForm.brand,
        stock: Number(productForm.stock),
        images: productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
        specs: {
          outputPower: productForm.outputPower || '',
          dimensions: productForm.dimensions || '',
          size: productForm.size || '',
          warranty: productForm.warranty || '',
          compatibility: productForm.compatibility || '',
          cableLength: productForm.cableLength || '',
          height: productForm.height || '',
          width: productForm.width || '',
          color: productForm.color || '',
          material: productForm.material || '',
        },
        sections: productForm.sections || [],
        isFeatured: productForm.isFeatured,
        isNewArrival: productForm.isNewArrival,
        isBestSeller: productForm.isBestSeller,
        hasVariants: Boolean(productForm.hasVariants),
        variants: productForm.hasVariants ? productForm.variants : [],
      };

      let res;
      if (editingProductId) {
        res = await fetchAdminApi(`/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchAdminApi('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res && res.success) {
        addToast(editingProductId ? 'Product updated!' : 'Product created successfully!', 'success');
        setShowProductModal(false);
        setEditingProductId(null);
        const updated = await fetchAdminApi('/admin/products');
        if (updated && updated.success) setProducts(updated.data);
      }
    } catch (err) {
      addToast(err.message || 'Save failed', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetchAdminApi(`/admin/products/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        addToast('Product deleted', 'info');
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetchAdminApi(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (res && res.success) {
        addToast(`Order status updated to ${newStatus}`, 'success');
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (err) {
      addToast(err.message || 'Status update failed', 'error');
    }
  };


  const openCreateModal = () => {
    setEditingProductId(null);
    setModalTab('basic');
    setImageSourceTab('upload');

    setProductForm({
      name: '',
      description: '',
      price: '',
      mrp: '',
      category: categories[0]?._id || '',
      brand: 'WAGH',
      stock: 100,
      images: [],
      outputPower: '',
      dimensions: '',
      size: '',
      warranty: '',
      compatibility: '',
      cableLength: '',
      height: '',
      width: '',
      color: '',
      material: '',
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      hasVariants: false,
      variants: [],
      sections: []
    });
    fetchMediaGallery();
    setShowProductModal(true);
  };


  const openEditModal = (p) => {
    setEditingProductId(p._id);
    setModalTab('basic');
    setImageSourceTab('upload');
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price,
      mrp: p.mrp,
      category: p.category?._id || p.category,
      brand: p.brand || 'WAGH',
      stock: p.stock || 100,
      images: Array.isArray(p.images) ? p.images : [],
      outputPower: p.specs?.outputPower || '',
      dimensions: p.specs?.dimensions || '',
      size: p.specs?.size || '',
      warranty: p.specs?.warranty || '',
      compatibility: p.specs?.compatibility || '',
      cableLength: p.specs?.cableLength || '',
      height: p.specs?.height || '',
      width: p.specs?.width || '',
      color: p.specs?.color || '',
      material: p.specs?.material || '',
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
      isBestSeller: !!p.isBestSeller,
      hasVariants: !!p.hasVariants,
      variants: Array.isArray(p.variants) ? p.variants : [],
      sections: p.sections || []
    });

    fetchMediaGallery();
    setShowProductModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-wagh-border pb-4">
        <div>
          <h1 className="font-editorial text-3xl font-extrabold text-wagh-dark">WAGH Admin Dashboard</h1>
          <p className="text-xs font-mono-tag text-wagh-muted">Manage Products, Customer Orders & Catalog Inventory</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-wagh-teal/10 rounded-full border border-wagh-teal/20 text-xs font-semibold text-wagh-teal">
            <span className="w-2 h-2 rounded-full bg-wagh-teal animate-pulse" />
            <span>Administrator</span>
            <span className="font-mono-tag text-[10px] bg-wagh-teal text-white px-2 py-0.5 rounded-full uppercase tracking-wider">ADMIN</span>
          </div>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2.5 rounded-full bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Manage Categories ({categories.length})</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs hover:bg-wagh-teal-dark transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={handleLockAdminSession}
            className="px-4 py-2.5 rounded-full bg-red-50 text-wagh-error font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin Session</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW & LAST YEAR SALES ANALYTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1">
          <span className="text-[11px] font-mono-tag text-wagh-muted uppercase block">Total Revenue</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-teal">₹{stats.totalRevenue}</span>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">All-time store sales</span>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1">
          <span className="text-[11px] font-mono-tag text-wagh-muted uppercase block">Total Orders</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{stats.totalOrders}</span>
            <span className="text-[11px] text-emerald-600 font-bold font-mono-tag">({stats.completedOrders} Delivered)</span>
          </div>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">All customer orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1 bg-gradient-to-br from-white to-wagh-gold/10">
          <span className="text-[11px] font-mono-tag text-wagh-teal uppercase font-bold block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Last Year's Sales</span>
          </span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">₹{stats.lastYearRevenue}</span>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">
            {stats.lastYearCompletedOrders} completed of {stats.lastYearTotalOrders} orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-1">
          <span className="text-[11px] font-mono-tag text-wagh-muted uppercase block">Active Catalog</span>
          <span className="font-mono-tag text-2xl font-extrabold text-wagh-dark">{products.length} Products</span>
          <span className="text-[10px] text-wagh-muted block font-mono-tag">{stats.totalCustomers} Customers</span>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
        <div className="flex border-b border-wagh-border bg-gray-50 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Order Timeline & Tracking ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Overview & Recent Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'products' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'customers' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <Users className="w-4 h-4 text-wagh-teal" />
            <span>Customers ({stats.totalCustomers || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeTab === 'coupons' ? 'border-b-2 border-wagh-teal text-wagh-teal bg-white shadow-xs' : 'text-wagh-muted hover:text-wagh-dark'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-500" />
            <span>Coupons & Discount System</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'customers' && <AdminCustomers />}
          {activeTab === 'coupons' && <AdminCoupons />}
          
          {/* TAB 1: ORDER TIMELINE & CATEGORIZED TRACKING VIEW */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* TIMELINE FILTERS TOOLBAR */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-wagh-border space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono-tag font-bold text-wagh-dark">
                    <Filter className="w-4 h-4 text-wagh-teal" />
                    <span>TIMELINE & DATE FILTERS:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Period Selector */}
                    <div className="relative">
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-wagh-border text-xs font-mono-tag font-bold bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal cursor-pointer"
                      >
                        <option value="all">All Time Timeline</option>
                        <option value="today">Today (Day)</option>
                        <option value="week">This Week (Weekly)</option>
                        <option value="month">This Month (Monthly)</option>
                        <option value="year">Whole Year (This Year)</option>
                        <option value="last_year">Last Year Sales</option>
                        <option value="selected_day">Selected Day (Date Picker)</option>
                      </select>
                    </div>

                    {/* Selected Day Date Picker */}
                    {dateFilter === 'selected_day' && (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3.5 py-1.5 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                      />
                    )}

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered / Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders by Order ID (e.g. WAGH-12345), customer name, or mobile number..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                  />
                </div>
              </div>

              {/* TIMELINE PERIOD METRICS SUMMARY BAR */}
              <div className="p-4 rounded-2xl bg-wagh-teal/5 border border-wagh-teal/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tag">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-wagh-teal" />
                  <span className="font-bold text-wagh-dark">
                    Showing {filteredOrders.length} Order(s) for Selected Filter
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span>Period Sales: <strong className="text-wagh-teal font-extrabold text-sm">₹{filterPeriodSales}</strong></span>
                  <span>Completed: <strong className="text-emerald-700 font-extrabold">{filterPeriodCompleted}</strong></span>
                </div>
              </div>

              {/* CATEGORIZED ORDER TIMELINE GROUPS */}
              {dateGroups.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-wagh-border">
                  <Clock className="w-10 h-10 text-wagh-muted mx-auto" />
                  <p className="text-base font-semibold text-wagh-dark">No orders matching the selected timeline filters</p>
                  <p className="text-xs text-wagh-muted">Try selecting a different date range, status, or clearing your search term.</p>
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                      setSelectedDate('');
                    }}
                    className="px-5 py-2 rounded-full bg-wagh-teal text-white text-xs font-bold shadow-xs hover:bg-wagh-teal-dark transition-all"
                  >
                    Reset Timeline Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {dateGroups.map((group) => (
                    <div key={group.dateString} className="space-y-4">
                      {/* DATE GROUP HEADER BANNER */}
                      <div className="bg-slate-50/90 border border-slate-200/90 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-wagh-teal/10 border border-wagh-teal/20 flex items-center justify-center text-wagh-teal shrink-0 shadow-2xs">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-base tracking-tight font-sans">
                                {group.dateString}
                              </h4>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wagh-teal/10 text-wagh-teal font-semibold text-xs border border-wagh-teal/20">
                                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                <span>{group.orders.length} {group.orders.length === 1 ? 'Order' : 'Orders'}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">Daily Orders Timeline</p>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 shadow-2xs self-start sm:self-auto">
                          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs text-emerald-700 font-medium font-sans">Day Sales Total:</span>
                          <span className="font-extrabold text-base text-emerald-800 font-sans tracking-tight">
                            ₹{group.totalSales?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* DATE GROUP ORDERS LIST */}
                      <div className="space-y-4">
                        {group.orders.map((o) => (
                          <div
                            key={o._id}
                            className="bg-white p-5 rounded-2xl border border-wagh-border shadow-soft space-y-4 hover:border-wagh-teal/40 transition-all"
                          >
                            {/* Order Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-wagh-border pb-3 gap-2 text-xs">
                              <div className="flex items-center gap-3">
                                <span className="font-mono-tag font-extrabold text-wagh-teal text-base">{o.orderNumber || o.orderId}</span>
                                <span className="text-[11px] text-wagh-muted font-sans font-medium flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-slate-100 font-sans text-xs font-semibold text-slate-700">
                                  {o.paymentMethod || 'COD'} ({o.paymentStatus || 'Pending'})
                                </span>

                                <span className="font-sans font-extrabold text-wagh-dark text-base">
                                  ₹{o.total?.toLocaleString('en-IN')}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderModal(o)}
                                  className="px-3 py-1.5 rounded-xl bg-wagh-teal/10 hover:bg-wagh-teal hover:text-white text-wagh-teal font-extrabold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Details</span>
                                </button>
                              </div>
                            </div>

                            {/* Customer & Status Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                              <div>
                                <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider mb-1">Customer Details</span>
                                <span className="font-bold text-slate-900 text-sm block">{o.shippingAddress?.name || 'Customer'}</span>
                                <span className="text-slate-600 block">{o.shippingAddress?.phone}</span>
                                <span className="text-slate-500 text-[11px] block mt-0.5">{o.shippingAddress?.street}, {o.shippingAddress?.city}, {o.shippingAddress?.state} - {o.shippingAddress?.pincode}</span>
                              </div>

                              <div className="flex flex-col justify-center sm:items-end gap-1.5">
                                <label className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Update Order Status</label>
                                <OrderStatusDropdown
                                  currentStatus={o.orderStatus}
                                  onStatusChange={(newStatus) => handleUpdateOrderStatus(o._id, newStatus)}
                                />
                              </div>
                            </div>

                            {/* Ordered Items List */}
                            <div className="border-t border-wagh-border/60 pt-3 space-y-2">
                              <span className="text-[11px] font-mono-tag font-bold text-wagh-muted uppercase block">
                                Order Items ({o.items?.length || 0}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {o.items?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-wagh-border text-xs">
                                    <img src={item.image} alt={item.name} className="w-9 h-9 object-contain bg-white rounded border p-0.5 shrink-0" />
                                    <div className="truncate flex-1">
                                      <span className="font-bold text-wagh-dark block truncate">{item.name}</span>
                                      <span className="text-[11px] text-wagh-muted block font-mono-tag">
                                        Qty: {item.qty} × ₹{item.price}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: OVERVIEW & RECENT ACTIVITY */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="font-editorial text-xl font-bold text-wagh-dark">Recent Customer Orders Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-tag">
                  <thead className="bg-gray-100 uppercase text-wagh-muted">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wagh-border">
                    {orders.slice(0, 10).map((o) => (
                      <tr key={o._id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-wagh-teal">{o.orderNumber || o.orderId}</td>
                        <td className="p-3 font-medium text-wagh-dark">{o.shippingAddress?.name || 'Customer'}</td>
                        <td className="p-3 font-bold">₹{o.total}</td>
                        <td className="p-3">{o.paymentMethod} ({o.paymentStatus})</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-wagh-teal/10 text-wagh-teal font-bold">
                            {o.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS CATALOG CRUD */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Image</th>
                      <th className="py-3.5 px-4">Product Details</th>
                      <th className="py-3.5 px-4">Size & Dimensions</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">MRP</th>
                      <th className="py-3.5 px-4">Stock Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {products.map((p) => {
                      const isLowStock = p.stock < 10;
                      return (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <img src={p.images?.[0]} alt={p.name} className="max-w-full max-h-full object-contain" />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1 max-w-xs sm:max-w-md">
                              <span className="font-bold text-slate-900 text-sm block leading-tight">{p.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                  {p.brand || 'WAGH'}
                                </span>
                                {p.isFeatured && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
                              <Ruler className="w-3.5 h-3.5 text-wagh-teal shrink-0" />
                              <span>{p.specs?.dimensions || p.specs?.size || 'Standard'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-wagh-teal text-sm">₹{p.price?.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-slate-400 line-through text-xs font-medium">₹{p.mrp?.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {p.stock} in stock
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedViewProduct(p)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white border border-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-50 text-wagh-teal hover:bg-wagh-teal hover:text-white border border-teal-200/60 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p._id)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200/60 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PRODUCT EDIT / CREATE MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-wagh-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-6 border border-wagh-border shadow-2xl">
            
            {/* Modal Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-editorial text-2xl font-bold text-wagh-dark">
                  {editingProductId ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-xs text-slate-500 font-sans">Manage product specifications, media assets, and structured details</p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => setModalTab('basic')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${
                    modalTab === 'basic' ? 'bg-white text-wagh-teal shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('images')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    modalTab === 'images' ? 'bg-white text-wagh-teal shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Images ({productForm.images?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('variants')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    modalTab === 'variants' ? 'bg-white text-wagh-teal shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Variants ({productForm.variants?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('sections')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    modalTab === 'sections' ? 'bg-white text-wagh-teal shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sections ({productForm.sections?.length || 0})</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs font-medium font-sans">
              
              {/* TAB 1: BASIC INFO & PRICING */}
              {modalTab === 'basic' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-semibold">Category *</label>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-[11px] font-bold text-wagh-teal hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Category
                        </button>
                      </div>
                      <select
                        required
                        value={productForm.category || categories[0]?._id || ''}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-wagh-teal font-sans text-xs bg-white"
                      >
                        {categories.length === 0 ? (
                          <option value="">Default / General</option>
                        ) : (
                          categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Brand</label>
                      <input
                        type="text"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-sans focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">MRP (₹)</label>
                      <input
                        type="number"
                        required
                        value={productForm.mrp}
                        onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-sans focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Stock Qty</label>
                      <input
                        type="number"
                        required
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-sans focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Dimensions (Height × Width × Depth)</label>
                      <input
                        type="text"
                        placeholder="e.g. 12.5 × 6.5 × 2.1 cm"
                        value={productForm.dimensions}
                        onChange={(e) => setProductForm({ ...productForm, dimensions: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Product Size / Height & Width</label>
                      <input
                        type="text"
                        placeholder="e.g. Height: 12.5 cm | Width: 6.5 cm"
                        value={productForm.size}
                        onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-wagh-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Short Summary / Description</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Enter product description or bullet points on new lines (e.g. • Feature 1)"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-wagh-teal text-xs font-sans"
                    />

                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isFeatured}
                        onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                        className="w-4 h-4 text-wagh-teal rounded"
                      />
                      <span>Featured</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isNewArrival}
                        onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                        className="w-4 h-4 text-wagh-teal rounded"
                      />
                      <span>New Arrival</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isBestSeller}
                        onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                        className="w-4 h-4 text-wagh-teal rounded"
                      />
                      <span>Best Seller</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGE GALLERY & UPLOAD (TASKS 1 & 3) */}
              {modalTab === 'images' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Source Selector: Upload New vs Choose from Cloud */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Add Image Source:</span>
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setImageSourceTab('upload')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            imageSourceTab === 'upload' ? 'bg-wagh-teal text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Upload New (Local)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageSourceTab('gallery');
                            fetchMediaGallery();
                          }}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            imageSourceTab === 'gallery' ? 'bg-wagh-teal text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Choose from Cloud Gallery
                        </button>
                      </div>
                    </div>


                    {/* Path 2: Local Upload & Crop Trigger */}
                    {imageSourceTab === 'upload' && (

                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-wagh-teal transition-all bg-white space-y-3">
                        <Upload className="w-8 h-8 text-wagh-teal mx-auto animate-bounce" />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Drag & drop product image here, or browse file</p>
                          <p className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP up to 5MB. Includes in-browser crop editor.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wagh-teal text-white font-bold text-xs cursor-pointer shadow-xs hover:bg-wagh-teal-dark transition-colors">
                          <span>Select Local File</span>
                          <input type="file" accept="image/*" onChange={handleSelectLocalFile} className="hidden" />
                        </label>
                      </div>
                    )}

                    {/* Path 2: Choose from Media Gallery Grid */}
                    {imageSourceTab === 'gallery' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>Select from Previously Uploaded Images ({galleryImages.length}):</span>
                          <button
                            type="button"
                            onClick={fetchMediaGallery}
                            className="text-wagh-teal flex items-center gap-1 hover:underline text-[11px]"
                          >
                            <RefreshCw className="w-3 h-3" /> Refresh
                          </button>
                        </div>

                        {loadingGallery ? (
                          <div className="py-8 text-center text-slate-400 text-xs">Loading media gallery...</div>
                        ) : galleryImages.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">No uploaded media images found in gallery.</div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 custom-gallery-scrollbar pr-2">
                            {galleryImages.map((media) => (
                              <div
                                key={media.publicId}
                                onClick={() => handleSelectGalleryImage(media)}
                                className="group relative aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden cursor-pointer hover:border-wagh-teal hover:shadow-md transition-all p-1"
                              >
                                <img src={media.url} alt={media.filename} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-wagh-teal/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                  + Select
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active Product Gallery List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Product Gallery Images ({productForm.images?.length || 0}):</span>
                      <span className="text-[11px] text-slate-400">First image is used as primary thumbnail</span>
                    </div>

                    {productForm.images?.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                        No product images attached yet. Use the upload or gallery options above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {productForm.images.map((img, idx) => {
                          const imgUrl = typeof img === 'string' ? img : img.url;
                          const isPrimary = typeof img === 'string' ? idx === 0 : (img.isPrimary || idx === 0);

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border bg-white space-y-2 relative transition-all ${
                                isPrimary ? 'border-wagh-teal shadow-xs ring-1 ring-wagh-teal/30' : 'border-slate-200'
                              }`}
                            >
                              <div className="relative aspect-square rounded-xl bg-slate-50 border overflow-hidden p-1 flex items-center justify-center">
                                <img src={imgUrl} alt={`Product ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                                {isPrimary && (
                                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-wagh-teal text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                                    Primary
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                                {!isPrimary ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(idx)}
                                    className="text-wagh-teal font-bold hover:underline"
                                  >
                                    Set Primary
                                  </button>
                                ) : (
                                  <span className="text-emerald-600 font-bold text-[10px]">Active Primary</span>
                                )}

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleReCropExisting(img, idx)}
                                    className="p-1 rounded bg-slate-100 text-slate-700 hover:bg-wagh-teal hover:text-white"
                                    title="Crop / Edit Image"
                                  >
                                    <Crop className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                                    title="Remove Image"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: PRODUCT VARIANTS (COLOR + SIZE/LENGTH) */}
              {modalTab === 'variants' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50/80 border border-teal-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Product Variants System (Color + Size)</h4>
                      <p className="text-slate-500 text-xs">Enable multi-color and size/length variants like Amazon.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!productForm.hasVariants && (!productForm.variants || productForm.variants.length === 0)) {
                          handleAddVariantColor();
                        } else {
                          setProductForm((prev) => ({ ...prev, hasVariants: !prev.hasVariants }));
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        productForm.hasVariants
                          ? 'bg-[#0f4b3f] text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {productForm.hasVariants ? '✓ Variants Enabled' : '+ Enable Variants'}
                    </button>
                  </div>

                  {productForm.hasVariants && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">
                          Color Variants ({productForm.variants?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={handleAddVariantColor}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0f4b3f] text-white text-xs font-bold hover:bg-[#0a352c] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Color Variant</span>
                        </button>
                      </div>

                      {(!productForm.variants || productForm.variants.length === 0) && (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                          <p className="text-slate-500 font-medium text-xs">No color variants added yet.</p>
                          <button
                            type="button"
                            onClick={handleAddVariantColor}
                            className="px-4 py-2 rounded-xl bg-wagh-teal text-white text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Color Variant</span>
                          </button>
                        </div>
                      )}

                      {productForm.variants?.map((v, vIdx) => (
                        <div key={v.variantId || vIdx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: v.color?.hex || '#0f4b3f' }}
                              />
                              <span>Color Variant #{vIdx + 1}: {v.color?.name || 'Unnamed'}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveVariantColor(vIdx)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Color</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-700 mb-1 font-semibold">Color Name *</label>
                              <input
                                type="text"
                                value={v.color?.name || ''}
                                onChange={(e) => handleUpdateColorField(vIdx, 'name', e.target.value)}
                                placeholder="e.g. Midnight Black, Deep Teal"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-wagh-teal"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-700 mb-1 font-semibold">Hex Code *</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={v.color?.hex || '#000000'}
                                  onChange={(e) => handleUpdateColorField(vIdx, 'hex', e.target.value)}
                                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  value={v.color?.hex || '#000000'}
                                  onChange={(e) => handleUpdateColorField(vIdx, 'hex', e.target.value)}
                                  placeholder="#000000"
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sizes / Length Options Table */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                Size / Length Options ({v.sizes?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddVariantSize(vIdx)}
                                className="px-3 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Size</span>
                              </button>
                            </div>

                            {(!v.sizes || v.sizes.length === 0) && (
                              <p className="text-xs text-rose-600 italic">At least 1 size is required for this color variant.</p>
                            )}

                            <div className="space-y-2">
                              {v.sizes?.map((s, sIdx) => (
                                <div key={s.sku || sIdx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                  <div className="col-span-3">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Size Label</label>
                                    <input
                                      type="text"
                                      value={s.label || ''}
                                      onChange={(e) => handleUpdateSizeField(vIdx, sIdx, 'label', e.target.value)}
                                      placeholder="e.g. 2M+2M"
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase">SKU (Unique)</label>
                                    <input
                                      type="text"
                                      value={s.sku || ''}
                                      onChange={(e) => handleUpdateSizeField(vIdx, sIdx, 'sku', e.target.value)}
                                      placeholder="SKU-123"
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Price (₹)</label>
                                    <input
                                      type="number"
                                      value={s.price}
                                      onChange={(e) => handleUpdateSizeField(vIdx, sIdx, 'price', e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase">MRP (₹)</label>
                                    <input
                                      type="number"
                                      value={s.mrp}
                                      onChange={(e) => handleUpdateSizeField(vIdx, sIdx, 'mrp', e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Stock</label>
                                    <input
                                      type="number"
                                      value={s.stock}
                                      onChange={(e) => handleUpdateSizeField(vIdx, sIdx, 'stock', e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                    />
                                  </div>
                                  <div className="col-span-1 flex justify-end pt-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariantSize(vIdx, sIdx)}
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                                      title="Remove Size"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STRUCTURED PRODUCT DETAILS & SPECIFICATIONS */}
              {modalTab === 'sections' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Block 1: 10 Recommended & Optional Specifications Grid */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-wagh-teal" />
                          <span>Product Specifications (Optional & Recommended)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">Fill in any attributes relevant to this product. Empty fields stay empty or show fallback.</p>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-wagh-teal/10 text-wagh-teal rounded-lg">10 Attributes</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Output Power</label>
                        <input
                          type="text"
                          placeholder="e.g. 45W PPS Super Fast"
                          value={productForm.outputPower || ''}
                          onChange={(e) => setProductForm({ ...productForm, outputPower: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions</label>
                        <input
                          type="text"
                          placeholder="e.g. 12.5 × 6.5 × 2.1 cm"
                          value={productForm.dimensions || ''}
                          onChange={(e) => setProductForm({ ...productForm, dimensions: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Size / Form Factor</label>
                        <input
                          type="text"
                          placeholder="e.g. Height: 12.5 cm | Width: 6.5 cm"
                          value={productForm.size || ''}
                          onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Warranty</label>
                        <input
                          type="text"
                          placeholder="e.g. 6 Months Replacement"
                          value={productForm.warranty || ''}
                          onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Compatibility</label>
                        <input
                          type="text"
                          placeholder="e.g. Universal, iPhone 15/16, Samsung S24"
                          value={productForm.compatibility || ''}
                          onChange={(e) => setProductForm({ ...productForm, compatibility: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cable Length</label>
                        <input
                          type="text"
                          placeholder="e.g. 1.2 Meters / 4 Feet"
                          value={productForm.cableLength || ''}
                          onChange={(e) => setProductForm({ ...productForm, cableLength: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Height</label>
                        <input
                          type="text"
                          placeholder="e.g. 12.5 cm"
                          value={productForm.height || ''}
                          onChange={(e) => setProductForm({ ...productForm, height: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Width</label>
                        <input
                          type="text"
                          placeholder="e.g. 6.5 cm"
                          value={productForm.width || ''}
                          onChange={(e) => setProductForm({ ...productForm, width: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Color</label>
                        <input
                          type="text"
                          placeholder="e.g. Deep Teal / Midnight Black"
                          value={productForm.color || ''}
                          onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Material</label>
                        <input
                          type="text"
                          placeholder="e.g. Aerospace GaN III / TPE"
                          value={productForm.material || ''}
                          onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-wagh-teal bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section Controls Toolbar */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Custom Structured Sections (Optional)</h4>
                      <p className="text-[11px] text-slate-500">Add custom tables or feature lists for additional unique product details.</p>
                    </div>


                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddSection('specifications')}
                        className="px-3 py-1.5 rounded-xl bg-wagh-teal text-white font-bold text-xs hover:bg-wagh-teal-dark flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>+ Specifications Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSection('keyFeatures')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>+ Features List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSection('details')}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>+ Details Text</span>
                      </button>
                    </div>
                  </div>

                  {/* Sections List */}
                  {productForm.sections?.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                      No structured sections added yet. Click "+ Specifications Table" or "+ Features List" above to add custom sections.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productForm.sections.map((sec, secIdx) => (
                        <div key={secIdx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                          
                          {/* Section Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                value={sec?.type || 'specifications'}
                                onChange={(e) => {
                                  const updated = [...(productForm.sections || [])];
                                  if (updated[secIdx]) {
                                    updated[secIdx].type = e.target.value;
                                    setProductForm({ ...productForm, sections: updated });
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-slate-300 font-bold text-slate-700 text-xs bg-slate-50 focus:ring-2 focus:ring-wagh-teal"
                              >
                                <option value="specifications">Specifications Table</option>
                                <option value="keyFeatures">Key Features List</option>
                                <option value="details">Details Text</option>
                                <option value="table">Custom Table</option>
                                <option value="list">Custom List</option>
                              </select>

                              <input
                                type="text"
                                value={sec?.title || ''}
                                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                onChange={(e) => {
                                  const updated = [...(productForm.sections || [])];
                                  if (updated[secIdx]) {
                                    updated[secIdx].title = e.target.value;
                                    setProductForm({ ...productForm, sections: updated });
                                  }
                                }}
                                placeholder="Section Title (e.g. Technical Specs)"
                                className="p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 text-xs flex-1 focus:ring-2 focus:ring-wagh-teal"
                              />
                            </div>


                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveSection(secIdx, 'up')}
                                disabled={secIdx === 0}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSection(secIdx, 'down')}
                                disabled={secIdx === (productForm.sections?.length || 1) - 1}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(secIdx)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Section Item Rows */}
                          {sec?.type !== 'text' ? (
                            <div className="space-y-2">
                              {sec?.items?.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Label (e.g. Battery)"
                                    value={item?.label || ''}
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                    onChange={(e) => {
                                      const updated = [...(productForm.sections || [])];
                                      if (updated[secIdx] && updated[secIdx].items && updated[secIdx].items[itemIdx]) {
                                        updated[secIdx].items[itemIdx].label = e.target.value;
                                        setProductForm({ ...productForm, sections: updated });
                                      }
                                    }}
                                    className="p-2 rounded-xl border border-slate-300 text-xs font-medium w-1/3 focus:ring-2 focus:ring-wagh-teal"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Value / Details"
                                    value={item?.value || ''}
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                    onChange={(e) => {
                                      const updated = [...(productForm.sections || [])];
                                      if (updated[secIdx] && updated[secIdx].items && updated[secIdx].items[itemIdx]) {
                                        updated[secIdx].items[itemIdx].value = e.target.value;
                                        setProductForm({ ...productForm, sections: updated });
                                      }
                                    }}
                                    className="p-2 rounded-xl border border-slate-300 text-xs font-medium flex-1 focus:ring-2 focus:ring-wagh-teal"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(productForm.sections || [])];
                                      if (updated[secIdx] && updated[secIdx].items) {
                                        updated[secIdx].items = updated[secIdx].items.filter((_, i) => i !== itemIdx);
                                        setProductForm({ ...productForm, sections: updated });
                                      }
                                    }}
                                    className="p-2 text-rose-500 hover:text-rose-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(productForm.sections || [])];
                                  if (updated[secIdx]) {
                                    if (!updated[secIdx].items) updated[secIdx].items = [];
                                    updated[secIdx].items.push({ label: '', value: '' });
                                    setProductForm({ ...productForm, sections: updated });
                                  }
                                }}
                                className="text-wagh-teal font-bold text-xs hover:underline flex items-center gap-1 pt-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Row Item
                              </button>
                            </div>
                          ) : (
                            <textarea
                              rows={3}
                              placeholder="Free form prose content for this section..."
                              value={sec?.content || ''}
                              onChange={(e) => {
                                const updated = [...(productForm.sections || [])];
                                if (updated[secIdx]) {
                                  updated[secIdx].content = e.target.value;
                                  setProductForm({ ...productForm, sections: updated });
                                }
                              }}
                              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-wagh-teal"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Tab {modalTab === 'basic' ? '1/3' : modalTab === 'images' ? '2/3' : '3/3'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold hover:bg-wagh-teal-dark shadow-md"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-BROWSER IMAGE CROP MODAL (TASK 3) */}
      {showCropModal && cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCancel={() => {
            setShowCropModal(false);
            setReCropIndex(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* CATEGORY CREATION & MANAGEMENT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>Create & Manage Categories</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* New Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Earbuds, Fast Chargers, Power Banks..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-wagh-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. High speed PD fast charging adapters"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-wagh-teal focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCategory}
                className="w-full py-2.5 bg-wagh-teal hover:bg-wagh-teal-dark text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingCategory ? 'Creating Category...' : 'Save & Select Category'}</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Existing Categories ({categories.length})
              </h4>
              {categories.length === 0 ? (
                <p className="text-xs text-slate-400">No categories created yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{cat.name}</span>
                        {cat.description && <span className="text-[10px] text-slate-400 block">{cat.description}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS VIEW MODAL (TASK 1) */}
      {selectedViewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-wagh-teal/10 text-wagh-teal text-[10px] font-extrabold uppercase tracking-wider">
                  {selectedViewProduct.brand || 'WAGH'} • {categories.find(c => c._id === selectedViewProduct.category)?.name || 'Product Details'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedViewProduct.name}</h2>
              </div>
              <button
                onClick={() => setSelectedViewProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 transition-colors text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Gallery & Key Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 p-3 flex items-center justify-center">
                  <img src={selectedViewProduct.images?.[0]} alt={selectedViewProduct.name} className="max-h-full max-w-full object-contain" />
                </div>
                {selectedViewProduct.images?.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedViewProduct.images.map((img, idx) => (
                      <img key={idx} src={typeof img === 'string' ? img : img.url} alt="" className="w-12 h-12 rounded-lg border border-slate-200 p-1 object-contain bg-white shrink-0" />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Price:</span>
                    <span className="text-lg font-extrabold text-wagh-teal">₹{selectedViewProduct.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">MRP:</span>
                    <span className="text-slate-400 line-through">₹{selectedViewProduct.mrp?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Stock Availability:</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full ${selectedViewProduct.stock < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {selectedViewProduct.stock} Units In Stock
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  <p><span className="font-bold text-slate-900">Dimensions:</span> {selectedViewProduct.specs?.dimensions || selectedViewProduct.dimensions || 'Standard'}</p>
                  <p><span className="font-bold text-slate-900">Form Factor / Size:</span> {selectedViewProduct.specs?.size || selectedViewProduct.size || 'Standard'}</p>
                  <p><span className="font-bold text-slate-900">Featured:</span> {selectedViewProduct.isFeatured ? 'Yes' : 'No'}</p>
                  <p><span className="font-bold text-slate-900">New Arrival:</span> {selectedViewProduct.isNewArrival ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedViewProduct.description && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Product Description & Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {selectedViewProduct.description}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  handleDeleteProduct(selectedViewProduct._id);
                  setSelectedViewProduct(null);
                }}
                className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold rounded-xl text-xs transition-colors"
              >
                Delete Product
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedViewProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    openEditModal(selectedViewProduct);
                    setSelectedViewProduct(null);
                  }}
                  className="px-5 py-2 bg-wagh-teal text-white hover:bg-wagh-teal-dark font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Edit Product
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ORDER DETAILS POPUP MODAL (TASK 3) */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tag text-lg font-black text-wagh-teal">{selectedOrderModal.orderId}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {new Date(selectedOrderModal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Full Customer Order Details & Payment Metadata</p>
              </div>

              <button
                onClick={() => setSelectedOrderModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 transition-colors text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Meta Pill Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment Mode</span>
                <span className="font-bold text-slate-900 uppercase">{selectedOrderModal.paymentMethod || 'COD'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment Status</span>
                <span className="font-bold text-emerald-600">{selectedOrderModal.paymentStatus || 'Pending'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Order Status</span>
                <OrderStatusDropdown
                  currentStatus={selectedOrderModal.orderStatus}
                  onStatusChange={(newStatus) => {
                    handleUpdateOrderStatus(selectedOrderModal._id, newStatus);
                    setSelectedOrderModal({ ...selectedOrderModal, orderStatus: newStatus });
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Grand Total</span>
                <span className="font-extrabold text-slate-900 text-sm">₹{selectedOrderModal.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Customer Delivery Details & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Customer Shipping Details</span>
                <p className="font-bold text-slate-900 text-sm">{selectedOrderModal.shippingAddress?.name || 'Customer'}</p>
                <p className="text-slate-700"><span className="font-semibold text-slate-900">Phone:</span> {selectedOrderModal.shippingAddress?.phone}</p>
                <p className="text-slate-700"><span className="font-semibold text-slate-900">Email:</span> {selectedOrderModal.customerEmail || selectedOrderModal.shippingAddress?.email || 'N/A'}</p>
                <p className="text-slate-600 leading-relaxed mt-1">
                  {selectedOrderModal.shippingAddress?.street}, {selectedOrderModal.shippingAddress?.city}, {selectedOrderModal.shippingAddress?.state} - {selectedOrderModal.shippingAddress?.pincode}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Payment & Transaction Details</span>
                <p className="text-slate-700"><span className="font-semibold text-slate-900">Payment Method:</span> {selectedOrderModal.paymentMethod}</p>
                <p className="text-slate-700"><span className="font-semibold text-slate-900">Payment Status:</span> {selectedOrderModal.paymentStatus}</p>
                {selectedOrderModal.razorpayPaymentId && (
                  <p className="text-slate-700 font-mono-tag"><span className="font-semibold text-slate-900 font-sans">Razorpay Pay ID:</span> {selectedOrderModal.razorpayPaymentId}</p>
                )}
                {selectedOrderModal.razorpayOrderId && (
                  <p className="text-slate-700 font-mono-tag"><span className="font-semibold text-slate-900 font-sans">Razorpay Order ID:</span> {selectedOrderModal.razorpayOrderId}</p>
                )}
                {selectedOrderModal.couponCode && (
                  <p className="text-emerald-700 font-bold"><span className="font-semibold text-slate-900">Applied Coupon:</span> {selectedOrderModal.couponCode} (-₹{selectedOrderModal.discount})</p>
                )}
              </div>
            </div>

            {/* Ordered Line Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Ordered Products ({selectedOrderModal.items?.length || 0})</h4>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">Item</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Price</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderModal.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded-lg border border-slate-200 p-0.5 bg-white shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono-tag">SKU: {item.sku || 'WAGH-PRODUCT'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{item.qty}</td>
                        <td className="py-3 px-4 text-right font-mono-tag text-slate-700">₹{item.price?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono-tag text-slate-900">₹{(item.price * item.qty)?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Navigation Links & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <a
                  href={`/orders/${selectedOrderModal.orderId}/receipt/invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>View Tax Invoice</span>
                </a>
                <a
                  href={`/orders/${selectedOrderModal.orderId}/receipt/payment`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>View Payment Receipt</span>
                </a>
              </div>

              <button
                onClick={() => setSelectedOrderModal(null)}
                className="px-5 py-2 bg-wagh-teal text-white hover:bg-wagh-teal-dark font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Done / Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
