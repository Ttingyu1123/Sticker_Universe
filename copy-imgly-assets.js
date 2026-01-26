import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, 'node_modules/@imgly/background-removal-data/dist');
const destDir = path.resolve(__dirname, 'public/imgly-data');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    if (!fs.existsSync(src)) {
        console.warn(`Source directory not found: ${src}`);
        return;
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            // console.log(`Copying ${entry.name}...`);
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    console.log(`Copying assets from ${srcDir} to ${destDir}...`);
    copyDir(srcDir, destDir);
    console.log('Assets copied successfully!');
} catch (error) {
    console.error('Error copying assets:', error);
    // Don't fail build if missing, just warn
}
