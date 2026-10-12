import { describe, it, expect } from 'vitest';
import { formatDateOnly, formatDateTime, formatTimeOnly } from './date';

describe('Date/Time Formatters', () => {
  describe('formatDateOnly', () => {
    it('should format date strings ignoring time offsets', () => {
      const result = formatDateOnly('2026-07-10');
      expect(result).toBe('Jul 10, 2026');
    });

    it('should return default fallback if date is null or invalid', () => {
      expect(formatDateOnly(null)).toBe('—');
      expect(formatDateOnly('invalid')).toBe('—');
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO datetime strings in Bahrain offset (+03:00)', () => {
      // 2026-07-10T12:00:00Z -> 3:00 PM in Bahrain (UTC+3)
      const result = formatDateTime('2026-07-10T12:00:00Z');
      expect(result).toContain('Jul 10, 2026');
      expect(result).toContain('3:00 PM');
    });
  });

  describe('formatTimeOnly', () => {
    it('should convert military duration TimeSpan to standard AM/PM format', () => {
      expect(formatTimeOnly('14:30:00')).toBe('2:30 PM');
      expect(formatTimeOnly('09:15:00')).toBe('9:15 AM');
    });

    it('should return original value or fallback if TimeSpan format is invalid', () => {
      expect(formatTimeOnly(null)).toBe('—');
      expect(formatTimeOnly('12')).toBe('12');
    });
  });
});
