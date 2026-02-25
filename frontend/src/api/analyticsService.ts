const API_BASE = "http://127.0.0.1:8000";

export interface AnalyticsSummary {
    total_requests: number;
    total_attacks: number;
    total_normal: number;
    attack_rate: number;
    top_attack_types: { type: string; count: number }[];
    severity_distribution: Record<string, number>;
    attacks_over_time: { date: string; attacks: number }[];
    traffic_over_time: { date: string; total: number; attacks: number }[];
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await fetch(`${API_BASE}/analytics/summary`);
    if (!response.ok) throw new Error("Failed to fetch analytics");
    return response.json();
}
