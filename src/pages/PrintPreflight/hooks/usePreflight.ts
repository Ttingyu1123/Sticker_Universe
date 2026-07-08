import { useCallback, useEffect, useRef, useState } from 'react';
import { runPreflight, type PixelSource, type PreflightReport, type PreflightSettings } from '../core';

// getImageData on huge images allocates width*height*4 bytes; cap analysis
// pixels and let DPI math use the true dimensions instead.
const MAX_ANALYSIS_PIXELS = 16_000_000;

export interface LoadedImage {
    objectUrl: string;
    /** True source dimensions */
    width: number;
    height: number;
    fileName: string;
    fileSizeBytes: number;
    pixels: PixelSource;
}

export function usePreflight(settings: PreflightSettings) {
    const [image, setImage] = useState<LoadedImage | null>(null);
    const [report, setReport] = useState<PreflightReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<'load' | null>(null);
    const objectUrlRef = useRef<string | null>(null);

    const loadImage = useCallback(async (blob: Blob, fileName: string) => {
        setLoading(true);
        setError(null);
        try {
            const bitmap = await createImageBitmap(blob);
            const totalPixels = bitmap.width * bitmap.height;
            const scale = totalPixels > MAX_ANALYSIS_PIXELS
                ? Math.sqrt(MAX_ANALYSIS_PIXELS / totalPixels)
                : 1;
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error('2d context unavailable');
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            const objectUrl = URL.createObjectURL(blob);
            objectUrlRef.current = objectUrl;

            setImage({
                objectUrl,
                width: bitmap.width,
                height: bitmap.height,
                fileName,
                fileSizeBytes: blob.size,
                pixels: { data: imageData.data, width: imageData.width, height: imageData.height },
            });
            bitmap.close();
        } catch (e) {
            console.error('Preflight image load failed:', e);
            setError('load');
        } finally {
            setLoading(false);
        }
    }, []);

    // Re-run analysis whenever the image or settings change (debounced so
    // typing in the mm inputs doesn't thrash the CPU).
    useEffect(() => {
        if (!image) {
            setReport(null);
            return;
        }
        setAnalyzing(true);
        const timer = setTimeout(() => {
            try {
                setReport(runPreflight(image.pixels, settings, {
                    trueWidth: image.width,
                    trueHeight: image.height,
                }));
            } catch (e) {
                console.error('Preflight analysis failed:', e);
                setReport(null);
            } finally {
                setAnalyzing(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [image, settings]);

    useEffect(() => () => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    }, []);

    return { image, report, loading, analyzing, error, loadImage };
}
