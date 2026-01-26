import { removeBackground } from "@imgly/background-removal";

// Configure publicly accessible URL for the models
const getPublicUrl = () => {
    const baseUrl = import.meta.env.BASE_URL;
    if (baseUrl === '/' || baseUrl === './') {
        // Attempt to construct from window.location if BASE_URL is relative or root
        const url = new URL(window.location.href);
        if (url.pathname.endsWith('index.html')) {
            url.pathname = url.pathname.slice(0, -'index.html'.length);
        }
        // Ensure trailing slash
        if (!url.pathname.endsWith('/')) {
            url.pathname += '/';
        }
        return url.href;
    } else {
        // If BASE_URL is a path like '/Sticker_Master_AI/', use origin + BASE_URL
        return window.location.origin + baseUrl;
    }
};

const publicUrl = getPublicUrl();

export const processImage = async (
    image: Blob | string,
    onProgress?: (progress: number) => void
): Promise<Blob> => {
    try {
        const fullUrl = `${publicUrl}imgly-data/`;
        console.log("AI Model Assets Path:", fullUrl); // Debugging log
        const blob = await removeBackground(image, {
            publicPath: fullUrl,
            model: 'medium',
            progress: (key, current, total) => {
                if (onProgress) {
                    onProgress(current / total);
                }
            },
        });
        return blob;
    } catch (error) {
        console.error("Background removal failed:", error);
        throw error;
    }
};
