'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { X, FileText, User, CreditCard, ChevronLeft, Building2, TrendingUp, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

interface SalesProductDrilldownProps {
  productKey: number;
  productName: string;
  categoryName: string;
  brandName: string;
  dateFrom: string;
  dateTo: string;
  productSummary: { revenue: number; gp: number; qty: number; margin: number; invoice_count: number; branch_count: number };
  onClose: () => void;
}

export default function SalesProductDrilldown({
  productKey, productName, categoryName, brandName, dateFrom, dateTo, productSummary, onClose,
}: SalesProductDrilldownProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'invoices'>('overview');

  useEffect(() => {
    api.salesProductDetail(productKey, dateFrom, dateTo)
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productKey, dateFrom, dateTo]);

  const invoices = (data?.invoices || []).map((r: any) => ({
    ...r,
    quantity: Number(r.quantity) || 0,
    unit_price: Number(r.unit_price) || 0,
    discount: Number(r.discount) || 0,
    net_amount: Number(r.net_amount) || 0,
    gp: Number(r.gp) || 0,
  }));

  const branchBreakdown = (data?.branchBreakdown || []).map((r: any) => ({
    ...r,
    qty: Number(r.qty) || 0,
    revenue: Number(r.revenue) || 0,
    gp: Number(r.gp) || 0,
    invoices: Number(r.invoices) || 0,
  }));

  const monthlyTrend = (data?.monthlyTrend || []).map((r: any) => ({
    ...r,
    qty: Number(r.qty) || 0,
    revenue: Number(r.revenue) || 0,
    gp: Number(r.gp) || 0,
    invoices: Number(r.invoices) || 0,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  {productName}
                </h2>
                <p className="text-sm text-gray-500">
                  {categoryName}
                  {brandName && <span> | {brandName}</span>}
                  {' | '}Drill-down รายละเอียดสินค้า
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <div className="bg-blue-50 rounded-xl px-3 py-2">
              <div className="text-xs text-blue-600 font-medium">รายได้</div>
              <div className="text-sm font-bold text-blue-800">{formatCurrency(productSummary.revenue)}</div>
            </div>
            <div className="bg-green-50 rounded-xl px-3 py-2">
              <div className="text-xs text-green-600 font-medium">กำไรขั้นต้น</div>
              <div className="text-sm font-bold text-green-800">{formatCurrency(productSummary.gp)}</div>
            </div>
            <div className="bg-purple-50 rounded-xl px-3 py-2">
              <div className="text-xs text-purple-600 font-medium">อัตรากำไร</div>
              <div className="text-sm font-bold text-purple-800">{(productSummary.margin * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-orange-50 rounded-xl px-3 py-2">
              <div className="text-xs text-orange-600 font-medium">จำนวนขาย</div>
              <div className="text-sm font-bold text-orange-800">{formatNumber(productSummary.qty)}</div>
            </div>
            <div className="bg-indigo-50 rounded-xl px-3 py-2">
              <div className="text-xs text-indigo-600 font-medium">Invoice</div>
              <div className="text-sm font-bold text-indigo-800">{formatNumber(productSummary.invoice_count)}</div>
            </div>
            <div className="bg-cyan-50 rounded-xl px-3 py-2">
              <div className="text-xs text-cyan-600 font-medium">สาขาที่ขาย</div>
              <div className="text-sm font-bold text-cyan-800">{formatNumber(productSummary.branch_count)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <button onClick={() => setTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <TrendingUp className="w-4 h-4 inline mr-1.5" />ภาพรวมสาขา & กราฟ
            </button>
            <button onClick={() => setTab('invoices')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'invoices' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <FileText className="w-4 h-4 inline mr-1.5" />รายการ Invoice ({invoices.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              {/* Monthly Trend */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">แนวโน้มยอดขายรายเดือน</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month_no" tickFormatter={(v: any) => `เดือน ${v}`} fontSize={11} />
                    <YAxis yAxisId="left" fontSize={10} tickFormatter={(v: any) => formatCurrency(v)} />
                    <YAxis yAxisId="right" orientation="right" fontSize={10} />
                    <Tooltip formatter={(v: any, name: any) => name === 'จำนวน' ? formatNumber(v) : formatCurrency(v)} />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="รายได้" />
                    <Bar yAxisId="left" dataKey="gp" fill="#10b981" radius={[4, 4, 0, 0]} name="กำไร" />
                    <Line yAxisId="right" type="monotone" dataKey="qty" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="จำนวน" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Branch Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  <Building2 className="w-4 h-4 inline mr-1.5" />ยอดขายแยกตามสาขา
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={Math.max(300, branchBreakdown.length * 28)}>
                    <BarChart data={branchBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" fontSize={10} tickFormatter={(v: any) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="branch_name" fontSize={10} width={110} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="รายได้" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-2 text-gray-600 font-semibold">สาขา</th>
                          <th className="text-left py-2 px-2 text-gray-600 font-semibold">ภูมิภาค</th>
                          <th className="text-right py-2 px-2 text-gray-600 font-semibold">จำนวน</th>
                          <th className="text-right py-2 px-2 text-gray-600 font-semibold">รายได้</th>
                          <th className="text-right py-2 px-2 text-gray-600 font-semibold">กำไร</th>
                          <th className="text-right py-2 px-2 text-gray-600 font-semibold">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchBreakdown.map((b: any, i: number) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-white transition-colors">
                            <td className="py-2 px-2 font-medium">{b.branch_name}</td>
                            <td className="py-2 px-2 text-gray-500 text-xs">{b.region_name}</td>
                            <td className="py-2 px-2 text-right">{formatNumber(b.qty)}</td>
                            <td className="py-2 px-2 text-right font-medium">{formatCurrency(b.revenue)}</td>
                            <td className="py-2 px-2 text-right text-green-600">{formatCurrency(b.gp)}</td>
                            <td className="py-2 px-2 text-right">{formatNumber(b.invoices)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Invoices Tab */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Invoice</div>
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">วันที่</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />สาขา</div>
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" />ลูกค้า</div>
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">ระดับ</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">
                      <div className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />ชำระเงิน</div>
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">จำนวน</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">ราคา/หน่วย</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">ส่วนลด</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">ยอดสุทธิ</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, i: number) => {
                    const invDate = inv.full_date ? new Date(inv.full_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-';
                    const tierColor = inv.loyalty_tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700'
                      : inv.loyalty_tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700'
                      : inv.loyalty_tier === 'SILVER' ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700';

                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="py-2 px-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2 px-2">
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{inv.invoice_no}</span>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600">{invDate}</td>
                        <td className="py-2 px-2">
                          <div className="text-xs font-medium">{inv.branch_name}</div>
                          <div className="text-[10px] text-gray-400">{inv.region_name}</div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="text-xs font-medium text-gray-800">{inv.customer_name || '-'}</div>
                          {inv.member_code && <div className="text-[10px] text-gray-400">{inv.member_code}</div>}
                        </td>
                        <td className="py-2 px-2">
                          {inv.loyalty_tier ? (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${tierColor}`}>{inv.loyalty_tier}</span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600">{inv.payment_method_name || '-'}</td>
                        <td className="py-2 px-2 text-right font-medium">{formatNumber(inv.quantity)}</td>
                        <td className="py-2 px-2 text-right text-gray-600 text-xs">{formatCurrency(inv.unit_price)}</td>
                        <td className="py-2 px-2 text-right text-red-500 text-xs">
                          {inv.discount > 0 ? `-${formatCurrency(inv.discount)}` : '-'}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{formatCurrency(inv.net_amount)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-green-600">{formatCurrency(inv.gp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td colSpan={7} className="py-3 px-2">รวมทั้งหมด ({invoices.length} รายการ)</td>
                    <td className="py-3 px-2 text-right">{formatNumber(invoices.reduce((s: number, r: any) => s + r.quantity, 0))}</td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-right text-red-500">{formatCurrency(invoices.reduce((s: number, r: any) => s + r.discount, 0))}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(invoices.reduce((s: number, r: any) => s + r.net_amount, 0))}</td>
                    <td className="py-3 px-2 text-right text-green-600">{formatCurrency(invoices.reduce((s: number, r: any) => s + r.gp, 0))}</td>
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
