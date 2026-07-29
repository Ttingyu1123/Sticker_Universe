import { exceedsLength, rejectBadOrigin } from './_guard';

const GEMINI_MODEL = 'veo-3.1-fast-generate-preview';
const GROK_MODEL = 'grok-imagine-video';
const MAX_BODY_LENGTH = 4_200_000;

const readJsonBody = async (req: any) => {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body);
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const upstreamError = async (response: Response) => {
    const raw = await response.text();
    let payload: any = { message: raw };
    try {
        payload = JSON.parse(raw);
    } catch {
        // Plain-text upstream errors are already represented by the fallback payload.
    }
    const message = payload?.error?.message || payload?.message || `Upstream request failed (${response.status})`;
    return { error: { message } };
};

const normalizeGeminiStatus = (payload: any, requestId: string) => {
    if (!payload.done) return { requestId, status: 'running' };
    if (payload.error) {
        return { requestId, status: 'failed', error: payload.error.message || 'Gemini video generation failed.' };
    }
    const videoUrl = payload.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
        || payload.response?.generatedVideos?.[0]?.video?.uri;
    return videoUrl
        ? { requestId, status: 'completed', videoUrl }
        : { requestId, status: 'failed', error: 'Gemini completed without a downloadable video.' };
};

const normalizeGrokStatus = (payload: any, requestId: string) => {
    const upstreamStatus = String(payload.status || '').toLowerCase();
    if (upstreamStatus === 'done' && payload.video?.url) {
        return { requestId, status: 'completed', videoUrl: payload.video.url };
    }
    if (upstreamStatus === 'failed' || upstreamStatus === 'expired') {
        return {
            requestId,
            status: 'failed',
            error: payload.error?.message || payload.error || `Grok task ${upstreamStatus}.`,
        };
    }
    return { requestId, status: upstreamStatus === 'pending' ? 'queued' : 'running' };
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: { message: 'Method not allowed.' } });
        return;
    }
    if (rejectBadOrigin(req, res)) return;

    try {
        const body = await readJsonBody(req);
        if (exceedsLength(body, MAX_BODY_LENGTH)) {
            res.status(413).json({ error: { message: 'Source image is too large for video generation.' } });
            return;
        }

        const { action, provider, apiKey } = body;
        if ((provider !== 'gemini' && provider !== 'grok') || typeof apiKey !== 'string' || !apiKey.trim()) {
            res.status(400).json({ error: { message: 'A valid provider and API key are required.' } });
            return;
        }

        if (action === 'create') {
            const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
            const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl : '';
            if (!prompt || !imageDataUrl.startsWith('data:image/')) {
                res.status(400).json({ error: { message: 'A prompt and source image are required.' } });
                return;
            }

            if (provider === 'gemini') {
                const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (!match) {
                    res.status(400).json({ error: { message: 'Unsupported source image encoding.' } });
                    return;
                }
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:predictLongRunning`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey.trim() },
                    body: JSON.stringify({
                        instances: [{
                            prompt,
                            image: { inlineData: { mimeType: match[1], data: match[2] } },
                        }],
                        parameters: {
                            aspectRatio: '16:9',
                            durationSeconds: 4,
                            resolution: '720p',
                            numberOfVideos: 1,
                        },
                    }),
                });
                if (!response.ok) {
                    res.status(response.status).json(await upstreamError(response));
                    return;
                }
                const payload = await response.json() as any;
                if (!payload.name) {
                    res.status(502).json({ error: { message: 'Gemini returned no operation ID.' } });
                    return;
                }
                res.status(200).json({ requestId: payload.name, status: 'queued' });
                return;
            }

            const response = await fetch('https://api.x.ai/v1/videos/generations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
                body: JSON.stringify({
                    model: GROK_MODEL,
                    prompt,
                    image: { url: imageDataUrl },
                    duration: 4,
                    aspect_ratio: '16:9',
                    resolution: '720p',
                }),
            });
            if (!response.ok) {
                res.status(response.status).json(await upstreamError(response));
                return;
            }
            const payload = await response.json() as any;
            if (!payload.request_id) {
                res.status(502).json({ error: { message: 'Grok returned no request ID.' } });
                return;
            }
            res.status(200).json({ requestId: payload.request_id, status: 'queued' });
            return;
        }

        if (action === 'status') {
            const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
            if (!requestId || !/^[A-Za-z0-9._/-]+$/.test(requestId)) {
                res.status(400).json({ error: { message: 'A valid request ID is required.' } });
                return;
            }

            if (provider === 'gemini') {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${requestId}`, {
                    headers: { 'x-goog-api-key': apiKey.trim() },
                });
                if (!response.ok) {
                    res.status(response.status).json(await upstreamError(response));
                    return;
                }
                res.status(200).json(normalizeGeminiStatus(await response.json(), requestId));
                return;
            }

            const response = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
                headers: { Authorization: `Bearer ${apiKey.trim()}` },
            });
            if (!response.ok) {
                res.status(response.status).json(await upstreamError(response));
                return;
            }
            res.status(200).json(normalizeGrokStatus(await response.json(), requestId));
            return;
        }

        res.status(400).json({ error: { message: 'Unsupported AI video action.' } });
    } catch (error: any) {
        console.error('[api/ai-video] request failed', error?.message || error);
        res.status(500).json({ error: { message: error?.message || 'Unexpected AI video proxy failure.' } });
    }
}
