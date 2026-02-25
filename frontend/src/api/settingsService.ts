const API_BASE = "http://127.0.0.1:8000";

export interface SystemSettings {
    test_mode: boolean;
    confidence_threshold: number;
    alert_sound: boolean;
    email_alerts: boolean;
    auto_generate_daily_report: boolean;
}

export async function fetchSettings(): Promise<SystemSettings> {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
}

export async function saveSettings(
    settings: Partial<SystemSettings>
): Promise<{ message: string; settings: SystemSettings }> {
    const response = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to save settings");
    return response.json();
}
