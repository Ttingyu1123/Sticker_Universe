import { useState } from 'react';

export interface ShareImageOptions {
    filename: string;
    metadata?: {
        type?: string;      // sticker/headshot/poster/image
        style?: string;
        size?: string;
        phrase?: string;
        prompt?: string;
        direction?: string; // e.g. Horizontal, Vertical, Square
        count?: string | number; // e.g. 1, 4, 8
    };
    title?: string;
    text?: string;
}

export const useImageShare = () => {
    const [isSharing, setIsSharing] = useState(false);

    const generateFilename = (options: ShareImageOptions): string => {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        // const time = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, ''); // Removed time to keep it cleaner as per "Date" request usually implies YYYYMMDD

        // Base: Size_Count_Direction_Date
        let parts: string[] = [];

        // 1. Size (Dimensions/Resolution)
        if (options.metadata?.size) {
            parts.push(options.metadata.size.replace(/[:\s]/g, '-'));
        }

        // 2. Count (張數/格數)
        if (options.metadata?.count) {
            parts.push(`${options.metadata.count}p`);
        }

        // 3. Direction (方向)
        if (options.metadata?.direction) {
            parts.push(options.metadata.direction);
        }

        // 4. Date
        parts.push(date);

        // Add Style/Type if needed for uniqueness, or stick to user request. 
        // User asked for: "下載檔名包含尺寸、張數、方向、日期"
        // But let's keep 'manga' or type prefix if provided in filename arg?
        // The function receives `filename` in options.filename which is usually used as prefix.

        let finalName = options.filename || 'image';
        if (parts.length > 0) {
            finalName += '_' + parts.join('_');
        }

        return finalName + '.png';
    };

    const shareImage = async (imageSrc: string, options: ShareImageOptions): Promise<boolean> => {
        setIsSharing(true);

        try {
            const filename = generateFilename(options);

            // 將 base64 或 URL 轉為 Blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            // 檢查是否支援 Web Share API（且可分享檔案）
            const canShare = typeof navigator.share === 'function' &&
                typeof navigator.canShare === 'function' &&
                navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] });

            if (canShare) {
                // 使用 Web Share API
                const file = new File([blob], filename, { type: blob.type });
                await navigator.share({
                    files: [file],
                    title: options.title || '分享圖片',
                    text: options.text || '',
                });
                setIsSharing(false);
                return true;
            } else {
                // Fallback: 傳統下載
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                setIsSharing(false);
                return true;
            }
        } catch (error) {
            console.error('分享/下載失敗:', error);
            setIsSharing(false);
            return false;
        }
    };

    return { shareImage, isSharing };
};
