
export type BackgroundType = 'solid' | 'gradient' | 'pattern';

export interface BackgroundPreset {
    id: string;
    name: string;
    type: BackgroundType;
    // For gradients
    colors?: string[];
    direction?: 'to-br' | 'to-r' | 'to-b'; // simplified direction
    // For patterns
    patternType?: 'dots' | 'grid' | 'noise' | 'paper';
    opacity?: number;
    scale?: number;
    // CSS generator for UI
    css: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
    // GRADIENTS
    {
        id: 'grad-sunset',
        name: 'Sunset',
        type: 'gradient',
        colors: ['#ff9a9e', '#fecfef'],
        direction: 'to-b',
        css: 'linear-gradient(to bottom, #ff9a9e 0%, #fecfef 100%)'
    },
    {
        id: 'grad-ocean',
        name: 'Ocean',
        type: 'gradient',
        colors: ['#a18cd1', '#fbc2eb'],
        direction: 'to-br',
        css: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
    },
    {
        id: 'grad-peach',
        name: 'Peach',
        type: 'gradient',
        colors: ['#fad0c4', '#ffd1ff'],
        direction: 'to-r',
        css: 'linear-gradient(to right, #fad0c4 0%, #ffd1ff 100%)'
    },
    {
        id: 'grad-mint',
        name: 'Mint',
        type: 'gradient',
        colors: ['#84fab0', '#8fd3f4'],
        direction: 'to-br',
        css: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)'
    },
    {
        id: 'grad-night',
        name: 'Midnight',
        type: 'gradient',
        colors: ['#30cfd0', '#330867'],
        direction: 'to-b',
        css: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)'
    },
    {
        id: 'grad-mystic',
        name: 'Mystic',
        type: 'gradient',
        colors: ['#5f2c82', '#49a09d'],
        direction: 'to-r',
        css: 'linear-gradient(to right, #5f2c82 0%, #49a09d 100%)'
    },
    {
        id: 'grad-morning',
        name: 'Morning',
        type: 'gradient',
        colors: ['#fff1eb', '#ace0f9'],
        direction: 'to-b',
        css: 'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)'
    },
    {
        id: 'grad-sunny',
        name: 'Sunny',
        type: 'gradient',
        colors: ['#f6d365', '#fda085'],
        direction: 'to-br',
        css: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)'
    },
    {
        id: 'grad-rainy',
        name: 'Rainy',
        type: 'gradient',
        colors: ['#fbc2eb', '#a6c1ee'],
        direction: 'to-b',
        css: 'linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)'
    },
    {
        id: 'grad-softair',
        name: 'Soft Air',
        type: 'gradient',
        colors: ['#e0c3fc', '#8ec5fc'],
        direction: 'to-r',
        css: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)'
    },

    // PATTERNS
    {
        id: 'pat-dots',
        name: 'Dots',
        type: 'pattern',
        patternType: 'dots',
        opacity: 0.3,
        // Radial gradient with scaling for preview
        css: 'radial-gradient(circle, #94a3b8 2px, transparent 2.5px) 0 0 / 12px 12px',
    },
    {
        id: 'pat-grid',
        name: 'Grid',
        type: 'pattern',
        patternType: 'grid',
        opacity: 0.1,
        // Linear gradient grid with scaling for preview
        css: 'linear-gradient(#94a3b8 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, #94a3b8 1px, transparent 1px) 0 0 / 12px 12px'
    },
    {
        id: 'pat-paper',
        name: 'Paper',
        type: 'pattern',
        patternType: 'paper',
        // Warm floral white base for preview (Noise is hard to do pure CSS without image)
        css: '#fffaf0',
    }
];

// Helper to draw these on Canvas
export const drawBackgroundPreset = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    presetId: string
) => {
    const preset = BACKGROUND_PRESETS.find(p => p.id === presetId);
    if (!preset) return false; // Fallback to solid color

    if (preset.type === 'gradient' && preset.colors) {
        let grad;
        // Basic direction mapping
        if (preset.direction === 'to-r') {
            grad = ctx.createLinearGradient(0, 0, width, 0);
        } else if (preset.direction === 'to-b') {
            grad = ctx.createLinearGradient(0, 0, 0, height);
        } else {
            // default to-br
            grad = ctx.createLinearGradient(0, 0, width, height);
        }

        preset.colors.forEach((color, index) => {
            const stop = index / (preset.colors!.length - 1);
            grad.addColorStop(stop, color);
        });

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return true;
    }

    if (preset.type === 'pattern' && preset.patternType) {
        // Draw base white first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (preset.patternType === 'dots') {
            const dotSize = 2; // px
            const spacing = 20; // px

            // Create a small canvas pattern
            const pCanvas = document.createElement('canvas');
            pCanvas.width = spacing;
            pCanvas.height = spacing;
            const pCtx = pCanvas.getContext('2d');
            if (pCtx) {
                pCtx.fillStyle = '#e5e7eb';
                pCtx.beginPath();
                pCtx.arc(dotSize / 2, dotSize / 2, dotSize / 2, 0, Math.PI * 2);
                pCtx.fill();

                const pattern = ctx.createPattern(pCanvas, 'repeat');
                if (pattern) {
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, width, height);
                }
            }
        } else if (preset.patternType === 'grid') {
            const spacing = 30;
            const pCanvas = document.createElement('canvas');
            pCanvas.width = spacing;
            pCanvas.height = spacing;
            const pCtx = pCanvas.getContext('2d');
            if (pCtx) {
                pCtx.strokeStyle = '#e5e7eb';
                pCtx.lineWidth = 1;
                pCtx.beginPath();
                pCtx.moveTo(0, 0);
                pCtx.lineTo(spacing, 0);
                pCtx.moveTo(0, 0);
                pCtx.lineTo(0, spacing);
                pCtx.stroke();

                const pattern = ctx.createPattern(pCanvas, 'repeat');
                if (pattern) {
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, width, height);
                }
            }
        } else if (preset.patternType === 'paper') {
            // Simple Noise implementation
            // Noise is heavy to generate on large canvas, so we generate small noise and repeat
            const noiseSize = 100;
            const pCanvas = document.createElement('canvas');
            pCanvas.width = noiseSize;
            pCanvas.height = noiseSize;
            const pCtx = pCanvas.getContext('2d');
            if (pCtx) {
                const idata = pCtx.createImageData(noiseSize, noiseSize);
                const buffer32 = new Uint32Array(idata.data.buffer);
                const len = buffer32.length;
                for (let i = 0; i < len; i++) {
                    if (Math.random() < 0.5) {
                        // slightly dark grain
                        buffer32[i] = 0x08000000; // Little endian... small alpha black
                    } else {
                        buffer32[i] = 0x00000000;
                    }
                }
                pCtx.putImageData(idata, 0, 0);

                // Add a warm tint
                ctx.fillStyle = '#fffaf0'; // floral white base
                ctx.fillRect(0, 0, width, height);

                const pattern = ctx.createPattern(pCanvas, 'repeat');
                if (pattern) {
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, width, height);
                }
            }
        }
        return true;
    }

    return false;
};
