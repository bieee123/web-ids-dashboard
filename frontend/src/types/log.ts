import type { SeverityLevel } from "./severity";

export interface DetectionLog {
    id: number;
    timestamp: string;
    duration: number;
    protocol: string;
    service: string;
    flag: string;
    result: "ATTACK" | "NORMAL";
    attack_type: string;
    confidence: number;
    severity?: SeverityLevel; // Calculated on frontend
}

export interface LogFilters {
    attackType: string[];
    protocol: string[];
    severity: SeverityLevel[];
    result: ("ATTACK" | "NORMAL")[];
    searchQuery: string;
}
