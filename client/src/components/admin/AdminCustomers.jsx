import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, ArrowUpDown, ChevronLeft, ChevronRight,
  ShieldCheck, AlertCircle, RefreshCw, Calendar, Phone, Mail, UserCheck,
  FileSpreadsheet, Loader2
} from 'lucide-react';
import { fetchAdminApi, fetchAdminFile, downloadBlob } from '../../api';
import { useToast } from '../../context/ToastContext';

// Helper to format date cleanly (e.g. "Aug 18, 2026")
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper to format date with time (e.g. "Aug 18, 2026, 10:45 AM")
const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Avatar background colors based on name initials
const AVATAR_BG_CLASSES = [
  'bg-teal-500 text-white',
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-sky-500 text-white',
  'bg-amber-500 text-white',
  'bg-violet-500 text-white',
];

const getAvatarBgClass = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_CLASSES.length;
  return AVATAR_BG_CLASSES[index];
};

const getInitials = (name = '') => {
  if (!name.trim()) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function AdminCustomers() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('joined_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });

      const res = await fetchAdminApi(`/admin/users?${queryParams.toString()}`);
      if (res && res.success && res.data) {
        setUsers(res.data.users || []);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      addToast('Failed to load customers list', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSort = () => {
    setSort((prev) => (prev === 'joined_desc' ? 'joined_asc' : 'joined_desc'));
    setPage(1);
  };

  // Downloads every customer matching the current search/sort as an .xlsx file
  // (Name, Phone, DOB, Gender, Email) — not just the rows on the current page.
  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const queryParams = new URLSearchParams({
        sort,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });

      const { blob, filename, totalRecords } = await fetchAdminFile(
        `/admin/users/export?${queryParams.toString()}`
      );

      const fallbackName = `wagh-customers-${new Date().toISOString().slice(0, 10)}.xlsx`;
      downloadBlob(blob, filename || fallbackName);

      const countLabel = Number.isFinite(totalRecords)
        ? `${totalRecords} customer${totalRecords === 1 ? '' : 's'}`
        : 'Customer list';
      addToast(`${countLabel} exported to Excel`, 'success');
    } catch (err) {
      console.error('Customer Excel export failed:', err);
      addToast(err.message || 'Failed to export customers to Excel', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-wagh-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Registered Customers</h3>
            <span className="bg-wagh-teal/10 text-wagh-teal font-mono-tag text-xs font-bold px-2.5 py-0.5 rounded-full border border-wagh-teal/20">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-wagh-muted mt-0.5">
            Manage and view registered customer accounts and activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-wagh-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-wagh-border text-xs focus:outline-none focus:ring-2 focus:ring-wagh-teal/20 focus:border-wagh-teal bg-gray-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-wagh-muted hover:text-wagh-dark font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-wagh-border text-xs font-semibold text-wagh-dark bg-white focus:outline-none focus:ring-2 focus:ring-wagh-teal/20 cursor-pointer"
            >
              <option value="joined_desc">Joined (Newest First)</option>
              <option value="joined_asc">Joined (Oldest First)</option>
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="last_login_desc">Last Active</option>
            </select>
            <button
              onClick={fetchUsers}
              className="p-1.5 rounded-xl border border-wagh-border text-wagh-muted hover:text-wagh-teal hover:bg-teal-50 transition-colors"
              title="Refresh Customers List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Export to Excel — downloads every matching customer, not just this page */}
          <button
            onClick={handleExportExcel}
            disabled={exporting || (!loading && totalCount === 0)}
            title={
              debouncedSearch
                ? `Export customers matching "${debouncedSearch}" to Excel`
                : 'Export all registered customers to Excel'
            }
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-wagh-teal text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-wagh-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
            )}
            <span>{exporting ? 'Preparing file…' : 'Export to Excel'}</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-wagh-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-wagh-border text-[11px] font-mono-tag font-bold uppercase tracking-wider text-wagh-muted">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">DOB</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-wagh-teal" onClick={toggleSort}>
                  <div className="flex items-center gap-1">
                    <span>Joined</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Last Signed In</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                // Skeleton Rows Loading State
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-slate-200 rounded w-28" />
                        <div className="h-2.5 bg-slate-200 rounded w-36" />
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-16" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-14" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-slate-200 rounded-full w-16" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 text-wagh-muted flex items-center justify-center mx-auto mb-3 border border-gray-200">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-wagh-dark text-sm">No customers found</h4>
                    <p className="text-xs text-wagh-muted mt-1">
                      {debouncedSearch
                        ? `No registered users match "${debouncedSearch}".`
                        : 'There are no registered customer accounts in the database yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                // Customer Rows
                users.map((user) => {
                  const isVerified = user.isVerified || user.emailVerified;
                  const phoneDisplay = user.mobileNumber || user.phone || '-';
                  const dobDisplay = user.birthdate ? formatDate(user.birthdate) : '-';
                  const genderDisplay =
                    user.gender && user.gender !== 'prefer_not_to_say'
                      ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                      : '-';

                  return (
                    <tr key={user._id} className="hover:bg-teal-50/30 transition-colors">
                      {/* Customer Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${getAvatarBgClass(
                              user.name
                            )}`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <span className="font-bold text-wagh-dark block leading-tight">
                              {user.name || 'WAGH Customer'}
                            </span>
                            <span className="text-[11px] text-wagh-muted font-medium">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono-tag text-xs text-wagh-dark/90">
                        {phoneDisplay}
                      </td>

                      {/* DOB */}
                      <td className="py-3.5 px-4 text-wagh-dark/80">
                        {dobDisplay}
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 text-wagh-dark/80">
                        {genderDisplay}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 font-mono-tag text-xs text-wagh-muted">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Last Signed In */}
                      <td className="py-3.5 px-4 font-mono-tag text-xs text-wagh-muted">
                        {formatDateTime(user.lastLoginAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Unverified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50/80 border-t border-wagh-border text-xs">
            <span className="text-wagh-muted font-mono-tag">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total customers)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-wagh-border bg-white text-wagh-dark font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-wagh-border bg-white text-wagh-dark font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomers;
