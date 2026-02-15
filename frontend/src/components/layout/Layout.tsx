import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    alertCount?: number;
}

export default function Layout({ children, title, subtitle, alertCount = 0 }: LayoutProps) {
    return (
        <div className="layout">
            <Sidebar alertCount={alertCount} />
            <div className="layout-main">
                <Header title={title} subtitle={subtitle} />
                <main className="layout-content">{children}</main>
            </div>
        </div>
    );
}
