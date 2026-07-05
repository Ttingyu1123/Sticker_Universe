import { openDB, DBSchema } from 'idb';
import { CollageSettings, FreeformRect, UploadedImage } from '../types';

// Work-in-progress collage persistence. Split into two stores so the
// frequent autosave only rewrites light metadata — photo blobs are written
// once per image (keyed by image id), not on every settings tweak.
// ponytail: page-local DB; fold into src/db.ts if other pages grow drafts

interface DraftImageMeta {
    id: string;
    name: string;
    type: string;
    scale: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    filter?: string;
    filterIntensity?: number;
    isHero?: boolean;
    caption?: string;
    freeform?: FreeformRect;
    originalWidth?: number;
    originalHeight?: number;
}

interface DraftState {
    savedAt: number;
    settings: CollageSettings;
    imagesMeta: DraftImageMeta[];
}

interface DraftDB extends DBSchema {
    state: { key: string; value: DraftState };
    blobs: { key: string; value: Blob };
}

const DB_NAME = 'photo-collage-draft';
const STATE_KEY = 'current';

const openDraftDB = () =>
    openDB<DraftDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
            if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
        },
    });

export const saveDraft = async (images: UploadedImage[], settings: CollageSettings): Promise<void> => {
    const db = await openDraftDB();
    const imagesMeta: DraftImageMeta[] = images.map(img => ({
        id: img.id,
        name: img.file.name,
        type: img.file.type,
        scale: img.scale,
        rotation: img.rotation,
        offsetX: img.offsetX,
        offsetY: img.offsetY,
        filter: img.filter,
        filterIntensity: img.filterIntensity,
        isHero: img.isHero,
        caption: img.caption,
        freeform: img.freeform,
        originalWidth: img.originalWidth,
        originalHeight: img.originalHeight,
    }));

    const existingKeys = (await db.getAllKeys('blobs')) as string[];
    const wanted = new Set(images.map(img => img.id));
    const existing = new Set(existingKeys);

    const tx = db.transaction(['state', 'blobs'], 'readwrite');
    for (const key of existingKeys) {
        if (!wanted.has(key)) void tx.objectStore('blobs').delete(key);
    }
    for (const img of images) {
        if (!existing.has(img.id)) void tx.objectStore('blobs').put(img.file, img.id);
    }
    void tx.objectStore('state').put({ savedAt: Date.now(), settings, imagesMeta }, STATE_KEY);
    await tx.done;
};

/** Cheap existence check for the resume prompt — does not load blobs. */
export const peekDraft = async (): Promise<{ savedAt: number; count: number } | null> => {
    const db = await openDraftDB();
    const state = await db.get('state', STATE_KEY);
    if (!state || state.imagesMeta.length === 0) return null;
    return { savedAt: state.savedAt, count: state.imagesMeta.length };
};

export const loadDraft = async (): Promise<{ images: UploadedImage[]; settings: CollageSettings } | null> => {
    const db = await openDraftDB();
    const state = await db.get('state', STATE_KEY);
    if (!state || state.imagesMeta.length === 0) return null;

    const images: UploadedImage[] = [];
    for (const meta of state.imagesMeta) {
        const blob = await db.get('blobs', meta.id);
        // A missing blob only drops that photo, not the whole draft
        if (!blob) continue;
        const file = new File([blob], meta.name, { type: meta.type });
        images.push({
            id: meta.id,
            file,
            url: URL.createObjectURL(file),
            scale: meta.scale,
            rotation: meta.rotation,
            offsetX: meta.offsetX,
            offsetY: meta.offsetY,
            filter: meta.filter,
            filterIntensity: meta.filterIntensity,
            isHero: meta.isHero,
            caption: meta.caption,
            freeform: meta.freeform,
            originalWidth: meta.originalWidth,
            originalHeight: meta.originalHeight,
        });
    }
    if (images.length === 0) return null;
    return { images, settings: state.settings };
};

export const clearDraft = async (): Promise<void> => {
    const db = await openDraftDB();
    const tx = db.transaction(['state', 'blobs'], 'readwrite');
    void tx.objectStore('state').clear();
    void tx.objectStore('blobs').clear();
    await tx.done;
};
