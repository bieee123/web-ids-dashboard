import { useState, useEffect } from 'react';
import {
    DashboardIcon,
    ActivityIcon,
    FileTextIcon,
    BarChartIcon,
    FileIcon,
    SettingsIcon,
    MenuIcon,
    ChevronLeftIcon,
    ShieldIcon,
} from '../Icons';
import './Sidebar.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.FC<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
    { path: '#/', label: 'Dashboard', icon: DashboardIcon },
    { path: '#/detection', label: 'Live Detection', icon: ActivityIcon },
    { path: '#/logs', label: 'Detection Logs', icon: FileTextIcon },
    { path: '#/analytics', label: 'Analytics', icon: BarChartIcon },
    { path: '#/reports', label: 'Reports', icon: FileIcon },
    { path: '#/settings', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
    // Alert count is now managed internally via localStorage
}

export default function Sidebar({}: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

    // Listen to hash changes
    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash || '#/');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && (
                    <div className="sidebar-title-wrapper">
                        <ShieldIcon size={24} className="sidebar-logo-icon" />
                        <h2 className="sidebar-title">Web IDS</h2>
                    </div>
                )}
                <button
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <MenuIcon size={20} /> : <ChevronLeftIcon size={20} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentHash === item.path;

                    return (
                        <a
                            key={item.path}
                            href={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            title={collapsed ? item.label : ''}
                        >
                            <Icon size={20} className="nav-icon" />
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                        </a>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                {!collapsed && (
                    <div className="sidebar-info">
                        <p className="text-muted">v1.0.0</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
