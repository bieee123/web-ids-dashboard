import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import SeverityBadge from '../components/SeverityBadge';
import { calculateSeverity } from '../utils/severity';
import { formatDate } from '../utils/dateUtils';
import './Logs.css';

interface DetectionLog {
    id: number;
    result: string;
    confidence: number;
    attack_type: string;
    timestamp: string;
    duration: number;
    protocol_type: string;
    service: string;
}

export default function Logs() {
    const [logs, setLogs] = useState<DetectionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ATTACK' | 'NORMAL'>('all');

    useEffect(() => {
        fetch('http://127.0.0.1:8000/logs?limit=100')
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

    const filteredLogs = logs.filter((log) => {
        if (filter === 'all') return true;
        return log.result === filter;
    });

    const logsWithSeverity = filteredLogs.map((log) => ({
        ...log,
        severity: calculateSeverity(log.confidence, log.attack_type, log.result),
    }));

    if (loading) {
        return (
            <Layout title="Detection Logs" subtitle="View detection history">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading logs...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Detection Logs" subtitle="View and filter detection history">
            <div className="logs-page fade-in">
                {/* Filter Buttons */}
                <div className="logs-filters">
                    <button
                        className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({logs.length})
                    </button>
                    <button
                        className={`btn ${filter === 'ATTACK' ? 'btn-primary' : ''}`}
                        onClick={() => setFilter('ATTACK')}
                    >
                        Attacks ({logs.filter((l) => l.result === 'ATTACK').length})
                    </button>
                    <button
                        className={`btn ${filter === 'NORMAL' ? 'btn-primary' : ''}`}
                        onClick={() => setFilter('NORMAL')}
                    >
                        Normal ({logs.filter((l) => l.result === 'NORMAL').length})
                    </button>
                </div>

                {/* Logs Table */}
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Result</th>
                                <th>Attack Type</th>
                                <th>Confidence</th>
                                <th>Severity</th>
                                <th>Protocol</th>
                                <th>Service</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logsWithSeverity.map((log) => (
                                <tr key={log.id} className={`log-row log-row-${log.result.toLowerCase()}`}>
                                    <td>{formatDate(log.timestamp)}</td>
                                    <td>
                                        <span className={`badge badge-${log.result.toLowerCase()}`}>
                                            {log.result}
                                        </span>
                                    </td>
                                    <td className="attack-type">{log.attack_type}</td>
                                    <td>{(log.confidence * 100).toFixed(1)}%</td>
                                    <td>
                                        <SeverityBadge severity={log.severity} size="sm" />
                                    </td>
                                    <td>{log.protocol_type}</td>
                                    <td>{log.service}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logsWithSeverity.length === 0 && (
                        <div className="empty-state">
                            <p className="text-muted">No logs found</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
