'use client';

import { useState, useEffect } from 'react';
import { X, FileText, User, CreditCard, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface ProductInvoiceModalProps {
  branchKey: number;
  branchName: string;
  productName: string;
  categoryName: string;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
}

export default function ProductInvoiceModal({
  branchKey, branchName, productName, categoryName, dateFrom, dateTo, onClose,
}: ProductInvoiceModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.branchProductInvoices(branchKey, productName, dateFrom, dateTo)
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [branchKey, productName, dateFrom, dateTo]);

  const invoices = (data?.invoices || []).map((r: any) => ({
    ...r,
    quantity: Number(r.quantity) || 0,
    unit_price: Number(r.unit_price) || 0,
    discount: Number(r.discount) || 0,
    net_amount: Number(r.net_amount) || 0,
    cost: Number(r.cost) || 0,
    gp: Number(r.gp) || 0,
  }));

  const summary = data?.summary || {};

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  {productName}
                </h2>
                <p className="text-sm text-gray-500">{branchName} | {categoryName} | รายละเอียด Invoice</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Bar */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-blue-50 rounded-xl px-3 py-2">
                <div className="text-xs text-blue-600 font-medium">จำนวน Invoice</div>
                <div className="text-lg font-bold text-blue-800">{formatNumber(summary.totalInvoices)}</div>
              </div>
              <div className="bg-green-50 rounded-xl px-3 py-2">
                <div className="text-xs text-green-600 font-medium">จำนวนรวม</div>
                <div className="text-lg font-bold text-green-800">{formatNumber(summary.totalQty)}</div>
              </div>
              <div className="bg-purple-50 rounded-xl px-3 py-2">
                <div className="text-xs text-purple-600 font-medium">รายได้รวม</div>
                <div className="text-lg font-bold text-purple-800">{formatCurrency(summary.totalRevenue)}</div>
              </div>
              <div className="bg-orange-50 rounded-xl px-3 py-2">
                <div className="text-xs text-orange-600 font-medium">กำไรรวม</div>
                <div className="text-lg font-bold text-orange-800">{formatCurrency(summary.totalGP)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล Invoice...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 text-gray-400">ไม่พบข้อมูล Invoice</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Invoice No.</div>
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">วันที่</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" />ลูกค้า</div>
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">ระดับ</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />ชำระเงิน</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-600">ประเภท</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">จำนวน</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">ราคา/หน่วย</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">ส่วนลด</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">ยอดสุทธิ</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, i: number) => {
                    const invDate = inv.full_date ? new Date(inv.full_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-';
                    const tierColor = inv.loyalty_tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700'
                      : inv.loyalty_tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700'
                      : inv.loyalty_tier === 'SILVER' ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700';
                    const typeColor = inv.line_type === 'SERVICE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {inv.invoice_no}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 text-xs">{invDate}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-gray-800 text-xs">{inv.customer_name || '-'}</div>
                          {inv.member_code && <div className="text-[10px] text-gray-400">{inv.member_code}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          {inv.loyalty_tier ? (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${tierColor}`}>
                              {inv.loyalty_tier}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">{inv.payment_method_name || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${typeColor}`}>
                            {inv.line_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatNumber(inv.quantity)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(inv.unit_price)}</td>
                        <td className="py-2.5 px-3 text-right text-red-500">
                          {inv.discount > 0 ? `-${formatCurrency(inv.discount)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">{formatCurrency(inv.net_amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-green-600">{formatCurrency(inv.gp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td colSpan={7} className="py-3 px-3">รวมทั้งหมด ({invoices.length} รายการ)</td>
                    <td className="py-3 px-3 text-right">{formatNumber(invoices.reduce((s: number, r: any) => s + r.quantity, 0))}</td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 text-right text-red-500">
                      {formatCurrency(invoices.reduce((s: number, r: any) => s + r.discount, 0))}
                    </td>
                    <td className="py-3 px-3 text-right">{formatCurrency(invoices.reduce((s: number, r: any) => s + r.net_amount, 0))}</td>
                    <td className="py-3 px-3 text-right text-green-600">{formatCurrency(invoices.reduce((s: number, r: any) => s + r.gp, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
