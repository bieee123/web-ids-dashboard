const API_BASE = "http://127.0.0.1:8000";

export interface ComplianceItem {
    category: string;
    requirement: string;
    status: "compliant" | "non-compliant" | "partial";
    details: string;
    severity: "critical" | "high" | "medium" | "low";
}

export interface ComplianceDashboard {
    overall_score: number;
    total_requirements: number;
    compliant_count: number;
    non_compliant_count: number;
    partial_count: number;
    last_assessment: string;
    categories: Record<string, { compliant: number; "non-compliant": number; partial: number; total: number }>;
    items: ComplianceItem[];
    recommendations: string[];
}

export async function fetchComplianceDashboard(): Promise<ComplianceDashboard> {
    const response = await fetch(`${API_BASE}/compliance/dashboard`);
    if (!response.ok) throw new Error("Failed to fetch compliance dashboard");
    return response.json();
}
