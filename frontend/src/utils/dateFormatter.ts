import { format, formatDistanceToNow } from "date-fns";

/**
 * Format a date string or Date object to a readable format
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Feb 14, 2026 8:30 PM")
 */
export function formatDate(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MMM dd, yyyy h:mm a");
}

/**
 * Format a date as relative time (e.g., "2 minutes ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date for table display (short format)
 * @param date - Date string or Date object
 * @returns Short formatted date (e.g., "02/14 20:30")
 */
export function formatTableDate(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "MM/dd HH:mm");
}
