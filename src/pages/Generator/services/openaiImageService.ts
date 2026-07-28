const getErrorMessage = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload.error?.message || payload.message || `OpenAI request failed (${response.status})`;
    } catch {
        if (response.status === 404) {
            return 'OpenAI image proxy endpoint is unavailable (404). Restart `npm run dev` so the local API middleware is loaded.';
        }
        return `OpenAI request failed (${response.status})`;
    }
};

export async function generateOpenAiImage(
    apiKey: string,
    prompt: string,
    base64Image: string | string[] | null,
    aspectRatio: string = '1:1',
    model: string = 'gpt-image-2',
    quality: 'low' | 'medium' | 'high' | 'auto' = 'medium',
): Promise<string> {
    try {
        const response = await fetch('/api/openai-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey,
                prompt,
                base64Image,
                aspectRatio,
                model,
                quality,
            }),
        });

        if (!response.ok) {
            const message = await getErrorMessage(response);
            if (response.status === 401) {
                throw new Error('KEY_NOT_FOUND');
            }
            throw new Error(message);
        }

        const payload = await response.json();
        const base64 = payload.imageBase64;
        if (!base64) {
            throw new Error('OpenAI returned no image.');
        }

        return `data:image/png;base64,${base64}`;
    } catch (error: any) {
        console.error('Error generating OpenAI image:', error);
        if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
            throw new Error('OpenAI proxy request failed. If you are on local Vite dev, use Vercel deployment or `vercel dev` for OpenAI image generation.');
        }
        if (error.message?.includes('invalid_api_key')) {
            throw new Error('KEY_NOT_FOUND');
        }
        throw error;
    }
}
