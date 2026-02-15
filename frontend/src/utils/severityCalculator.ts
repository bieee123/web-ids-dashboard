import type { SeverityLevel } from "../types/severity";

// High-risk attack types that should escalate severity
const CRITICAL_ATTACKS = ["neptune", "smurf", "pod", "teardrop", "land"];
const HIGH_RISK_ATTACKS = ["portsweep", "ipsweep", "satan", "nmap", "back"];

/**
 * Calculate severity level based on confidence score and attack type
 * 
 * @param confidence - Model confidence score (0-1)
 * @param attackType - Type of attack detected
 * @param result - Detection result ("ATTACK" or "NORMAL")
 * @returns Severity level (CRITICAL, HIGH, MEDIUM, or LOW)
 */
export function calculateSeverity(
    confidence: number,
    attackType: string,
    result: string
): SeverityLevel {
    // Normal traffic is always LOW severity
    if (result === "NORMAL") {
        return "LOW";
    }

    // Base severity on confidence score
    let severity: SeverityLevel;

    if (confidence >= 0.90) {
        severity = "CRITICAL";
    } else if (confidence >= 0.75) {
        severity = "HIGH";
    } else if (confidence >= 0.50) {
        severity = "MEDIUM";
    } else {
        severity = "LOW";
    }

    // Upgrade severity for known dangerous attack types
    const attackLower = attackType.toLowerCase();

    if (CRITICAL_ATTACKS.includes(attackLower)) {
        if (severity === "HIGH") severity = "CRITICAL";
        else if (severity === "MEDIUM") severity = "HIGH";
        else if (severity === "LOW") severity = "MEDIUM";
    } else if (HIGH_RISK_ATTACKS.includes(attackLower)) {
        if (severity === "MEDIUM") severity = "HIGH";
        else if (severity === "LOW") severity = "MEDIUM";
    }

    return severity;
}
