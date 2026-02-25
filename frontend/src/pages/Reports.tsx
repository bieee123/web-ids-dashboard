import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { generateReport, downloadBlob } from '../api/reportsService';
import { DownloadIcon, FileTextIcon, FileIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
import './Reports.css';

type ReportStatus = 'idle' | 'generating' | 'success' | 'error';

export default function Reports() {
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [lastBlob, setLastBlob] = useState<Blob | null>(null);
    const [lastFilename, setLastFilename] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleGenerate = async () => {
        setStatus('generating');
        setErrorMsg('');
        try {
            const blob = await generateReport();
            const filename = `IDS_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            setLastBlob(blob);
            setLastFilename(filename);
            setStatus('success');
            // Auto-download
            downloadBlob(blob, filename);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Report generation failed');
            setStatus('error');
        }
    };

    const handleDownloadLatest = () => {
        if (lastBlob && lastFilename) {
            downloadBlob(lastBlob, lastFilename);
        }
    };

    return (
        <Layout title="Reports" subtitle="Generate security reports">
            <div className="reports-page fade-in">
                {/* Action Buttons */}
                <div className="card">
                    <h3><FileIcon size={20} className="card-icon" /> Report Generator</h3>
                    <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
                        Generate a comprehensive PDF security report with analytics, charts, detection logs, and recommendations.
                    </p>
                    <div className="report-actions">
                        <button
                            className="btn-generate"
                            onClick={handleGenerate}
                            disabled={status === 'generating'}
                        >
                            {status === 'generating' ? (
                                <><span className="spinner-sm"></span> Generating...</>
                            ) : (
                                <><FileTextIcon size={18} /> Generate Report</>
                            )}
                        </button>
                        <button
                            className="btn-download"
                            onClick={handleDownloadLatest}
                            disabled={!lastBlob}
                        >
                            <DownloadIcon size={18} /> Download Latest Report
                        </button>
                    </div>
                </div>

                {/* Status Message */}
                {status === 'generating' && (
                    <div className="report-status generating">
                        <span className="spinner-sm"></span>
                        Generating report... This may take a few seconds.
                    </div>
                )}
                {status === 'success' && (
                    <div className="report-status success">
                        <CheckCircleIcon size={18} className="status-icon" />
                        Report generated and downloaded successfully!
                    </div>
                )}
                {status === 'error' && (
                    <div className="report-status error">
                        <XCircleIcon size={18} className="status-icon" />
                        {errorMsg}
                    </div>
                )}

                {/* Report Contents Info */}
                <div className="card">
                    <h3><FileTextIcon size={20} className="card-icon" /> Report Contents</h3>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        Each generated report includes the following sections:
                    </p>
                    <div className="report-info">
                        <div className="report-info-item">
                            <h4>Page 1</h4>
                            <p>Cover Page</p>
                            <span className="text-muted">System status, attack rate, date</span>
                        </div>
                        <div className="report-info-item">
                            <h4>Page 2</h4>
                            <p>Executive Summary</p>
                            <span className="text-muted">Statistics table, risk assessment</span>
                        </div>
                        <div className="report-info-item">
                            <h4>Page 3</h4>
                            <p>Visual Analytics</p>
                            <span className="text-muted">Pie chart, bar chart, line chart</span>
                        </div>
                        <div className="report-info-item">
                            <h4>Page 4</h4>
                            <p>Detection Logs</p>
                            <span className="text-muted">Last 50 detections in table format</span>
                        </div>
                        <div className="report-info-item">
                            <h4>Page 5</h4>
                            <p>Recommendations</p>
                            <span className="text-muted">Auto-generated security advice</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
