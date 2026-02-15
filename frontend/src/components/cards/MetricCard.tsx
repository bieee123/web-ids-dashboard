import { LucideIcon } from "lucide-react";
import "./MetricCard.css";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: "blue" | "red" | "green" | "yellow" | "purple";
}

export default function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
}: MetricCardProps) {
    return (
        <div className={`metric-card metric-card-${color}`}>
            <div className="metric-header">
                <div className="metric-icon-wrapper">
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`metric-trend ${trend.isPositive ? "positive" : "negative"}`}>
                        {trend.isPositive ? "+" : ""}{trend.value}%
                    </span>
                )}
            </div>

            <div className="metric-content">
                <h3 className="metric-title">{title}</h3>
                <p className="metric-value">{value}</p>
                {subtitle && <p className="metric-subtitle">{subtitle}</p>}
            </div>
        </div>
    );
}
