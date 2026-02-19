import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import {
  CharacterPromptState,
  CharacterWorldMode,
} from './types';

const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export async function generateCharacterMatrix(
  apiKey: string,
  input: string,
  mode: CharacterWorldMode
): Promise<Partial<CharacterPromptState>> {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert prompt engineer for AI image generation.
Analyze the user idea and output a JSON object with these keys:
character, pose, outfit, env, light, color, style, shot, rare.

Rules:
- Output language for values: English.
- Use concise but descriptive comma-separated phrases.
- Theme context: ${mode}.
- If a key is not explicit in user text, infer a suitable value.`;

  const prompt = `Analyze this character idea and return JSON only: "${input}"`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '{}';
  return JSON.parse(cleanJson(text));
}

export async function optimizeCharacterPrompt(
  apiKey: string,
  sourceText: string,
  mode: CharacterWorldMode,
  style: 'artistic' | 'photo' | 'anime'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  let styleInstruction = '';
  if (style === 'photo') {
    styleInstruction =
      'Rewrite as a premium photography prompt with camera/lens/lighting details and realism.';
  } else if (style === 'anime') {
    styleInstruction =
      'Rewrite as a high-quality anime prompt with clear subject, scene, style, and rendering details.';
  } else {
    styleInstruction =
      'Rewrite as an artistic, vivid, and cohesive visual prompt.';
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Original prompt: "${sourceText}"\nTheme: ${mode}\nOutput only optimized prompt text.`,
    config: {
      systemInstruction: styleInstruction,
    },
  });

  return response.text?.trim() || '';
}

export async function generateCharacterStory(
  apiKey: string,
  tags: string,
  mode: CharacterWorldMode,
  language: 'en' | 'zh-TW'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const outputLang = language === 'zh-TW' ? 'Traditional Chinese (Taiwan)' : 'English';

  const systemInstruction = `You are a creative writer.
Create a concise character card in ${outputLang} for world setting ${mode}.
Use markdown sections:
## Name
**Title/Class:**
**Personality:**
**Background Story:** (80-140 words)
**Visual Traits:**`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Character tags: "${tags}"`,
    config: {
      systemInstruction,
    },
  });

  return response.text?.trim() || '';
}
