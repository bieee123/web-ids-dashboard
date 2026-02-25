const API_BASE = "http://127.0.0.1:8000";

export interface SystemHealth {
    cpu_usage: number;
    memory_usage: number;
    memory_total: number;
    memory_available: number;
    disk_usage: number;
    disk_total: number;
    disk_used: number;
    db_size_mb: number;
    db_table_count: number;
    db_logs_count: number;
    db_notifications_count: number;
    api_uptime_seconds: number;
    api_start_time: string;
    model_loaded: boolean;
    model_path_exists: boolean;
    overall_status: "healthy" | "warning" | "critical";
    timestamp: string;
}

export interface ModelMetrics {
    model_loaded: boolean;
    model_type: string;
    feature_count: number;
    classes: string[];
    last_prediction_time: string | null;
    total_predictions: number;
    attack_predictions: number;
    normal_predictions: number;
    accuracy_estimate: number;
}

export interface QuickActionResponse {
    success: boolean;
    message: string;
    data?: Record<string, any>;
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(`${API_BASE}/system/health`);
    if (!response.ok) throw new Error("Failed to fetch system health");
    return response.json();
}

export async function fetchModelMetrics(): Promise<ModelMetrics> {
    const response = await fetch(`${API_BASE}/system/model-metrics`);
    if (!response.ok) throw new Error("Failed to fetch model metrics");
    return response.json();
}

export async function exportLogs(): Promise<QuickActionResponse> {
    const response = await fetch(`${API_BASE}/system/actions/export-logs`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Failed to export logs");
    return response.json();
}

export async function clearDatabase(): Promise<QuickActionResponse> {
    const response = await fetch(`${API_BASE}/system/actions/clear-database`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Failed to clear database");
    return response.json();
}

export async function resetSettings(): Promise<QuickActionResponse> {
    const response = await fetch(`${API_BASE}/system/actions/reset-settings`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Failed to reset settings");
    return response.json();
}
