import type { Notification, NotificationFilters } from "../types/notification";

const API_BASE = "http://127.0.0.1:8000";

export async function fetchNotifications(
    limit: number = 4,
    filters?: NotificationFilters
): Promise<Notification[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        skip: "0",
    });

    if (filters?.type) params.append("type", filters.type);
    if (filters?.severity) params.append("severity", filters.severity);
    if (filters?.is_read !== undefined) params.append("is_read", filters.is_read.toString());

    const response = await fetch(`${API_BASE}/notifications?${params}`);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
}

export async function fetchUnreadCount(): Promise<number> {
    const response = await fetch(`${API_BASE}/notifications/count`);
    if (!response.ok) throw new Error("Failed to fetch unread count");
    const data = await response.json();
    return data.unread_count;
}

export async function markAsRead(id: number): Promise<Notification> {
    const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
    return response.json();
}

export async function markAllAsRead(): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to mark all as read");
}

export async function deleteNotification(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete notification");
}

export async function deleteAllNotifications(): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete all notifications");
}
