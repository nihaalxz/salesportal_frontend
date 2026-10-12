import { describe, it, expect } from 'vitest';
import { parseHeadsUrlParams, serializeHeadsUrlParams, DEFAULTS } from './url-state';

describe('Heads URL State Manager', () => {
  describe('parseHeadsUrlParams', () => {
    it('should parse valid values correctly', () => {
      const query = new URLSearchParams('page=3&pageSize=25&search=test&sortBy=wallet&sortOrder=desc');
      const params = parseHeadsUrlParams(query);
      
      expect(params.page).toBe(3);
      expect(params.pageSize).toBe(25);
      expect(params.searchTerm).toBe('test');
      expect(params.sortBy).toBe('wallet');
      expect(params.sortOrder).toBe('desc');
    });

    it('should apply default fallbacks on missing values', () => {
      const query = new URLSearchParams('');
      const params = parseHeadsUrlParams(query);
      
      expect(params.page).toBe(DEFAULTS.page);
      expect(params.pageSize).toBe(DEFAULTS.pageSize);
      expect(params.searchTerm).toBeUndefined();
      expect(params.sortBy).toBe(DEFAULTS.sortBy);
      expect(params.sortOrder).toBe(DEFAULTS.sortOrder);
    });

    it('should fall back defensively on invalid values', () => {
      const query = new URLSearchParams('page=-5&pageSize=200&sortBy=invalidCol&sortOrder=invalidDirection');
      const params = parseHeadsUrlParams(query);
      
      expect(params.page).toBe(DEFAULTS.page);
      expect(params.pageSize).toBe(DEFAULTS.pageSize); // fallback because 200 > 100 maximum boundary
      expect(params.sortBy).toBe(DEFAULTS.sortBy);
      expect(params.sortOrder).toBe(DEFAULTS.sortOrder);
    });
  });

  describe('serializeHeadsUrlParams', () => {
    it('should omit default values during serialization', () => {
      const params = serializeHeadsUrlParams({
        page: DEFAULTS.page,
        pageSize: DEFAULTS.pageSize,
        sortBy: DEFAULTS.sortBy,
        sortOrder: DEFAULTS.sortOrder
      });
      expect(params.toString()).toBe('');
    });

    it('should serialize overridden parameters correctly', () => {
      const params = serializeHeadsUrlParams({
        page: 5,
        searchTerm: 'hello',
        sortBy: 'wallet'
      });
      const queryStr = params.toString();
      expect(queryStr).toContain('page=5');
      expect(queryStr).toContain('search=hello');
      expect(queryStr).toContain('sortBy=wallet');
    });
  });
});
