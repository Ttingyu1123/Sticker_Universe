import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const enPath = path.join(root, 'src', 'locales', 'en.json');
const zhPath = path.join(root, 'src', 'locales', 'zh-TW.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const flattenKeys = (obj, prefix = '', out = new Set()) => {
    if (obj === null || obj === undefined) return out;
    if (typeof obj !== 'object' || Array.isArray(obj)) {
        if (prefix) out.add(prefix);
        return out;
    }

    for (const [key, value] of Object.entries(obj)) {
        const next = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            flattenKeys(value, next, out);
        } else {
            out.add(next);
        }
    }
    return out;
};

const collectSuspiciousValues = (obj, prefix = '', out = []) => {
    if (obj === null || obj === undefined) return out;
    if (typeof obj !== 'object' || Array.isArray(obj)) return out;

    for (const [key, value] of Object.entries(obj)) {
        const next = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            collectSuspiciousValues(value, next, out);
            continue;
        }
        if (typeof value !== 'string') continue;
        if (value.includes('\uFFFD') || value.includes('???')) {
            out.push(next);
        }
    }
    return out;
};

try {
    const en = readJson(enPath);
    const zh = readJson(zhPath);

    const enKeys = flattenKeys(en);
    const zhKeys = flattenKeys(zh);

    const missingInZh = [...enKeys].filter((key) => !zhKeys.has(key));
    const extraInZh = [...zhKeys].filter((key) => !enKeys.has(key));
    const suspiciousZh = collectSuspiciousValues(zh);

    if (missingInZh.length > 0) {
        console.error(`Missing keys in zh-TW: ${missingInZh.length}`);
        for (const key of missingInZh.slice(0, 30)) console.error(`- ${key}`);
        process.exit(1);
    }

    console.log(`i18n validation passed. en=${enKeys.size}, zh-TW=${zhKeys.size}`);
    if (extraInZh.length > 0) {
        console.warn(`Extra zh-TW keys (not in en): ${extraInZh.length}`);
    }
    if (suspiciousZh.length > 0) {
        console.warn(`Suspicious zh-TW values (contains ??? or replacement char): ${suspiciousZh.length}`);
        for (const key of suspiciousZh.slice(0, 20)) console.warn(`- ${key}`);
    }
} catch (error) {
    console.error('i18n validation failed:', error.message);
    process.exit(1);
}
