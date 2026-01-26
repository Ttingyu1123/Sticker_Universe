import { removeBackground } from "@imgly/background-removal";

const publicUrl = window.location.origin + import.meta.env.BASE_URL;

export const processImage = async (
    image: Blob | string,
    onProgress?: (progress: number) => void
): Promise<Blob> => {
    try {
        const fullUrl = `${publicUrl}imgly-data/`;
        console.log("AI Model Assets Path:", fullUrl);
        console.log("Fetching resources from:", `${fullUrl}resources.json`);

        const blob = await removeBackground(image, {
            publicPath: fullUrl,
            model: 'medium',
            progress: (key: string, current: number, total: number) => {
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
