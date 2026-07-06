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

export interface CollageProject {
    id: string;
    name: string;
    savedAt: number;
    settings: CollageSettings;
    imagesMeta: DraftImageMeta[];
}

interface DraftDB extends DBSchema {
    state: { key: string; value: DraftState };
    blobs: { key: string; value: Blob };
    projects: { key: string; value: CollageProject };
}

const DB_NAME = 'photo-collage-draft';
const STATE_KEY = 'current';

const openDraftDB = () =>
    openDB<DraftDB>(DB_NAME, 2, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
            if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
            if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        },
    });

const toMeta = (images: UploadedImage[]): DraftImageMeta[] =>
    images.map(img => ({
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

const metaToImages = async (
    db: Awaited<ReturnType<typeof openDraftDB>>,
    imagesMeta: DraftImageMeta[]
): Promise<UploadedImage[]> => {
    const images: UploadedImage[] = [];
    for (const meta of imagesMeta) {
        const blob = await db.get('blobs', meta.id);
        // A missing blob only drops that photo, not the whole restore
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
    return images;
};

/** Blob ids still referenced by any named project (blobs are shared across projects and the draft). */
const projectReferencedIds = async (db: Awaited<ReturnType<typeof openDraftDB>>): Promise<Set<string>> => {
    const refs = new Set<string>();
    for (const project of await db.getAll('projects')) {
        for (const meta of project.imagesMeta) refs.add(meta.id);
    }
    return refs;
};

export const saveDraft = async (images: UploadedImage[], settings: CollageSettings): Promise<void> => {
    const db = await openDraftDB();
    const existingKeys = (await db.getAllKeys('blobs')) as string[];
    const existing = new Set(existingKeys);
    // Keep blobs used by the draft OR by any named project
    const wanted = new Set(images.map(img => img.id));
    for (const id of await projectReferencedIds(db)) wanted.add(id);

    const tx = db.transaction(['state', 'blobs'], 'readwrite');
    for (const key of existingKeys) {
        if (!wanted.has(key)) void tx.objectStore('blobs').delete(key);
    }
    for (const img of images) {
        if (!existing.has(img.id)) void tx.objectStore('blobs').put(img.file, img.id);
    }
    void tx.objectStore('state').put({ savedAt: Date.now(), settings, imagesMeta: toMeta(images) }, STATE_KEY);
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
    const images = await metaToImages(db, state.imagesMeta);
    if (images.length === 0) return null;
    return { images, settings: state.settings };
};

export const clearDraft = async (): Promise<void> => {
    const db = await openDraftDB();
    const keep = await projectReferencedIds(db);
    const blobKeys = (await db.getAllKeys('blobs')) as string[];
    const tx = db.transaction(['state', 'blobs'], 'readwrite');
    void tx.objectStore('state').clear();
    for (const key of blobKeys) {
        if (!keep.has(key)) void tx.objectStore('blobs').delete(key);
    }
    await tx.done;
};

// ---- Named projects (re-editable saves; blobs shared with the draft) ----

export const saveProject = async (
    name: string,
    images: UploadedImage[],
    settings: CollageSettings
): Promise<CollageProject> => {
    const db = await openDraftDB();
    const project: CollageProject = {
        id: crypto.randomUUID(),
        name,
        savedAt: Date.now(),
        settings,
        imagesMeta: toMeta(images),
    };
    const existing = new Set((await db.getAllKeys('blobs')) as string[]);
    const tx = db.transaction(['projects', 'blobs'], 'readwrite');
    for (const img of images) {
        if (!existing.has(img.id)) void tx.objectStore('blobs').put(img.file, img.id);
    }
    void tx.objectStore('projects').put(project);
    await tx.done;
    return project;
};

export const listProjects = async (): Promise<{ id: string; name: string; savedAt: number; count: number }[]> => {
    const db = await openDraftDB();
    const projects = await db.getAll('projects');
    return projects
        .map(p => ({ id: p.id, name: p.name, savedAt: p.savedAt, count: p.imagesMeta.length }))
        .sort((a, b) => b.savedAt - a.savedAt);
};

export const loadProject = async (id: string): Promise<{ images: UploadedImage[]; settings: CollageSettings; name: string } | null> => {
    const db = await openDraftDB();
    const project = await db.get('projects', id);
    if (!project) return null;
    const images = await metaToImages(db, project.imagesMeta);
    if (images.length === 0) return null;
    return { images, settings: project.settings, name: project.name };
};

export const deleteProject = async (id: string): Promise<void> => {
    const db = await openDraftDB();
    await db.delete('projects', id);
    // GC blobs no longer referenced by any project or the current draft
    const keep = await projectReferencedIds(db);
    const state = await db.get('state', STATE_KEY);
    state?.imagesMeta.forEach(meta => keep.add(meta.id));
    const blobKeys = (await db.getAllKeys('blobs')) as string[];
    const tx = db.transaction('blobs', 'readwrite');
    for (const key of blobKeys) {
        if (!keep.has(key)) void tx.store.delete(key);
    }
    await tx.done;
};
