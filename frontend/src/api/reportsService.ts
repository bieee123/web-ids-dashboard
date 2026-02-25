const API_BASE = "http://127.0.0.1:8000";

export async function generateReport(): Promise<Blob> {
    try {
        const response = await fetch(`${API_BASE}/reports/generate`, {
            method: "GET",
            headers: {
                "Accept": "application/pdf",
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Report generation failed: ${response.status} - ${errorText}`);
        }
        
        return response.blob();
    } catch (error) {
        console.error("Report generation error:", error);
        throw error;
    }
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
