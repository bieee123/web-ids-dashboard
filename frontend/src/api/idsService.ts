import type { DetectionRequest, DetectionResponse } from "../types/detection";

export const detectAttack = async (
    data: DetectionRequest
): Promise<DetectionResponse> => {
    const response = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to detect");
    }

    return response.json();
};
