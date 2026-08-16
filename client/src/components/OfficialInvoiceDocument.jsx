import React from 'react';
import { Building2, Package, CheckCircle2 } from 'lucide-react';

export function OfficialInvoiceDocument({ data, mode = 'invoice' }) {
  if (!data) return null;

  const {
    invoiceNumber = 'INV-158512-2026',
    invoiceDate = new Date(),
    orderId = 'WAGH-158512',
    paymentMethod = 'COD',
    paymentStatus = 'Pending',
    orderStatus = 'Processing',
    transactionId = 'COD-WAGH-158512',
    receiptNumber = `WAG-PAY-2026-${(orderId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`,
    lineItems = [],
    summary = {},
    shippingAddress = {},
    customer = {},
    company = {
      name: 'Wagh Mobile Accessories',
      address: 'Wagh Mobile Accessories, 6VGR+92G, Surat - Kamrej Hwy, Silver Point, Moti Nagar, Nana Varachha, Surat, Gujarat - 395013',
      gstin: '27AAACW1234A1Z5',
      email: 'waghonline9@gmail.com',
    },
  } = data;

  const formattedDate = new Date(invoiceDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const subtotalVal = summary.subtotal || summary.grandTotal || 5598;
  const grandTotalVal = summary.grandTotal || subtotalVal;
  const cgstVal = summary.gstBreakdown?.cgst || Math.round((subtotalVal * 0.09) * 100) / 100;
  const sgstVal = summary.gstBreakdown?.sgst || Math.round((subtotalVal * 0.09) * 100) / 100;

  const isPaid = paymentStatus === 'Paid' || paymentStatus === 'Success';
  const displayPhone = shippingAddress?.phone || customer.phone || '7567731104';
  const displayEmail = customer.email || 'devangpanchal23032006@gmail.com';
  const displayCustomerName = shippingAddress?.name || customer.name || 'Dev Panchal';

  const fullShippingAddressString = shippingAddress?.street
    ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`
    : 'B-59 Ram Krishna Society, Near Ram Krishna Vidhya Bhavan L.H Road Varachha, Surat, Gujarat - 395006';

  const renderInvoice = mode === 'invoice' || mode === 'both';
  const renderReceipt = mode === 'receipt' || mode === 'both';

  return (
    <div className="w-full bg-white text-slate-900 font-sans print:w-full">
      
      {/* TAX INVOICE VIEW / PRINT */}
      {renderInvoice && (
        <div className="max-w-4xl mx-auto bg-white p-5 sm:p-8 md:p-10 border border-slate-100 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.06),0_10px_30px_rgba(0,0,0,0.04)] space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-xl text-slate-900 bg-white shadow-2xs shrink-0">
                W
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  TAX INVOICE
                </h1>
                <p className="text-xs text-slate-500 font-medium">{company.name}</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5 text-xs font-mono-tag">
              <p className="font-bold text-slate-900">
                INVOICE #: <span className="font-extrabold text-slate-900">{invoiceNumber}</span>
              </p>
              <p className="text-slate-600 font-sans">
                Date: <span className="font-semibold text-slate-800">{formattedDate}</span>
              </p>
              <p className="text-slate-600 font-sans">
                Order ID: <span className="font-bold text-slate-900 font-mono-tag">{orderId}</span>
              </p>
            </div>
          </div>

          {/* Seller vs Billed Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pb-5 border-b border-slate-100 text-xs">
            {/* Seller Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Seller Details</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{company.name}</p>
              <p className="text-slate-600 leading-relaxed">{company.address}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">GSTIN:</span> {company.gstin}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">Support:</span> {company.email}</p>
            </div>

            {/* Billed & Shipped To */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider mb-1">
                <Package className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Billed & Shipped To</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{displayCustomerName}</p>
              <p className="text-slate-600 leading-relaxed">{fullShippingAddressString}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">Phone:</span> {displayPhone}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">Email:</span> {displayEmail}</p>
            </div>
          </div>

          {/* Payment & Order Meta Box */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-tag">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Payment Mode</p>
              <p className="font-bold text-slate-900 uppercase mt-0.5">{paymentMethod}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Payment Status</p>
              <p className={`font-bold mt-0.5 ${isPaid ? 'text-emerald-700' : 'text-emerald-600'}`}>
                {paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Order Status</p>
              <p className="font-bold text-slate-900 mt-0.5">{orderStatus}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Txn Ref</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{transactionId}</p>
            </div>
          </div>

          {/* Ordered Line Items Table */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">
              Ordered Line Items
            </h3>
            <div className="rounded-2xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px] sm:min-w-0">
                <thead className="bg-slate-100/70 text-slate-800 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-4">Product Description</th>
                    <th className="py-3 px-4 text-center w-16">Qty</th>
                    <th className="py-3 px-4 text-right w-24">Price (₹)</th>
                    <th className="py-3 px-4 text-right w-28">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.length > 0 ? (
                    lineItems.map((item) => (
                      <tr key={item.srNo || item.name}>
                        <td className="py-3.5 px-4 font-mono-tag text-slate-500">{item.srNo}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono-tag mt-0.5">SKU: {item.sku}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">{item.qty}</td>
                        <td className="py-3.5 px-4 text-right font-mono-tag text-slate-800">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono-tag text-slate-900">₹{(item.lineTotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3.5 px-4 font-mono-tag text-slate-500">1</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">WAGH® 25W PD + QC Powerbank in Built Type-C & Lightning Cable (Yellow/Black Variant)</p>
                        <p className="text-[10px] text-slate-500 font-mono-tag mt-0.5">SKU: WAGH-SKU-65CF25</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">2</td>
                      <td className="py-3.5 px-4 text-right font-mono-tag text-slate-800">₹2,799</td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono-tag text-slate-900">₹5,598</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section: Terms & Breakdown Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-2">
            <div className="text-xs text-slate-600 max-w-xs space-y-1 font-sans">
              <p className="font-bold text-slate-900">Terms & Conditions:</p>
              <p>• Goods once sold can be returned per WAGH return policy.</p>
              <p>• Inclusive of 18% Goods and Services Tax (GST).</p>
            </div>

            <div className="w-full sm:w-72 bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs font-mono-tag shrink-0">
              <div className="flex justify-between text-slate-700 font-sans">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900 font-mono-tag">₹{subtotalVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] font-sans pl-2">
                <span>CGST (9%):</span>
                <span className="font-mono-tag">₹{cgstVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] font-sans pl-2">
                <span>SGST (9%):</span>
                <span className="font-mono-tag">₹{sgstVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900 font-sans">
                <span>Grand Total:</span>
                <span className="text-base text-slate-900 font-mono-tag">₹{grandTotalVal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Page 1 */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-sans gap-2 text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authorized Tax Invoice • Wagh Mobile Accessories</span>
            </div>
            <p className="font-mono-tag font-bold">Page 1 of 1</p>
          </div>

        </div>
      )}


      {/* PAYMENT RECEIPT VIEW / PRINT */}
      {renderReceipt && (
        <div className="max-w-4xl mx-auto bg-white p-5 sm:p-8 md:p-10 border border-slate-100 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.06),0_10px_30px_rgba(0,0,0,0.04)] space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
          
          {/* Header Row Page 2 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                $
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Payment Receipt
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Financial Transaction Record • Wagh Mobile Accessories
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-extrabold uppercase font-mono-tag">
                {isPaid ? 'PAYMENT SUCCESSFUL' : 'PAYMENT PENDING'}
              </span>
              <p className="text-xs font-mono-tag font-bold text-slate-900">
                Receipt #: <span className="font-extrabold">{receiptNumber}</span>
              </p>
            </div>
          </div>

          {/* Meta Pill Container Page 2 */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-tag">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">ORDER REF</p>
              <p className="font-bold text-slate-900 mt-0.5">{orderId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">PAYMENT DATE</p>
              <p className="font-bold text-slate-900 font-sans mt-0.5">{formattedDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">PAYMENT MODE</p>
              <p className="font-bold text-slate-900 uppercase mt-0.5">{paymentMethod}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">TXN / GATEWAY ID</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{transactionId}</p>
            </div>
          </div>

          {/* Paid To vs Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pb-5 border-b border-slate-100 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Paid To</p>
              <p className="font-bold text-slate-900 text-sm">{company.name}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">GSTIN:</span> {company.gstin}</p>
              <p className="text-slate-600 leading-relaxed">{company.address}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">Email:</span> {company.email}</p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Customer Details</p>
              <p className="font-bold text-slate-900 text-sm">{displayCustomerName}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">Email:</span> {displayEmail}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-700">Phone:</span> {displayPhone}</p>
            </div>
          </div>

          {/* Financial Breakdown Section */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">
              Financial Breakdown
            </h3>
            <div className="rounded-2xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[400px] sm:min-w-0">
                <thead className="bg-slate-100/70 text-slate-800 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Description</th>
                    <th className="py-3.5 px-5 text-right w-40">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-tag">
                  <tr>
                    <td className="py-3.5 px-5 font-sans font-medium text-slate-800">Item Subtotal</td>
                    <td className="py-3.5 px-5 text-right font-bold text-slate-900">₹{subtotalVal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-sans text-slate-600 text-[11px] pl-8">CGST (9%)</td>
                    <td className="py-3.5 px-5 text-right text-slate-700 text-[11px]">₹{cgstVal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-sans text-slate-600 text-[11px] pl-8">SGST (9%)</td>
                    <td className="py-3.5 px-5 text-right text-slate-700 text-[11px]">₹{sgstVal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/60 font-bold">
                    <td className="py-4 px-5 font-sans text-sm font-extrabold text-slate-900">Total Amount Paid</td>
                    <td className="py-4 px-5 text-right text-base font-extrabold text-slate-900">₹{grandTotalVal.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Page 2 */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-sans gap-2 text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Computer-generated official receipt. No physical signature required.</span>
            </div>
            <p className="font-semibold text-slate-700">Thank you for shopping with Wagh Mobile!</p>
          </div>

        </div>
      )}

    </div>
  );
}
