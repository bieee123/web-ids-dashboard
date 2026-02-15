import { useState } from "react";
import { detectAttack } from "../api/idsService";

export default function DetectForm() {
    const [result, setResult] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            duration: 0,
            protocol_type: "tcp",
            service: "http",
            flag: "SF",
        };

        try {
            const response = await detectAttack(data);
            setResult(
                `${response.result} (confidence: ${response.confidence})`
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Test IDS Detection</h2>
            <button onClick={handleSubmit}>Test Detect</button>

            {result && <p>Result: {result}</p>}
        </div>
    );
}
