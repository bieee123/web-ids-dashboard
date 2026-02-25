import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import MetricCard from '../components/MetricCard';
import SeverityBadge from '../components/SeverityBadge';
import SystemHealthMonitor from '../components/SystemHealthMonitor';
import QuickActionsPanel from '../components/QuickActionsPanel';
import ComplianceDashboard from '../components/ComplianceDashboard';
import {
    ActivityIcon,
    ShieldIcon,
    ShieldAlertIcon,
    ShieldCheckIcon,
    PercentIcon,
    TargetIcon,
} from '../components/Icons';
import { calculateSeverity } from '../utils/severity';
import './Dashboard.css';

interface DetectionLog {
    id: number;
    result: string;
    confidence: number;
    attack_type: string;
    timestamp: string;
}

export default function Dashboard() {
    const [logs, setLogs] = useState<DetectionLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/logs?limit=1000')
            .then((res) => res.json())
            .then((data) => {
                setLogs(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load logs:', err);
                setLogs([]);
                setLoading(false);
            });
    }, []);

    // Calculate metrics
    const totalDetections = logs.length;
    const totalAttacks = logs.filter((log) => log.result === 'ATTACK').length;
    const totalNormal = logs.filter((log) => log.result === 'NORMAL').length;
    const attackRate =
        totalDetections > 0 ? ((totalAttacks / totalDetections) * 100).toFixed(1) : '0';

    const logsWithSeverity = logs.map((log) => ({
        ...log,
        severity: calculateSeverity(log.confidence, log.attack_type, log.result),
    }));

    const criticalAlerts = logsWithSeverity.filter((log) => log.severity === 'CRITICAL').length;

    // Most frequent attack type
    const attackTypeCounts: Record<string, number> = {};
    logs
        .filter((log) => log.result === 'ATTACK')
        .forEach((log) => {
            attackTypeCounts[log.attack_type] = (attackTypeCounts[log.attack_type] || 0) + 1;
        });

    const mostFrequentAttack =
        Object.keys(attackTypeCounts).length > 0
            ? Object.entries(attackTypeCounts).sort((a, b) => b[1] - a[1])[0][0]
            : 'None';

    if (loading) {
        return (
            <Layout title="Dashboard" subtitle="System Overview">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard" subtitle="Real-time system monitoring">
            <div className="dashboard fade-in">
                {/* Metrics Grid */}
                <div className="grid grid-cols-3">
                    <MetricCard
                        title="Total Detections"
                        value={totalDetections.toLocaleString()}
                        subtitle="All time"
                        icon={ActivityIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Total Attacks"
                        value={totalAttacks.toLocaleString()}
                        subtitle="Detected threats"
                        icon={ShieldAlertIcon}
                        color="red"
                    />
                    <MetricCard
                        title="Normal Traffic"
                        value={totalNormal.toLocaleString()}
                        subtitle="Safe connections"
                        icon={ShieldCheckIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Attack Rate"
                        value={`${attackRate}%`}
                        subtitle="Threat percentage"
                        icon={PercentIcon}
                        color="yellow"
                    />
                    <MetricCard
                        title="Critical Alerts"
                        value={criticalAlerts.toLocaleString()}
                        subtitle="Requires attention"
                        icon={ShieldIcon}
                        color="red"
                    />
                    <MetricCard
                        title="Top Threat"
                        value={mostFrequentAttack}
                        subtitle="Most frequent attack"
                        icon={TargetIcon}
                        color="purple"
                    />
                </div>

                {/* System Health Monitor */}
                <SystemHealthMonitor />

                {/* Quick Actions Panel */}
                <QuickActionsPanel />

                {/* Compliance Dashboard */}
                <ComplianceDashboard />

                {/* Recent Critical Alerts */}
                <div className="card">
                    <h3>Recent Critical Alerts</h3>
                    <div className="alerts-list">
                        {logsWithSeverity
                            .filter((log) => log.severity === 'CRITICAL')
                            .slice(0, 5)
                            .map((log) => (
                                <div key={log.id} className="alert-item">
                                    <div className="alert-info">
                                        <span className="alert-type">{log.attack_type}</span>
                                        <span className="alert-confidence">
                                            {(log.confidence * 100).toFixed(1)}% confidence
                                        </span>
                                    </div>
                                    <SeverityBadge severity={log.severity} />
                                </div>
                            ))}
                        {logsWithSeverity.filter((log) => log.severity === 'CRITICAL').length === 0 && (
                            <p className="text-muted">No critical alerts</p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
