import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_PAGES_DIR = path.join(ROOT, 'src', 'pages');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts', 'page-boundary-allowlist.json');
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

const args = new Set(process.argv.slice(2));
const SHOULD_UPDATE_ALLOWLIST = args.has('--update-allowlist');

const normalize = (value) => value.replaceAll('\\', '/');

const walkFiles = (dir, out = []) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, out);
            continue;
        }
        if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
            out.push(fullPath);
        }
    }
    return out;
};

const resolveModulePath = (fromFile, specifier) => {
    if (specifier.startsWith('@/')) {
        return path.join(ROOT, 'src', specifier.slice(2));
    }
    if (specifier.startsWith('.')) {
        return path.resolve(path.dirname(fromFile), specifier);
    }
    return null;
};

const resolveExistingFile = (resolvedPath) => {
    const candidates = [
        resolvedPath,
        ...FILE_EXTENSIONS.map((ext) => `${resolvedPath}${ext}`),
        ...FILE_EXTENSIONS.map((ext) => path.join(resolvedPath, `index${ext}`)),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }
    return null;
};

const getPageRootName = (absoluteFilePath) => {
    const normalized = normalize(absoluteFilePath);
    const marker = '/src/pages/';
    const idx = normalized.indexOf(marker);
    if (idx === -1) return null;
    const rest = normalized.slice(idx + marker.length);
    const [pageRoot] = rest.split('/');
    return pageRoot || null;
};

const getImportSpecifiers = (sourceText) => {
    const specifiers = new Set();
    const importExportRegex = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    while ((match = importExportRegex.exec(sourceText)) !== null) {
        specifiers.add(match[1]);
    }
    while ((match = dynamicImportRegex.exec(sourceText)) !== null) {
        specifiers.add(match[1]);
    }
    return [...specifiers];
};

const readAllowlist = () => {
    if (!fs.existsSync(ALLOWLIST_PATH)) return new Set();
    const raw = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw);
};

const pageFiles = walkFiles(SRC_PAGES_DIR);
const violations = [];

for (const sourceFile of pageFiles) {
    const sourcePageRoot = getPageRootName(sourceFile);
    if (!sourcePageRoot) continue;

    const sourceText = fs.readFileSync(sourceFile, 'utf8');
    const specifiers = getImportSpecifiers(sourceText);

    for (const specifier of specifiers) {
        const maybeResolvedPath = resolveModulePath(sourceFile, specifier);
        if (!maybeResolvedPath) continue;

        const targetFile = resolveExistingFile(maybeResolvedPath);
        if (!targetFile) continue;

        const targetPageRoot = getPageRootName(targetFile);
        if (!targetPageRoot) continue;
        if (sourcePageRoot === targetPageRoot) continue;

        const sourceRel = normalize(path.relative(ROOT, sourceFile));
        const targetRel = normalize(path.relative(ROOT, targetFile));
        violations.push({
            key: `${sourceRel} => ${specifier}`,
            source: sourceRel,
            target: targetRel,
            specifier,
            sourcePageRoot,
            targetPageRoot,
        });
    }
}

violations.sort((a, b) => a.key.localeCompare(b.key));

if (SHOULD_UPDATE_ALLOWLIST) {
    const keys = violations.map((v) => v.key);
    fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(keys, null, 2)}\n`, 'utf8');
    console.log(`Updated allowlist with ${keys.length} entries: scripts/page-boundary-allowlist.json`);
    process.exit(0);
}

const allowlist = readAllowlist();
const blocked = violations.filter((v) => !allowlist.has(v.key));

if (blocked.length > 0) {
    console.error(`Page boundary violations: ${blocked.length}`);
    for (const violation of blocked) {
        console.error(`- ${violation.source} imports ${violation.specifier} -> ${violation.target}`);
    }
    process.exit(1);
}

console.log(`Boundary check passed. violations=${violations.length}, allowlisted=${allowlist.size}`);
