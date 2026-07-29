import type { AiVideoProvider, AiVideoTaskResult } from './types';

interface CreateTaskOptions {
    provider: AiVideoProvider;
    apiKey: string;
    model: string;
    prompt: string;
    imageDataUrl: string;
    duration: number;
    aspectRatio: '16:9';
    resolution: '720p';
}

const request = async (payload: Record<string, unknown>): Promise<AiVideoTaskResult> => {
    const response = await fetch('/api/ai-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({})) as {
        requestId?: string;
        status?: AiVideoTaskResult['status'];
        videoUrl?: string;
        error?: string | { message?: string };
    };
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('AI video proxy endpoint is unavailable (404). Restart `npm run dev` so the local API middleware is loaded.');
        }
        const error = typeof data.error === 'string' ? data.error : data.error?.message;
        throw new Error(error || `AI video request failed (${response.status})`);
    }
    if (!data.requestId || !data.status) throw new Error('AI video service returned an incomplete response.');
    return {
        requestId: data.requestId,
        status: data.status,
        videoUrl: data.videoUrl,
        error: typeof data.error === 'string' ? data.error : data.error?.message,
    };
};

export const createAiVideoTask = (options: CreateTaskOptions) => request({ action: 'create', ...options });

export const getAiVideoTaskStatus = (provider: AiVideoProvider, apiKey: string, requestId: string) => request({
    action: 'status',
    provider,
    apiKey,
    requestId,
});

export const fetchAiVideoBlob = async (provider: AiVideoProvider, apiKey: string, videoUrl: string) => {
    const response = await fetch(videoUrl, {
        headers: provider === 'gemini' ? { 'x-goog-api-key': apiKey } : undefined,
    });
    if (!response.ok) throw new Error(`Video download failed (${response.status})`);
    const blob = await response.blob();
    return blob.type === 'video/mp4' ? blob : new Blob([blob], { type: 'video/mp4' });
};
