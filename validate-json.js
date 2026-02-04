
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/locales/zh-TW.json');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log("JSON is valid!");
} catch (e) {
    console.error("JSON Error:", e.message);
    // Extract position if available
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.substring(0, pos).split('\n');
        const lineNum = lines.length;
        const colNum = lines[lines.length - 1].length + 1;
        console.error(`Error at Line ${lineNum}, Column ${colNum}`);

        // Show context
        const allLines = content.split('\n');
        console.error("Context:");
        for (let i = Math.max(0, lineNum - 3); i < Math.min(allLines.length, lineNum + 2); i++) {
            console.error(`${i + 1}: ${allLines[i]}`);
            if (i + 1 === lineNum) {
                console.error(' '.repeat(colNum + String(i + 1).length + 1) + '^');
            }
        }
    }
}
