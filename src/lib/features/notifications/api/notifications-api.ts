import { apiFetch } from '$lib/api/client';

export interface NotificationResponse {
  id: string;
  type: string;
  notifiableType: string;
  notifiableId: number;
  data: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationData {
  title: string;
  message: string;
  serviceType: string;
  serviceId: number;
  documentNumber?: string;
  status: string;
  amount: number;
  details?: string;
  createdAt: string;
}

export async function getNotifications(signal?: AbortSignal): Promise<NotificationResponse[]> {
  return apiFetch<NotificationResponse[]>(`/api/sales/notifications?t=${Date.now()}`, { signal });
}

export async function markAsRead(id: string): Promise<void> {
  return apiFetch(`/api/sales/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllAsRead(): Promise<void> {
  return apiFetch('/api/sales/notifications/read-all', { method: 'POST' });
}

export async function deleteNotification(id: string): Promise<void> {
  return apiFetch(`/api/sales/notifications/${id}`, { method: 'DELETE' });
}

export async function clearAllNotifications(): Promise<void> {
  return apiFetch('/api/sales/notifications/clear-all', { method: 'DELETE' });
}
