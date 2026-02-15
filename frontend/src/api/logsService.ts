import type { DetectionLog } from "../types/log";

export async function fetchLogs(
    limit: number = 100,
    offset: number = 0,
    result?: "ATTACK" | "NORMAL"
): Promise<DetectionLog[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    if (result) {
        params.append("result", result);
    }

    const response = await fetch(
        `http://127.0.0.1:8000/logs?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch logs");
    }

    return response.json();
}
