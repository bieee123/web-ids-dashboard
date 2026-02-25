export interface DetectionRequest {
    duration: number;
    protocol_type: string;
    service: string;
    flag: string;
}

export interface DetectionResponse {
    prediction: number;
    result: string;
    attack_type: string | null;
    confidence: number;
    severity: string;
    timestamp: string | null;
    protocol_type: string;
    service: string;
    flag: string;
    duration: number;
}

