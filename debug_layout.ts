
import { LayoutType } from './src/pages/PhotoCollage/types';
import { calculateFrames } from './src/pages/PhotoCollage/utils/geometry';

// Mock types
enum MockLayoutType {
    GRID = 'GRID',
    VERTICAL = 'VERTICAL',
    HORIZONTAL = 'HORIZONTAL',
    FEATURED = 'FEATURED',
    MASONRY = 'MASONRY',
    CENTER = 'CENTER',
    SCATTER = 'SCATTER',
    DIAGONAL_SPLIT = 'DIAGONAL_SPLIT',
    L_LEFT = 'L_LEFT',
    L_RIGHT = 'L_RIGHT',
    T_SHAPE = 'T_SHAPE',
    CROSS_FOCUS = 'CROSS_FOCUS',
}

const runTest = (layout: string, count: number) => {
    const w = 1000;
    const h = 1000;
    const gap = 10;
    const padding = 20;

    const frames = calculateFrames(count, layout as any, w, h, gap, padding);
    console.log(`Layout: ${layout}, Count: ${count}`);
    frames.forEach((f, i) => {
        console.log(`  Frame ${i}: x=${f.x}, y=${f.y}, w=${f.width}, h=${f.height}`);
    });
    console.log('---');
};

console.log('Testing Layouts with 2 images:');
runTest('VERTICAL', 2);
runTest('HORIZONTAL', 2);
runTest('GRID', 2);
runTest('MASONRY', 2);
runTest('FEATURED', 2);
