import type { HeadsQueryParams } from '../api/heads-api';

export const DEFAULTS: Required<Omit<HeadsQueryParams, 'searchTerm' | 'type'>> = {
  page: 1,
  pageSize: 10,
  sortBy: 'lastName',
  sortOrder: 'asc'
};

const ALLOWED_SORT_BY = ['firstName', 'lastName', 'wallet', 'createdAt'];
const ALLOWED_SORT_ORDER = ['asc', 'desc'];

/**
 * Parses URLSearchParams into strongly-typed HeadsQueryParams, applying strict boundaries and fallbacks.
 */
export function parseHeadsUrlParams(searchParams: URLSearchParams): HeadsQueryParams {
  const pageStr = searchParams.get('page');
  const pageSizeStr = searchParams.get('pageSize');
  const search = searchParams.get('search');
  const sortByStr = searchParams.get('sortBy');
  const sortOrderStr = searchParams.get('sortOrder');
  const type = searchParams.get('type');

  let page = DEFAULTS.page;
  if (pageStr) {
    const val = parseInt(pageStr, 10);
    if (!isNaN(val) && val >= 1) {
      page = val;
    }
  }

  let pageSize = DEFAULTS.pageSize;
  if (pageSizeStr) {
    const val = parseInt(pageSizeStr, 10);
    if (!isNaN(val) && val >= 1 && val <= 100) {
      pageSize = val;
    }
  }

  let sortBy = DEFAULTS.sortBy;
  if (sortByStr && ALLOWED_SORT_BY.includes(sortByStr)) {
    sortBy = sortByStr;
  }

  let sortOrder = DEFAULTS.sortOrder;
  if (sortOrderStr && ALLOWED_SORT_ORDER.includes(sortOrderStr)) {
    sortOrder = sortOrderStr;
  }

  return {
    page,
    pageSize,
    searchTerm: search?.trim() || undefined,
    sortBy,
    sortOrder,
    type: type?.trim() || 'customer'
  };
}

/**
 * Serializes HeadsQueryParams into a URLSearchParams object.
 */
export function serializeHeadsUrlParams(params: HeadsQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  if (params.page && params.page !== DEFAULTS.page) {
    searchParams.set('page', String(params.page));
  }
  if (params.pageSize && params.pageSize !== DEFAULTS.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }
  if (params.searchTerm?.trim()) {
    searchParams.set('search', params.searchTerm.trim());
  }
  if (params.sortBy && params.sortBy !== DEFAULTS.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params.sortOrder && params.sortOrder !== DEFAULTS.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }
  if (params.type) {
    searchParams.set('type', params.type);
  }

  return searchParams;
}
