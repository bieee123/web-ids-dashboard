import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
    fetchAnalyticsSummary,
    type AnalyticsSummary,
} from '../api/analyticsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    AreaChart, Area, Legend,
} from 'recharts';
import {
    ActivityIcon, ShieldAlertIcon, ShieldCheckIcon, PercentIcon,
} from '../components/Icons';
import './Analytics.css';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

const SEV_COLORS: Record<string, string> = {
    LOW: '#3B82F6',
    MEDIUM: '#EAB308',
    HIGH: '#F59E0B',
    CRITICAL: '#EF4444',
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            {payload.map((entry, i) => (
                <div key={i} className="value" style={{ color: entry.color }}>
                    {entry.name}: {entry.value.toLocaleString()}
                </div>
            ))}
        </div>
    );
}

export default function Analytics() {
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsSummary()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Layout title="Analytics" subtitle="Advanced threat analytics">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading analytics...</p>
                </div>
            </Layout>
        );
    }

    if (!data) {
        return (
            <Layout title="Analytics" subtitle="Advanced threat analytics">
                <div className="card"><p className="text-muted">Failed to load analytics data.</p></div>
            </Layout>
        );
    }

    // Prepare chart data
    const pieData = data.top_attack_types.map(item => ({
        name: item.type,
        value: item.count,
    }));

    const sevData = Object.entries(data.severity_distribution).map(([key, val]) => ({
        name: key,
        count: val,
        fill: SEV_COLORS[key] || '#666',
    }));

    return (
        <Layout title="Analytics" subtitle="Advanced threat analytics">
            <div className="analytics-page fade-in">

                {/* ── Stat Cards ── */}
                <div className="analytics-metrics">
                    <div className="stat-card">
                        <div className="stat-icon blue"><ActivityIcon size={20} /></div>
                        <div className="analytics-stat-value">{data.total_requests.toLocaleString()}</div>
                        <div className="analytics-stat-label">Total Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red"><ShieldAlertIcon size={20} /></div>
                        <div className="analytics-stat-value">{data.total_attacks.toLocaleString()}</div>
                        <div className="analytics-stat-label">Total Attacks</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><ShieldCheckIcon size={20} /></div>
                        <div className="analytics-stat-value">{data.total_normal.toLocaleString()}</div>
                        <div className="analytics-stat-label">Normal Traffic</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow"><PercentIcon size={20} /></div>
                        <div className="analytics-stat-value">{data.attack_rate}%</div>
                        <div className="analytics-stat-label">Attack Rate</div>
                    </div>
                </div>

                {/* ── Charts Grid ── */}
                <div className="charts-grid">
                    {/* Line Chart — Attacks Over Time */}
                    <div className="chart-card">
                        <h3>Attacks Over Time</h3>
                        <p className="chart-subtitle">Daily attack count (last 30 days)</p>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.attacks_over_time}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickFormatter={(v: string) => v.slice(5)} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="attacks" stroke="#EF4444"
                                        strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }}
                                        activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart — Attack Distribution */}
                    <div className="chart-card">
                        <h3>Attack Distribution</h3>
                        <p className="chart-subtitle">Breakdown by attack type</p>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55}
                                        outerRadius={95} paddingAngle={3} dataKey="value"
                                        label={({ name, percent }) =>
                                            `${name ?? 'Unknown'} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#64748B' }}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart — Severity Levels */}
                    <div className="chart-card">
                        <h3>Severity Distribution</h3>
                        <p className="chart-subtitle">Detection severity breakdown</p>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sevData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {sevData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Area Chart — Traffic vs Attacks */}
                    <div className="chart-card">
                        <h3>Traffic Overview</h3>
                        <p className="chart-subtitle">Total traffic vs attacks over time</p>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.traffic_over_time}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickFormatter={(v: string) => v.slice(5)} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: '#94A3B8' }} />
                                    <Area type="monotone" dataKey="total" stackId="1"
                                        stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15}
                                        name="Total Traffic" />
                                    <Area type="monotone" dataKey="attacks" stackId="2"
                                        stroke="#EF4444" fill="#EF4444" fillOpacity={0.25}
                                        name="Attacks" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
