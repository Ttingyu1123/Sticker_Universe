import { GoogleGenAI } from '@google/genai';
import type { AiProvider } from '../../shared/geminiApiKey';
import { generateOpenAiJson } from '../image-generation-core';
import { findConceptConflicts } from './series';
import type { StickerConcept } from './types';

interface SuggestStickerConceptsOptions {
    provider: AiProvider;
    apiKey: string;
    referenceImage: string;
    characterNotes?: string;
    previousConcepts?: StickerConcept[];
    requiredCaptions?: string[];
    contentGuidance?: string;
    requiredCaptionGuidance?: Record<string, string>;
}

interface StickerConceptResponse {
    characterSummary: string;
    recommendedBackgroundColor: string;
    backgroundColorReason: string;
    concepts: StickerConcept[];
}

const CONCEPT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['characterSummary', 'recommendedBackgroundColor', 'backgroundColorReason', 'concepts'],
    properties: {
        characterSummary: { type: 'string' },
        recommendedBackgroundColor: {
            type: 'string',
            description: 'Six-digit hexadecimal chroma-key color, such as #00FF00.',
            pattern: '^#[0-9A-Fa-f]{6}$',
        },
        backgroundColorReason: { type: 'string' },
        concepts: {
            type: 'array',
            minItems: 8,
            maxItems: 8,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['theme', 'caption', 'visual'],
                properties: {
                    theme: { type: 'string' },
                    caption: { type: 'string' },
                    visual: { type: 'string' },
                },
            },
        },
    },
} as const;

export const buildConceptPlanningPrompt = (
    characterNotes = '',
    previousConcepts: StickerConcept[] = [],
    requiredCaptions: string[] = [],
    contentGuidance = '',
    requiredCaptionGuidance: Record<string, string> = {},
) => {
    const exclusionList = previousConcepts.length > 0
        ? `
This is the next batch in the same sticker series.

ALREADY USED — DO NOT REPEAT OR PARAPHRASE:
${previousConcepts.map((concept, index) => (
        `${index + 1}. Theme: ${concept.theme} | Caption: ${concept.caption} | Visual: ${concept.visual}`
    )).join('\n')}

- Do not reuse the same caption with different punctuation or spacing.
- Do not rename an earlier theme while keeping the same chat meaning, pose, expression, prop, or visual joke.
- The new 8 concepts must add genuinely new communication needs and performances to the series.
`
        : '';
    const requiredCaptionList = requiredCaptions.length > 0
        ? `
REQUIRED CAPTIONS — USE VERBATIM:
${requiredCaptions.map((caption, index) => {
        const direction = Object.prototype.hasOwnProperty.call(requiredCaptionGuidance, caption)
            ? requiredCaptionGuidance[caption]?.trim().slice(0, 240)
            : '';
        return `${index + 1}. ${caption}${direction ? ` | REQUIRED CONTENT DIRECTION: ${direction}` : ''}`;
    }).join('\n')}

- Include every required caption exactly once among the 8 concepts.
- Do not alter, paraphrase, shorten, or add punctuation to any required caption.
- Design a distinct theme and visual performance that naturally supports each required caption.
- When a required caption has its own content direction, follow it precisely in that caption's visual performance. Do not transfer it to another caption.
`
        : '';
    const contentDirection = contentGuidance.trim().slice(0, 500);
    const contentDirectionBlock = contentDirection
        ? `
USER CONTENT DIRECTION — REQUIRED:
${contentDirection}

- Treat this as the creative brief for the whole set, not as optional inspiration.
- Carry the requested theme and mood across all 8 concepts.
- Make explicitly requested props, objects, actions, or relationships clearly visible in each relevant visual direction.
- If the user says an element must appear in every sticker, include it in all 8 concepts in varied, natural ways.
`
        : '';

    return `
Analyze the uploaded character reference and design a practical set of exactly 8 different LINE-style chat stickers for this specific character.

Character notes from the user:
${characterNotes.trim() || 'None. Infer only visible, non-sensitive design traits from the image.'}
${exclusionList}
${requiredCaptionList}
${contentDirectionBlock}

PLANNING GOALS:
- Make the set feel authored for this character, not copied from a generic fixed prompt list.
- Reuse visible signature details such as clothing, hairstyle, silhouette, mascot species, occupation-like costume, or handheld object when useful.
- Never infer sensitive identity, health, religion, ethnicity, politics, or private facts.
- Choose the 8 most useful chat intents for this character from greetings, acknowledgement, gratitude, apology, encouragement, joy, frustration, sadness, surprise, affection, busy/resting, and goodbye.
- All 8 captions must be distinct Traditional Chinese used naturally in Taiwan, ideally 2–6 characters and at most 8 characters.
- Each visual direction must describe a clearly different facial expression, body pose, gesture, energy, and optional prop/effect.
- Avoid 8 sequential animation frames. These are 8 independent sticker designs.

CHROMA-KEY BACKGROUND:
- Inspect the visible palette and recommend one flat, highly saturated chroma-key background color as a six-digit hex value.
- It must be clearly separated from all visible clothing, hair, skin, accessories, props, outlines, text, and likely sticker effects.
- Prefer vivid green, blue, or magenta only when that hue is absent from the character. Do not automatically choose green.
- Briefly explain the choice in Traditional Chinese so the user can decide whether to keep it.

Return JSON only:
{
  "characterSummary": "A concise Traditional Chinese summary of the visible character design",
  "recommendedBackgroundColor": "#0066FF",
  "backgroundColorReason": "A concise Traditional Chinese explanation of why this color is safe for chroma keying",
  "concepts": [
    { "theme": "貼圖用途", "caption": "貼圖文字", "visual": "具體表情、姿勢、動作與道具描述" }
  ]
}
`.trim();
};

const parseDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid reference image data.');
    return { mimeType: match[1], data: match[2] };
};

const normalizeConcepts = (
    payload: StickerConceptResponse,
    previousConcepts: StickerConcept[] = [],
    requiredCaptions: string[] = [],
): StickerConceptResponse => {
    const concepts = Array.isArray(payload?.concepts)
        ? payload.concepts.map((item) => ({
            theme: String(item?.theme || '').trim().slice(0, 40),
            caption: String(item?.caption || '').trim().slice(0, 12),
            visual: String(item?.visual || '').trim().slice(0, 240),
        })).filter((item) => item.theme && item.caption && item.visual)
        : [];

    if (concepts.length !== 8) {
        throw new Error('AI did not return exactly 8 complete sticker concepts.');
    }

    const conflicts = findConceptConflicts(concepts, previousConcepts);
    if (conflicts.length > 0) {
        const repeated = conflicts.map((conflict) => conflict.value).join('、');
        throw new Error(`AI repeats earlier sticker content: ${repeated}`);
    }

    const returnedCaptions = new Set(
        concepts.map((concept) => concept.caption.normalize('NFKC').trim()),
    );
    const missingRequiredCaptions = requiredCaptions.filter((caption) => (
        !returnedCaptions.has(caption.normalize('NFKC').trim())
    ));
    if (missingRequiredCaptions.length > 0) {
        throw new Error(`AI is missing required sticker captions: ${missingRequiredCaptions.join('、')}`);
    }

    return {
        characterSummary: String(payload?.characterSummary || '').trim().slice(0, 300),
        recommendedBackgroundColor: /^#[0-9a-fA-F]{6}$/.test(payload?.recommendedBackgroundColor || '')
            ? payload.recommendedBackgroundColor.toUpperCase()
            : '#00FF00',
        backgroundColorReason: String(payload?.backgroundColorReason || '').trim().slice(0, 300),
        concepts,
    };
};

export const suggestStickerConcepts = async ({
    provider,
    apiKey,
    referenceImage,
    characterNotes = '',
    previousConcepts = [],
    requiredCaptions = [],
    contentGuidance = '',
    requiredCaptionGuidance = {},
}: SuggestStickerConceptsOptions): Promise<StickerConceptResponse> => {
    const prompt = buildConceptPlanningPrompt(
        characterNotes,
        previousConcepts,
        requiredCaptions,
        contentGuidance,
        requiredCaptionGuidance,
    );

    if (provider === 'openai') {
        const payload = await generateOpenAiJson<StickerConceptResponse>(
            apiKey,
            [{
                role: 'user',
                content: [
                    { type: 'input_text', text: prompt },
                    { type: 'input_image', image_url: referenceImage },
                ],
            }],
            {
                instructions: 'You are a sticker-set art director. Analyze the supplied image and return only the requested structured JSON in Traditional Chinese.',
                schemaName: 'sticker_collection_plan',
                schemaDescription: 'Eight image-specific sticker concepts for one character',
                schema: CONCEPT_SCHEMA as unknown as Record<string, unknown>,
                maxOutputTokens: 4096,
            },
        );
        return normalizeConcepts(payload, previousConcepts, requiredCaptions);
    }

    const image = parseDataUrl(referenceImage);
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
            parts: [
                { inlineData: image },
                { text: prompt },
            ],
        }],
        config: { responseMimeType: 'application/json' },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned no sticker concepts.');
    return normalizeConcepts(
        JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim()),
        previousConcepts,
        requiredCaptions,
    );
};
