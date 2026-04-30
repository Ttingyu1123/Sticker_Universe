const OPENAI_IMAGE_GENERATIONS_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_IMAGE_EDITS_URL = 'https://api.openai.com/v1/images/edits';

const MIN_TOTAL_PIXELS = 655360;
const MAX_EDGE = 3840;
const MAX_RATIO = 3;
const BASE_SHORT_EDGE = 1024;

const roundToMultipleOf16 = (value: number) => Math.max(16, Math.round(value / 16) * 16);

const dataUrlToFile = (dataUrl: string, fallbackName: string) => {
    const [meta, base64] = dataUrl.split(',');
    const mimeType = meta?.match(/data:(.*?);base64/)?.[1] || 'image/png';
    const binary = atob(base64 || '');
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    const extension = mimeType.split('/')[1] || 'png';
    return new File([bytes], `${fallbackName}.${extension}`, { type: mimeType });
};

const parseAspectRatio = (aspectRatio: string) => {
    const [widthText, heightText] = aspectRatio.split(':');
    const width = Number(widthText);
    const height = Number(heightText);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return 1;
    }

    return Math.min(MAX_RATIO, Math.max(1 / MAX_RATIO, width / height));
};

const resolveOpenAiSize = (aspectRatio: string) => {
    const ratio = parseAspectRatio(aspectRatio);

    let width = ratio >= 1 ? roundToMultipleOf16(BASE_SHORT_EDGE * ratio) : BASE_SHORT_EDGE;
    let height = ratio >= 1 ? BASE_SHORT_EDGE : roundToMultipleOf16(BASE_SHORT_EDGE / ratio);

    if (width > MAX_EDGE) {
        const scale = MAX_EDGE / width;
        width = roundToMultipleOf16(width * scale);
        height = roundToMultipleOf16(height * scale);
    }

    if (height > MAX_EDGE) {
        const scale = MAX_EDGE / height;
        width = roundToMultipleOf16(width * scale);
        height = roundToMultipleOf16(height * scale);
    }

    const pixelCount = width * height;
    if (pixelCount < MIN_TOTAL_PIXELS) {
        const scale = Math.sqrt(MIN_TOTAL_PIXELS / pixelCount);
        width = roundToMultipleOf16(width * scale);
        height = roundToMultipleOf16(height * scale);
    }

    return `${width}x${height}`;
};

const getErrorMessage = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload.error?.message || payload.message || `OpenAI request failed (${response.status})`;
    } catch {
        return `OpenAI request failed (${response.status})`;
    }
};

export async function generateOpenAiImage(
    apiKey: string,
    prompt: string,
    base64Image: string | null,
    aspectRatio: string = '1:1',
    model: string = 'gpt-image-2',
    quality: 'low' | 'medium' | 'high' | 'auto' = 'medium',
): Promise<string> {
    const size = resolveOpenAiSize(aspectRatio);

    try {
        let response: Response;

        if (base64Image) {
            const formData = new FormData();
            formData.append('model', model);
            formData.append('prompt', prompt || 'Generate an image based on the reference image.');
            formData.append('size', size);
            formData.append('quality', quality);
            formData.append('image[]', dataUrlToFile(base64Image, 'reference-image'));

            response = await fetch(OPENAI_IMAGE_EDITS_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
                body: formData,
            });
        } else {
            response = await fetch(OPENAI_IMAGE_GENERATIONS_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    size,
                    quality,
                }),
            });
        }

        if (!response.ok) {
            const message = await getErrorMessage(response);
            if (response.status === 401) {
                throw new Error('KEY_NOT_FOUND');
            }
            throw new Error(message);
        }

        const payload = await response.json();
        const base64 = payload.data?.[0]?.b64_json;
        if (!base64) {
            throw new Error('OpenAI returned no image.');
        }

        return `data:image/png;base64,${base64}`;
    } catch (error: any) {
        console.error('Error generating OpenAI image:', error);
        if (error.message?.includes('invalid_api_key')) {
            throw new Error('KEY_NOT_FOUND');
        }
        throw error;
    }
}
