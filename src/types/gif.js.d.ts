declare module 'gif.js' {
    interface GifOptions {
        workers?: number;
        quality?: number;
        width?: number;
        height?: number;
        workerScript?: string;
        transparent?: string | number | null;
        background?: string;
        repeat?: number;
        dither?: boolean | string;
    }

    interface FrameOptions {
        delay?: number;
        copy?: boolean;
        dispose?: number;
    }

    export default class GIF {
        constructor(options?: GifOptions);
        addFrame(
            element: CanvasRenderingContext2D | HTMLCanvasElement | HTMLImageElement | ImageData,
            options?: FrameOptions
        ): void;
        on(event: 'finished', callback: (blob: Blob) => void): void;
        on(event: 'progress', callback: (progress: number) => void): void;
        on(event: string, callback: (...args: any[]) => void): void;
        render(): void;
        abort(): void;
    }
}
