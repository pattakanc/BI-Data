'use client';

import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface FullscreenChartProps {
  title: string;
  subtitle?: string;
  children: (expanded: boolean) => React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function FullscreenChart({ title, subtitle, children, action, className = '' }: FullscreenChartProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Normal card */}
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <button
              onClick={() => setExpanded(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="ขยายเต็มหน้าจอ"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {children(false)}
      </div>

      {/* Fullscreen overlay */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setExpanded(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children(true)}
          </div>
        </div>
      )}
    </>
  );
}
