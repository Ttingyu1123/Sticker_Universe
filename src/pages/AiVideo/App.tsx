import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveAs } from 'file-saver';
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Download,
    Film,
    FolderHeart,
    Image as ImageIcon,
    KeyRound,
    LoaderCircle,
    Play,
    Sparkles,
    Upload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GalleryPicker } from '../../components/GalleryPicker';
import { useToast } from '../../components/shared/ToastProvider';
import { getAiVideoJob, getLatestAiVideoJob, saveAiVideoJob } from '../../db';
import {
    getAiVideoApiKeyUrl,
    isValidAiVideoApiKey,
    loadAiVideoApiKey,
    saveAiVideoApiKey,
} from '../../features/ai-video/apiKeys';
import { createAiVideoDraft } from '../../features/ai-video/jobs';
import { prepareAiVideoInput } from '../../features/ai-video/image';
import { buildStickerVideoPrompt } from '../../features/ai-video/prompt';
import {
    createAiVideoTask,
    fetchAiVideoBlob,
    getAiVideoTaskStatus,
} from '../../features/ai-video/service';
import { AI_VIDEO_MODELS } from '../../features/ai-video/types';
import type { AiVideoJob, AiVideoProvider } from '../../features/ai-video/types';

const providerOptions: Array<{
    id: AiVideoProvider;
    name: string;
    note: string;
    cost: string;
}> = [
    { id: 'gemini', name: 'Gemini · Veo 3.1 Fast', note: '可沿用 Gemini Key（需 Veo 權限與付費額度）', cost: '約 US$0.40 / 4 秒' },
    { id: 'grok', name: 'Grok Imagine Video', note: '需使用 xAI API Key', cost: '約 US$0.28 / 4 秒' },
];

