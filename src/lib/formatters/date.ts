/**
 * Timezone offset for Bahrain (UTC+3, no DST).
 */
export const BAHRAIN_TIMEZONE = 'Asia/Bahrain';

/**
 * Safely parses any date input from server or client into a Date object.
 *
 * CRITICAL TIMEZONE HANDLING:
 * 1. If date is already a Date object, returns it.
 * 2. If date is a date-only string (e.g., '2026-07-10'), parses year/month/day at noon UTC
 *    to prevent any global timezone boundary shifting.
 * 3. If date is an ISO date-time string without a timezone designator ('Z' or '+HH:mm'/'-HH:mm'),
 *    e.g., '2026-09-25T17:43:00.123', all Texas Portals backends store timestamps in UTC
 *    via DateTime.UtcNow in SQL Server datetime2 columns (which strip offset).
 *    Appending 'Z' ensures JavaScript parses it as UTC rather than the visitor's local
 *    browser timezone, so formatting to 'Asia/Bahrain' gives the true Bahrain time.
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Case A: Date-only format 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }

  // Case B: ISO string missing timezone offset (e.g. '2026-09-25T17:43:00' or with fractional seconds)
  let normalized = trimmed;
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed)) {
    normalized = trimmed.replace(' ', 'T') + 'Z';
  }

  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a date-only value (e.g., '2026-07-10' or Date).
 */
export function formatDateOnly(value: string | Date | null | undefined, locale = 'en-US'): string {
  if (!value) return '—';
  const date = parseDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: BAHRAIN_TIMEZONE
  }).format(date);
}

/** Alias for formatDateOnly */
export const formatDate = formatDateOnly;

/**
 * Formats a timezone-aware audit timestamp in Bahrain AST (+03:00).
 */
export function formatDateTime(value: string | Date | null | undefined, locale = 'en-US'): string {
  if (!value) return '—';
  const date = parseDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: BAHRAIN_TIMEZONE
  }).format(date);
}

/**
 * Formats time-only in Bahrain AST (+03:00) from a Date or ISO timestamp.
 */
export function formatBahrainTime(value: string | Date | null | undefined, locale = 'en-US'): string {
  if (!value) return '—';
  const date = parseDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: BAHRAIN_TIMEZONE
  }).format(date);
}

/**
 * Formats a business time-only TimeSpan value (e.g., '14:30:00').
 */
export function formatTimeOnly(timeSpan: string | null | undefined): string {
  if (!timeSpan) return '—';
  const parts = timeSpan.split(':');
  if (parts.length < 2) return timeSpan;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return timeSpan;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Returns current date string in Bahrain timezone (YYYY-MM-DD).
 */
export function getBahrainDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BAHRAIN_TIMEZONE }).format(d);
}

/**
 * Returns preset date ranges ('today', 'this-week', 'this-month') in Bahrain timezone.
 */
export function getBahrainPresetRanges() {
  const now = new Date();
  const todayStr = getBahrainDateString(now);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BAHRAIN_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now);

  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '2026', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

  const jsDate = new Date(year, month - 1, day);
  const dayOfWeek = (jsDate.getDay() + 6) % 7; // Monday = 0
  const mondayDate = new Date(jsDate);
  mondayDate.setDate(jsDate.getDate() - dayOfWeek);
  const mondayStr = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, '0')}-${String(mondayDate.getDate()).padStart(2, '0')}`;

  return {
    today: { startDate: todayStr, endDate: todayStr },
    thisWeek: { startDate: mondayStr, endDate: todayStr },
    thisMonth: { startDate: monthStart, endDate: monthEnd }
  };
}
