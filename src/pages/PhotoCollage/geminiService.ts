
import { GoogleGenAI } from "@google/genai";

export async function generateImage(
    apiKey: string,
    prompt: string,
    base64ReferenceImage?: string // Optional reference image if needed
): Promise<string> {
    // 1. Initialize Client with User's Key
    const ai = new GoogleGenAI({ apiKey });

    // 2. Select Model
    const model = 'gemini-2.0-flash'; // Wait, user asked for 'gemini 3 pro'. 
    // Wait, I should double check if gemini-3-pro-image-preview actually exists.
    // The user prompt said: "refer to skills 'gemini_byok_image_gen', only call gemini 3 pro".
    // The SKILL document said: "model: 'gemini-3-pro-image-preview'".
    // BUT the skill content I viewed in Step 7 has: "const model = 'gemini-3-pro-image-preview';"
    // However, officially it might be experimental. I will stick to what the skill says as per user instruction.

    // NOTE: If 'gemini-3-pro-image-preview' fails, it might be 'gemini-2.0-flash' with image generation capabilities or similar.
    // But I will follow the skill instructions EXACTLY as requested.
    const modelId = 'gemini-2.0-flash-exp'; // Updating to a known working model for now?
    // User explicitly said "only call gemini 3 pro".
    // If the skill says "gemini-3-pro-image-preview", I MUST use it.
    const targetModel = 'gemini-3-pro-image-preview';

    // 3. Configuration (Critical for Image Gen)
    const config = {
        imageConfig: {
            aspectRatio: "1:1", // Options: "1:1", "4:3", "3:4", "16:9", "9:16"
            imageSize: "1K"    // Options: "1K"
        }
    };

    // 4. Construct Content Parts
    const parts: any[] = [{ text: prompt }];

    // Add reference image if provided (Image-to-Image)
    if (base64ReferenceImage) {
        parts.unshift({
            inlineData: {
                data: base64ReferenceImage.split(',')[1], // Remove header
                mimeType: 'image/jpeg', // Assumption, can be dynamic
            },
        });
    }

    try {
        // 5. Generate Content
        // @ts-ignore - The types for @google/genai might not fully support this experimental model yet
        const response = await ai.models.generateContent({
            model: targetModel,
            contents: [{ parts }],
            // @ts-ignore
            config: config
        });

        // 6. Extract Image from Response
        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

        if (imagePart && imagePart.inlineData) {
            return `data:image/png;base64,${imagePart.inlineData.data}`;
        }

        throw new Error("No image generated.");

    } catch (error: any) {
        console.error("Generation failed:", error);
        throw error;
    }
}
