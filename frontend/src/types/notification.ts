export type NotificationType = "ATTACK" | "REPORT" | "SYSTEM" | "ANALYTICS";
export type NotificationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string | null;
    severity: NotificationSeverity;
    is_read: boolean;
    timestamp: string;
    related_id: number | null;
}

export interface NotificationFilters {
    type?: NotificationType;
    severity?: NotificationSeverity;
    is_read?: boolean;
    search?: string;
}
