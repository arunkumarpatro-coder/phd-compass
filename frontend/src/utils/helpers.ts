export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function getDayOfWeek(date: Date): string {
  return DAYS[date.getDay()];
}

export function formatDisplayDate(date: Date): string {
  return `${getDayOfWeek(date)}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getWeekDateRange(date: Date): string {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  const fmt = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function calculateStreak(entries: { date: string }[]): number {
  if (entries.length === 0) return 0;

  const uniqueDates = [...new Set(entries.map(e => e.date))].sort().reverse();
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDates[i] + 'T00:00:00');
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays <= 2) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function isLastWeekOfMonth(date: Date): boolean {
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d.getMonth() !== date.getMonth();
}

export function isQuarterlyWeek(date: Date): boolean {
  const month = date.getMonth();
  return (month === 2 || month === 5 || month === 8 || month === 11) && isLastWeekOfMonth(date);
}

export function daysSince(isoDate: string): number {
  if (!isoDate) return Infinity;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

export function getEntriesForWeek(entries: { date: string }[], refDate: Date): { date: string }[] {
  const start = getWeekStart(refDate);
  const end = getWeekEnd(refDate);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return entries.filter(e => e.date >= startStr && e.date <= endStr);
}

export function getWeeksAgo(weeksBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeksBack * 7);
  return d;
}
