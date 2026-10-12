import { describe, it, expect } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('should format Bahraini Dinar (BHD) with 3 decimal places', () => {
    // Note: formatting results might use non-breaking spaces depending on runtime locale details.
    // We clean spaces to assert raw character representations.
    const result = formatMoney(123.456, 'BHD').replace(/\s/g, ' ');
    expect(result).toContain('123.456');
    expect(result).toContain('BHD');
  });

  it('should format standard currencies with 2 decimal places', () => {
    const result = formatMoney(12.345, 'USD').replace(/\s/g, ' ');
    expect(result).toContain('12.35');
    expect(result).toMatch(/\$|USD/);
  });

  it('should handle string inputs correctly', () => {
    const result = formatMoney('450.780', 'BHD').replace(/\s/g, ' ');
    expect(result).toContain('450.780');
  });

  it('should return a fallback string for null or undefined values', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('should return a fallback string for invalid number inputs', () => {
    expect(formatMoney('invalid-number')).toBe('—');
  });
});
