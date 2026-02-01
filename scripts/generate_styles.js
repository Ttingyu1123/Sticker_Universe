const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../100種風格十二宮格貼圖.txt');
const outputPath = path.join(__dirname, '../constants.tsx');

try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const lines = content.split('\n');
    const styles = [];
    let currentTitle = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Regex to match "1.Title" or "100. Title"
        const match = line.match(/^(\d+)\.(.*)/);
        if (match) {
            currentTitle = match[2].trim();
        } else if (currentTitle) {
            styles.push({ label: currentTitle, prompt: line });
            currentTitle = '';
        }
    }

    if (styles.length === 0) {
        console.error('No styles found! Check regex or file format.');
        process.exit(1);
    }

    const newContent = `\n\nexport const TWELVE_GRID_STYLES = ${JSON.stringify(styles, null, 2)};\n`;
    fs.appendFileSync(outputPath, newContent);
    console.log('Successfully appended ' + styles.length + ' styles to constants.tsx');

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
