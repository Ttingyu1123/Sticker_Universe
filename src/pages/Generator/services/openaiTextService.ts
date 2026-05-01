const DEFAULT_OPENAI_TEXT_MODEL = 'gpt-5-mini';

type OpenAiTextFormat =
    | { type: 'text' }
    | { type: 'json_object' }
    | {
        type: 'json_schema';
        name: string;
        description?: string;
        schema: Record<string, unknown>;
        strict?: boolean;
    };

type OpenAiTextOptions = {
    instructions?: string;
    model?: string;
    responseFormat?: OpenAiTextFormat;
    maxOutputTokens?: number;
};

const cleanJson = (text: string) => text.replace(/```json\n?|\n?```/g, '').trim();

const getErrorMessage = async (response: Response) => {
    try {
        const payload = await response.json();
        return payload.error?.message || payload.message || `OpenAI request failed (${response.status})`;
    } catch {
        return `OpenAI request failed (${response.status})`;
    }
};

export async function generateOpenAiText(
    apiKey: string,
    input: string | Array<Record<string, unknown>>,
    options: OpenAiTextOptions = {},
): Promise<string> {
    try {
        const response = await fetch('/api/openai-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey,
                input,
                instructions: options.instructions,
                model: options.model || DEFAULT_OPENAI_TEXT_MODEL,
                responseFormat: options.responseFormat,
                maxOutputTokens: options.maxOutputTokens,
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
        const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
        if (!text) {
            throw new Error('OpenAI returned no text.');
        }

        return text;
    } catch (error: any) {
        console.error('Error generating OpenAI text:', error);
        if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
            throw new Error('OpenAI proxy request failed. If you are on local Vite dev, use Vercel deployment or `vercel dev` for OpenAI text generation.');
        }
        if (error.message?.includes('invalid_api_key')) {
            throw new Error('KEY_NOT_FOUND');
        }
        throw error;
    }
}

export async function generateOpenAiJson<T>(
    apiKey: string,
    input: string | Array<Record<string, unknown>>,
    options: Omit<OpenAiTextOptions, 'responseFormat'> & {
        schemaName: string;
        schema: Record<string, unknown>;
        schemaDescription?: string;
        strict?: boolean;
    },
): Promise<T> {
    const text = await generateOpenAiText(apiKey, input, {
        ...options,
        responseFormat: {
            type: 'json_schema',
            name: options.schemaName,
            description: options.schemaDescription,
            schema: options.schema,
            strict: options.strict,
        },
    });

    return JSON.parse(cleanJson(text)) as T;
}
