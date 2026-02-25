import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
} from '../api/notificationService';
import {
    FaShieldAlt,
    FaFilePdf,
    FaCog,
    FaChartLine,
    FaCheck,
    FaCheckDouble,
    FaTrash,
    FaSearch,
    FaFilter,
} from 'react-icons/fa';
import type { Notification, NotificationType, NotificationSeverity } from '../types/notification';
import './Notifications.css';

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

const TYPE_LABELS: Record<string, string> = {
    ATTACK: 'Attack',
    REPORT: 'Report',
    SYSTEM: 'System',
    ANALYTICS: 'Analytics',
};

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<NotificationType | 'ALL'>('ALL');
    const [selectedSeverity, setSelectedSeverity] = useState<NotificationSeverity | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await fetchNotifications(100);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

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

    const handleDeleteAll = async () => {
        if (window.confirm('Are you sure you want to delete all notifications?')) {
            try {
                await deleteAllNotifications();
                loadNotifications();
            } catch (error) {
                console.error('Failed to delete all notifications:', error);
            }
        }
    };

    const filteredNotifications = notifications.filter((notif) => {
        if (selectedType !== 'ALL' && notif.type !== selectedType) return false;
        if (selectedSeverity !== 'ALL' && notif.severity !== selectedSeverity) return false;
        if (searchQuery && !notif.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !notif.message?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    function formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return (
        <Layout title="Notifications" subtitle="Manage and view all system notifications">
            <div className="notifications-page fade-in">
                {/* Actions Bar */}
                <div className="notifications-actions-bar">
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="actions-right">
                        <button
                            className={`btn-filter ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FaFilter size={14} />
                            <span>Filters</span>
                        </button>
                        {unreadCount > 0 && (
                            <button className="btn-mark-all" onClick={handleMarkAllAsRead}>
                                <FaCheckDouble size={14} />
                                <span>Mark All Read</span>
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button className="btn-delete-all" onClick={handleDeleteAll}>
                                <FaTrash size={14} />
                                <span>Delete All</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="filters-panel fade-in">
                        <div className="filter-group">
                            <label>Type</label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as NotificationType | 'ALL')}
                            >
                                <option value="ALL">All Types</option>
                                <option value="ATTACK">Attacks</option>
                                <option value="REPORT">Reports</option>
                                <option value="SYSTEM">System</option>
                                <option value="ANALYTICS">Analytics</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Severity</label>
                            <select
                                value={selectedSeverity}
                                onChange={(e) =>
                                    setSelectedSeverity(e.target.value as NotificationSeverity | 'ALL')
                                }
                            >
                                <option value="ALL">All Severities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        <div className="filter-stats">
                            <span>Showing {filteredNotifications.length} of {notifications.length}</span>
                            {unreadCount > 0 && (
                                <span className="unread-stat">{unreadCount} unread</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Notifications List */}
                <div className="notifications-list-container">
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="notifications-empty">
                            <FaShieldAlt size={64} />
                            <h3>No Notifications</h3>
                            <p className="text-muted">
                                {searchQuery || selectedType !== 'ALL' || selectedSeverity !== 'ALL'
                                    ? 'No notifications match your filters'
                                    : "You're all caught up!"}
                            </p>
                        </div>
                    ) : (
                        <table className="notifications-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Title</th>
                                    <th>Severity</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotifications.map((notification) => {
                                    const IconComponent =
                                        TYPE_ICONS[notification.type] || FaShieldAlt;
                                    return (
                                        <tr
                                            key={notification.id}
                                            className={`notification-row ${
                                                !notification.is_read ? 'unread' : ''
                                            }`}
                                        >
                                            <td>
                                                <div className="table-type">
                                                    <IconComponent
                                                        size={18}
                                                        style={{
                                                            color: SEVERITY_COLORS[notification.severity],
                                                        }}
                                                    />
                                                    <span>{TYPE_LABELS[notification.type]}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="table-title">
                                                    <strong>{notification.title}</strong>
                                                    {notification.message && (
                                                        <p className="table-message">{notification.message}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className="severity-badge"
                                                    style={{
                                                        background: `${SEVERITY_COLORS[notification.severity]}20`,
                                                        color: SEVERITY_COLORS[notification.severity],
                                                        border: `1px solid ${SEVERITY_COLORS[notification.severity]}`,
                                                    }}
                                                >
                                                    {notification.severity}
                                                </span>
                                            </td>
                                            <td className="table-time">
                                                {formatTimeAgo(notification.timestamp)}
                                            </td>
                                            <td>
                                                {notification.is_read ? (
                                                    <span className="status-read">
                                                        <FaCheck size={12} /> Read
                                                    </span>
                                                ) : (
                                                    <span className="status-unread">Unread</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    {!notification.is_read && (
                                                        <button
                                                            className="btn-action btn-mark"
                                                            onClick={() =>
                                                                handleMarkAsRead(notification.id)
                                                            }
                                                            title="Mark as read"
                                                        >
                                                            <FaCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(notification.id)}
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
}
