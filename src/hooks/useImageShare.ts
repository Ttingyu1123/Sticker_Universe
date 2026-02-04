import { useState } from 'react';

export interface ShareImageOptions {
    filename: string;
    metadata?: {
        type?: string;      // sticker/headshot/poster/image
        style?: string;
        size?: string;
        phrase?: string;
        prompt?: string;
    };
    title?: string;
    text?: string;
}

export const useImageShare = () => {
    const [isSharing, setIsSharing] = useState(false);

    const generateFilename = (options: ShareImageOptions): string => {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString('zh-TW', { hour12: false }).replace(/:/g, '-');

        let filename = options.metadata?.type || 'image';

        // 添加元資料
        if (options.metadata?.style) {
            filename += `_${options.metadata.style.replace(/\s+/g, '_')}`;
        }
        if (options.metadata?.size) {
            filename += `_${options.metadata.size.replace(/\s+/g, '_')}`;
        }
        if (options.metadata?.phrase) {
            // 限制短語長度，避免檔名過長
            const phrase = options.metadata.phrase.substring(0, 20).replace(/\s+/g, '_');
            filename += `_${phrase}`;
        }
        if (options.metadata?.prompt) {
            // 限制提示詞長度
            const prompt = options.metadata.prompt.substring(0, 30).replace(/\s+/g, '_');
            filename += `_${prompt}`;
        }

        filename += `_${date}_${time}.png`;

        return filename;
    };

    const shareImage = async (imageSrc: string, options: ShareImageOptions): Promise<boolean> => {
        setIsSharing(true);

        try {
            const filename = generateFilename(options);

            // 將 base64 或 URL 轉為 Blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            // 檢查是否支援 Web Share API（且可分享檔案）
            const canShare = navigator.share &&
                navigator.canShare &&
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
