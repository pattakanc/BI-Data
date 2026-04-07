'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { X, Package, TrendingUp, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent, formatDateShort, formatDateLong } from '@/lib/utils';
import ProductInvoiceModal from './ProductInvoiceModal';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

interface BranchDetailModalProps {
  branchKey: number;
  branchName: string;
  regionName: string;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
  branchSummary: {
    sales: number;
    gp: number;
    margin: number;
    invoices: number;
    customers: number;
  };
}

export default function BranchDetailModal({
  branchKey, branchName, regionName, dateFrom, dateTo, onClose, branchSummary,
}: BranchDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'products'>('overview');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    api.branchDetail(branchKey, dateFrom, dateTo)
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [branchKey, dateFrom, dateTo]);

  const products = (data?.products || []).map((r: any) => ({
    ...r,
    qty: Number(r.qty) || 0,
    revenue: Number(r.revenue) || 0,
    gp: Number(r.gp) || 0,
    margin: Number(r.margin) || 0,
  }));

  const dailyTrend = (data?.dailyTrend || []).map((r: any) => ({
    ...r,
    revenue: Number(r.revenue) || 0,
    gp: Number(r.gp) || 0,
    invoices: Number(r.invoices) || 0,
  }));

  const categorySplit = (data?.categorySplit || []).map((r: any) => ({
    ...r,
    revenue: Number(r.revenue) || 0,
    gp: Number(r.gp) || 0,
    qty: Number(r.qty) || 0,
  }));

  const totalProductRevenue = products.reduce((s: number, r: any) => s + r.revenue, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{branchName}</h2>
                <p className="text-sm text-gray-500">{regionName} | Drill-down รายละเอียดสาขา</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KPI Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <div className="bg-blue-50 rounded-xl px-3 py-2">
                <div className="text-xs text-blue-600 font-medium">ยอดขาย</div>
                <div className="text-sm font-bold text-blue-800">{formatCurrency(branchSummary.sales)}</div>
              </div>
              <div className="bg-green-50 rounded-xl px-3 py-2">
                <div className="text-xs text-green-600 font-medium">กำไรขั้นต้น</div>
                <div className="text-sm font-bold text-green-800">{formatCurrency(branchSummary.gp)}</div>
              </div>
              <div className="bg-purple-50 rounded-xl px-3 py-2">
                <div className="text-xs text-purple-600 font-medium">อัตรากำไร</div>
                <div className="text-sm font-bold text-purple-800">{formatPercent(branchSummary.margin)}</div>
              </div>
              <div className="bg-orange-50 rounded-xl px-3 py-2">
                <div className="text-xs text-orange-600 font-medium">จำนวนบิล</div>
                <div className="text-sm font-bold text-orange-800">{formatNumber(branchSummary.invoices)}</div>
              </div>
              <div className="bg-indigo-50 rounded-xl px-3 py-2">
                <div className="text-xs text-indigo-600 font-medium">ลูกค้า</div>
                <div className="text-sm font-bold text-indigo-800">{formatNumber(branchSummary.customers)}</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4">
              <button
                onClick={() => setTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1.5" />ภาพรวมและกราฟ
              </button>
              <button
                onClick={() => setTab('products')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'products' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Package className="w-4 h-4 inline mr-1.5" />รายการสินค้า ({products.length})
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
                {/* Daily Trend */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">แนวโน้มรายได้รายวัน</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="full_date" fontSize={10}
                        tickFormatter={(v: any) => formatDateShort(v)} />
                      <YAxis fontSize={10} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(v: any) => formatCurrency(v)}
                        labelFormatter={(l: any) => formatDateLong(l)}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="รายได้" dot={false} />
                      <Line type="monotone" dataKey="gp" stroke="#10b981" strokeWidth={2} name="กำไรขั้นต้น" dot={false} />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">สัดส่วนหมวดหมู่สินค้า</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={categorySplit} dataKey="revenue" nameKey="category_name" cx="50%" cy="45%" outerRadius={85}
                          label={({ x, y, category_name, percent }: any) => (
                            <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fill="#374151">
                              {`${category_name} ${((percent || 0) * 100).toFixed(1)}%`}
                            </text>
                          )}>
                          {categorySplit.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 10 สินค้าขายดี</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={products.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" fontSize={10} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="product_name" fontSize={10} width={100} />
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="รายได้" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              /* Products Tab - Clickable rows */
              <div>
                <p className="text-xs text-gray-400 mb-3">คลิกที่สินค้าเพื่อดูรายละเอียด Invoice แต่ละรายการ</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-3 font-semibold text-gray-600">#</th>
                        <th className="text-left py-3 px-3 font-semibold text-gray-600">สินค้า</th>
                        <th className="text-left py-3 px-3 font-semibold text-gray-600">หมวดหมู่</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-600">จำนวน</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-600">รายได้</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-600">สัดส่วน</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-600">กำไรขั้นต้น</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-600">อัตรากำไร</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-600">ดู Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p: any, i: number) => {
                        const pct = totalProductRevenue > 0 ? (p.revenue / totalProductRevenue * 100) : 0;
                        return (
                          <tr
                            key={i}
                            onClick={() => setSelectedProduct(p)}
                            className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors group"
                          >
                            <td className="py-2.5 px-3 text-gray-400">{i + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-gray-800 group-hover:text-blue-700">{p.product_name}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{p.category_name}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">{formatNumber(p.qty)}</td>
                            <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-green-600 font-medium">{formatCurrency(p.gp)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`text-xs font-semibold ${p.margin >= 0.5 ? 'text-green-600' : p.margin >= 0.3 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {(p.margin * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 inline transition-colors" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                        <td className="py-3 px-3" colSpan={3}>รวมทั้งหมด ({products.length} รายการ)</td>
                        <td className="py-3 px-3 text-right">{formatNumber(products.reduce((s: number, p: any) => s + p.qty, 0))}</td>
                        <td className="py-3 px-3 text-right">{formatCurrency(totalProductRevenue)}</td>
                        <td className="py-3 px-3 text-right">100%</td>
                        <td className="py-3 px-3 text-right text-green-600">{formatCurrency(products.reduce((s: number, p: any) => s + p.gp, 0))}</td>
                        <td className="py-3 px-3 text-right">
                          {totalProductRevenue > 0 ? ((products.reduce((s: number, p: any) => s + p.gp, 0) / totalProductRevenue) * 100).toFixed(1) : 0}%
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Invoice Detail Modal */}
      {selectedProduct && (
        <ProductInvoiceModal
          branchKey={branchKey}
          branchName={branchName}
          productName={selectedProduct.product_name}
          categoryName={selectedProduct.category_name}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
