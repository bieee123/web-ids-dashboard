import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashboardLayout.css";

interface DashboardLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export default function DashboardLayout({
    children,
    title,
    subtitle,
}: DashboardLayoutProps) {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-wrapper">
                <Header title={title} subtitle={subtitle} />
                <main className="main-content">{children}</main>
            </div>
        </div>
    );
}
