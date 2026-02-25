import { useState, useEffect, type ReactNode } from 'react';
import Layout from '../components/layout/Layout';
import {
    fetchSettings,
    saveSettings,
    type SystemSettings,
} from '../api/settingsService';
import { SettingsIcon, BeakerIcon, ZapIcon, CheckCircleIcon, XCircleIcon, BellIcon, FileIcon } from '../components/Icons';
import './Settings.css';

export default function Settings() {
    const [settings, setSettings] = useState<SystemSettings>({
        test_mode: true,
        confidence_threshold: 0.7,
        alert_sound: true,
        email_alerts: false,
        auto_generate_daily_report: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<ReactNode>('');

    useEffect(() => {
        fetchSettings()
            .then(setSettings)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (key: keyof SystemSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleThreshold = (value: number) => {
        setSettings(prev => ({ ...prev, confidence_threshold: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setToast('');
        try {
            await saveSettings(settings);
            setToast(<span className="save-toast"><CheckCircleIcon size={16} className="toast-icon" /> Settings saved successfully!</span>);
            setTimeout(() => setToast(''), 3000);
        } catch (err) {
            setToast(<span className="save-toast error"><XCircleIcon size={16} className="toast-icon" /> Failed to save settings</span>);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Settings" subtitle="Configure system preferences">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Settings" subtitle="Configure system preferences">
            <div className="settings-page fade-in">

                {/* Detection Settings */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <h3><SettingsIcon size={18} className="section-icon" /> Detection Settings</h3>
                        <span className={`mode-indicator ${settings.test_mode ? 'test-mode' : 'production-mode'}`}>
                            {settings.test_mode ? <><BeakerIcon size={14} className="mode-icon" /> Test Mode</> : <><ZapIcon size={14} className="mode-icon" /> Production Mode</>}
                        </span>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Test Mode</span>
                            <span className="setting-description">
                                Enable for random attack simulation (demo). Disable to use real ML model predictions.
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.test_mode}
                                onChange={() => handleToggle('test_mode')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Confidence Threshold</span>
                            <span className="setting-description">Minimum confidence score to flag as threat</span>
                        </div>
                        <div className="setting-slider-container">
                            <span className="setting-slider-value">
                                {settings.confidence_threshold.toFixed(2)}
                            </span>
                            <input
                                type="range"
                                className="setting-slider"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={settings.confidence_threshold}
                                onChange={e => handleThreshold(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Alert Settings */}
                <div className="settings-section">
                    <h3><BellIcon size={18} className="section-icon" /> Alert Settings</h3>

                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Sound Alerts</span>
                            <span className="setting-description">Play audio alert when attack is detected</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.alert_sound}
                                onChange={() => handleToggle('alert_sound')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Email Alerts</span>
                            <span className="setting-description">Send email notification on critical detections</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.email_alerts}
                                onChange={() => handleToggle('email_alerts')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Report Settings */}
                <div className="settings-section">
                    <h3><FileIcon size={18} className="section-icon" /> Report Settings</h3>

                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Auto Daily Report</span>
                            <span className="setting-description">Automatically generate a daily security report</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.auto_generate_daily_report}
                                onChange={() => handleToggle('auto_generate_daily_report')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Save */}
                <div className="settings-actions">
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    {toast && <span className="save-toast">{toast}</span>}
                </div>
            </div>
        </Layout>
    );
}
