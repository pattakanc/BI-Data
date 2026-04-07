'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { GraduationCap, BookOpen, Award, Clock } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#94a3b8'];

export default function LearningPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.learningSummary(toDateKey(from), toDateKey(to))
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

  const { overview, byCourse: rawByCourse } = data;
  const byCourse = (rawByCourse || []).map((r: any) => ({ ...r, avg_completion: Number(r.avg_completion) || 0, avg_score: Number(r.avg_score) || 0, certified: Number(r.certified) || 0 }));

  const certPie = [
    { name: 'ผ่านการรับรอง', value: parseInt(overview.certified_count) },
    { name: 'กำลังเรียน', value: parseInt(overview.in_progress_count) },
    { name: 'ยังไม่เริ่ม', value: parseInt(overview.not_started_count) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การเรียนรู้และพัฒนา</h1>
          <p className="text-sm text-gray-500 mt-1">Learning & Capability Analytics</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="พนักงานทั้งหมด" value={formatNumber(overview.total_employees)} icon={<GraduationCap className="w-6 h-6" />} color="blue" />
        <KpiCard title="เรียนเฉลี่ย" value={`${parseFloat(overview.avg_completion).toFixed(1)}%`} icon={<BookOpen className="w-6 h-6" />} color="green" />
        <KpiCard title="ผ่านการรับรอง" value={formatNumber(overview.certified_count)} icon={<Award className="w-6 h-6" />} color="purple" />
        <KpiCard title="คะแนนเฉลี่ย" value={parseFloat(overview.avg_score).toFixed(1)} icon={<Clock className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="สถานะการรับรอง">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={certPie} cx="50%" cy="45%" outerRadius={85} dataKey="value"
                label={({ x, y, name, percent }: any) => (
                  <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#374151">
                    {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  </text>
                )}>
                {certPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ความสำเร็จรายหลักสูตร">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCourse} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} fontSize={12} />
              <YAxis type="category" dataKey="course_name" fontSize={11} width={120} />
              <Tooltip formatter={(value: any) => `${parseFloat(value).toFixed(1)}%`} />
              <Bar dataKey="avg_completion" fill="#3b82f6" radius={[0, 6, 6, 0]} name="เรียนเฉลี่ย %" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="คะแนนเฉลี่ยรายหลักสูตร">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byCourse}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="course_name" fontSize={11} />
            <YAxis domain={[0, 100]} fontSize={12} />
            <Tooltip />
            <Bar dataKey="avg_score" fill="#10b981" radius={[6, 6, 0, 0]} name="คะแนนเฉลี่ย" />
            <Bar dataKey="certified" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="ผ่านรับรอง (คน)" />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
