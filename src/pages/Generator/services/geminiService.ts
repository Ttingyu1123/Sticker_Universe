
import { GoogleGenAI } from "@google/genai";

export async function generateSticker(
  apiKey: string,
  base64Image: string,
  phrase: string,
  model: string,
  styleSnippet: string,
  includeText: boolean
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const textInstruction = includeText
    ? `TYPOGRAPHY:
       - Overlay the Traditional Chinese text "${phrase}" in a large, bold, playful font.
       - The text should be clear and well-integrated into the composition.`
    : `STRICT RULE - NO TEXT:
       - DO NOT include any text, letters, symbols, or characters in the image. 
       - Focus 100% on the character's expression and dynamic pose to convey the meaning of "${phrase}".`;

  // Determine if this style is the one that actually needs a border
  const isStickerWithBorder = styleSnippet.includes("OFFSET BORDER");

  const prompt = `
    TASK: Create a professional illustration based on the provided character reference image.
    
    STYLE & CHARACTER:
    - ${styleSnippet}
    - FACIAL IDENTITY: Preserve the character's facial structure and features from the original photo.
    - EXPRESSION & POSE: Exaggerate the expression to match the energy of the Taiwanese phrase "${phrase}".
    
    BORDER & EDGES (CRITICAL):
    ${isStickerWithBorder
      ? "- This specific style MUST have a thick, solid white sticker border."
      : "- STRICT FORBIDDEN: DO NOT add any white border, offset, outline, or glow. The character's outermost lines must be the black ink lines or the character colors themselves, touching the green background directly."}
    
    BACKGROUND (CRITICAL CHROMA KEY):
    - The background MUST be a 100% SOLID, FLAT, PURE NEON GREEN (#00FF00). 
    - No gradients, no textures, no shadows, no background objects.
    - Think of this as a character sprite for a game engine.
    
    ${textInstruction}
    
    FINAL VALIDATION:
    - If there is a white border and the style is NOT "寫實貼紙", the generation is WRONG.
    - For anime styles, ensure the edges are sharp and clean against the green.
  `;

  try {
    const config: any = {};

    if (model === 'gemini-3-pro-image-preview') {
      config.imageConfig = {
        aspectRatio: "1:1",
        imageSize: "1K"
      };
    } else if (model.includes('flash')) {
      // Gemini Flash models often do not support native image output mimetype.
      // We leave config empty and handle text response in the error block below.
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: 'image/jpeg',
            },
          },
          { text: prompt },
        ],
      },
      config: config
    });

    console.log("Gemini Response:", JSON.stringify(response, null, 2));

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No candidates returned from model.");

    // Check for safety finish reason
    if (candidate.finishReason !== "STOP" && candidate.finishReason !== undefined) {
      console.warn("Model finished with reason:", candidate.finishReason);
    }

    const parts = candidate.content?.parts;

    // If parts are missing, check if it's because safety blocked it or other reason
    if (!parts || !Array.isArray(parts)) {
      throw new Error(`Invalid response structure: 'parts' is missing. Finish Reason: ${candidate.finishReason}`);
    }

    let imageUrl = '';
    let textContent = '';

    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
      if (part.text) {
        textContent += part.text;
      }
    }

    if (!imageUrl) {
      console.warn("No image found in response. Text content:", textContent);
      throw new Error(`Model returned text instead of image: "${textContent.slice(0, 100)}..." (Reason: ${candidate.finishReason})`);
    }

    return imageUrl;

    if (!imageUrl) {
      throw new Error('Failed to extract image from response');
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Error generating sticker:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}
