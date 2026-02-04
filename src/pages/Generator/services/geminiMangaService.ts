import { GoogleGenAI } from "@google/genai";
import { ComicConfig, ComicLayout } from "../components/Manga/types";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

export const optimizeStory = async (apiKey: string, rawStory: string, layout: ComicLayout, style: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required");
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{
                parts: [{
                    text: `You are a professional comic book editor. Refine the following story idea into a structured visual prompt.
      
      **Context:**
      - Layout: "${layout}"
      - Art Style: "${style}"

      **Goal:** 
      Break down the story into distinct panel descriptions that match the "${layout}" structure.
      The visual descriptions MUST perfectly fit the "${style}" aesthetic.
      
      **Instructions:**
      1. Create a scene description for each panel implied by the layout.
      2. Focus on lighting, camera angles, and details that emphasize the "${style}" style.
      3. For example, if style is "Cyberpunk", describe neon lights and high-tech details. If "Horror", describe shadows and eerie atmosphere.
      4. Keep the output as a coherent narrative block (or numbered list) ready to be used as a prompt.
      
      Raw Story: "${rawStory}"`
                }]
            }],
            config: {
                systemInstruction: "You are an expert comic book scriptwriter. Your goal is to convert loose ideas into precise, panel-by-panel visual descriptions for an artist."
            }
        });

        const refinedText = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!refinedText) throw new Error("No response from AI");
        return refinedText;

    } catch (error: any) {
        console.error("Story optimization failed", error);
        if (error.message.includes('404')) {
            throw new Error("無法找到模型 (404)。您的 API Key 可能沒有權限存取 Gemini 3 Pro。");
        }
        throw new Error(error.message || "Optimization failed");
    }
};

export const generateComicImage = async (apiKey: string, config: ComicConfig): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required");
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];
    const characterDetails: string[] = [];

    // Process characters first
    if (config.characters.length > 0) {
        for (const char of config.characters) {
            if (char.image) {
                const base64Data = await fileToBase64(char.image);
                parts.push({
                    inlineData: {
                        mimeType: char.image.type,
                        data: base64Data
                    }
                });
                characterDetails.push(`- Character "${char.name}": See the attached reference image above. Visual description: ${char.description}`);
            } else {
                characterDetails.push(`- Character "${char.name}": ${char.description}`);
            }
        }
    }

    const textInstruction = config.withText
        ? `Include speech bubbles. IMPORTANT: All text inside bubbles MUST be in ${config.textLanguage === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : config.textLanguage}. Ensure the text is legible and fits the bubbles.`
        : "DO NOT include any speech bubbles, text, or sound effects. Keep the artwork clean for post-production.";

    let promptText = `Generate a high-quality comic page.
  
  **Visual Configuration:**
  - Layout Structure: ${config.layout}
  - Art Style: ${config.style}
  - Color Palette: ${config.colorMode}
  
  **Script & Panels:**
  ${config.theme}
  
  **Character References:**
  ${characterDetails.length > 0 ? characterDetails.join('\n') : 'No specific characters defined.'}
  
  **Technical Requirements:**
  - Strictly adhere to the requested "${config.layout}" layout.
  - Draw panel borders clearly.
  - Maintain high fidelity to the art style: ${config.style}.
  - Color Mode: ${config.colorMode} (Ensure strict adherence to this color scheme).
  - ${textInstruction}
  
  **Negative Constraints (Avoid these):**
  ${config.negativePrompt ? config.negativePrompt : 'blurry, low quality, distorted, extra limbs, bad anatomy, watermark'}
  ${!config.withText ? ', text, speech bubbles, words, letters' : ''}
  `;

    parts.push({ text: promptText });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview', // Use the specific model requested
            contents: [{ parts }],
            config: {
                imageConfig: {
                    // @ts-ignore - The SDK types might not be fully updated for this specific model/config shape yet
                    aspectRatio: config.aspectRatio, // "1:1", "3:4", "4:3", "16:9", "9:16"
                },
                systemInstruction: "You are a world-class comic artist and illustrator. You specialize in creating cohesive, high-quality comic pages that perfectly follow structural layouts. You are expert at maintaining character consistency across multiple panels within a single page."
            }
        });

        const candidate = response.candidates?.[0];
        // Check for inline data (image)
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }

        throw new Error("No image data returned from Gemini.");

    } catch (error) {
        console.error("Comic generation failed", error);
        throw error;
    }
};
