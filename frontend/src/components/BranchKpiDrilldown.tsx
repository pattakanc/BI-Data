'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { X, Search, Building2, TrendingUp, DollarSign, Users, Package, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const KPI_CONFIG = {
  branches: {
    title: 'จำนวนสาขา',
    subtitle: 'Total Branches — รายละเอียดสาขาทั้งหมด',
    icon: Building2,
    color: '#3b82f6',
    bgClass: 'bg-blue-600',
    lightBg: 'bg-blue-50',
    textClass: 'text-blue-800',
    labelClass: 'text-blue-600',
    mainField: 'branches' as const,
    mainFormat: formatNumber,
    mainLabel: 'สาขา',
    chartField: 'sales' as const,
    chartLabel: 'ยอดขาย',
    chartColor: '#3b82f6',
    trendField: 'sales' as const,
    trendLabel: 'ยอดขาย',
    branchSortLabel: 'ยอดขาย',
  },
  sales: {
    title: 'ยอดขายรวม',
    subtitle: 'Total Sales — Drill-down รายละเอียดยอดขาย',
    icon: DollarSign,
    color: '#10b981',
    bgClass: 'bg-emerald-600',
    lightBg: 'bg-green-50',
    textClass: 'text-green-800',
    labelClass: 'text-green-600',
    mainField: 'sales' as const,
    mainFormat: formatCurrency,
    mainLabel: 'ยอดขาย',
    chartField: 'sales' as const,
    chartLabel: 'ยอดขาย',
    chartColor: '#10b981',
    trendField: 'sales' as const,
    trendLabel: 'ยอดขาย',
    branchSortLabel: 'ยอดขายสูงสุด',
  },
  gp: {
    title: 'กำไรขั้นต้นรวม',
    subtitle: 'Total GP — Drill-down รายละเอียดกำไร',
    icon: TrendingUp,
    color: '#8b5cf6',
    bgClass: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    textClass: 'text-purple-800',
    labelClass: 'text-purple-600',
    mainField: 'gp' as const,
    mainFormat: formatCurrency,
    mainLabel: 'กำไรขั้นต้น',
    chartField: 'gp' as const,
    chartLabel: 'กำไรขั้นต้น',
    chartColor: '#8b5cf6',
    trendField: 'gp' as const,
    trendLabel: 'กำไรขั้นต้น',
    branchSortLabel: 'กำไรสูงสุด',
  },
  margin: {
    title: 'อัตรากำไรเฉลี่ย',
    subtitle: 'Average Margin — Drill-down อัตรากำไรแต่ละสาขา',
    icon: Users,
    color: '#f59e0b',
    bgClass: 'bg-amber-500',
    lightBg: 'bg-orange-50',
    textClass: 'text-orange-800',
    labelClass: 'text-orange-600',
    mainField: 'margin' as const,
    mainFormat: formatPercent,
    mainLabel: 'อัตรากำไร',
    chartField: 'margin' as const,
    chartLabel: 'อัตรากำไร',
    chartColor: '#f59e0b',
    trendField: 'sales' as const,
    trendLabel: 'ยอดขาย',
    branchSortLabel: 'อัตรากำไรสูงสุด',
  },
};

interface BranchKpiDrilldownProps {
  type: 'branches' | 'sales' | 'gp' | 'margin';
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
}

