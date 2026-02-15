import './MetricCard.css';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.FC<{ size?: number; className?: string }>;
    color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue' }: MetricCardProps) {
    return (
        <div className={`metric-card metric-card-${color}`}>
            <div className="metric-icon">
                <Icon size={24} />
            </div>
            <div className="metric-content">
                <p className="metric-title">{title}</p>
                <h3 className="metric-value">{value}</h3>
                {subtitle && <p className="metric-subtitle">{subtitle}</p>}
            </div>
        </div>
    );
}
