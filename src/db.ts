import { openDB, DBSchema } from 'idb';
import { Sticker } from './pages/Generator/types';

interface StickerDB extends DBSchema {
    stickers: {
        key: string;
        value: Sticker;
        indexes: { 'timestamp': number };
    };
}

const DB_NAME = 'sticker-universe-db';
const STORE_NAME = 'stickers';
const VERSION = 1;

export const initDB = async () => {
    return openDB<StickerDB>(DB_NAME, VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp'); // Allow sorting by time
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
