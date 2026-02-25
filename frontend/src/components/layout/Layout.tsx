import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
    return (
        <div className="layout">
            <Sidebar />
            <div className="layout-main">
                <Header title={title} subtitle={subtitle} />
                <main className="layout-content">{children}</main>
            </div>
        </div>
    );
}
