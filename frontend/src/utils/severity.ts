// Severity calculation utility - no external dependencies

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SeverityConfig {
    level: SeverityLevel;
    color: string;
    bgColor: string;
    borderColor: string;
}

export const SEVERITY_COLORS: Record<SeverityLevel, SeverityConfig> = {
    CRITICAL: {
        level: 'CRITICAL',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#EF4444',
    },
    HIGH: {
        level: 'HIGH',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#F59E0B',
    },
    MEDIUM: {
        level: 'MEDIUM',
        color: '#EAB308',
        bgColor: 'rgba(234, 179, 8, 0.1)',
        borderColor: '#EAB308',
    },
    LOW: {
        level: 'LOW',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
    },
};

const CRITICAL_ATTACKS = ['neptune', 'smurf', 'pod', 'teardrop', 'land', 'back'];
const HIGH_RISK_ATTACKS = ['portsweep', 'ipsweep', 'satan', 'nmap', 'saint', 'mscan'];

export function calculateSeverity(
    confidence: number,
    attackType: string,
    result: string
): SeverityLevel {
    if (result === 'NORMAL') {
        return 'LOW';
    }

    let severity: SeverityLevel;

    // Base severity on confidence
    if (confidence >= 0.90) {
        severity = 'CRITICAL';
    } else if (confidence >= 0.75) {
        severity = 'HIGH';
    } else if (confidence >= 0.50) {
        severity = 'MEDIUM';
    } else {
        severity = 'LOW';
    }

    // Upgrade severity for critical attack types
    if (CRITICAL_ATTACKS.includes(attackType.toLowerCase())) {
        if (severity === 'HIGH') severity = 'CRITICAL';
        if (severity === 'MEDIUM') severity = 'HIGH';
    }

    // Upgrade severity for high-risk attack types
    if (HIGH_RISK_ATTACKS.includes(attackType.toLowerCase())) {
        if (severity === 'MEDIUM') severity = 'HIGH';
        if (severity === 'LOW') severity = 'MEDIUM';
    }

    return severity;
}
