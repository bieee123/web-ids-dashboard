import { useState, useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import SeverityBadge from '../components/SeverityBadge';
import { ActivityIcon } from '../components/Icons';
import { detectAttack } from '../api/idsService';
import { fetchSettings } from '../api/settingsService';
import type { DetectionResponse } from '../types/detection';
import type { SeverityLevel } from '../utils/severity';
import './LiveDetection.css';

export default function LiveDetection() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<DetectionResponse | null>(null);
    const [history, setHistory] = useState<DetectionResponse[]>([]);
    const [toast, setToast] = useState<{ show: boolean; type: string }>({ show: false, type: '' });
    const [alertSoundEnabled, setAlertSoundEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Load settings for alert sound preference
        fetchSettings()
            .then(settings => setAlertSoundEnabled(settings.alert_sound))
            .catch(console.error);

        // Initialize audio
        audioRef.current = new Audio('/alert-sound.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    const playAlertSound = () => {
        if (alertSoundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Silent fail if audio not available
            });
        }
    };

    const handleDetect = async () => {
        setScanning(true);
        try {
            const response = await detectAttack({
                duration: Math.floor(Math.random() * 300),
                protocol_type: ['tcp', 'udp', 'icmp'][Math.floor(Math.random() * 3)],
                service: ['http', 'ftp', 'smtp', 'ssh', 'dns'][Math.floor(Math.random() * 5)],
                flag: ['SF', 'S0', 'REJ', 'RSTR', 'SH'][Math.floor(Math.random() * 5)],
            });
            setResult(response);
            setHistory(prev => [response, ...prev].slice(0, 20));

            // Update attack counter in localStorage for sidebar badge
            if (response.result === 'ATTACK') {
                const currentCount = parseInt(localStorage.getItem('recentAttacks') || '0', 10);
                localStorage.setItem('recentAttacks', (currentCount + 1).toString());
                window.dispatchEvent(new Event('storage'));
                playAlertSound();
            }

            // Show toast
            setToast({ show: true, type: response.result });
            setTimeout(() => setToast({ show: false, type: '' }), 3000);
        } catch (err) {
            console.error('Detection failed:', err);
        } finally {
            setScanning(false);
        }
    };

    const getSeverityLevel = (sev: string): SeverityLevel => {
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(sev)) return sev as SeverityLevel;
        return 'LOW';
    };

    const getConfidenceClass = (confidence: number): string => {
        if (confidence >= 0.9) return 'critical';
        if (confidence >= 0.75) return 'high';
        if (confidence >= 0.5) return 'medium';
        return 'low';
    };

    const isAttack = result?.result === 'ATTACK';

    return (
        <Layout title="Live Detection" subtitle="Test network traffic detection in real-time">
            <div className="live-detection-page fade-in">

                {/* Toast */}
                {toast.show && (
                    <div className={`attack-toast ${toast.type === 'ATTACK' ? 'attack' : 'normal'}`}>
                        {toast.type === 'ATTACK' ? '🚨 ATTACK DETECTED!' : '✅ Traffic Normal'}
                    </div>
                )}

                {/* Controls */}
                <div className="card">
                    <h3>Network Traffic Analyzer</h3>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        Send a simulated network packet for IDS analysis. The system will classify the traffic and return detection results.
                    </p>
                    <div className="detect-controls">
                        <button
                            className={`btn-detect ${scanning ? 'scanning' : ''}`}
                            onClick={handleDetect}
                            disabled={scanning}
                        >
                            <ActivityIcon size={18} />
                            <span className={scanning ? 'btn-pulse' : ''}>
                                {scanning ? 'Scanning...' : 'Run Detection'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Detection Result */}
                {result && (
                    <>
                        <div className="detection-result-card">
                            <div className={`detection-result-header ${isAttack ? 'attack' : 'normal'}`}>
                                <div className={`result-label ${isAttack ? 'attack' : 'normal'}`}>
                                    <span className={`result-indicator ${isAttack ? 'attack' : 'normal'}`}></span>
                                    {isAttack ? '🚨 ATTACK DETECTED' : '✅ NORMAL TRAFFIC'}
                                </div>
                                <SeverityBadge severity={getSeverityLevel(result.severity)} />
                            </div>

                            <div className="detection-result-body">
                                {isAttack && result.attack_type && (
                                    <div className="detail-item">
                                        <span className="detail-label">Attack Type</span>
                                        <span className="detail-value attack-type">{result.attack_type}</span>
                                    </div>
                                )}
                                <div className="detail-item">
                                    <span className="detail-label">Confidence</span>
                                    <span className="detail-value">{(result.confidence * 100).toFixed(1)}%</span>
                                    <div className="confidence-bar">
                                        <div
                                            className={`confidence-fill ${getConfidenceClass(result.confidence)}`}
                                            style={{ width: `${result.confidence * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Severity</span>
                                    <span className="detail-value">{result.severity}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Prediction</span>
                                    <span className="detail-value">{result.prediction === 1 ? 'Malicious' : 'Benign'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Timestamp</span>
                                    <span className="detail-value">
                                        {result.timestamp
                                            ? new Date(result.timestamp).toLocaleString()
                                            : new Date().toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Traffic Details */}
                        <div className="traffic-details">
                            <h3>📡 Traffic Details</h3>
                            <div className="traffic-grid">
                                <div className="traffic-item">
                                    <span className="traffic-label">Protocol</span>
                                    <span className="traffic-value">{result.protocol_type?.toUpperCase()}</span>
                                </div>
                                <div className="traffic-item">
                                    <span className="traffic-label">Service</span>
                                    <span className="traffic-value">{result.service?.toUpperCase()}</span>
                                </div>
                                <div className="traffic-item">
                                    <span className="traffic-label">Flag</span>
                                    <span className="traffic-value">{result.flag}</span>
                                </div>
                                <div className="traffic-item">
                                    <span className="traffic-label">Duration</span>
                                    <span className="traffic-value">{result.duration}ms</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Detection History */}
                {history.length > 0 && (
                    <div className="detection-history">
                        <h3>📋 Recent Detections ({history.length})</h3>
                        <div className="history-list">
                            {history.map((item, i) => (
                                <div key={i} className="history-item">
                                    <div className="history-meta">
                                        <span className={`history-result ${item.result === 'ATTACK' ? 'attack' : 'normal'}`}>
                                            {item.result}
                                        </span>
                                        <span className="text-muted">
                                            {item.attack_type || 'Normal Traffic'}
                                        </span>
                                    </div>
                                    <div className="history-meta">
                                        <span className="text-secondary">
                                            {(item.confidence * 100).toFixed(0)}%
                                        </span>
                                        <SeverityBadge severity={getSeverityLevel(item.severity)} size="sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
