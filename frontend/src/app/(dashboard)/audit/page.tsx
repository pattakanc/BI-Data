'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = { PASS: '#10b981', IMPROVE: '#f59e0b', FAIL: '#ef4444' };

export default function AuditPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.auditSummary(toDateKey(from), toDateKey(to))
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

  const { overview, byBranch: rawByBranch, byChecklist: rawByChecklist } = data;
  const byBranch = (rawByBranch || []).map((r: any) => ({ ...r, avg_score: Number(r.avg_score) || 0, pass: Number(r.pass) || 0, fail: Number(r.fail) || 0, total: Number(r.total) || 0 }));
  const byChecklist = (rawByChecklist || []).map((r: any) => ({ ...r, avg_score: Number(r.avg_score) || 0 }));

  const pieData = [
    { name: 'ผ่าน', value: parseInt(overview.pass_count), color: STATUS_COLORS.PASS },
    { name: 'ปรับปรุง', value: parseInt(overview.improve_count), color: STATUS_COLORS.IMPROVE },
    { name: 'ไม่ผ่าน', value: parseInt(overview.fail_count), color: STATUS_COLORS.FAIL },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบและคุณภาพ</h1>
          <p className="text-sm text-gray-500 mt-1">Audit & Compliance Analytics</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="ตรวจสอบทั้งหมด" value={formatNumber(overview.total_checks)} icon={<ShieldCheck className="w-6 h-6" />} color="blue" />
        <KpiCard title="ผ่าน" value={formatNumber(overview.pass_count)} icon={<CheckCircle className="w-6 h-6" />} color="green" />
        <KpiCard title="ต้องปรับปรุง" value={formatNumber(overview.improve_count)} icon={<AlertTriangle className="w-6 h-6" />} color="orange" />
        <KpiCard title="ไม่ผ่าน" value={formatNumber(overview.fail_count)} icon={<XCircle className="w-6 h-6" />} color="red" subtitle={`คะแนนเฉลี่ย ${parseFloat(overview.avg_score).toFixed(1)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="สัดส่วนผลการตรวจ">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" outerRadius={85} dataKey="value"
                label={({ x, y, name, percent }: any) => (
                  <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#374151">
                    {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  </text>
                )}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="คะแนนตาม Checklist">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byChecklist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} fontSize={12} />
              <YAxis type="category" dataKey="checklist_name" fontSize={11} width={120} />
              <Tooltip formatter={(value: any) => parseFloat(value).toFixed(1)} />
              <Bar dataKey="avg_score" fill="#3b82f6" radius={[0, 6, 6, 0]} name="คะแนนเฉลี่ย" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="คะแนนตรวจสอบรายสาขา">
        <DataTable
          columns={[
            { key: 'branch_name', label: 'สาขา' },
            { key: 'avg_score', label: 'คะแนนเฉลี่ย', align: 'right' as const, render: (v: any) => (
              <span className={`font-semibold ${parseFloat(v) >= 80 ? 'text-green-600' : parseFloat(v) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{parseFloat(v).toFixed(1)}</span>
            )},
            { key: 'pass', label: 'ผ่าน', align: 'right' as const, render: (v: any) => <span className="text-green-600">{v}</span> },
            { key: 'fail', label: 'ไม่ผ่าน', align: 'right' as const, render: (v: any) => <span className="text-red-600">{v}</span> },
            { key: 'total', label: 'ทั้งหมด', align: 'right' as const },
          ]}
          data={byBranch}
        />
      </ChartCard>
    </div>
  );
}
