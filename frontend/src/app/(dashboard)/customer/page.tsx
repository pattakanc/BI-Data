'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Users, UserPlus, Heart, Crown } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
const TIER_COLORS: Record<string, string> = { PLATINUM: '#a855f7', GOLD: '#f59e0b', SILVER: '#94a3b8', STANDARD: '#3b82f6' };

export default function CustomerPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.customerSummary(toDateKey(from), toDateKey(to))
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(dateFrom, dateTo); }, []);

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    fetchData(from, to);
  };

  if (loading && !data) return <Loading />;
  if (!data) return <div className="text-center py-20 text-gray-400">ไม่สามารถโหลดข้อมูลได้</div>;

  const { overview, tierDistribution: rawTierDist, visitTrend: rawVisitTrend, topCustomers: rawTopCustomers } = data;

  const tierData = [
    { name: 'Platinum', value: Number(overview.platinum) || 0 },
    { name: 'Gold', value: Number(overview.gold) || 0 },
    { name: 'Silver', value: Number(overview.silver) || 0 },
    { name: 'Standard', value: Number(overview.standard) || 0 },
  ];

  const tierDistribution = (rawTierDist || []).map((r: any) => ({ ...r, count: Number(r.count) || 0 }));
  const visitTrend = (rawVisitTrend || []).map((r: any) => ({ ...r, unique_customers: Number(r.unique_customers) || 0, total_visits: Number(r.total_visits) || 0 }));
  const topCustomers = (rawTopCustomers || []).map((r: any) => ({ ...r, visits: Number(r.visits) || 0, revenue: Number(r.revenue) || 0 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้าและ CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Customer Analytics & CRM Insights</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="ลูกค้าทั้งหมด" value={formatNumber(overview.total)} icon={<Users className="w-6 h-6" />} color="blue" />
        <KpiCard title="ลูกค้า Active" value={formatNumber(overview.active)} icon={<UserPlus className="w-6 h-6" />} color="green" />
        <KpiCard title="Platinum" value={formatNumber(overview.platinum)} icon={<Crown className="w-6 h-6" />} color="purple" />
        <KpiCard title="Gold" value={formatNumber(overview.gold)} icon={<Heart className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="สัดส่วนระดับสมาชิก" subtitle="Loyalty Tier Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={tierData} cx="50%" cy="45%" outerRadius={85} dataKey="value"
                label={({ x, y, name, percent }: any) => (
                  <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#374151">
                    {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  </text>
                )}>
                {tierData.map((entry, i) => <Cell key={i} fill={Object.values(TIER_COLORS)[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="แนวโน้มการเข้าใช้บริการ" subtitle="Monthly Visit Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month_no" tickFormatter={v => `เดือน ${v}`} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: any) => formatNumber(value)} />
              <Line type="monotone" dataKey="unique_customers" stroke="#3b82f6" strokeWidth={2} name="ลูกค้า" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="total_visits" stroke="#10b981" strokeWidth={2} name="จำนวนครั้ง" dot={{ r: 4 }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Segment Distribution">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={tierDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" fontSize={12} />
            <YAxis type="category" dataKey="segment_code" fontSize={12} width={80} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} name="จำนวน" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="ลูกค้า Top 15 ตามรายได้" subtitle="Top Customers by Revenue">
        <DataTable
          columns={[
            { key: 'full_name', label: 'ชื่อลูกค้า' },
            { key: 'loyalty_tier', label: 'ระดับ', render: (v: string) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'PLATINUM' ? 'bg-purple-100 text-purple-700' : v === 'GOLD' ? 'bg-yellow-100 text-yellow-700' : v === 'SILVER' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>{v}</span>
            )},
            { key: 'member_code', label: 'รหัสสมาชิก' },
            { key: 'visits', label: 'เข้าใช้บริการ', align: 'right' as const, render: (v: any) => formatNumber(v) },
            { key: 'revenue', label: 'รายได้', align: 'right' as const, render: (v: any) => formatCurrency(v) },
          ]}
          data={topCustomers}
        />
      </ChartCard>
    </div>
  );
}
