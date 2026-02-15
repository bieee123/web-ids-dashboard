export interface DetectionRequest {
    duration: number;
    protocol_type: string;
    service: string;
    flag: string;
}

export interface DetectionResponse {
    result: string;
    attack_type: number;
    confidence: number;
}
