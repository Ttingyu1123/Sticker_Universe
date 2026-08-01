import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/shared/ToastProvider';
import { deleteStickerFromDB, getAllStickersFromDB, saveStickerToDB } from '../../db';
import type { AiProvider } from '../../shared/geminiApiKey';
import { isApiKeyError, isValidApiKey } from '../../shared/geminiApiKey';
import { safeLoadFromLocalStorage, safeSaveToLocalStorage } from '../../shared/localStorage';
import { createAiVideoDraft } from '../ai-video/jobs';
import { dataUrlToBlob } from '../ai-video/image';
import { buildStickerVideoPrompt } from '../ai-video/prompt';
import { generateGeminiImage, generateOpenAiImage } from '../image-generation-core';
import { loadStickerBackgroundColor, saveStickerBackgroundColor } from './backgroundColor';
import { suggestStickerConcepts } from './concepts';
import { fileToDataUrl, normalizeSpriteSheet, prepareAnalysisImage } from './image';
import {
    createSpriteSheetPlanGalleryItem,
    parseSpriteSheetPlanGalleryItem,
    SPRITE_SHEET_DRAFT_ID,
    type SpriteSheetPlanDraft,
} from './planPersistence';
import { buildSpriteSheetPrompt, SPRITE_FRAME_COUNT } from './prompt';
import {
    appendStickerBatch,
    appendStickerSeriesArchive,
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
import type { SpriteSheetStyle, StickerConcept } from './types';

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
    fallbackSeriesName: string,
): StickerSeriesPreferences => {
    if (typeof window === 'undefined') {
        return {
            seriesName: fallbackSeriesName,
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
            : fallbackSeriesName,
        requiredCaptionsInput: typeof stored?.requiredCaptionsInput === 'string'
            ? stored.requiredCaptionsInput
            : '',
        excludedSeriesIds: Array.isArray(stored?.excludedSeriesIds)
            ? stored.excludedSeriesIds.filter((id): id is string => typeof id === 'string')
            : archives.map((archive) => archive.id),
    };
};

interface UseSpriteSheetGeneratorControllerOptions {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onNeedApiKey: (provider?: AiProvider) => void;
}

export const useSpriteSheetGeneratorController = ({
    provider,
    apiKeys,
    onNeedApiKey,
}: UseSpriteSheetGeneratorControllerOptions) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const defaultSeriesName = t('spriteSheet.defaultSeriesName');
    const [initialSeriesControls] = useState(() => {
        const archives = loadStickerSeriesArchives();
        return {
            archives,
            preferences: loadStickerSeriesPreferences(archives, defaultSeriesName),
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
    const hasCompletePlan = concepts.length === SPRITE_FRAME_COUNT
        && concepts.every((item) => item.theme.trim() && item.caption.trim() && item.visual.trim());
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

    const createCurrentDraft = (
        overrides: Partial<SpriteSheetPlanDraft> = {},
    ): SpriteSheetPlanDraft | null => {
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
                const restored = item
                    ? parseSpriteSheetPlanGalleryItem(item, defaultSeriesName)
                    : null;

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
    }, [defaultSeriesName, navigate, requestedPlanId, t]);

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
                title: t('spriteSheet.galleryDraftTitle', { batch: activeBatchNumber }),
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
        const requiredForBatch = getRequiredCaptionsForBatch(
            requiredCaptions,
            completedBatches,
            targetBatchIndex,
        );
        const overlongRequiredCaptions = findOverlongRequiredCaptions(requiredForBatch);
        if (overlongRequiredCaptions.length > 0) {
            showToast(t('spriteSheet.requiredCaptionTooLong', {
                values: overlongRequiredCaptions.join('、'),
            }), 'error');
            return;
        }
        const requiredConflicts = findRequiredCaptionConflicts(
            requiredForBatch,
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
                requiredCaptions: requiredForBatch,
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
            const message = invalidKey
                ? t('spriteSheet.errors.invalidSavedKey')
                : error instanceof Error ? error.message : String(error);
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
        const archive = createStickerSeriesArchive(
            seriesName,
            completedBatches,
            t('spriteSheet.unnamedSeries'),
        );
        if (archive) {
            setArchivedSeries((current) => {
                const updated = appendStickerSeriesArchive(current, archive);
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

    return {
        fileInputRef,
        referenceImage,
        characterDescription,
        setCharacterDescription,
        characterSummary,
        concepts,
        style,
        setStyle,
        backgroundColor,
        backgroundRecommendation,
        includeText,
        setIncludeText,
        isSuggesting,
        isGenerating,
        resultImage,
        setResultImage,
        lastPrompt,
        completedBatches,
        editingBatchIndex,
        archivedSeries,
        seriesName,
        setSeriesName,
        requiredCaptionsInput,
        setRequiredCaptionsInput,
        excludedSeriesIds,
        setExcludedSeriesIds,
        draftStatus,
        hasCompletePlan,
        seriesConcepts,
        requiredCaptions,
        batchRequiredCaptions,
        completedStickerCount,
        isSeriesComplete,
        prompt,
        handleSuggest,
        handleReferenceFile,
        updateConcept,
        updateBackgroundColor,
        handleSelectBatch,
        handleExitBatchEdit,
        handleGenerate,
        copyText,
        handleOpenAiVideo,
        clearReference,
        resetSeries,
    };
};

export type SpriteSheetGeneratorController = ReturnType<typeof useSpriteSheetGeneratorController>;
