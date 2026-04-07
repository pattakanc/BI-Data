export function formatNumber(n: number | string | null | undefined, decimals = 0): string {
  if (n == null) return '0';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0';
  return num.toLocaleString('th-TH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatCurrency(n: number | string | null | undefined): string {
  if (n == null) return '฿0';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '฿0';
  if (Math.abs(num) >= 1000000) return `฿${(num / 1000000).toFixed(2)}M`;
  if (Math.abs(num) >= 1000) return `฿${(num / 1000).toFixed(1)}K`;
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPercent(n: number | string | null | undefined, decimals = 1): string {
  if (n == null) return '0%';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0%';
  return `${(num * 100).toFixed(decimals)}%`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format date as dd/mm/yyyy (CE year) */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format date short for chart axis: dd/mm */
export function formatDateShort(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/** Format date long for tooltip: dd/mm/yyyy */
export function formatDateLong(d: string | Date): string {
  return formatDate(d);
}
