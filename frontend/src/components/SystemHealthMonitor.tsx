import { useState, useEffect } from 'react';
import {
    FaMicrochip,
    FaMemory,
    FaDatabase,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaServer,
} from 'react-icons/fa';
import { fetchSystemHealth, fetchModelMetrics } from '../api/systemService';
import type { SystemHealth as SystemHealthType, ModelMetrics } from '../api/systemService';
import './SystemHealthMonitor.css';

function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m ${secs}s`;
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'healthy':
            return <FaCheckCircle className="status-icon healthy" />;
        case 'warning':
            return <FaExclamationTriangle className="status-icon warning" />;
        case 'critical':
            return <FaTimesCircle className="status-icon critical" />;
        default:
            return <FaCheckCircle className="status-icon healthy" />;
    }
}

function getUsageClass(usage: number): string {
    if (usage >= 90) return 'critical';
    if (usage >= 70) return 'warning';
    return 'normal';
}

export default function SystemHealthMonitor() {
    const [health, setHealth] = useState<SystemHealthType | null>(null);
    const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [healthData, metricsData] = await Promise.all([
                fetchSystemHealth(),
                fetchModelMetrics(),
            ]);
            setHealth(healthData);
            setMetrics(metricsData);
        } catch (error) {
            console.error('Failed to load system health:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="system-health-monitor loading">
                <div className="spinner"></div>
                <p>Loading system health...</p>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="system-health-monitor error">
                <FaExclamationTriangle size={24} />
                <p>Failed to load system health</p>
            </div>
        );
    }

    return (
        <div className="system-health-monitor">
            <div className="health-header">
                <h3>
                    <FaServer className="section-icon" />
                    System Health
                </h3>
                <div className={`health-status ${health.overall_status}`}>
                    {getStatusIcon(health.overall_status)}
                    <span>{health.overall_status.toUpperCase()}</span>
                </div>
            </div>

            <div className="health-grid">
                {/* CPU Usage */}
                <div className="health-card">
                    <div className="health-card-header">
                        <FaMicrochip className="card-icon cpu" />
                        <span>CPU Usage</span>
                    </div>
                    <div className="health-card-value">
                        {health.cpu_usage.toFixed(1)}%
                    </div>
                    <div className="usage-bar">
                        <div
                            className={`usage-fill ${getUsageClass(health.cpu_usage)}`}
                            style={{ width: `${health.cpu_usage}%` }}
                        />
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="health-card">
                    <div className="health-card-header">
                        <FaMemory className="card-icon memory" />
                        <span>Memory Usage</span>
                    </div>
                    <div className="health-card-value">
                        {health.memory_usage.toFixed(1)}%
                    </div>
                    <div className="usage-bar">
                        <div
                            className={`usage-fill ${getUsageClass(health.memory_usage)}`}
                            style={{ width: `${health.memory_usage}%` }}
                        />
                    </div>
                    <div className="health-card-sub">
                        {health.memory_available.toFixed(2)} GB available
                    </div>
                </div>

                {/* Disk Usage */}
                <div className="health-card">
                    <div className="health-card-header">
                        <FaServer className="card-icon disk" />
                        <span>Disk Usage</span>
                    </div>
                    <div className="health-card-value">
                        {health.disk_usage.toFixed(1)}%
                    </div>
                    <div className="usage-bar">
                        <div
                            className={`usage-fill ${getUsageClass(health.disk_usage)}`}
                            style={{ width: `${health.disk_usage}%` }}
                        />
                    </div>
                    <div className="health-card-sub">
                        {health.disk_used.toFixed(1)} / {health.disk_total.toFixed(0)} GB
                    </div>
                </div>

                {/* Database */}
                <div className="health-card">
                    <div className="health-card-header">
                        <FaDatabase className="card-icon db" />
                        <span>Database</span>
                    </div>
                    <div className="health-card-value">
                        {health.db_size_mb.toFixed(2)} MB
                    </div>
                    <div className="health-card-sub">
                        {health.db_logs_count} logs
                    </div>
                    <div className="health-card-sub-small">
                        {health.db_notifications_count} notifications
                    </div>
                </div>

                {/* API Uptime */}
                <div className="health-card">
                    <div className="health-card-header">
                        <FaClock className="card-icon uptime" />
                        <span>API Uptime</span>
                    </div>
                    <div className="health-card-value uptime-value">
                        {formatUptime(health.api_uptime_seconds)}
                    </div>
                    <div className="health-card-sub">
                        Since {new Date(health.api_start_time).toLocaleDateString()}
                    </div>
                </div>

                {/* Model Status */}
                <div className="health-card">
                    <div className="health-card-header">
                        <FaCheckCircle className="card-icon model" />
                        <span>ML Model</span>
                    </div>
                    <div className="health-card-value model-status">
                        {metrics?.model_loaded ? (
                            <span className="model-loaded">Loaded</span>
                        ) : (
                            <span className="model-not-loaded">Not Loaded</span>
                        )}
                    </div>
                    {metrics && (
                        <>
                            <div className="health-card-sub">
                                {metrics.total_predictions} predictions
                            </div>
                            <div className="health-card-sub-small">
                                Accuracy: ~{metrics.accuracy_estimate}%
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
