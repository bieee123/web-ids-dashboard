import { useState, useEffect } from 'react';
import {
    FaShieldAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaChartLine,
    FaLightbulb,
} from 'react-icons/fa';
import { fetchComplianceDashboard } from '../api/complianceService';
import type { ComplianceDashboard as ComplianceDashboardType } from '../api/complianceService';
import './ComplianceDashboard.css';

function getStatusIcon(status: string) {
    switch (status) {
        case 'compliant':
            return <FaCheckCircle className="status-icon compliant" />;
        case 'non-compliant':
            return <FaTimesCircle className="status-icon non-compliant" />;
        case 'partial':
            return <FaExclamationTriangle className="status-icon partial" />;
        default:
            return null;
    }
}

function getSeverityClass(severity: string): string {
    return `severity-${severity}`;
}

export default function ComplianceDashboard() {
    const [dashboard, setDashboard] = useState<ComplianceDashboardType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await fetchComplianceDashboard();
                setDashboard(data);
            } catch (error) {
                console.error('Failed to load compliance dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="compliance-dashboard loading">
                <div className="spinner"></div>
                <p>Loading compliance status...</p>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="compliance-dashboard error">
                <FaExclamationTriangle size={24} />
                <p>Failed to load compliance dashboard</p>
            </div>
        );
    }

    return (
        <div className="compliance-dashboard">
            <div className="compliance-header">
                <h3>
                    <FaShieldAlt className="section-icon" />
                    Security Compliance Dashboard
                </h3>
                <div className="compliance-score">
                    <div className="score-circle">
                        <svg viewBox="0 0 36 36" className="score-svg">
                            <path
                                className="score-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="score-value"
                                strokeDasharray={`${dashboard.overall_score}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className="score-number">{dashboard.overall_score}%</span>
                    </div>
                    <span className="score-label">Compliance Score</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="compliance-summary">
                <div className="summary-card compliant">
                    <FaCheckCircle className="summary-icon" />
                    <div className="summary-content">
                        <span className="summary-value">{dashboard.compliant_count}</span>
                        <span className="summary-label">Compliant</span>
                    </div>
                </div>
                <div className="summary-card partial">
                    <FaExclamationTriangle className="summary-icon" />
                    <div className="summary-content">
                        <span className="summary-value">{dashboard.partial_count}</span>
                        <span className="summary-label">Partial</span>
                    </div>
                </div>
                <div className="summary-card non-compliant">
                    <FaTimesCircle className="summary-icon" />
                    <div className="summary-content">
                        <span className="summary-value">{dashboard.non_compliant_count}</span>
                        <span className="summary-label">Non-Compliant</span>
                    </div>
                </div>
                <div className="summary-card total">
                    <FaChartLine className="summary-icon" />
                    <div className="summary-content">
                        <span className="summary-value">{dashboard.total_requirements}</span>
                        <span className="summary-label">Total Requirements</span>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="compliance-categories">
                <h4>By Category</h4>
                <div className="categories-grid">
                    {Object.entries(dashboard.categories).map(([category, data]) => (
                        <div key={category} className="category-card">
                            <h5>{category}</h5>
                            <div className="category-bars">
                                <div className="category-bar-item">
                                    <span className="bar-label">Compliant</span>
                                    <div className="bar-bg">
                                        <div
                                            className="bar-fill compliant"
                                            style={{
                                                width: `${(data.compliant / data.total) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="bar-value">{data.compliant}</span>
                                </div>
                                <div className="category-bar-item">
                                    <span className="bar-label">Partial</span>
                                    <div className="bar-bg">
                                        <div
                                            className="bar-fill partial"
                                            style={{
                                                width: `${(data.partial / data.total) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="bar-value">{data.partial}</span>
                                </div>
                                <div className="category-bar-item">
                                    <span className="bar-label">Non-Compliant</span>
                                    <div className="bar-bg">
                                        <div
                                            className="bar-fill non-compliant"
                                            style={{
                                                width: `${(data['non-compliant'] / data.total) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="bar-value">{data['non-compliant']}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Requirements Table */}
            <div className="compliance-requirements">
                <h4>Requirements</h4>
                <div className="requirements-list">
                    {dashboard.items.map((item, index) => (
                        <div
                            key={index}
                            className={`requirement-item ${item.status}`}
                        >
                            <div className="requirement-status">
                                {getStatusIcon(item.status)}
                            </div>
                            <div className="requirement-content">
                                <div className="requirement-header">
                                    <span className="requirement-category">{item.category}</span>
                                    <span className={`requirement-severity ${getSeverityClass(item.severity)}`}>
                                        {item.severity.toUpperCase()}
                                    </span>
                                </div>
                                <h5 className="requirement-title">{item.requirement}</h5>
                                <p className="requirement-details">{item.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="compliance-recommendations">
                <h4>
                    <FaLightbulb className="recommendations-icon" />
                    Recommendations
                </h4>
                <ul className="recommendations-list">
                    {dashboard.recommendations.map((rec, index) => (
                        <li key={index} className="recommendation-item">
                            <FaLightbulb className="recommendation-icon" />
                            <span>{rec}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
