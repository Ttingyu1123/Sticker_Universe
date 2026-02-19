
import { GoogleGenAI } from "@google/genai";

export async function generateSticker(
  apiKey: string,
  base64Image: string,
  phrase: string,
  model: string,
  styleSnippet: string,
  includeText: boolean,
  fontPrompt: string = '',
  priorityMode: 'style' | 'semantic' = 'style',
  characterLock: boolean = true,
  variationStrength: number = 3
): Promise<{ imageUrl: string; prompt: string }> {
  const ai = new GoogleGenAI({ apiKey });
  const normalizedPhrase = (phrase || '').trim();
  const phraseForPrompt = normalizedPhrase || 'a context-appropriate sticker meaning chosen by the model';

  const priorityInstruction = priorityMode === 'semantic'
    ? `PRIORITY MODE: MEANING FIRST
       - Prioritize clear semantic meaning and expression readability over decorative style details.
       - Style should support readability, not overpower it.`
    : `PRIORITY MODE: STYLE FIRST
       - Prioritize style fidelity, rendering quality, and visual consistency first.
       - Preserve readable expression and semantic clarity as secondary goals.`;

  const characterLockInstruction = characterLock
    ? `CHARACTER LOCK: ON
       - Keep identity highly consistent with the reference image (face shape, eyes, nose, mouth, hairline, hair color).
       - Avoid changing identity-defining attributes between outputs.`
    : `CHARACTER LOCK: OFF
       - Keep broad resemblance to the reference image, but allow looser character reinterpretation.`;

  const clampedVariation = Math.max(1, Math.min(5, variationStrength));
  const variationInstruction =
    clampedVariation <= 2
      ? 'VARIATION LEVEL: LOW. Keep pose, composition, and details relatively stable.'
      : clampedVariation === 3
        ? 'VARIATION LEVEL: MEDIUM. Balance consistency and expressive changes.'
        : 'VARIATION LEVEL: HIGH. Allow larger pose/expression/detail variation while preserving character identity.';

  const textInstruction = includeText
    ? `TYPOGRAPHY:
       - ${normalizedPhrase
        ? `Overlay the Traditional Chinese text "${normalizedPhrase}" in a large, bold, playful font.`
        : 'Generate a short Traditional Chinese sticker caption (2-6 chars) that matches the expression.'}
       - The text should be clear and well-integrated into the composition.
       - Font direction: ${fontPrompt || 'Bold sans-serif with clear readability for sticker usage.'}`
    : `STRICT RULE - NO TEXT:
       - DO NOT include any text, letters, symbols, or characters in the image. 
       - Focus 100% on the character's expression and dynamic pose to convey "${phraseForPrompt}".`;

  // Determine if this style is the one that actually needs a border
  const isStickerWithBorder = styleSnippet.includes("OFFSET BORDER");

  const prompt = `
    TASK: Create a professional illustration based on the provided character reference image.
    
    STYLE & CHARACTER:
    - ${styleSnippet}
    - ${priorityInstruction}
    - ${characterLockInstruction}
    - ${variationInstruction}
    - FACIAL IDENTITY: Preserve the character's facial structure and features from the original photo.
    - EXPRESSION & POSE: Exaggerate the expression to match "${phraseForPrompt}".
    
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
      contents: [
        {
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
      ],
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

    return { imageUrl, prompt };
  } catch (error: any) {
    console.error("Error generating sticker:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  base64Image: string | null,
  aspectRatio: string = "1:1",
  model: string = "gemini-3-pro-image-preview"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const config: any = {
    imageConfig: {
      aspectRatio: aspectRatio,
      imageSize: "1K"
    }
  };

  const contents: any = [
    {
      parts: [
        { text: prompt }
      ]
    }
  ];

  if (base64Image) {
    contents[0].parts.unshift({
      inlineData: {
        data: base64Image.split(',')[1] || base64Image,
        mimeType: 'image/jpeg',
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    console.log("Gemini Image Gen Response:", JSON.stringify(response, null, 2));

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No candidates returned from model.");

    const parts = candidate.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      throw new Error("Invalid response structure: 'parts' is missing.");
    }

    let imageUrl = '';
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error(`Model returned no image. Finish Reason: ${candidate.finishReason}`);
    }

    return imageUrl;

  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

export async function generateCaptions(
  apiKey: string,
  base64Image: string,
  model: string = "gemini-1.5-pro"
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze this image and suggest 5 short, funny, and relevant captions suitable for a LINE sticker.
    
    REQUIREMENTS:
    - Use Traditional Chinese (Taiwan usage).
    - Incorporate popular Taiwanese internet slang where appropriate (e.g. 歸剛欸, 真的假的, 笑死, 哭阿, 有料).
    - Keep each caption under 10 characters.
    - Return ONLY the 5 captions, separated by commas or newlines. No numbering, no introduction.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
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
      ],
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error("No captions generated.");
    }

    const text = candidate.content.parts[0].text;
    const captions = text.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    return captions.slice(0, 5);

  } catch (error) {
    console.error("Error generating captions:", error);
    throw error;
  }
}

export async function suggestStickerPhrases(
  apiKey: string,
  themePrompt: string,
  count: number,
  model: string = "gemini-2.0-flash"
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  const safeCount = Math.max(1, Math.min(32, count));

  const prompt = `
You are helping create sticker phrases.
Generate ${safeCount} short Traditional Chinese phrases for stickers.

Theme context:
${themePrompt || 'general daily expression stickers'}

Rules:
- Traditional Chinese only
- 2 to 8 characters each
- avoid duplicates
- keep phrases practical for chat use
- output plain lines only, one phrase per line, no numbering
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
    const lines = text
      .split('\n')
      .map((line) => line.replace(/^\s*\d+[\.\)\-]\s*/, '').trim())
      .filter(Boolean)
      .map((line) => line.slice(0, 12));

    const unique: string[] = [];
    for (const item of lines) {
      if (!unique.includes(item)) unique.push(item);
      if (unique.length >= safeCount) break;
    }

    while (unique.length < safeCount) {
      unique.push(`貼圖${unique.length + 1}`);
    }

    return unique;
  } catch (error: any) {
    console.error("Error suggesting sticker phrases:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

export async function listAvailableModels(apiKey: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response: any = await ai.models.list();
    if (response.models) {
      return response.models.map((m: any) => m.name.replace('models/', ''));
    }
    // Fallback if it's not structured as expected, return empty to avoid crash
    return [];
  } catch (error) {
    console.error("Failed to list models:", error);
    return [];
  }
}
