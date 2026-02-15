import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashboardLayout.css";

interface DashboardLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    alertCount?: number;
}

export default function DashboardLayout({
    children,
    title,
    subtitle,
    alertCount = 0,
}: DashboardLayoutProps) {
    return (
        <div className="dashboard-layout">
            <Sidebar alertCount={alertCount} />
            <div className="main-wrapper">
                <Header title={title} subtitle={subtitle} />
                <main className="main-content">{children}</main>
            </div>
        </div>
    );
}
