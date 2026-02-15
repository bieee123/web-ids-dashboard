import { BellIcon, DownloadIcon } from '../Icons';
import './Header.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-text">
                    <h1 className="header-title">{title}</h1>
                    {subtitle && <p className="header-subtitle">{subtitle}</p>}
                </div>
                <div className="header-actions">
                    <button className="btn" title="Notifications">
                        <BellIcon size={18} />
                    </button>
                    <button className="btn" title="Export Data">
                        <DownloadIcon size={18} />
                        <span>Export</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
