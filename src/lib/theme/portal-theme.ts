export type PortalType = 'sales' | 'accounts' | 'master-accountant' | 'operations';

export const PORTAL_THEMES: Record<PortalType, string> = {
  sales: 'theme-sales',
  accounts: 'theme-accounts',
  'master-accountant': 'theme-master-accountant',
  operations: 'theme-operations'
};

export function getPortalThemeClass(portal: PortalType): string {
  return PORTAL_THEMES[portal] || 'theme-sales';
}
