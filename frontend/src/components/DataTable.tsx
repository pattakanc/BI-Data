'use client';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  maxRows?: number;
}

export default function DataTable({ columns, data, maxRows }: DataTableProps) {
  const rows = maxRows ? data.slice(0, maxRows) : data;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map(col => (
              <th key={col.key} className={`py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-${col.align || 'left'}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-3 text-${col.align || 'left'} text-gray-700`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="py-8 text-center text-gray-400">ไม่มีข้อมูล</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
