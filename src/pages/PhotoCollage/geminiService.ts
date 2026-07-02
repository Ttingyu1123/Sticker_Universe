import { GoogleGenAI } from "@google/genai";

const MODEL = 'gemini-3-pro-image-preview';

const clientCache = new Map<string, GoogleGenAI>();

function getClient(apiKey: string): GoogleGenAI {
    let client = clientCache.get(apiKey);
    if (!client) {
        client = new GoogleGenAI({ apiKey });
        clientCache.set(apiKey, client);
    }
    return client;
}

export async function generateImage(
    apiKey: string,
    prompt: string,
    base64ReferenceImage?: string
): Promise<string> {
    const ai = getClient(apiKey);

    const config = {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
    };

    const parts: any[] = [{ text: prompt }];

    if (base64ReferenceImage) {
        parts.unshift({
            inlineData: {
                data: base64ReferenceImage.split(',')[1],
                mimeType: 'image/jpeg',
            },
        });
    }

    try {
        // @ts-ignore - The types for @google/genai might not fully support this experimental model yet
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ parts }],
            // @ts-ignore
            config: config
        });

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
