import type { SeverityLevel } from "./severity";

export interface Alert {
    id: string;
    timestamp: Date;
    attackType: string;
    severity: SeverityLevel;
    confidence: number;
    status: "new" | "acknowledged";
    message: string;
}
