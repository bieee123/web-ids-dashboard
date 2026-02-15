import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: "2rem",
                    backgroundColor: "#1E2749",
                    color: "#E2E8F0",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui"
                }}>
                    <h1 style={{ color: "#EF4444" }}>⚠️ Something went wrong</h1>
                    <p style={{ color: "#94A3B8", marginBottom: "1rem" }}>
                        The application encountered an error:
                    </p>
                    <pre style={{
                        backgroundColor: "#0A0E27",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        maxWidth: "600px",
                        overflow: "auto"
                    }}>
                        {this.state.error?.message}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: "1rem",
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#3B82F6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "1rem"
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
