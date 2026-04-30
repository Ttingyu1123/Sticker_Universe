const OPENAI_IMAGE_GENERATIONS_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_IMAGE_EDITS_URL = 'https://api.openai.com/v1/images/edits';

const MIN_TOTAL_PIXELS = 655360;
const MAX_EDGE = 3840;
const MAX_RATIO = 3;
const BASE_SHORT_EDGE = 1024;

const roundToMultipleOf16 = (value: number) => Math.max(16, Math.round(value / 16) * 16);

const parseAspectRatio = (aspectRatio: string) => {
    const [widthText, heightText] = String(aspectRatio || '1:1').split(':');
    const width = Number(widthText);
    const height = Number(heightText);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return 1;
    }

    return Math.min(MAX_RATIO, Math.max(1 / MAX_RATIO, width / height));
};

const resolveOpenAiSize = (aspectRatio: string) => {
    const ratio = parseAspectRatio(aspectRatio);

    let width = ratio >= 1 ? roundToMultipleOf16(BASE_SHORT_EDGE * ratio) : BASE_SHORT_EDGE;
    let height = ratio >= 1 ? BASE_SHORT_EDGE : roundToMultipleOf16(BASE_SHORT_EDGE / ratio);

    if (width > MAX_EDGE) {
        const scale = MAX_EDGE / width;
        width = roundToMultipleOf16(width * scale);
        height = roundToMultipleOf16(height * scale);
    }

    if (height > MAX_EDGE) {
        const scale = MAX_EDGE / height;
        width = roundToMultipleOf16(width * scale);
        height = roundToMultipleOf16(height * scale);
    }

    const pixelCount = width * height;
    if (pixelCount < MIN_TOTAL_PIXELS) {
        const scale = Math.sqrt(MIN_TOTAL_PIXELS / pixelCount);
        width = roundToMultipleOf16(width * scale);
        height = roundToMultipleOf16(height * scale);
    }

    return `${width}x${height}`;
};

const getErrorPayload = async (response: Response) => {
    try {
        return await response.json();
    } catch {
        return { error: { message: `OpenAI request failed (${response.status})` } };
    }
};

const dataUrlToFile = (dataUrl: string, fallbackName: string) => {
    const [meta, base64] = String(dataUrl || '').split(',');
    const mimeType = meta?.match(/data:(.*?);base64/)?.[1] || 'image/png';
    const buffer = Buffer.from(base64 || '', 'base64');
    const extension = mimeType.split('/')[1] || 'png';
    return new File([buffer], `${fallbackName}.${extension}`, { type: mimeType });
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

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: { message: 'Method not allowed' } });
        return;
    }

    try {
        const body = await parseJsonBody(req);
        const {
            apiKey,
            prompt,
            base64Image,
            aspectRatio = '1:1',
            model = 'gpt-image-2',
            quality = 'medium',
        } = body || {};

        if (!apiKey || typeof apiKey !== 'string') {
            res.status(400).json({ error: { message: 'Missing OpenAI API key.' } });
            return;
        }

        const size = resolveOpenAiSize(aspectRatio);

        let response: Response;

        if (base64Image) {
            const formData = new FormData();
            formData.append('model', model);
            formData.append('prompt', prompt || 'Generate an image based on the reference image.');
            formData.append('size', size);
            formData.append('quality', quality);
            formData.append('image[]', dataUrlToFile(base64Image, 'reference-image'));

            response = await fetch(OPENAI_IMAGE_EDITS_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
                body: formData,
            });
        } else {
            response = await fetch(OPENAI_IMAGE_GENERATIONS_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    size,
                    quality,
                }),
            });
        }

        if (!response.ok) {
            const errorPayload = await getErrorPayload(response);
            res.status(response.status).json(errorPayload);
            return;
        }

        const payload = await response.json();
        const imageBase64 = payload.data?.[0]?.b64_json;

        if (!imageBase64) {
            res.status(502).json({ error: { message: 'OpenAI returned no image.' } });
            return;
        }

        res.status(200).json({ imageBase64 });
    } catch (error: any) {
        console.error('[api/openai-image] request failed', error);
        res.status(500).json({
            error: {
                message: error?.message || 'Unexpected OpenAI proxy failure.',
            },
        });
    }
}
