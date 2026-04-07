'use client';

import { useState } from 'react';
import { Calendar, Search } from 'lucide-react';

interface DateRangeFilterProps {
  from: string;        // yyyy-mm-dd
  to: string;          // yyyy-mm-dd
  onChange: (from: string, to: string) => void;
  loading?: boolean;
}

const PRESETS = [
  { label: 'วันนี้', days: 0 },
  { label: '7 วัน', days: 7 },
  { label: '30 วัน', days: 30 },
  { label: '90 วัน', days: 90 },
  { label: 'YTD', days: -1 },
  { label: 'ทั้งหมด', days: -2 },
];

function formatForInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(days: number): { from: string; to: string } {
  const to = new Date('2026-04-06');
  if (days === 0) {
    return { from: formatForInput(to), to: formatForInput(to) };
  }
  if (days === -1) {
    // YTD
    return { from: `${to.getFullYear()}-01-01`, to: formatForInput(to) };
  }
  if (days === -2) {
    // All data
    return { from: '2024-01-01', to: formatForInput(to) };
  }
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  return { from: formatForInput(from), to: formatForInput(to) };
}

export default function DateRangeFilter({ from, to, onChange, loading }: DateRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  const handleApply = () => {
    onChange(localFrom, localTo);
  };

  const handlePreset = (days: number) => {
    const range = getPresetRange(days);
    setLocalFrom(range.from);
    setLocalTo(range.to);
    onChange(range.from, range.to);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.days)}
            disabled={loading}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

      {/* Date inputs */}
      <div className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input
          type="date"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <span className="text-xs text-gray-400">ถึง</span>
        <input
          type="date"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <button
          onClick={handleApply}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5" />
          ค้นหา
        </button>
      </div>

      {loading && (
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

// Convert yyyy-mm-dd to YYYYMMDD integer for API
export function toDateKey(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}
