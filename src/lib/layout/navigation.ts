import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Plane, 
  Hotel, 
  FileText, 
  CalendarRange, 
  Compass, 
  Car, 
  ConciergeBell,
  Receipt,
  FileSpreadsheet,
  UserCog,
  Scale
} from 'lucide-svelte';
import type { Component } from 'svelte';

export interface NavItem {
  label: string;
  route: string;
  icon: any;
  permission?: string;
  children?: NavItem[];
  exactMatch?: boolean;
  colorClass?: string;
}

export const navigationConfig: NavItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: LayoutDashboard,
    permission: 'read:dashboard',
    exactMatch: true,
    colorClass: 'text-indigo-500 dark:text-indigo-400'
  },
  {
    label: 'Heads',
    route: '/heads?type=customer',
    icon: Users,
    permission: 'read:heads',
    colorClass: 'text-emerald-500 dark:text-emerald-400'
  },
  {
    label: 'Leads',
    route: '/leads',
    icon: Sparkles,
    permission: 'read:leads',
    colorClass: 'text-violet-500 dark:text-violet-400'
  },
  {
    label: 'Receipts',
    route: '/receipts',
    icon: Receipt,
    permission: 'read:receipts',
    colorClass: 'text-amber-500 dark:text-amber-400'
  },
  {
    label: 'Quotations',
    route: '/quotations',
    icon: FileSpreadsheet,
    permission: 'read:bookings',
    colorClass: 'text-teal-600 dark:text-teal-400'
  },
  {
    label: 'Bookings',
    route: '/bookings',
    icon: Plane,
    permission: 'read:bookings',
    colorClass: 'text-sky-500 dark:text-sky-400',
    children: [
      {
        label: 'Flight Tickets',
        route: '/bookings/flights',
        icon: Plane,
        colorClass: 'text-sky-500 dark:text-sky-400'
      },
      {
        label: 'Hotel Bookings',
        route: '/bookings/hotels',
        icon: Hotel,
        colorClass: 'text-rose-500 dark:text-rose-400'
      },
      {
        label: 'Visa Services',
        route: '/bookings/visas',
        icon: FileText,
        colorClass: 'text-cyan-500 dark:text-cyan-400'
      },
      {
        label: 'VFS Appointments',
        route: '/bookings/vfs',
        icon: CalendarRange,
        colorClass: 'text-indigo-500 dark:text-indigo-400'
      },
      {
        label: 'Holiday Packages',
        route: '/bookings/holidays',
        icon: Compass,
        colorClass: 'text-teal-500 dark:text-teal-400'
      },
      {
        label: 'Transportation',
        route: '/bookings/transport',
        icon: Car,
        colorClass: 'text-green-500 dark:text-green-400'
      },
      {
        label: 'Other Services',
        route: '/bookings/other-services',
        icon: ConciergeBell,
        colorClass: 'text-fuchsia-500 dark:text-fuchsia-400'
      }
    ]
  },
  {
    label: 'Disputes & Chargebacks',
    route: '/disputes',
    icon: Scale,
    permission: 'read:receipts', // Same permission level as receipts/financials
    colorClass: 'text-rose-500 dark:text-rose-400'
  },
  {
    label: 'Profile Settings',
    route: '/profile',
    icon: UserCog,
    permission: 'read:dashboard', // All logged in users
    colorClass: 'text-slate-500 dark:text-slate-400'
  }
];

/**
 * Checks if a route path matches the current active URL path.
 */
export function isRouteActive(currentPath: string, routePath: string, exact = false): boolean {
  if (exact) {
    return currentPath === routePath;
  }
  return currentPath.startsWith(routePath);
}
