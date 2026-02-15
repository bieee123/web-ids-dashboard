import type { SeverityLevel } from "../../types/severity";
import { SEVERITY_COLORS } from "../../types/severity";
import "./SeverityBadge.css";

interface SeverityBadgeProps {
    severity: SeverityLevel;
    size?: "sm" | "md" | "lg";
}

export default function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
    const config = SEVERITY_COLORS[severity];

    return (
        <span
            className={`severity-badge severity-badge-${size}`}
            style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
            }}
        >
            {severity}
        </span>
    );
}
