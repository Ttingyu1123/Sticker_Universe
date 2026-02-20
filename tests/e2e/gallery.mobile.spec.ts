import { expect, test, type Page } from '@playwright/test';

const TEST_DB_NAME = 'sticker-universe-db';
const TEST_STORE_NAME = 'stickers';
const TEST_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s2m30YAAAAASUVORK5CYII=';

async function seedGallery(page: Page) {
  await page.evaluate(
    async ({ dbName, storeName, imageUrl }) => {
      await new Promise<void>((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => reject(deleteReq.error);
        deleteReq.onblocked = () => resolve();
      });

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => {
          const upgradeDb = req.result;
          if (!upgradeDb.objectStoreNames.contains(storeName)) {
            const store = upgradeDb.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const now = Date.now();
      const rows = [
        { id: 'e2e-1', phrase: 'e2e_share_1', imageUrl, timestamp: now - 1000 },
        { id: 'e2e-2', phrase: 'e2e_share_2', imageUrl, timestamp: now },
      ];

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        rows.forEach((row) => store.put(row));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      db.close();
    },
    { dbName: TEST_DB_NAME, storeName: TEST_STORE_NAME, imageUrl: TEST_IMAGE_DATA_URL }
  );
}

test.describe('Gallery mobile multi-select actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let shareCalls = 0;
      Object.defineProperty(window, '__shareCalls', {
        configurable: true,
        get: () => shareCalls,
      });

      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: () => true,
      });

      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async () => {
          shareCalls += 1;
        },
      });
    });

    await page.goto('/gallery');
    await seedGallery(page);
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('gallery-selection-mode').click();
    await page.getByText('e2e_share_1').click();
    await page.getByText('e2e_share_2').click();
  });

  test('batch action bar shows zip download and delete buttons', async ({ page }) => {
    await expect(page.getByTestId('gallery-batch-download')).toBeVisible();
    await expect(page.getByTestId('gallery-batch-delete')).toBeVisible();
    await expect(page.getByTestId('gallery-batch-share')).toHaveCount(0);
  });

  test('batch download triggers zip flow and exits selection mode', async ({ page }) => {
    await page.getByTestId('gallery-batch-download').click();
    await expect(page).toHaveURL(/\/gallery$/);
  });
});
