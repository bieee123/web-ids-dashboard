import { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import {
    FaShieldAlt,
    FaFilePdf,
    FaCog,
    FaChartLine,
    FaCheck,
    FaCheckDouble,
    FaTrash,
} from 'react-icons/fa';
import {
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../api/notificationService';
import type { Notification } from '../types/notification';
import './NotificationBell.css';

const SEVERITY_COLORS: Record<string, string> = {
    LOW: '#3B82F6',
    MEDIUM: '#EAB308',
    HIGH: '#F59E0B',
    CRITICAL: '#EF4444',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    ATTACK: FaShieldAlt,
    REPORT: FaFilePdf,
    SYSTEM: FaCog,
    ANALYTICS: FaChartLine,
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const bellRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                fetchNotifications(4),
                fetchUnreadCount(),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                if (!isPinned) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPinned]);

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        if (!isPinned) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsOpen(false);
            }, 200);
        }
    };

    const handleClick = () => {
        setIsPinned(!isPinned);
        if (!isPinned) {
            setIsOpen(true);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsPinned(false);
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await markAsRead(id);
            loadNotifications();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            loadNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteNotification(id);
            loadNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <div
            className="notification-bell-container"
            ref={bellRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={`notification-bell ${isOpen ? 'open' : ''}`}
                onClick={handleClick}
                title="Notifications"
            >
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={`notification-popup ${isPinned ? 'pinned' : ''}`}>
                    <div className="notification-popup-header">
                        <h3>Notifications</h3>
                        <div className="notification-popup-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="btn-mark-all"
                                    onClick={handleMarkAllAsRead}
                                    title="Mark all as read"
                                >
                                    <FaCheckDouble size={14} />
                                </button>
                            )}
                            <button
                                className="btn-close-popup"
                                onClick={handleClose}
                                title={isPinned ? 'Unpin' : 'Close'}
                            >
                                {isPinned ? '✕' : '✓'}
                            </button>
                        </div>
                    </div>

                    <div className="notification-popup-content">
                        {loading ? (
                            <div className="notification-loading">
                                <div className="spinner-sm"></div>
                                <span>Loading...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <FiBell size={48} />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            <>
                                <div className="notification-list">
                                    {notifications.map((notification) => {
                                        const IconComponent =
                                            TYPE_ICONS[notification.type] || FaShieldAlt;
                                        return (
                                            <div
                                                key={notification.id}
                                                className={`notification-item ${
                                                    !notification.is_read ? 'unread' : ''
                                                }`}
                                            >
                                                <div
                                                    className="notification-icon"
                                                    style={{
                                                        color: SEVERITY_COLORS[notification.severity],
                                                    }}
                                                >
                                                    <IconComponent size={20} />
                                                </div>
                                                <div className="notification-content">
                                                    <div className="notification-header">
                                                        <h4 className="notification-title">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.is_read && (
                                                            <span className="unread-dot"></span>
                                                        )}
                                                    </div>
                                                    <p className="notification-message">
                                                        {notification.message}
                                                    </p>
                                                    <div className="notification-footer">
                                                        <span className="notification-time">
                                                            {formatTimeAgo(notification.timestamp)}
                                                        </span>
                                                        <span
                                                            className="notification-severity"
                                                            style={{
                                                                color: SEVERITY_COLORS[
                                                                    notification.severity
                                                                ],
                                                            }}
                                                        >
                                                            {notification.severity}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="notification-actions">
                                                    {!notification.is_read && (
                                                        <button
                                                            className="btn-mark-read"
                                                            onClick={() =>
                                                                handleMarkAsRead(notification.id)
                                                            }
                                                            title="Mark as read"
                                                        >
                                                            <FaCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() =>
                                                            handleDelete(notification.id)
                                                        }
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <a href="#/notifications" className="show-more-link">
                                    Show All Notifications →
                                </a>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
