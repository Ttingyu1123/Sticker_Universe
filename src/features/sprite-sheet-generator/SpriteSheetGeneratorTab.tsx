import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import {
    ArrowRight,
    BrainCircuit,
    Check,
    CloudCheck,
    Clipboard,
    Download,
    Film,
    Image as ImageIcon,
    KeyRound,
    LoaderCircle,
    PencilLine,
    RefreshCw,
    Sparkles,
    Upload,
    WandSparkles,
    X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProviderSwitcher } from '../../components/shared/ProviderSwitcher';
import { useToast } from '../../components/shared/ToastProvider';
import { deleteStickerFromDB, getAllStickersFromDB, saveStickerToDB } from '../../db';
import { generateGeminiImage, generateOpenAiImage } from '../image-generation-core';
import { isApiKeyError, isValidApiKey } from '../../shared/geminiApiKey';
import type { AiProvider } from '../../shared/geminiApiKey';
import { safeLoadFromLocalStorage, safeSaveToLocalStorage } from '../../shared/localStorage';
import { createAiVideoDraft } from '../ai-video/jobs';
import { dataUrlToBlob } from '../ai-video/image';
import { buildStickerVideoPrompt } from '../ai-video/prompt';
import type { SpriteSheetStyle, StickerConcept } from './types';
import {
    loadStickerBackgroundColor,
    saveStickerBackgroundColor,
} from './backgroundColor';
import { suggestStickerConcepts } from './concepts';
import { fileToDataUrl, normalizeSpriteSheet, prepareAnalysisImage } from './image';
import { buildSpriteSheetPrompt, SPRITE_FRAME_COUNT } from './prompt';
import {
    createSpriteSheetPlanGalleryItem,
    DEFAULT_STICKER_SERIES_NAME,
    parseSpriteSheetPlanGalleryItem,
    SPRITE_SHEET_DRAFT_ID,
    type SpriteSheetPlanDraft,
} from './planPersistence';
import {
    appendStickerBatch,
    createStickerSeriesArchive,
    findConceptConflicts,
    findMissingRequiredCaptions,
    findOverlongRequiredCaptions,
    findRequiredCaptionConflicts,
    getRequiredCaptionsForBatch,
    getSelectedArchiveConcepts,
    getSeriesConcepts,
    getSeriesConceptsExcludingBatch,
    isBatchInSeries,
    MAX_SERIES_BATCHES,
    MAX_SERIES_STICKERS,
    parseRequiredCaptions,
    parseStickerSeriesArchives,
    replaceStickerBatch,
    type StickerSeriesArchive,
    type StickerSeriesBatch,
} from './series';

const STYLE_OPTIONS: SpriteSheetStyle[] = ['reference', 'chibi', 'cel', 'clay', 'sketch'];
const SERIES_STORAGE_KEY = 'sprite-sheet-series-v1';
const SERIES_ARCHIVE_STORAGE_KEY = 'sprite-sheet-series-archives-v1';
const SERIES_PREFERENCES_STORAGE_KEY = 'sprite-sheet-series-preferences-v1';

interface StickerSeriesPreferences {
    seriesName: string;
    requiredCaptionsInput: string;
    excludedSeriesIds: string[];
}

