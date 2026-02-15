import { SEVERITY_COLORS, type SeverityLevel } from '../utils/severity';

interface SeverityBadgeProps {
    severity: SeverityLevel;
    size?: 'sm' | 'md';
}

export default function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
    const config = SEVERITY_COLORS[severity];

    return (
        <span
            className={`badge badge-${severity.toLowerCase()} badge-${size}`}
            style={{
                backgroundColor: config.bgColor,
                color: config.color,
                borderColor: config.borderColor,
            }}
        >
            {severity}
        </span>
    );
}
