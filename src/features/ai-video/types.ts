export type AiVideoProvider = 'gemini' | 'grok';

export type AiVideoJobStatus = 'draft' | 'queued' | 'running' | 'completed' | 'failed';

export interface AiVideoJob {
    id: string;
    provider: AiVideoProvider;
    model: string;
    prompt: string;
    duration: number;
    aspectRatio: '16:9';
    resolution: '720p';
    status: AiVideoJobStatus;
    sourceImage: Blob;
    sourceName: string;
    requestId?: string;
    videoBlob?: Blob;
    remoteVideoUrl?: string;
    error?: string;
    createdAt: number;
    updatedAt: number;
}

export interface AiVideoTaskResult {
    requestId: string;
    status: Exclude<AiVideoJobStatus, 'draft'>;
    videoUrl?: string;
    error?: string;
}

export const AI_VIDEO_MODELS: Record<AiVideoProvider, string> = {
    gemini: 'veo-3.1-fast-generate-preview',
    grok: 'grok-imagine-video',
};
