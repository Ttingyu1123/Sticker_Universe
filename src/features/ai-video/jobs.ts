import { saveAiVideoJob } from '../../db';
import { AI_VIDEO_MODELS } from './types';
import type { AiVideoJob, AiVideoProvider } from './types';

interface CreateAiVideoDraftOptions {
    sourceImage: Blob;
    sourceName: string;
    prompt: string;
    provider?: AiVideoProvider;
}

export const createAiVideoDraft = async ({
    sourceImage,
    sourceName,
    prompt,
    provider = 'gemini',
}: CreateAiVideoDraftOptions): Promise<AiVideoJob> => {
    const now = Date.now();
    const job: AiVideoJob = {
        id: crypto.randomUUID(),
        provider,
        model: AI_VIDEO_MODELS[provider],
        prompt,
        duration: 4,
        aspectRatio: '16:9',
        resolution: '720p',
        status: 'draft',
        sourceImage,
        sourceName,
        createdAt: now,
        updatedAt: now,
    };
    await saveAiVideoJob(job);
    return job;
};