const loadStickerSeries = (): StickerSeriesBatch[] => {
    if (typeof window === 'undefined') return [];
    const stored = safeLoadFromLocalStorage<StickerSeriesBatch[]>(SERIES_STORAGE_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.filter((batch) => (
        typeof batch?.signature === 'string'
        && Array.isArray(batch.concepts)
        && batch.concepts.length === SPRITE_FRAME_COUNT
    )).slice(0, MAX_SERIES_BATCHES);
};

const loadStickerSeriesArchives = (): StickerSeriesArchive[] => {
    if (typeof window === 'undefined') return [];
    return parseStickerSeriesArchives(
        safeLoadFromLocalStorage<unknown>(SERIES_ARCHIVE_STORAGE_KEY),
    );
};

const loadStickerSeriesPreferences = (
    archives: StickerSeriesArchive[],
): StickerSeriesPreferences => {
    if (typeof window === 'undefined') {
        return {
            seriesName: DEFAULT_STICKER_SERIES_NAME,
            requiredCaptionsInput: '',
            excludedSeriesIds: [],
        };
    }
    const stored = safeLoadFromLocalStorage<Partial<StickerSeriesPreferences>>(
        SERIES_PREFERENCES_STORAGE_KEY,
    );
    return {
        seriesName: typeof stored?.seriesName === 'string' && stored.seriesName.trim()
            ? stored.seriesName
            : DEFAULT_STICKER_SERIES_NAME,
        requiredCaptionsInput: typeof stored?.requiredCaptionsInput === 'string'
            ? stored.requiredCaptionsInput
            : '',
        excludedSeriesIds: Array.isArray(stored?.excludedSeriesIds)
            ? stored.excludedSeriesIds.filter((id): id is string => typeof id === 'string')
            : archives.map((archive) => archive.id),
    };
};

interface SpriteSheetGeneratorTabProps {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onNeedApiKey: (provider?: AiProvider) => void;
}

const SpriteSheetGeneratorTab = ({ provider, apiKeys, onProviderChange, onNeedApiKey }: SpriteSheetGeneratorTabProps) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [initialSeriesControls] = useState(() => {
        const archives = loadStickerSeriesArchives();
        return {
            archives,
            preferences: loadStickerSeriesPreferences(archives),
        };
    });
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterSummary, setCharacterSummary] = useState('');
    const [concepts, setConcepts] = useState<StickerConcept[]>([]);
    const [style, setStyle] = useState<SpriteSheetStyle>('reference');
    const [backgroundColor, setBackgroundColor] = useState(() => loadStickerBackgroundColor('#00FF00'));
    const [backgroundRecommendation, setBackgroundRecommendation] = useState<{
        color: string;
        reason: string;
    } | null>(null);
    const [includeText, setIncludeText] = useState(true);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [lastPrompt, setLastPrompt] = useState('');
    const [completedBatches, setCompletedBatches] = useState<StickerSeriesBatch[]>(loadStickerSeries);
    const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);
    const [archivedSeries, setArchivedSeries] = useState<StickerSeriesArchive[]>(
        initialSeriesControls.archives,
    );
    const [seriesName, setSeriesName] = useState(initialSeriesControls.preferences.seriesName);
    const [requiredCaptionsInput, setRequiredCaptionsInput] = useState(
        initialSeriesControls.preferences.requiredCaptionsInput,
    );
    const [excludedSeriesIds, setExcludedSeriesIds] = useState<string[]>(
        initialSeriesControls.preferences.excludedSeriesIds,
    );
    const [isDraftHydrated, setIsDraftHydrated] = useState(false);
    const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'restored'>('idle');

    const requestedPlanId = useMemo(
        () => new URLSearchParams(location.search).get('plan'),
        [location.search],
    );

    const hasCompletePlan = concepts.length === SPRITE_FRAME_COUNT && concepts.every((item) => item.theme.trim() && item.caption.trim() && item.visual.trim());
    const seriesConcepts = useMemo(() => getSeriesConcepts(completedBatches), [completedBatches]);
    const requiredCaptions = useMemo(
        () => parseRequiredCaptions(requiredCaptionsInput),
        [requiredCaptionsInput],
    );
    const selectedArchiveConcepts = useMemo(
        () => getSelectedArchiveConcepts(archivedSeries, excludedSeriesIds),
        [archivedSeries, excludedSeriesIds],
    );
    const batchRequiredCaptions = useMemo(
        () => getRequiredCaptionsForBatch(requiredCaptions, completedBatches, editingBatchIndex),
        [completedBatches, editingBatchIndex, requiredCaptions],
    );
    const completedStickerCount = seriesConcepts.length;
    const isSeriesComplete = completedStickerCount >= MAX_SERIES_STICKERS;
    const activeBatchNumber = editingBatchIndex === null
        ? Math.min(completedBatches.length + 1, MAX_SERIES_BATCHES)
        : editingBatchIndex + 1;

    const createCurrentDraft = (overrides: Partial<SpriteSheetPlanDraft> = {}): SpriteSheetPlanDraft | null => {
        const effectiveReferenceImage = overrides.referenceImage || referenceImage;
        if (!effectiveReferenceImage) return null;
        return {
            referenceImage: effectiveReferenceImage,
            characterDescription,
            characterSummary,
            concepts,
            style,
            backgroundColor,
            backgroundRecommendation,
            includeText,
            completedBatches,
            editingBatchIndex,
            seriesName,
            requiredCaptions,
            excludedSeriesIds,
            ...overrides,
        };
    };

    useEffect(() => {
        let cancelled = false;
        setIsDraftHydrated(false);

        const restorePlan = async () => {
            try {
                const galleryItems = await getAllStickersFromDB();
                const targetId = requestedPlanId || SPRITE_SHEET_DRAFT_ID;
                const item = galleryItems.find((candidate) => candidate.id === targetId);
                const restored = item ? parseSpriteSheetPlanGalleryItem(item) : null;

                if (restored && !cancelled) {
                    setReferenceImage(restored.referenceImage);
                    setCharacterDescription(restored.characterDescription);
                    setCharacterSummary(restored.characterSummary);
                    setConcepts(restored.concepts);
                    setStyle(restored.style);
                    setBackgroundColor(restored.backgroundColor);
                    setBackgroundRecommendation(restored.backgroundRecommendation);
                    setIncludeText(restored.includeText);
                    setCompletedBatches(restored.completedBatches);
                    setEditingBatchIndex(restored.editingBatchIndex);
                    setSeriesName(restored.seriesName);
                    setRequiredCaptionsInput(restored.requiredCaptions.join('\n'));
                    setExcludedSeriesIds(restored.excludedSeriesIds);
                    setResultImage(null);
                    setLastPrompt('');
                    saveStickerBackgroundColor(restored.backgroundColor);
                    safeSaveToLocalStorage(SERIES_STORAGE_KEY, restored.completedBatches);
                    setDraftStatus('restored');

                    if (requestedPlanId) {
                        await saveStickerToDB(createSpriteSheetPlanGalleryItem(restored, {
                            id: SPRITE_SHEET_DRAFT_ID,
                            timestamp: Date.now(),
                            title: t('spriteSheet.galleryDraftTitle', {
                                batch: restored.editingBatchIndex === null
                                    ? Math.min(restored.completedBatches.length + 1, MAX_SERIES_BATCHES)
                                    : restored.editingBatchIndex + 1,
                            }),
                        }));
                        navigate('/generator?tab=sprite-sheet', { replace: true });
                    }
                }
            } catch (error) {
                console.error('[SpriteSheetGenerator] Failed to restore plan draft:', error);
            } finally {
                if (!cancelled) setIsDraftHydrated(true);
            }
        };

        void restorePlan();
        return () => {
            cancelled = true;
        };
    }, [navigate, requestedPlanId, t]);

    useEffect(() => {
        safeSaveToLocalStorage(SERIES_PREFERENCES_STORAGE_KEY, {
            seriesName,
            requiredCaptionsInput,
            excludedSeriesIds,
        } satisfies StickerSeriesPreferences);
    }, [excludedSeriesIds, requiredCaptionsInput, seriesName]);

    useEffect(() => {
        if (!isDraftHydrated || !referenceImage || concepts.length !== SPRITE_FRAME_COUNT) return;
        setDraftStatus('saving');
        const timer = window.setTimeout(() => {
            const draft = createCurrentDraft();
            if (!draft) return;
            void saveStickerToDB(createSpriteSheetPlanGalleryItem(draft, {
                id: SPRITE_SHEET_DRAFT_ID,
                timestamp: Date.now(),
                title: t('spriteSheet.galleryDraftTitle', {
                    batch: activeBatchNumber,
                }),
            })).then(() => setDraftStatus('saved')).catch((error) => {
                console.error('[SpriteSheetGenerator] Failed to auto-save plan draft:', error);
                setDraftStatus('idle');
            });
        }, 400);

        return () => window.clearTimeout(timer);
    }, [activeBatchNumber, backgroundColor, backgroundRecommendation, characterDescription, characterSummary, completedBatches, concepts, excludedSeriesIds, includeText, isDraftHydrated, referenceImage, requiredCaptions, seriesName, style, t]);

    const prompt = useMemo(() => hasCompletePlan ? buildSpriteSheetPrompt({
        concepts,
        characterDescription: characterDescription || characterSummary,
        style,
        backgroundColor,
        includeText,
    }) : '', [backgroundColor, characterDescription, characterSummary, concepts, hasCompletePlan, includeText, style]);

    const ensureKey = () => {
        const key = apiKeys[provider]?.trim();
        if (!isValidApiKey(provider, key)) {
            onNeedApiKey(provider);
            showToast(t('spriteSheet.errors.needKey'), 'error');
            return null;
        }
        return key;
    };

    const handleSuggest = async (
        imageOverride?: string,
        batchIndexOverride?: number | null,
    ) => {
        const targetBatchIndex = batchIndexOverride === undefined
            ? editingBatchIndex
            : batchIndexOverride;
        const image = imageOverride || referenceImage;
        const activeKey = ensureKey();
        if (!activeKey || !image) {
            if (!image) showToast(t('spriteSheet.needReferenceForIdeas'), 'error');
            return;
        }
        if (isSeriesComplete && targetBatchIndex === null) {
            showToast(t('spriteSheet.seriesComplete'), 'error');
            return;
        }
        const currentSeriesPreviousConcepts = targetBatchIndex === null
            ? seriesConcepts
            : getSeriesConceptsExcludingBatch(completedBatches, targetBatchIndex);
        const previousConcepts = [...currentSeriesPreviousConcepts, ...selectedArchiveConcepts];
        const batchRequiredCaptions = getRequiredCaptionsForBatch(
            requiredCaptions,
            completedBatches,
            targetBatchIndex,
        );
        const overlongRequiredCaptions = findOverlongRequiredCaptions(batchRequiredCaptions);
        if (overlongRequiredCaptions.length > 0) {
            showToast(t('spriteSheet.requiredCaptionTooLong', {
                values: overlongRequiredCaptions.join('、'),
            }), 'error');
            return;
        }
        const requiredConflicts = findRequiredCaptionConflicts(
            batchRequiredCaptions,
            selectedArchiveConcepts,
        );
        if (requiredConflicts.length > 0) {
            showToast(t('spriteSheet.requiredCaptionConflict', {
                values: requiredConflicts.join('、'),
            }), 'error');
            return;
        }

        setIsSuggesting(true);
        setResultImage(null);
        try {
            const analysisImage = await prepareAnalysisImage(image);
            const plan = await suggestStickerConcepts({
                provider,
                apiKey: activeKey,
                referenceImage: analysisImage,
                characterNotes: characterDescription,
                previousConcepts,
                requiredCaptions: batchRequiredCaptions,
            });
            setCharacterSummary(plan.characterSummary);
            setConcepts(plan.concepts);
            setBackgroundColor(plan.recommendedBackgroundColor);
            setBackgroundRecommendation({
                color: plan.recommendedBackgroundColor,
                reason: plan.backgroundColorReason,
            });
            saveStickerBackgroundColor(plan.recommendedBackgroundColor);
            const plannedDraft = createCurrentDraft({
                referenceImage: image,
                characterSummary: plan.characterSummary,
                concepts: plan.concepts,
                backgroundColor: plan.recommendedBackgroundColor,
                backgroundRecommendation: {
                    color: plan.recommendedBackgroundColor,
                    reason: plan.backgroundColorReason,
                },
                editingBatchIndex: targetBatchIndex,
            });
            if (plannedDraft) {
                const timestamp = Date.now();
                const batch = targetBatchIndex === null
                    ? Math.min(completedBatches.length + 1, MAX_SERIES_BATCHES)
                    : targetBatchIndex + 1;
                try {
                    await Promise.all([
                        saveStickerToDB(createSpriteSheetPlanGalleryItem(plannedDraft, {
                            id: `sprite-sheet-plan-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
                            timestamp,
                            title: t('spriteSheet.galleryPlanTitle', { batch }),
                        })),
                        saveStickerToDB(createSpriteSheetPlanGalleryItem(plannedDraft, {
                            id: SPRITE_SHEET_DRAFT_ID,
                            timestamp,
                            title: t('spriteSheet.galleryDraftTitle', { batch }),
                        })),
                    ]);
                    setDraftStatus('saved');
                    showToast(t('spriteSheet.conceptsReadyAndSaved'), 'success');
                } catch (error) {
                    console.error('[SpriteSheetGenerator] Failed to save text plan:', error);
                    showToast(t('spriteSheet.galleryPlanSaveFailed'), 'error');
                }
            } else {
                showToast(t('spriteSheet.conceptsReadyToast'), 'success');
            }
        } catch (error) {
            if (isApiKeyError(error)) onNeedApiKey(provider);
            const reason = error instanceof Error ? error.message : String(error);
            showToast(t('spriteSheet.suggestFailed', { reason }), 'error');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleReferenceFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast(t('spriteSheet.errors.imageOnly'), 'error');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            showToast(t('spriteSheet.errors.imageTooLarge'), 'error');
            return;
        }
        try {
            const dataUrl = await fileToDataUrl(file);
            void deleteStickerFromDB(SPRITE_SHEET_DRAFT_ID);
            setReferenceImage(dataUrl);
            setCharacterSummary('');
            setBackgroundRecommendation(null);
            setConcepts([]);
            setResultImage(null);
            setEditingBatchIndex(null);
            void handleSuggest(dataUrl, null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : String(error), 'error');
        }
    };

    const updateConcept = (index: number, key: keyof StickerConcept, value: string) => {
        setConcepts((current) => current.map((concept, conceptIndex) => (
            conceptIndex === index ? { ...concept, [key]: value } : concept
        )));
        setResultImage(null);
    };

    const updateBackgroundColor = (color: string) => {
        setBackgroundColor(color);
        saveStickerBackgroundColor(color);
        setResultImage(null);
    };

    const handleSelectBatch = (batchIndex: number) => {
        const batch = completedBatches[batchIndex];
        if (!batch || isSuggesting || isGenerating) return;
        setEditingBatchIndex(batchIndex);
        setConcepts(batch.concepts.map((concept) => ({ ...concept })));
        setResultImage(null);
        setLastPrompt('');
        setDraftStatus('restored');
    };

    const handleExitBatchEdit = () => {
        const clearedDraft = createCurrentDraft({ concepts: [], editingBatchIndex: null });
        setEditingBatchIndex(null);
        setConcepts([]);
        setResultImage(null);
        setLastPrompt('');
        setDraftStatus('idle');
        if (clearedDraft) {
            void saveStickerToDB(createSpriteSheetPlanGalleryItem(clearedDraft, {
                id: SPRITE_SHEET_DRAFT_ID,
                timestamp: Date.now(),
                title: t('spriteSheet.galleryDraftTitle', {
                    batch: Math.min(completedBatches.length + 1, MAX_SERIES_BATCHES),
                }),
            }));
        }
    };

    const handleGenerate = async () => {
        const activeKey = ensureKey();
        if (!activeKey) return;
        if (!referenceImage) {
            showToast(t('spriteSheet.needReferenceForIdeas'), 'error');
            return;
        }
        if (!hasCompletePlan || !prompt) {
            showToast(t('spriteSheet.needConcepts'), 'error');
            return;
        }

        const isEditingBatch = editingBatchIndex !== null
            && Boolean(completedBatches[editingBatchIndex]);
        const batchAlreadyRecorded = isBatchInSeries(completedBatches, concepts);
        const missingRequiredCaptions = findMissingRequiredCaptions(batchRequiredCaptions, concepts);
        if (missingRequiredCaptions.length > 0) {
            showToast(t('spriteSheet.missingRequiredCaptions', {
                values: missingRequiredCaptions.join('、'),
            }), 'error');
            return;
        }
        const currentSeriesConceptsToCompare = isEditingBatch
            ? getSeriesConceptsExcludingBatch(completedBatches, editingBatchIndex)
            : seriesConcepts;
        const conceptsToCompare = [
            ...currentSeriesConceptsToCompare,
            ...selectedArchiveConcepts,
        ];
        if (isEditingBatch) {
            const conflicts = findConceptConflicts(concepts, conceptsToCompare);
            if (conflicts.length > 0) {
                showToast(t('spriteSheet.seriesConflict', {
                    values: conflicts.map((conflict) => conflict.value).join('、'),
                }), 'error');
                return;
            }
        } else if (!batchAlreadyRecorded) {
            if (isSeriesComplete) {
                showToast(t('spriteSheet.seriesComplete'), 'error');
                return;
            }
            const conflicts = findConceptConflicts(concepts, conceptsToCompare);
            if (conflicts.length > 0) {
                showToast(t('spriteSheet.seriesConflict', {
                    values: conflicts.map((conflict) => conflict.value).join('、'),
                }), 'error');
                return;
            }
        }

        setIsGenerating(true);
        setLastPrompt(prompt);
        try {
            const generated = provider === 'gemini'
                ? await generateGeminiImage(activeKey, prompt, referenceImage, '16:9', 'gemini-3-pro-image-preview', '2K')
                : await generateOpenAiImage(activeKey, prompt, referenceImage, '16:9', 'gpt-image-2', 'medium');
            const normalized = await normalizeSpriteSheet(generated);
            setResultImage(normalized);
            if (isEditingBatch && editingBatchIndex !== null) {
                setCompletedBatches((current) => {
                    const updated = replaceStickerBatch(current, editingBatchIndex, concepts);
                    safeSaveToLocalStorage(SERIES_STORAGE_KEY, updated);
                    return updated;
                });
            } else if (!batchAlreadyRecorded) {
                setCompletedBatches((current) => {
                    const updated = appendStickerBatch(current, concepts);
                    safeSaveToLocalStorage(SERIES_STORAGE_KEY, updated);
                    return updated;
                });
            }
            saveStickerToDB({
                id: `sprite-sheet-${Date.now()}`,
                imageUrl: normalized,
                phrase: isEditingBatch
                    ? t('spriteSheet.galleryBatchVersion', { batch: activeBatchNumber })
                    : t('spriteSheet.galleryName'),
                description: prompt,
                timestamp: Date.now(),
            }).catch((error) => console.error('[SpriteSheetGenerator] Failed to save result to Gallery:', error));
            showToast(
                isEditingBatch
                    ? t('spriteSheet.toast.batchReplaced', { batch: activeBatchNumber })
                    : t('spriteSheet.toast.generated'),
                'success',
            );
        } catch (error) {
            const invalidKey = isApiKeyError(error);
            const message = invalidKey ? t('spriteSheet.errors.invalidSavedKey') : error instanceof Error ? error.message : String(error);
            if (invalidKey) onNeedApiKey(provider);
            showToast(t('spriteSheet.errors.generateFailed', { reason: message }), 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyText = async (value: string, message: string) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast(message, 'success');
        } catch {
            showToast(t('common.toast.copyFailed'), 'error');
        }
    };

    const handleOpenAiVideo = async () => {
        if (!resultImage) return;
        try {
            const job = await createAiVideoDraft({
                sourceImage: dataUrlToBlob(resultImage),
                sourceName: `sticker-collection-4x2-${Date.now()}.png`,
                prompt: buildStickerVideoPrompt(concepts),
            });
            navigate(`/ai-video?job=${job.id}`);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            showToast(t('spriteSheet.aiVideoHandoffFailed', { reason }), 'error');
        }
    };

    const clearReference = () => {
        void deleteStickerFromDB(SPRITE_SHEET_DRAFT_ID);
        setReferenceImage(null);
        setCharacterSummary('');
        setBackgroundRecommendation(null);
        setConcepts([]);
        setEditingBatchIndex(null);
        setResultImage(null);
        setDraftStatus('idle');
    };

    const resetSeries = () => {
        if (!window.confirm(t('spriteSheet.resetSeriesConfirm'))) return;
        const archive = createStickerSeriesArchive(seriesName, completedBatches);
        if (archive) {
            setArchivedSeries((current) => {
                const updated = [archive, ...current.filter((item) => item.id !== archive.id)];
                safeSaveToLocalStorage(SERIES_ARCHIVE_STORAGE_KEY, updated);
                return updated;
            });
            setExcludedSeriesIds((current) => (
                current.includes(archive.id) ? current : [...current, archive.id]
            ));
        }
        setCompletedBatches([]);
        setEditingBatchIndex(null);
        safeSaveToLocalStorage(SERIES_STORAGE_KEY, []);
        setSeriesName(t('spriteSheet.nextSeriesDefaultName', {
            number: archivedSeries.length + 2,
        }));
        setRequiredCaptionsInput('');
        setConcepts([]);
        setResultImage(null);
        setLastPrompt('');
        setDraftStatus('idle');
        void deleteStickerFromDB(SPRITE_SHEET_DRAFT_ID);
        showToast(t('spriteSheet.seriesArchivedToast'), 'success');
    };

    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-background p-4 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -left-32 -top-48 h-[34rem] w-[34rem] rounded-full bg-primary-light/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 top-44 h-[36rem] w-[36rem] rounded-full bg-secondary/35 blur-3xl" />

            <div className="relative">
                <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary shadow-sm"><BrainCircuit size={15} /> {t('spriteSheet.collectionEyebrow')}</div>
                        <h2 className="max-w-4xl text-3xl font-black leading-tight tracking-[-0.035em] text-bronze-text md:text-4xl">{t('spriteSheet.collectionTitle')}</h2>
                        <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-bronze-light">{t('spriteSheet.collectionSubtitle')}</p>
                    </div>
                    <Link to="/animated-sticker" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cream-dark bg-cream px-5 py-3 text-sm font-black text-bronze-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"><Film size={17} /> {t('spriteSheet.openVideoCutter')} <ArrowRight size={15} /></Link>
                </motion.header>

                <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.35fr)]">
                    <section className="rounded-[2rem] border border-cream-dark bg-cream p-5 shadow-sm md:p-6">
                        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">01 · {t('spriteSheet.character')}</p><h3 className="mt-1 text-2xl font-black text-bronze-text">{t('spriteSheet.characterTitle')}</h3></div>{referenceImage && <button type="button" onClick={clearReference} className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100" aria-label={t('spriteSheet.removeReference')}><X size={17} /></button>}</div>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleReferenceFile(file); event.currentTarget.value = ''; }} />
                        {referenceImage ? <div className="relative mt-5 overflow-hidden rounded-2xl border border-cream-dark bg-grid-pattern"><img src={referenceImage} alt={t('spriteSheet.referenceAlt')} className="h-60 w-full object-contain" />{isSuggesting && <div className="absolute inset-0 grid place-items-center bg-bronze-text/55 text-white backdrop-blur-sm"><div className="text-center"><LoaderCircle size={28} className="mx-auto animate-spin" /><p className="mt-2 text-sm font-black">{t('spriteSheet.suggesting')}</p></div></div>}</div> : <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-dark bg-cream-light px-4 py-12 text-bronze-light transition-all hover:border-primary/40 hover:bg-white hover:text-primary"><Upload size={28} /><span className="text-sm font-black">{t('spriteSheet.uploadAndPlan')}</span><span className="text-xs font-medium">PNG · JPG · WebP</span></button>}
                        <label className="mt-4 block text-xs font-black uppercase tracking-wider text-bronze-light">{t('spriteSheet.characterDescription')}<textarea value={characterDescription} onChange={(event) => setCharacterDescription(event.target.value)} rows={3} placeholder={t('spriteSheet.characterPlaceholder')} className="mt-2 w-full resize-none rounded-2xl border border-cream-dark bg-white px-4 py-3.5 text-base font-medium normal-case leading-6 tracking-normal text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
                        {characterSummary && <div className="mt-3 rounded-xl border border-primary/15 bg-white p-3.5 text-sm font-medium leading-6 text-bronze-light"><span className="font-black text-primary">AI CHARACTER READ · </span>{characterSummary}</div>}
                    </section>

                    <section className="rounded-[2rem] border border-cream-dark bg-cream-light p-5 shadow-sm md:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">02 · API & ART DIRECTION</p><h3 className="mt-1 text-2xl font-black text-bronze-text">{t('spriteSheet.planSettingsTitle')}</h3></div><button type="button" onClick={() => onNeedApiKey(provider)} className="flex items-center gap-2 rounded-xl border border-cream-dark bg-cream px-3.5 py-2.5 text-xs font-black text-bronze-text hover:border-primary/40 hover:bg-white hover:text-primary"><KeyRound size={16} /> {t('spriteSheet.changeKey')}</button></div>
                        <div className="mt-5 [&_button]:py-3 [&_button]:text-sm"><ProviderSwitcher value={provider} onChange={onProviderChange} disabled={isSuggesting || isGenerating} /></div>
                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-cream-dark bg-cream p-4">
                                <label className="block text-sm font-black text-bronze-text">
                                    {t('spriteSheet.seriesName')}
                                    <input
                                        value={seriesName}
                                        maxLength={60}
                                        disabled={isSuggesting || isGenerating}
                                        onChange={(event) => setSeriesName(event.target.value)}
                                        placeholder={t('spriteSheet.seriesNamePlaceholder')}
                                        className="mt-2 w-full rounded-xl border border-cream-dark bg-white px-3.5 py-3 text-base font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                </label>
                                <label className="mt-4 block text-sm font-black text-bronze-text">
                                    {t('spriteSheet.requiredCaptions')}
                                    <textarea
                                        value={requiredCaptionsInput}
                                        rows={4}
                                        disabled={isSuggesting || isGenerating}
                                        onChange={(event) => {
                                            setRequiredCaptionsInput(event.target.value);
                                            setResultImage(null);
                                        }}
                                        placeholder={t('spriteSheet.requiredCaptionsPlaceholder')}
                                        className="mt-2 w-full resize-y rounded-xl border border-cream-dark bg-white px-3.5 py-3 text-base font-medium leading-6 text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                </label>
                                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-bronze-light">
                                    <span>{t('spriteSheet.requiredCaptionsCount', {
                                        count: requiredCaptions.length,
                                        total: MAX_SERIES_STICKERS,
                                    })}</span>
                                    <span>{t('spriteSheet.nextBatchRequiredCount', {
                                        count: batchRequiredCaptions.length,
                                    })}</span>
                                </div>
                                {requiredCaptions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
                                    {requiredCaptions.map((caption) => <span key={caption} className="rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-bold text-primary">{caption}</span>)}
                                </div>}
                            </div>
                            <div className="rounded-2xl border border-cream-dark bg-cream p-4">
                                <p className="text-sm font-black text-bronze-text">{t('spriteSheet.previousSeries')}</p>
                                <p className="mt-1 text-xs font-medium leading-5 text-bronze-light">{t('spriteSheet.previousSeriesHint')}</p>
                                {archivedSeries.length > 0 ? <div className="mt-3 space-y-2">
                                    {archivedSeries.map((archive) => <label key={archive.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-cream-dark bg-white px-3.5 py-3">
                                        <span>
                                            <span className="block text-sm font-black text-bronze-text">{archive.name}</span>
                                            <span className="mt-1 block text-xs font-bold text-bronze-light">{t('spriteSheet.archivedSeriesCount', { count: archive.concepts.length })}</span>
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={excludedSeriesIds.includes(archive.id)}
                                            disabled={isSuggesting || isGenerating}
                                            onChange={(event) => setExcludedSeriesIds((current) => (
                                                event.target.checked
                                                    ? [...new Set([...current, archive.id])]
                                                    : current.filter((id) => id !== archive.id)
                                            ))}
                                            className="h-5 w-5 accent-primary"
                                        />
                                    </label>)}
                                </div> : <p className="mt-4 rounded-xl border border-dashed border-cream-dark bg-white/70 p-3 text-sm font-medium leading-6 text-bronze-light">{t('spriteSheet.noPreviousSeries')}</p>}
                            </div>
                        </div>
                        <div className="mt-6"><p className="mb-2 text-sm font-black text-bronze-text">{t('spriteSheet.styleLabel')}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{STYLE_OPTIONS.map((option) => <button key={option} type="button" onClick={() => setStyle(option)} className={`rounded-xl border px-3 py-3 text-sm font-black transition-all ${style === option ? 'border-primary bg-primary text-white shadow-sm' : 'border-cream-dark bg-cream text-bronze-light hover:border-primary/30 hover:bg-white hover:text-primary'}`}>{t(`spriteSheet.styles.${option}`)}</button>)}</div></div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <label className="flex items-center justify-between gap-4 rounded-2xl border border-cream-dark bg-cream p-4"><span><span className="block text-sm font-black text-bronze-text">{t('spriteSheet.background')}</span><span className="mt-1 block text-xs text-bronze-light">{backgroundColor.toUpperCase()}</span></span><input type="color" value={backgroundColor} onChange={(event) => updateBackgroundColor(event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border-0 bg-transparent" /></label>
                            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-cream-dark bg-cream p-4"><span><span className="block text-sm font-black text-bronze-text">{t('spriteSheet.includeText')}</span><span className="mt-1 block text-xs leading-5 text-bronze-light">{t('spriteSheet.includeTextHint')}</span></span><input type="checkbox" checked={includeText} onChange={(event) => setIncludeText(event.target.checked)} className="h-5 w-5 accent-primary" /></label>
                        </div>
                        {backgroundRecommendation && <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cream-dark shadow-sm" style={{ backgroundColor: backgroundRecommendation.color }}><Sparkles size={16} className="text-white drop-shadow" /></span><div><p className="text-sm font-black text-primary">{t('spriteSheet.backgroundAiRecommended')} · {backgroundRecommendation.color}</p><p className="mt-1 text-xs font-medium leading-5 text-bronze-light">{backgroundRecommendation.reason}</p></div></div>{backgroundColor.toUpperCase() !== backgroundRecommendation.color && <button type="button" onClick={() => updateBackgroundColor(backgroundRecommendation.color)} className="shrink-0 rounded-xl border border-primary/25 bg-cream px-3.5 py-2.5 text-xs font-black text-primary hover:bg-white">{t('spriteSheet.backgroundApplySuggestion')}</button>}</div>}
                        <button type="button" onClick={() => void handleSuggest()} disabled={!referenceImage || isSuggesting || isGenerating || (isSeriesComplete && editingBatchIndex === null)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-cream px-5 py-4 text-base font-black text-primary transition-all hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">{isSuggesting ? <LoaderCircle size={20} className="animate-spin" /> : <WandSparkles size={19} />}{isSuggesting ? t('spriteSheet.suggesting') : editingBatchIndex !== null ? t('spriteSheet.replanBatch', { batch: editingBatchIndex + 1 }) : isSeriesComplete ? t('spriteSheet.seriesCompleteShort') : concepts.length ? t('spriteSheet.resuggestButton') : t('spriteSheet.suggestButton')}</button>
                    </section>
                </div>

                <section className="mt-6 rounded-[2rem] border border-cream-dark bg-cream p-5 shadow-sm md:p-7">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">03 · STICKER STORYBOARD</p><h3 className="mt-1 text-2xl font-black text-bronze-text">{t('spriteSheet.plannerTitle')}</h3><p className="mt-2 text-sm leading-6 text-bronze-light">{t('spriteSheet.plannerHint')}</p></div><div className="flex flex-wrap items-center gap-2">{concepts.length === SPRITE_FRAME_COUNT && draftStatus !== 'idle' && <div className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3.5 py-2 text-xs font-black text-primary"><CloudCheck size={15} />{draftStatus === 'saving' ? t('spriteSheet.draftSaving') : draftStatus === 'restored' ? t('spriteSheet.draftRestored') : t('spriteSheet.draftSaved')}</div>}<div className={`rounded-full px-3.5 py-2 text-xs font-black ${hasCompletePlan ? 'bg-primary/10 text-primary' : 'bg-cream-light text-bronze-light'}`}>{concepts.length} / {SPRITE_FRAME_COUNT} {t('spriteSheet.planned')}</div></div></div>
                    <div className="mb-5 overflow-hidden rounded-2xl border border-cream-dark bg-cream-light">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-dark/60 px-4 py-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t('spriteSheet.seriesTitle')}</p>
                                <p className="mt-1 text-sm font-bold text-bronze-text">{t('spriteSheet.seriesProgress', { count: completedStickerCount, total: MAX_SERIES_STICKERS })}</p>
                            </div>
                            {completedBatches.length > 0 && <button type="button" onClick={resetSeries} className="rounded-xl border border-cream-dark bg-white px-3.5 py-2.5 text-xs font-black text-bronze-light transition-colors hover:border-primary/40 hover:text-primary">{t('spriteSheet.startNewSeries')}</button>}
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: MAX_SERIES_BATCHES }, (_, index) => {
                                    const isDone = index < completedBatches.length;
                                    const isCurrent = index === completedBatches.length && !isSeriesComplete;
                                    const isSelected = editingBatchIndex === index;
                                    return <button
                                        key={index}
                                        type="button"
                                        disabled={!isDone || isSuggesting || isGenerating}
                                        aria-pressed={isSelected}
                                        onClick={() => handleSelectBatch(index)}
                                        className={`rounded-xl border px-3.5 py-3 text-left transition-all disabled:cursor-default ${isSelected ? 'border-primary bg-white text-primary shadow-md ring-2 ring-primary/15' : isDone ? 'border-primary bg-primary text-white hover:-translate-y-0.5 hover:bg-primary-hover' : isCurrent ? 'border-primary/30 bg-cream text-primary' : 'border-cream-dark bg-cream text-bronze-light'}`}
                                    ><p className="text-xs font-black uppercase tracking-wider">{t('spriteSheet.seriesBatch', { number: index + 1 })}</p><p className="mt-1 text-xs font-bold leading-5">{isSelected ? t('spriteSheet.seriesBatchEditing') : isDone ? t('spriteSheet.seriesBatchDone') : isCurrent ? t('spriteSheet.seriesBatchCurrent') : t('spriteSheet.seriesBatchWaiting')}</p></button>;
                                })}
                            </div>
                            {editingBatchIndex !== null && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-secondary/35 p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-black text-bronze-text">{t('spriteSheet.editingBatchTitle', { batch: editingBatchIndex + 1 })}</p><p className="mt-1 text-xs font-medium leading-5 text-bronze-light">{t('spriteSheet.editingBatchHint')}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={handleGenerate} disabled={!hasCompletePlan || isGenerating || isSuggesting} className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-black text-white hover:bg-primary-hover disabled:opacity-45"><RefreshCw size={15} /> {t('spriteSheet.regenerateBatchImage', { batch: editingBatchIndex + 1 })}</button><button type="button" onClick={() => void handleSuggest()} disabled={!referenceImage || isGenerating || isSuggesting} className="flex items-center gap-2 rounded-xl border border-primary/25 bg-white px-3.5 py-2.5 text-xs font-black text-primary hover:bg-cream disabled:opacity-45"><WandSparkles size={15} /> {t('spriteSheet.replanBatch', { batch: editingBatchIndex + 1 })}</button><button type="button" onClick={handleExitBatchEdit} disabled={isGenerating || isSuggesting} className="rounded-xl border border-cream-dark bg-cream px-3.5 py-2.5 text-xs font-black text-bronze-light hover:bg-white hover:text-primary disabled:opacity-45">{t('spriteSheet.exitBatchEdit')}</button></div></div>}
                            {seriesConcepts.length > 0 ? <div className="mt-4"><p className="mb-2 text-xs font-black uppercase tracking-wider text-bronze-light">{t('spriteSheet.usedCaptions')}</p><div className="flex flex-wrap gap-2">{seriesConcepts.map((concept, index) => <span key={`${concept.caption}-${index}`} className="rounded-full border border-cream-dark bg-white px-3 py-1.5 text-xs font-bold text-bronze-text">{concept.caption}</span>)}</div></div> : <p className="mt-4 text-sm leading-6 text-bronze-light">{t('spriteSheet.seriesHint')}</p>}
                        </div>
                    </div>
                    {concepts.length === SPRITE_FRAME_COUNT ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{concepts.map((concept, index) => <motion.article key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="group relative overflow-hidden rounded-2xl border border-cream-dark bg-cream-light p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="mb-3 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-black text-white">{String(index + 1).padStart(2, '0')}</span><PencilLine size={15} className="text-primary opacity-50 transition-opacity group-hover:opacity-100" /></div><input value={concept.theme} onChange={(event) => updateConcept(index, 'theme', event.target.value)} aria-label={`${index + 1} ${t('spriteSheet.conceptTheme')}`} className="w-full border-0 bg-transparent text-xs font-black uppercase tracking-wider text-primary outline-none" /><input value={concept.caption} onChange={(event) => updateConcept(index, 'caption', event.target.value)} maxLength={12} aria-label={`${index + 1} ${t('spriteSheet.conceptCaption')}`} className="mt-2 w-full border-b border-cream-dark bg-transparent pb-2 text-xl font-black text-bronze-text outline-none focus:border-primary" /><textarea value={concept.visual} onChange={(event) => updateConcept(index, 'visual', event.target.value)} rows={4} aria-label={`${index + 1} ${t('spriteSheet.conceptVisual')}`} className="mt-3 w-full resize-none bg-transparent text-sm font-medium leading-6 text-bronze-light outline-none" /></motion.article>)}</div> : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-cream-dark bg-cream-light p-8 text-center"><div><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><BrainCircuit size={27} /></div><p className="mt-4 text-base font-black text-bronze-text">{t('spriteSheet.emptyPlanTitle')}</p><p className="mt-2 max-w-md text-sm leading-6 text-bronze-light">{t('spriteSheet.emptyPlanHint')}</p></div></div>}
                    <div className="mt-6 rounded-2xl border border-cream-dark bg-secondary/25 p-4"><div className="relative aspect-video overflow-hidden rounded-xl bg-cream-dark/50"><div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-px overflow-hidden rounded-md bg-primary/20">{Array.from({ length: SPRITE_FRAME_COUNT }, (_, index) => <div key={index} className="grid place-items-center bg-white/90 px-1 text-center text-xs font-black text-primary">{concepts[index]?.caption || String(index + 1).padStart(2, '0')}</div>)}</div></div><div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold text-bronze-light"><span className="flex items-center gap-1"><Check size={13} /> 1280 × 720</span><span className="flex items-center gap-1"><Check size={13} /> 4 × 2</span><span className="flex items-center gap-1"><Check size={13} /> 8 {t('spriteSheet.distinctStickers')}</span></div></div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => prompt && void copyText(prompt, t('spriteSheet.toast.promptCopied'))} disabled={!hasCompletePlan} className="flex items-center justify-center gap-2 rounded-2xl border border-cream-dark bg-white px-5 py-4 text-sm font-black text-bronze-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"><Clipboard size={17} /> {t('spriteSheet.copyPrompt')}</button><button type="button" onClick={handleGenerate} disabled={!hasCompletePlan || isGenerating || isSuggesting} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">{isGenerating ? <LoaderCircle size={20} className="animate-spin" /> : <Sparkles size={19} />}{isGenerating ? t('spriteSheet.generatingCollection') : editingBatchIndex !== null ? t('spriteSheet.regenerateBatchImage', { batch: editingBatchIndex + 1 }) : t('spriteSheet.generateCollection', { provider: provider === 'gemini' ? 'Gemini' : 'OpenAI' })}</button></div>
                </section>

                <section className="mt-6 rounded-[2rem] border border-cream-dark bg-cream-light p-5 shadow-sm md:p-7">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">04 · {t('spriteSheet.result')}</p><h3 className="mt-1 text-2xl font-black text-bronze-text">{t('spriteSheet.collectionResultTitle')}</h3><p className="mt-2 text-sm leading-6 text-bronze-light">{t('spriteSheet.resultHint')}</p></div>{resultImage && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => saveAs(resultImage, `sticker-collection-4x2-${Date.now()}.png`)} className="flex items-center gap-2 rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm font-black text-bronze-text hover:bg-white hover:text-primary"><Download size={17} /> {t('spriteSheet.downloadPng')}</button><button type="button" onClick={() => void copyText(t('spriteSheet.collectionVideoPrompt', { background: backgroundColor.toUpperCase() }), t('spriteSheet.toast.videoPromptCopied'))} className="flex items-center gap-2 rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm font-black text-bronze-text hover:bg-white hover:text-primary"><Film size={17} /> {t('spriteSheet.copyVideoPrompt')}</button><button type="button" onClick={() => void handleOpenAiVideo()} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 hover:bg-primary-hover"><Sparkles size={17} /> {t('spriteSheet.animateWithAi')} <ArrowRight size={15} /></button></div>}</div>
                    {resultImage ? <div><div className="relative overflow-hidden rounded-3xl border border-cream-dark bg-bronze-text p-2 shadow-xl"><div className="relative overflow-hidden rounded-2xl"><img src={resultImage} alt={t('spriteSheet.resultAlt')} className="block w-full" /><div className="pointer-events-none absolute inset-0 grid grid-cols-4 grid-rows-2 overflow-hidden border border-white/55">{Array.from({ length: SPRITE_FRAME_COUNT }, (_, index) => <div key={index} className="relative border-b border-r border-dashed border-white/45"><span className="absolute left-2 top-2 rounded-md bg-bronze-text/75 px-2 py-1 text-xs font-black text-white">{String(index + 1).padStart(2, '0')}</span></div>)}</div></div></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-cream-dark bg-cream p-4"><p className="text-xs font-black uppercase tracking-wider text-primary">1</p><p className="mt-1 text-sm font-black text-bronze-text">{t('spriteSheet.nextDownload')}</p></div><div className="rounded-2xl border border-cream-dark bg-cream p-4"><p className="text-xs font-black uppercase tracking-wider text-primary">2</p><p className="mt-1 text-sm font-black text-bronze-text">{t('spriteSheet.nextAnimate')}</p></div><Link to="/animated-sticker" className="group rounded-2xl bg-primary p-4 text-white transition-colors hover:bg-primary-hover"><p className="text-xs font-black uppercase tracking-wider text-white/70">3</p><p className="mt-1 flex items-center justify-between text-sm font-black">{t('spriteSheet.nextCut')} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></p></Link></div></div> : <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-cream-dark bg-cream p-8 text-center"><div><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><ImageIcon size={27} /></div><p className="mt-4 text-base font-black text-bronze-text">{t('spriteSheet.emptyCollectionResultTitle')}</p><p className="mt-2 max-w-md text-sm leading-6 text-bronze-light">{t('spriteSheet.emptyCollectionResultHint')}</p></div></div>}
                </section>
                {lastPrompt && <div className="mt-4 flex justify-center"><button type="button" onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 text-sm font-black text-bronze-light hover:text-primary disabled:opacity-50"><RefreshCw size={15} /> {t('spriteSheet.regenerate')}</button></div>}
            </div>
        </div>
    );
};

export default SpriteSheetGeneratorTab;
