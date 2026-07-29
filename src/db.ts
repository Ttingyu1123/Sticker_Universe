import { openDB, DBSchema } from 'idb';
import type { Sticker } from './shared/types/sticker';
import type { AiVideoJob } from './features/ai-video/types';

interface StickerDB extends DBSchema {
    stickers: {
        key: string;
        value: Sticker;
        indexes: { 'timestamp': number };
    };
    aiVideoJobs: {
        key: string;
        value: AiVideoJob;
        indexes: { 'updatedAt': number };
    };
}

const DB_NAME = 'sticker-universe-db';
const STORE_NAME = 'stickers';
const AI_VIDEO_STORE_NAME = 'aiVideoJobs';
const VERSION = 2;

export const initDB = async () => {
    return openDB<StickerDB>(DB_NAME, VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp'); // Allow sorting by time
            }
            if (!db.objectStoreNames.contains(AI_VIDEO_STORE_NAME)) {
                const store = db.createObjectStore(AI_VIDEO_STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt');
            }
        },
    });
};

export const saveStickerToDB = async (sticker: Sticker) => {
    const db = await initDB();
    return db.put(STORE_NAME, sticker);
};

export const getAllStickersFromDB = async () => {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'timestamp'); // Get all sorted by timestamp (asc)
};

export const deleteStickerFromDB = async (id: string) => {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
};

export const clearAllStickersFromDB = async () => {
    const db = await initDB();
    return db.clear(STORE_NAME);
};

export const saveAiVideoJob = async (job: AiVideoJob) => {
    const db = await initDB();
    return db.put(AI_VIDEO_STORE_NAME, job);
};

export const getAiVideoJob = async (id: string) => {
    const db = await initDB();
    return db.get(AI_VIDEO_STORE_NAME, id);
};

export const getLatestAiVideoJob = async () => {
    const db = await initDB();
    const jobs = await db.getAllFromIndex(AI_VIDEO_STORE_NAME, 'updatedAt');
    return jobs.at(-1);
};

export const deleteAiVideoJob = async (id: string) => {
    const db = await initDB();
    return db.delete(AI_VIDEO_STORE_NAME, id);
};
