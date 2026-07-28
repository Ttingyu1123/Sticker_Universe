import { rejectBadOrigin, clampNumber, exceedsLength } from './_guard';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const ALLOWED_MODELS = new Set(['gpt-5-mini', 'gpt-5-nano']);
// Multimodal planning requests include a browser-compressed reference image.
// Keep this below typical serverless body limits while allowing a 1024px JPEG data URL.
const MAX_INPUT_LENGTH = 2_500_000;
const MAX_INSTRUCTIONS_LENGTH = 16_000;
const MAX_OUTPUT_TOKENS_CAP = 4096;

const getErrorPayload = async (response: Response) => {
    try {
        return await response.json();
    } catch {
        return { error: { message: `OpenAI request failed (${response.status})` } };
    }
};

const parseJsonBody = async (req: any) => {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string' && req.body.length > 0) return JSON.parse(req.body);

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const raw = Buffer.concat(chunks).toString('utf8');
    return raw ? JSON.parse(raw) : {};
};

const extractResponseText = (payload: any): string => {
    if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
        return payload.output_text.trim();
    }

    const chunks: string[] = [];
    const outputItems = Array.isArray(payload?.output) ? payload.output : [];

    for (const item of outputItems) {
        if (!Array.isArray(item?.content)) continue;
        for (const content of item.content) {
            if (typeof content?.text === 'string' && (content.type === 'output_text' || content.type === 'text')) {
                chunks.push(content.text);
            }
        }
    }

    return chunks.join('\n').trim();
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: { message: 'Method not allowed' } });
        return;
    }

    if (rejectBadOrigin(req, res)) return;

    try {
        const body = await parseJsonBody(req);
        const {
            apiKey,
            input,
            instructions,
            model = 'gpt-5-mini',
            responseFormat,
            maxOutputTokens = 800,
        } = body || {};

        if (!apiKey || typeof apiKey !== 'string') {
            res.status(400).json({ error: { message: 'Missing OpenAI API key.' } });
            return;
        }

        if (!input || (typeof input !== 'string' && !Array.isArray(input))) {
            res.status(400).json({ error: { message: 'Missing OpenAI input.' } });
            return;
        }

        if (!ALLOWED_MODELS.has(model)) {
            res.status(400).json({ error: { message: `Unsupported model: ${String(model)}` } });
            return;
        }

        if (exceedsLength(input, MAX_INPUT_LENGTH)) {
            res.status(400).json({ error: { message: 'Input too long.' } });
            return;
        }

        if (exceedsLength(instructions, MAX_INSTRUCTIONS_LENGTH)) {
            res.status(400).json({ error: { message: 'Instructions too long.' } });
            return;
        }

        const requestBody: Record<string, any> = {
            model,
            input,
            max_output_tokens: clampNumber(maxOutputTokens, 800, MAX_OUTPUT_TOKENS_CAP),
            text: {
                format: { type: 'text' },
            },
        };

        if (typeof instructions === 'string' && instructions.trim()) {
            requestBody.instructions = instructions;
        }

        if (responseFormat?.type === 'json_schema' && responseFormat.name && responseFormat.schema) {
            requestBody.text = {
                format: {
                    type: 'json_schema',
                    name: responseFormat.name,
                    description: responseFormat.description,
                    schema: responseFormat.schema,
                    strict: responseFormat.strict ?? true,
                },
            };
        } else if (responseFormat?.type === 'json_object') {
            requestBody.text = {
                format: { type: 'json_object' },
            };
        }

        const response = await fetch(OPENAI_RESPONSES_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorPayload = await getErrorPayload(response);
            res.status(response.status).json(errorPayload);
            return;
        }

        const payload = await response.json();
        const text = extractResponseText(payload);

        if (!text) {
            res.status(502).json({ error: { message: 'OpenAI returned no text.' } });
            return;
        }

        res.status(200).json({ text });
    } catch (error: any) {
        console.error('[api/openai-text] request failed', error);
        res.status(500).json({
            error: {
                message: error?.message || 'Unexpected OpenAI text proxy failure.',
            },
        });
    }
}
