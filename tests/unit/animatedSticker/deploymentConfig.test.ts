import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface VercelHeader {
    key: string;
    value: string;
}

interface VercelConfig {
    headers?: Array<{ headers?: VercelHeader[] }>;
}

describe('animated sticker deployment configuration', () => {
    it('allows local blob URLs to be used as video sources', () => {
        const config = JSON.parse(
            readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
        ) as VercelConfig;
        const contentSecurityPolicy = config.headers
            ?.flatMap((route) => route.headers ?? [])
            .find((header) => header.key === 'Content-Security-Policy')
            ?.value;

        expect(contentSecurityPolicy).toMatch(/(?:^|;\s*)media-src\s+[^;]*\bblob:/);
    });
});