const AiVideoApp = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [job, setJob] = useState<AiVideoJob | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [rememberKey, setRememberKey] = useState(true);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingVideo, setIsFetchingVideo] = useState(false);
    const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

    const provider = job?.provider ?? 'gemini';
    const isWorking = job?.status === 'queued' || job?.status === 'running';

    useEffect(() => {
        let active = true;
        const restore = async () => {
            const requestedId = searchParams.get('job');
            const saved = requestedId ? await getAiVideoJob(requestedId) : await getLatestAiVideoJob();
            if (!active || !saved) return;
            setJob(saved);
            const keyState = loadAiVideoApiKey(saved.provider);
            setApiKey(keyState?.key ?? '');
            setRememberKey(keyState?.remember ?? true);
        };
        void restore();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!job?.sourceImage) {
            setSourcePreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(job.sourceImage);
        setSourcePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [job?.id, job?.sourceImage]);

    useEffect(() => {
        if (!job?.videoBlob) {
            setVideoPreviewUrl(job?.remoteVideoUrl ?? null);
            return;
        }
        const url = URL.createObjectURL(job.videoBlob);
        setVideoPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [job?.videoBlob, job?.remoteVideoUrl]);

    useEffect(() => {
        if (!job?.requestId || !isWorking || !apiKey.trim()) return;
        let cancelled = false;
        let timer = 0;

        const poll = async () => {
            try {
                const result = await getAiVideoTaskStatus(job.provider, apiKey.trim(), job.requestId!);
                if (cancelled) return;
                if (result.status === 'completed' && result.videoUrl) {
                    let videoBlob: Blob | undefined;
                    try {
                        videoBlob = await fetchAiVideoBlob(job.provider, apiKey.trim(), result.videoUrl);
                    } catch {
                        // Keep the provider URL available even when a browser blocks the immediate copy.
                    }
                    const completed: AiVideoJob = {
                        ...job,
                        status: 'completed',
                        remoteVideoUrl: result.videoUrl,
                        videoBlob,
                        error: undefined,
                        updatedAt: Date.now(),
                    };
                    await saveAiVideoJob(completed);
                    if (!cancelled) {
                        setJob(completed);
                        showToast(t('aiVideo.toast.completed'), 'success');
                    }
                    return;
                }
                if (result.status === 'failed') {
                    const failed: AiVideoJob = {
                        ...job,
                        status: 'failed',
                        error: result.error || t('aiVideo.errors.failed'),
                        updatedAt: Date.now(),
                    };
                    await saveAiVideoJob(failed);
                    if (!cancelled) setJob(failed);
                    return;
                }
                const running: AiVideoJob = {
                    ...job,
                    status: result.status,
                    updatedAt: Date.now(),
                };
                await saveAiVideoJob(running);
                if (!cancelled) {
                    setJob(running);
                    timer = window.setTimeout(poll, 6000);
                }
            } catch (error) {
                if (!cancelled) {
                    const message = error instanceof Error ? error.message : String(error);
                    showToast(t('aiVideo.errors.statusFailed', { reason: message }), 'error');
                    timer = window.setTimeout(poll, 10000);
                }
            }
        };

        timer = window.setTimeout(poll, 1500);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [job?.id, job?.requestId, job?.status, apiKey]);

    const persistJob = (next: AiVideoJob) => {
        setJob(next);
        void saveAiVideoJob(next);
    };

    const handleSourceBlob = async (blob: Blob, name: string) => {
        if (!blob.type.startsWith('image/')) {
            showToast(t('aiVideo.errors.imageOnly'), 'error');
            return;
        }
        const draft = await createAiVideoDraft({
            sourceImage: blob,
            sourceName: name,
            prompt: buildStickerVideoPrompt(),
            provider,
        });
        setJob(draft);
        setSearchParams({ job: draft.id });
    };

    const handleProviderChange = (nextProvider: AiVideoProvider) => {
        const keyState = loadAiVideoApiKey(nextProvider);
        setApiKey(keyState?.key ?? '');
        setRememberKey(keyState?.remember ?? true);
        if (!job) return;
        persistJob({
            ...job,
            provider: nextProvider,
            model: AI_VIDEO_MODELS[nextProvider],
            status: 'draft',
            requestId: undefined,
            videoBlob: undefined,
            remoteVideoUrl: undefined,
            error: undefined,
            updatedAt: Date.now(),
        });
    };

    const handleGenerate = async () => {
        if (!job || isSubmitting || isWorking) return;
        if (!isValidAiVideoApiKey(job.provider, apiKey)) {
            showToast(t('aiVideo.errors.invalidKey'), 'error');
            return;
        }
        if (!job.prompt.trim()) {
            showToast(t('aiVideo.errors.promptRequired'), 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            saveAiVideoApiKey(job.provider, apiKey.trim(), rememberKey);
            const imageDataUrl = await prepareAiVideoInput(job.sourceImage);
            const result = await createAiVideoTask({
                provider: job.provider,
                apiKey: apiKey.trim(),
                model: job.model,
                prompt: job.prompt,
                imageDataUrl,
                duration: 4,
                aspectRatio: '16:9',
                resolution: '720p',
            });
            const submitted: AiVideoJob = {
                ...job,
                requestId: result.requestId,
                status: result.status,
                videoBlob: undefined,
                remoteVideoUrl: undefined,
                error: undefined,
                updatedAt: Date.now(),
            };
            await saveAiVideoJob(submitted);
            setJob(submitted);
            showToast(t('aiVideo.toast.submitted'), 'info');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const failed = { ...job, status: 'failed' as const, error: message, updatedAt: Date.now() };
            await saveAiVideoJob(failed);
            setJob(failed);
            showToast(t('aiVideo.errors.generateFailed', { reason: message }), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const ensureVideoBlob = async () => {
        if (!job) throw new Error(t('aiVideo.errors.noVideo'));
        if (job.videoBlob) return job.videoBlob;
        if (!job.remoteVideoUrl) throw new Error(t('aiVideo.errors.noVideo'));
        setIsFetchingVideo(true);
        try {
            const blob = await fetchAiVideoBlob(job.provider, apiKey.trim(), job.remoteVideoUrl);
            const updated = { ...job, videoBlob: blob, updatedAt: Date.now() };
            await saveAiVideoJob(updated);
            setJob(updated);
            return blob;
        } finally {
            setIsFetchingVideo(false);
        }
    };

    const handleDownload = async () => {
        try {
            const blob = await ensureVideoBlob();
            saveAs(blob, `sticker-board-${job?.provider}-${Date.now()}.mp4`);
        } catch (error) {
            showToast(error instanceof Error ? error.message : String(error), 'error');
        }
    };

    const handleOpenCutter = async () => {
        try {
            await ensureVideoBlob();
            navigate(`/animated-sticker?videoJob=${job?.id}`);
        } catch (error) {
            showToast(error instanceof Error ? error.message : String(error), 'error');
        }
    };

    return (
        <div className="relative min-h-full overflow-hidden bg-background px-4 py-8 md:px-8 lg:px-10">
            <div className="pointer-events-none absolute -left-32 -top-44 h-[34rem] w-[34rem] rounded-full bg-primary-light/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 top-72 h-[36rem] w-[36rem] rounded-full bg-secondary/35 blur-3xl" />
            <div className="relative mx-auto max-w-[1480px]">
                <header className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary shadow-sm"><Sparkles size={15} /> {t('aiVideo.eyebrow')}</div>
                        <h2 className="max-w-4xl text-3xl font-black leading-tight tracking-[-0.035em] text-bronze-text md:text-5xl">{t('aiVideo.title')}</h2>
                        <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-bronze-light">{t('aiVideo.subtitle')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['4×2', '4 sec', '16:9', '720p'].map((label) => <span key={label} className="rounded-xl border border-cream-dark bg-cream px-3.5 py-2 text-sm font-black text-bronze-light">{label}</span>)}
                    </div>
                </header>

                <div className="grid gap-6 xl:grid-cols-[minmax(330px,0.8fr)_minmax(0,1.2fr)]">
                    <section className="rounded-[2rem] border border-cream-dark bg-cream p-5 shadow-sm md:p-6">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">01 · {t('aiVideo.source')}</p>
                        <h3 className="mt-1 text-2xl font-black text-bronze-text">{t('aiVideo.sourceTitle')}</h3>
                        <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-cream-dark bg-grid-pattern">
                            {sourcePreviewUrl ? <img src={sourcePreviewUrl} alt={t('aiVideo.sourceAlt')} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center p-6 text-center text-bronze-light"><div><ImageIcon size={34} className="mx-auto text-primary" /><p className="mt-3 text-base font-black">{t('aiVideo.emptySource')}</p></div></div>}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleSourceBlob(file, file.name); event.currentTarget.value = ''; }} />
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isWorking} className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-cream-light px-4 py-3.5 text-sm font-black text-primary hover:bg-white disabled:opacity-45"><Upload size={18} /> {t('aiVideo.upload')}</button>
                            <button type="button" onClick={() => setIsGalleryOpen(true)} disabled={isWorking} className="flex items-center justify-center gap-2 rounded-xl border border-cream-dark bg-white px-4 py-3.5 text-sm font-black text-bronze-text hover:text-primary disabled:opacity-45"><FolderHeart size={18} /> {t('aiVideo.gallery')}</button>
                        </div>
                        <p className="mt-3 text-sm font-medium leading-6 text-bronze-light">{t('aiVideo.sourceHint')}</p>
                    </section>

                    <section className="rounded-[2rem] border border-cream-dark bg-cream-light p-5 shadow-sm md:p-7">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">02 · API & MOTION DIRECTION</p>
                        <h3 className="mt-1 text-2xl font-black text-bronze-text">{t('aiVideo.directionTitle')}</h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {providerOptions.map((option) => <button key={option.id} type="button" onClick={() => handleProviderChange(option.id)} disabled={isWorking || isSubmitting} className={`rounded-2xl border p-4 text-left transition-all ${provider === option.id ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-cream-dark bg-cream text-bronze-text hover:border-primary/30 hover:bg-white'}`}><span className="block text-base font-black">{option.name}</span><span className={`mt-1 block text-sm font-medium ${provider === option.id ? 'text-white/80' : 'text-bronze-light'}`}>{option.note}</span><span className={`mt-3 block text-xs font-black ${provider === option.id ? 'text-white' : 'text-primary'}`}>{option.cost}</span></button>)}
                        </div>

                        <div className="mt-5 rounded-2xl border border-cream-dark bg-cream p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="ai-video-key" className="flex items-center gap-2 text-sm font-black text-bronze-text"><KeyRound size={17} /> {provider === 'gemini' ? 'Gemini API Key' : 'xAI API Key'}</label><a href={getAiVideoApiKeyUrl(provider)} target="_blank" rel="noreferrer" className="text-xs font-black text-primary hover:underline">{t('aiVideo.getKey')}</a></div>
                            <input id="ai-video-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} disabled={isWorking} autoComplete="off" placeholder={provider === 'gemini' ? 'AIza…' : 'xai-…'} className="mt-3 w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-base font-medium text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-bronze-light"><input type="checkbox" checked={rememberKey} onChange={(event) => setRememberKey(event.target.checked)} className="h-4 w-4 accent-primary" /> {t('aiVideo.rememberKey')}</label>
                        </div>

                        <label className="mt-5 block text-sm font-black text-bronze-text">{t('aiVideo.prompt')}<textarea value={job?.prompt ?? ''} onChange={(event) => job && persistJob({ ...job, prompt: event.target.value, status: 'draft', error: undefined, updatedAt: Date.now() })} disabled={!job || isWorking} rows={7} className="mt-2 w-full resize-y rounded-2xl border border-cream-dark bg-white px-4 py-3.5 text-base font-medium leading-7 text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-55" placeholder={t('aiVideo.promptPlaceholder')} /></label>
                        <button type="button" onClick={() => void handleGenerate()} disabled={!job || isWorking || isSubmitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">{isSubmitting || isWorking ? <LoaderCircle size={20} className="animate-spin" /> : <Sparkles size={19} />}{isSubmitting ? t('aiVideo.submitting') : isWorking ? t('aiVideo.generating') : t('aiVideo.generate')}</button>
                        <p className="mt-3 text-center text-sm font-medium leading-6 text-bronze-light">{t('aiVideo.leaveHint')}</p>
                    </section>
                </div>

                <section className="mt-6 rounded-[2rem] border border-cream-dark bg-cream p-5 shadow-sm md:p-7">
                    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">03 · {t('aiVideo.result')}</p><h3 className="mt-1 text-2xl font-black text-bronze-text">{t('aiVideo.resultTitle')}</h3></div>{job?.requestId && <span className="max-w-full truncate rounded-xl bg-cream-light px-3 py-2 text-xs font-bold text-bronze-light">ID · {job.requestId}</span>}</div>
                    {job?.status === 'completed' && videoPreviewUrl ? <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]"><div className="overflow-hidden rounded-3xl border-4 border-bronze-text bg-black shadow-xl"><video src={videoPreviewUrl} controls loop playsInline className="aspect-video w-full object-contain" /></div><div className="flex flex-col justify-center rounded-2xl border border-primary/20 bg-cream-light p-5"><div className="flex items-center gap-2 text-primary"><CheckCircle2 size={22} /><span className="text-lg font-black">{t('aiVideo.completed')}</span></div><p className="mt-3 text-sm font-medium leading-6 text-bronze-light">{t('aiVideo.completedHint')}</p><button type="button" onClick={() => void handleDownload()} disabled={isFetchingVideo} className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-cream-dark bg-white px-4 py-3.5 text-sm font-black text-bronze-text hover:text-primary disabled:opacity-45"><Download size={18} /> {t('aiVideo.download')}</button><button type="button" onClick={() => void handleOpenCutter()} disabled={isFetchingVideo} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-black text-white hover:bg-primary-hover disabled:opacity-45"><Film size={18} /> {t('aiVideo.openCutter')} <ArrowRight size={16} /></button></div></div> : isWorking ? <div className="mt-5 grid min-h-72 place-items-center rounded-3xl border border-dashed border-primary/30 bg-cream-light p-8 text-center"><div><LoaderCircle size={40} className="mx-auto animate-spin text-primary" /><p className="mt-4 text-lg font-black text-bronze-text">{t('aiVideo.generating')}</p><p className="mt-2 max-w-lg text-sm font-medium leading-6 text-bronze-light">{t('aiVideo.generatingHint')}</p></div></div> : job?.status === 'failed' ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5"><p className="text-base font-black text-red-700">{t('aiVideo.failed')}</p><p className="mt-2 break-words text-sm font-medium leading-6 text-red-600">{job.error}</p></div> : <div className="mt-5 grid min-h-64 place-items-center rounded-3xl border border-dashed border-cream-dark bg-cream-light p-8 text-center"><div><Play size={36} className="mx-auto text-primary" /><p className="mt-4 text-base font-black text-bronze-text">{t('aiVideo.emptyResult')}</p><p className="mt-2 text-sm font-medium leading-6 text-bronze-light">{t('aiVideo.emptyResultHint')}</p></div></div>}
                    {job?.status === 'completed' && <div className="mt-4 flex items-center gap-2 text-sm font-medium text-bronze-light"><Clock3 size={16} className="text-primary" /> {t('aiVideo.savedLocally')}</div>}
                </section>
            </div>
            {isGalleryOpen && <GalleryPicker onClose={() => setIsGalleryOpen(false)} onSelect={(blobs) => { const blob = blobs[0]; if (blob) void handleSourceBlob(blob, `gallery-sticker-${Date.now()}.png`); }} />}
        </div>
    );
};

export default AiVideoApp;
