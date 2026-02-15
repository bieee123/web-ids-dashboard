export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface SeverityConfig {
    level: SeverityLevel;
    color: string;
    bgColor: string;
    borderColor: string;
}

export const SEVERITY_COLORS: Record<SeverityLevel, SeverityConfig> = {
    CRITICAL: {
        level: "CRITICAL",
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "#EF4444",
    },
    HIGH: {
        level: "HIGH",
        color: "#F97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
        borderColor: "#F97316",
    },
    MEDIUM: {
        level: "MEDIUM",
        color: "#EAB308",
        bgColor: "rgba(234, 179, 8, 0.1)",
        borderColor: "#EAB308",
    },
    LOW: {
        level: "LOW",
        color: "#3B82F6",
        bgColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3B82F6",
    },
};