export default function BranchKpiDrilldown({ type, dateFrom, dateTo, onClose }: BranchKpiDrilldownProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<any[]>([]);
  const [selRegion, setSelRegion] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const cfg = KPI_CONFIG[type];
  const Icon = cfg.icon;
  const toKey = (d: string) => d.replace(/-/g, '');

  const fetchData = useCallback((region?: string, prodSearch?: string) => {
    setLoading(true);
    api.branchKpiDrilldown(type, toKey(dateFrom), toKey(dateTo), region || undefined, prodSearch || undefined)
      .then((res: any) => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
    api.regions().then((res: any) => { if (res.success) setRegions(res.data); });
  }, [fetchData]);

  const handleRegionChange = (val: string) => { setSelRegion(val); fetchData(val, productSearch); };
  const handleSearch = () => { setProductSearch(searchInput); fetchData(selRegion, searchInput); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const branchSummary = (data?.branchSummary || []).map((r: any) => ({
    ...r, sales: Number(r.sales) || 0, gp: Number(r.gp) || 0,
    margin: Number(r.margin) || 0, invoices: Number(r.invoices) || 0,
    customers: Number(r.customers) || 0, avg_ticket: Number(r.avg_ticket) || 0,
  }));
  const regionSummary = (data?.regionSummary || []).map((r: any) => ({
    ...r, sales: Number(r.sales) || 0, gp: Number(r.gp) || 0,
    margin: Number(r.margin) || 0, invoices: Number(r.invoices) || 0,
    branch_count: Number(r.branch_count) || 0,
  }));
  const dailyTrend = (data?.dailyTrend || []).map((r: any) => ({
    ...r, sales: Number(r.sales) || 0, gp: Number(r.gp) || 0, invoices: Number(r.invoices) || 0,
  }));
  const topProducts = (data?.topProducts || []).map((r: any) => ({
    ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0, qty: Number(r.qty) || 0,
    branch_count: Number(r.branch_count) || 0,
  }));
  const totals = data?.totals || { branches: 0, sales: 0, gp: 0, invoices: 0, customers: 0, margin: 0 };

  // For margin type, sort branches by margin desc
  const sortedBranches = type === 'margin'
    ? [...branchSummary].sort((a, b) => b.margin - a.margin)
    : branchSummary;

  // For margin chart, show margin % instead of value
  const marginChartData = sortedBranches.slice(0, 20).map((b: any) => ({
    ...b,
    marginPct: (b.margin * 100),
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.bgClass} flex items-center justify-center text-white shadow-lg`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{cfg.title}</h2>
                <p className="text-sm text-gray-500">{cfg.subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main KPI Value */}
          <div className={`${cfg.lightBg} rounded-xl px-5 py-3 mt-4 flex items-center justify-between`}>
            <div>
              <div className={`text-xs ${cfg.labelClass} font-medium`}>{cfg.mainLabel}</div>
              <div className={`text-2xl font-bold ${cfg.textClass}`}>{cfg.mainFormat(totals[cfg.mainField])}</div>
            </div>
            <div className="text-right text-xs text-gray-400 space-y-0.5">
              {type !== 'branches' && <div>{totals.branches} สาขา</div>}
              {type !== 'sales' && <div>ยอดขาย {formatCurrency(totals.sales)}</div>}
              {type !== 'gp' && <div>กำไร {formatCurrency(totals.gp)}</div>}
              <div>{formatNumber(totals.invoices)} บิล | {formatNumber(totals.customers)} ลูกค้า</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <select
                value={selRegion}
                onChange={e => handleRegionChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[160px]"
              >
                <option value="">ทุกภูมิภาค</option>
                {regions.map((r: any) => (
                  <option key={r.region_code} value={r.region_name}>{r.region_name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="ค้นหาสินค้า..."
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[180px]"
              />
              <button onClick={handleSearch}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                ค้นหา
              </button>
            </div>
            {(selRegion || productSearch) && (
              <button onClick={() => { setSelRegion(''); setSearchInput(''); setProductSearch(''); fetchData('', ''); }}
                className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                ล้างฟิลเตอร์
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daily Trend */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">แนวโน้ม{cfg.trendLabel}รายวัน</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="full_date" fontSize={10}
                      tickFormatter={(v: any) => new Date(v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} />
                    <YAxis fontSize={10} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(v)}
                      labelFormatter={(l: any) => new Date(l).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="ยอดขาย" dot={false} />
                    <Line type="monotone" dataKey="gp" stroke="#10b981" strokeWidth={2} name="กำไร" dot={false} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branch Chart */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    {type === 'margin' ? 'อัตรากำไรแต่ละสาขา' : `${cfg.chartLabel}แยกตามสาขา`}
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(250, Math.min(sortedBranches.length * 24, 500))}>
                    <BarChart data={type === 'margin' ? marginChartData : sortedBranches.slice(0, 20)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" fontSize={10}
                        tickFormatter={(v: any) => type === 'margin' ? `${v.toFixed(0)}%` : `${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="branch_name" fontSize={10} width={100} />
                      <Tooltip formatter={(v: any) => type === 'margin' ? `${Number(v).toFixed(1)}%` : formatCurrency(v)} />
                      <Bar dataKey={type === 'margin' ? 'marginPct' : cfg.chartField} fill={cfg.chartColor} radius={[0, 4, 4, 0]}
                        name={type === 'margin' ? 'อัตรากำไร %' : cfg.chartLabel} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Region Pie + Top Products */}
                <div className="space-y-6">
                  {/* Region Breakdown */}
                  {regionSummary.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        <MapPin className="w-4 h-4 inline mr-1" />สัดส่วนตามภูมิภาค
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-left py-2 px-2 font-semibold text-gray-600">ภูมิภาค</th>
                              <th className="text-right py-2 px-2 font-semibold text-gray-600">สาขา</th>
                              <th className="text-right py-2 px-2 font-semibold text-gray-600">ยอดขาย</th>
                              <th className="text-right py-2 px-2 font-semibold text-gray-600">กำไร</th>
                              <th className="text-right py-2 px-2 font-semibold text-gray-600">อัตรากำไร</th>
                              <th className="text-right py-2 px-2 font-semibold text-gray-600">บิล</th>
                            </tr>
                          </thead>
                          <tbody>
                            {regionSummary.map((r: any, i: number) => (
                              <tr key={i} className="border-b border-gray-100 hover:bg-white cursor-pointer"
                                onClick={() => { setSelRegion(r.region_name); fetchData(r.region_name, productSearch); }}>
                                <td className="py-1.5 px-2 font-medium text-blue-600">{r.region_name}</td>
                                <td className="py-1.5 px-2 text-right">{r.branch_count}</td>
                                <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(r.sales)}</td>
                                <td className="py-1.5 px-2 text-right text-green-600">{formatCurrency(r.gp)}</td>
                                <td className="py-1.5 px-2 text-right">{formatPercent(r.margin)}</td>
                                <td className="py-1.5 px-2 text-right">{formatNumber(r.invoices)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Top Products */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      <Package className="w-4 h-4 inline mr-1" />Top 15 สินค้า
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">#</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">สินค้า</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">จำนวน</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">รายได้</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">กำไร</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">สาขา</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProducts.map((p: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-white">
                              <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                              <td className="py-1.5 px-2 font-medium text-gray-700">{p.product_name}</td>
                              <td className="py-1.5 px-2 text-right">{formatNumber(p.qty)}</td>
                              <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(p.revenue)}</td>
                              <td className="py-1.5 px-2 text-right text-green-600">{formatCurrency(p.gp)}</td>
                              <td className="py-1.5 px-2 text-right text-gray-500">{p.branch_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Branch Table */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  ตารางรายสาขา (เรียงตาม{cfg.branchSortLabel})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-100">
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-600">#</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-600">สาขา</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-600">ภูมิภาค</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-600">ยอดขาย</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-600">กำไรขั้นต้น</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-600">อัตรากำไร</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-600">จำนวนบิล</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-600">ลูกค้า</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-600">เฉลี่ย/บิล</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBranches.map((b: any, i: number) => {
                        const isHighlight = (type === 'sales' && i < 3) || (type === 'gp' && i < 3) || (type === 'margin' && i < 3);
                        return (
                          <tr key={i} className={`border-b border-gray-50 hover:bg-white ${isHighlight ? 'bg-yellow-50/50' : ''}`}>
                            <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                            <td className="py-2 px-3 font-medium text-gray-800">{b.branch_name}</td>
                            <td className="py-2 px-3 text-gray-500 text-xs">{b.region_name}</td>
                            <td className={`py-2 px-3 text-right ${type === 'sales' ? 'font-bold text-green-700' : ''}`}>{formatCurrency(b.sales)}</td>
                            <td className={`py-2 px-3 text-right ${type === 'gp' ? 'font-bold text-purple-700' : 'text-green-600'}`}>{formatCurrency(b.gp)}</td>
                            <td className={`py-2 px-3 text-right ${type === 'margin' ? 'font-bold text-orange-600' : ''}`}>
                              <span className={`text-xs font-semibold ${b.margin >= 0.5 ? 'text-green-600' : b.margin >= 0.3 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatPercent(b.margin)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">{formatNumber(b.invoices)}</td>
                            <td className="py-2 px-3 text-right">{formatNumber(b.customers)}</td>
                            <td className="py-2 px-3 text-right text-gray-500">{formatCurrency(b.avg_ticket)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                        <td className="py-2.5 px-3" colSpan={3}>รวมทั้งหมด ({totals.branches} สาขา)</td>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(totals.sales)}</td>
                        <td className="py-2.5 px-3 text-right text-green-600">{formatCurrency(totals.gp)}</td>
                        <td className="py-2.5 px-3 text-right">{formatPercent(totals.margin)}</td>
                        <td className="py-2.5 px-3 text-right">{formatNumber(totals.invoices)}</td>
                        <td className="py-2.5 px-3 text-right">{formatNumber(totals.customers)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-500">
                          {totals.invoices > 0 ? formatCurrency(totals.sales / totals.invoices) : '฿0'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
