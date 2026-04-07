'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Building2, TrendingUp, Users, DollarSign, ExternalLink } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import FullscreenChart from '@/components/FullscreenChart';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import BranchDetailModal from '@/components/BranchDetailModal';
import BranchKpiDrilldown from '@/components/BranchKpiDrilldown';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function BranchPerformancePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [kpiDrilldown, setKpiDrilldown] = useState<'branches' | 'sales' | 'gp' | 'margin' | null>(null);

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.branchPerformance(toDateKey(from), toDateKey(to))
      .then((res: any) => { if (res.success) setData(res.data?.branches ?? []); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(dateFrom, dateTo); }, []);

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    fetchData(from, to);
  };

  if (loading && data.length === 0) return <Loading />;

  const totalBranches = data.length;
  const totalSales = data.reduce((sum, r) => sum + Number(r.sales || 0), 0);
  const totalGP = data.reduce((sum, r) => sum + Number(r.gp || 0), 0);
  const avgMargin = totalSales > 0 ? totalGP / totalSales : 0;

  const barData = [...data].sort((a, b) => Number(b.sales) - Number(a.sales)).map((r) => ({
    branch_name: r.branch_name,
    branch_key: r.branch_key,
    sales: Number(r.sales || 0),
    gp: Number(r.gp || 0),
    region_name: r.region_name,
    margin: Number(r.margin || 0),
    invoices: Number(r.invoices || 0),
    customers: Number(r.customers || 0),
  }));

  const regionMap = new Map<string, number>();
  data.forEach((r) => { const region = r.region_name || 'ไม่ระบุ'; regionMap.set(region, (regionMap.get(region) || 0) + Number(r.sales || 0)); });
  const regionData = Array.from(regionMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const handleBarClick = (chartData: any) => {
    if (!chartData?.activePayload?.[0]?.payload) return;
    const b = chartData.activePayload[0].payload;
    setSelectedBranch(b);
  };

  const handleRowClick = (row: any) => {
    setSelectedBranch({
      branch_key: row.branch_key,
      branch_name: row.branch_name,
      region_name: row.region_name,
      sales: Number(row.sales || 0),
      gp: Number(row.gp || 0),
      margin: Number(row.margin || 0),
      invoices: Number(row.invoices || 0),
      customers: Number(row.customers || 0),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผลงานสาขา</h1>
          <p className="text-sm text-gray-500 mt-1">Branch Performance Analytics — คลิกที่กราฟหรือแถวเพื่อดู Drill-down</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="จำนวนสาขา" value={formatNumber(totalBranches)} subtitle="Total Branches" icon={<Building2 className="w-6 h-6" />} color="blue" onClick={() => setKpiDrilldown('branches')} />
        <KpiCard title="ยอดขายรวม" value={formatCurrency(totalSales)} subtitle="Total Sales" icon={<DollarSign className="w-6 h-6" />} color="green" onClick={() => setKpiDrilldown('sales')} />
        <KpiCard title="กำไรขั้นต้นรวม" value={formatCurrency(totalGP)} subtitle="Total GP" icon={<TrendingUp className="w-6 h-6" />} color="purple" onClick={() => setKpiDrilldown('gp')} />
        <KpiCard title="อัตรากำไรเฉลี่ย" value={formatPercent(avgMargin)} subtitle="Average Margin" icon={<Users className="w-6 h-6" />} color="orange" onClick={() => setKpiDrilldown('margin')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Branch Sales Ranking - Expandable + Clickable */}
        <FullscreenChart title="อันดับยอดขายสาขา" subtitle="คลิกแถบกราฟเพื่อ Drill-down" className="lg:col-span-2">
          {(expanded) => (
            <div style={{ height: expanded ? 600 : 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v: any) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="branch_name" width={expanded ? 140 : 120} tick={{ fontSize: expanded ? 12 : 11 }} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), 'ยอดขาย']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    cursor={{ fill: '#dbeafe', opacity: 0.5 }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </FullscreenChart>

        {/* Region Breakdown - Expandable */}
        <FullscreenChart title="สัดส่วนตามภูมิภาค" subtitle="Region Breakdown">
          {(expanded) => (
            <div style={{ height: expanded ? 500 : 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={expanded ? 160 : 90}
                    label={({ x, y, name, percent }: any) => (
                      <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={expanded ? 13 : 11} fill="#374151">
                        {`${name} ${((percent || 0) * 100).toFixed(1)}%`}
                      </text>
                    )} labelLine>
                    {regionData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </FullscreenChart>
      </div>

      {/* Data Table - Clickable rows */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">รายละเอียดสาขา</h3>
            <p className="text-xs text-gray-400 mt-0.5">คลิกแถวเพื่อดูรายละเอียดสินค้าของสาขา</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-600">สาขา</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600">ภูมิภาค</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">ยอดขาย</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">กำไรขั้นต้น</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">อัตรากำไร</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">จำนวนบิล</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">ลูกค้า</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">เฉลี่ย/บิล</th>
                <th className="text-center py-3 px-3 font-semibold text-gray-600">ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, i: number) => (
                <tr
                  key={i}
                  onClick={() => handleRowClick(row)}
                  className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 font-medium text-gray-800">{row.branch_name}</td>
                  <td className="py-2.5 px-3 text-gray-600">{row.region_name}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(row.sales)}</td>
                  <td className="py-2.5 px-3 text-right text-green-600">{formatCurrency(row.gp)}</td>
                  <td className="py-2.5 px-3 text-right">{formatPercent(row.margin)}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.invoices)}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.customers)}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(row.avg_ticket)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 inline transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch KPI Drill-down Modal */}
      {kpiDrilldown && (
        <BranchKpiDrilldown
          type={kpiDrilldown}
          dateFrom={toDateKey(dateFrom)}
          dateTo={toDateKey(dateTo)}
          onClose={() => setKpiDrilldown(null)}
        />
      )}

      {/* Branch Detail Modal */}
      {selectedBranch && (
        <BranchDetailModal
          branchKey={selectedBranch.branch_key}
          branchName={selectedBranch.branch_name}
          regionName={selectedBranch.region_name}
          dateFrom={toDateKey(dateFrom)}
          dateTo={toDateKey(dateTo)}
          onClose={() => setSelectedBranch(null)}
          branchSummary={{
            sales: selectedBranch.sales,
            gp: selectedBranch.gp,
            margin: selectedBranch.margin,
            invoices: selectedBranch.invoices,
            customers: selectedBranch.customers,
          }}
        />
      )}
    </div>
  );
}
