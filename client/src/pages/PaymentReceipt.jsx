import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Printer, ArrowLeft, Receipt, FileText } from 'lucide-react';
import { fetchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { OfficialInvoiceDocument } from '../components/OfficialInvoiceDocument';

export default function PaymentReceipt() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setLoading(true);
        const res = await fetchApi(`/orders/${orderId}/receipt/invoice`, { getToken });
        if (res.success && res.data) {
          setInvoiceData(res.data);
        } else {
          setError(res.message || 'Unable to load payment receipt');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch payment receipt');
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-12 h-12 border-4 border-wagh-teal border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Generating financial payment receipt...</p>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-100 shadow-xl rounded-3xl p-8 text-center space-y-4">
          <Receipt className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Receipt Not Available</h2>
          <p className="text-sm text-slate-500">{error || 'Could not locate payment receipt details.'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 bg-wagh-teal hover:bg-wagh-teal-dark text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans print:p-0 print:m-0 print:bg-white print:min-h-0">
      
      {/* Header Controls (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to={`/orders/${orderId}/receipt/invoice`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer text-center"
          >
            <FileText className="w-4 h-4 text-wagh-teal shrink-0" />
            <span>View TAX INVOICE</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-wagh-teal hover:bg-wagh-teal-dark text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer text-center"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print Payment Receipt (PDF)</span>
          </button>
        </div>
      </div>

      {/* Renders ONLY Payment Receipt (1 Page) */}
      <div className="print-container">
        <OfficialInvoiceDocument data={invoiceData} mode="receipt" />
      </div>

    </div>
  );
}
