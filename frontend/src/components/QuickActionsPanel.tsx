import { useState } from 'react';
import {
    FaDownload,
    FaTrash,
    FaUndo,
    FaFilePdf,
    FaCog,
    FaExclamationTriangle,
    FaCheck,
} from 'react-icons/fa';
import {
    exportLogs,
    clearDatabase,
    resetSettings,
} from '../api/systemService';
import { generateReport } from '../api/reportsService';
import './QuickActionsPanel.css';

interface ActionButtonProps {
    icon: React.ElementType;
    label: string;
    description: string;
    onClick: () => void;
    loading?: boolean;
    variant?: 'primary' | 'danger' | 'secondary';
}

function ActionButton({
    icon: Icon,
    label,
    description,
    onClick,
    loading = false,
    variant = 'primary',
}: ActionButtonProps) {
    return (
        <button className={`action-btn ${variant}`} onClick={onClick} disabled={loading}>
            <div className="action-btn-content">
                {loading ? (
                    <div className="spinner-sm"></div>
                ) : (
                    <Icon size={24} />
                )}
                <div className="action-btn-text">
                    <span className="action-label">{label}</span>
                    <span className="action-description">{description}</span>
                </div>
            </div>
        </button>
    );
}

export default function QuickActionsPanel() {
    const [exporting, setExporting] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleExportLogs = async () => {
        setExporting(true);
        try {
            const result = await exportLogs();
            if (result.success) {
                showMessage('success', `Exported ${result.data?.count} logs to CSV`);
            } else {
                showMessage('error', result.message);
            }
        } catch (error) {
            showMessage('error', 'Failed to export logs');
        } finally {
            setExporting(false);
        }
    };

    const handleClearDatabase = async () => {
        if (!window.confirm('Are you sure you want to clear all detection logs and notifications? This cannot be undone.')) {
            return;
        }

        setClearing(true);
        try {
            const result = await clearDatabase();
            if (result.success) {
                showMessage(
                    'success',
                    `Cleared ${result.data?.logs_deleted} logs and ${result.data?.notifications_deleted} notifications`
                );
            } else {
                showMessage('error', result.message);
            }
        } catch (error) {
            showMessage('error', 'Failed to clear database');
        } finally {
            setClearing(false);
        }
    };

    const handleResetSettings = async () => {
        if (!window.confirm('Reset all settings to defaults?')) {
            return;
        }

        setResetting(true);
        try {
            const result = await resetSettings();
            if (result.success) {
                showMessage('success', 'Settings reset to defaults');
            } else {
                showMessage('error', result.message);
            }
        } catch (error) {
            showMessage('error', 'Failed to reset settings');
        } finally {
            setResetting(false);
        }
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            const blob = await generateReport();
            const filename = `IDS_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            
            // Download the report
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showMessage('success', 'Report generated and downloaded');
        } catch (error) {
            showMessage('error', 'Failed to generate report');
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <div className="quick-actions-panel">
            <div className="panel-header">
                <h3>
                    <FaCog className="section-icon" />
                    Quick Actions
                </h3>
            </div>

            {message && (
                <div className={`action-message ${message.type}`}>
                    {message.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
                    {message.text}
                </div>
            )}

            <div className="actions-grid">
                <ActionButton
                    icon={FaFilePdf}
                    label="Generate Report"
                    description="Create PDF security report"
                    onClick={handleGenerateReport}
                    loading={generatingReport}
                    variant="primary"
                />

                <ActionButton
                    icon={FaDownload}
                    label="Export Logs"
                    description="Download logs as CSV"
                    onClick={handleExportLogs}
                    loading={exporting}
                    variant="primary"
                />

                <ActionButton
                    icon={FaUndo}
                    label="Reset Settings"
                    description="Restore default settings"
                    onClick={handleResetSettings}
                    loading={resetting}
                    variant="secondary"
                />

                <ActionButton
                    icon={FaTrash}
                    label="Clear Database"
                    description="Delete all logs & notifications"
                    onClick={handleClearDatabase}
                    loading={clearing}
                    variant="danger"
                />
            </div>
        </div>
    );
}
