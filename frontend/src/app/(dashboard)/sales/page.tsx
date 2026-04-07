'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, CreditCard, Filter, ExternalLink, Package } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import SalesProductDrilldown from '@/components/SalesProductDrilldown';
import SalesKpiDrilldown from '@/components/SalesKpiDrilldown';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function SalesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  // Product filter state
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selCategory, setSelCategory] = useState('');
  const [selBrand, setSelBrand] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [kpiDrilldown, setKpiDrilldown] = useState<'revenue' | 'gp' | 'invoices' | 'discount' | null>(null);

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.salesSummary(toDateKey(from), toDateKey(to))
      .then((res: any) => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchTopProducts = useCallback((from: string, to: string, cat: string, brand: string) => {
    setProductsLoading(true);
    api.salesTopProducts(toDateKey(from), toDateKey(to), cat || undefined, brand || undefined)
      .then((res: any) => {
        if (res.success) {
          setFilteredProducts((res.data || []).map((r: any) => ({
            ...r,
            revenue: Number(r.revenue) || 0,
            gp: Number(r.gp) || 0,
            qty: Number(r.qty) || 0,
            margin: Number(r.margin) || 0,
            invoice_count: Number(r.invoice_count) || 0,
            branch_count: Number(r.branch_count) || 0,
          })));
        }
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    fetchData(dateFrom, dateTo);
    fetchTopProducts(dateFrom, dateTo, '', '');
    api.salesProductFilters().then(res => {
      if (res.success) {
        setCategories(res.data.categories);
        setBrands(res.data.brands);
      }
    });
  }, []);

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    fetchData(from, to);
    fetchTopProducts(from, to, selCategory, selBrand);
  };

  const handleCategoryChange = (cat: string) => {
    setSelCategory(cat);
    fetchTopProducts(dateFrom, dateTo, cat, selBrand);
  };

  const handleBrandChange = (brand: string) => {
    setSelBrand(brand);
    fetchTopProducts(dateFrom, dateTo, selCategory, brand);
  };

  if (loading && !data) return <Loading />;
  if (!data) return <div className="text-center text-gray-400 py-20">ไม่สามารถโหลดข้อมูลได้</div>;

  const salesTrend: any[] = (data.salesTrend || []).map((r: any) => ({ ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0, discount: Number(r.discount) || 0, invoices: Number(r.invoices) || 0 }));
  const categoryBreakdown: any[] = (data.categoryBreakdown || []).map((r: any) => ({ ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0, qty: Number(r.qty) || 0 }));
  const paymentMix: any[] = (data.paymentMix || []).map((r: any) => ({ ...r, amount: Number(r.amount) || 0, count: Number(r.count) || 0 }));

  const totalRevenue = salesTrend.reduce((sum: number, r: any) => sum + r.revenue, 0);
  const totalGP = salesTrend.reduce((sum: number, r: any) => sum + r.gp, 0);
  const totalInvoices = salesTrend.reduce((sum: number, r: any) => sum + r.invoices, 0);
  const totalDiscount = salesTrend.reduce((sum: number, r: any) => sum + r.discount, 0);
  const topProductsRevenue = filteredProducts.reduce((s: number, r: any) => s + r.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ยอดขายและรายได้</h1>
          <p className="text-sm text-gray-500 mt-1">Sales & Revenue Analytics</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="รายได้รวม" value={formatCurrency(totalRevenue)} subtitle="Total Revenue" icon={<DollarSign className="w-6 h-6" />} color="blue" onClick={() => setKpiDrilldown('revenue')} />
        <KpiCard title="กำไรขั้นต้น" value={formatCurrency(totalGP)} subtitle="Gross Profit" icon={<TrendingUp className="w-6 h-6" />} color="green" onClick={() => setKpiDrilldown('gp')} />
        <KpiCard title="จำนวนใบแจ้งหนี้" value={formatNumber(totalInvoices)} subtitle="Total Invoices" icon={<ShoppingCart className="w-6 h-6" />} color="purple" onClick={() => setKpiDrilldown('invoices')} />
        <KpiCard title="ส่วนลดรวม" value={formatCurrency(totalDiscount)} subtitle="Discount Amount" icon={<CreditCard className="w-6 h-6" />} color="orange" onClick={() => setKpiDrilldown('discount')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="แนวโน้มยอดขายรายเดือน" subtitle="Monthly Sales Trend">
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month_no" tick={{ fontSize: 12 }} tickFormatter={(v: any) => `เดือน ${v}`} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: any) => formatCurrency(v)} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="revenue" name="รายได้" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gp" name="กำไรขั้นต้น" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="สัดส่วนตามหมวดหมู่" subtitle="Category Breakdown">
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="revenue" nameKey="category_name" cx="50%" cy="45%" outerRadius={80}
                  label={({ x, y, category_name, percent }: any) => (
                    <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fill="#374151">
                      {`${category_name} ${((percent || 0) * 100).toFixed(1)}%`}
                    </text>
                  )}>
                  {categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="สัดส่วนช่องทางชำระเงิน" subtitle="Payment Mix">
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentMix} dataKey="amount" nameKey="payment_method_name" cx="50%" cy="45%" outerRadius={80}
                  label={({ x, y, payment_method_name, percent }: any) => (
                    <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fill="#374151">
                      {`${payment_method_name} ${((percent || 0) * 100).toFixed(1)}%`}
                    </text>
                  )}>
                  {paymentMix.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top Products with Filters + Drill-down */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              สินค้าขายดี
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">คลิกที่สินค้าเพื่อดู Drill-down รายละเอียด Invoice</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[130px]"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selBrand}
              onChange={e => handleBrandChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[120px]"
            >
              <option value="">ทุกยี่ห้อ</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {(selCategory || selBrand) && (
              <button
                onClick={() => { setSelCategory(''); setSelBrand(''); fetchTopProducts(dateFrom, dateTo, '', ''); }}
                className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                ล้างฟิลเตอร์
              </button>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={Math.max(300, Math.min(filteredProducts.length * 32, 600))}>
            <BarChart data={filteredProducts.slice(0, 20)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" fontSize={10} tickFormatter={(v: any) => formatCurrency(v)} />
              <YAxis type="category" dataKey="product_name" fontSize={10} width={150} />
              <Tooltip
                formatter={(v: any, name: any) => name === 'จำนวน' ? formatNumber(v) : formatCurrency(v)}
                cursor={{ fill: '#dbeafe', opacity: 0.5 }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="รายได้" />
              <Bar dataKey="gp" fill="#10b981" radius={[0, 4, 4, 0]} name="กำไร" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Products Table */}
        {productsLoading ? (
          <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold text-gray-600">#</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-600">สินค้า</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-600">หมวดหมู่</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-600">ยี่ห้อ</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">จำนวน</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">รายได้</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">สัดส่วน</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">กำไรขั้นต้น</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">อัตรากำไร</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">Invoice</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-600">สาขา</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">ดูข้อมูล</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p: any, i: number) => {
                  const pct = topProductsRevenue > 0 ? (p.revenue / topProductsRevenue * 100) : 0;
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
                      <td className="py-2.5 px-3 text-xs text-gray-500">{p.brand_name || '-'}</td>
                      <td className="py-2.5 px-3 text-right">{formatNumber(p.qty)}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-gray-200 rounded-full h-1.5">
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
                      <td className="py-2.5 px-3 text-right text-gray-600">{formatNumber(p.invoice_count)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{formatNumber(p.branch_count)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 inline transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KPI Drill-down Modal */}
      {kpiDrilldown && (
        <SalesKpiDrilldown
          type={kpiDrilldown}
          dateFrom={toDateKey(dateFrom)}
          dateTo={toDateKey(dateTo)}
          onClose={() => setKpiDrilldown(null)}
        />
      )}

      {/* Product Drill-down Modal */}
      {selectedProduct && (
        <SalesProductDrilldown
          productKey={selectedProduct.product_key}
          productName={selectedProduct.product_name}
          categoryName={selectedProduct.category_name}
          brandName={selectedProduct.brand_name || ''}
          dateFrom={toDateKey(dateFrom)}
          dateTo={toDateKey(dateTo)}
          productSummary={{
            revenue: selectedProduct.revenue,
            gp: selectedProduct.gp,
            qty: selectedProduct.qty,
            margin: selectedProduct.margin,
            invoice_count: selectedProduct.invoice_count,
            branch_count: selectedProduct.branch_count,
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
