---
name: Gemini Image Generation BYOK
description: Implementation guide for using Gemini 3 Pro Image Preview with a Bring Your Own Key (BYOK) architecture.
---

# Gemini Image Generation & BYOK Implementation

This skill outlines how to implement a secure, client-side "Bring Your Own Key" (BYOK) pattern for using Google's `gemini-3-pro-image-preview` model to generate images.

## 1. Dependencies

Ensure you have the official Google GenAI SDK installed:

```bash
npm install @google/genai
```

## 2. BYOK Architecture (React)

The core principle is to store the API key in the user's browser (LocalStorage) and never on your server.

### State Management & Persistence

```typescript
// App.tsx
import React, { useState, useEffect } from 'react';

const App = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [showKeyModal, setShowKeyModal] = useState(false);

    // Load key on mount
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            setShowKeyModal(true);
        }
    }, []);

    const handleSaveKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        setShowKeyModal(false);
    };

    const handleClearKey = () => {
        setApiKey('');
        localStorage.removeItem('gemini_api_key');
        setShowKeyModal(true);
    };

    // ... render UI
};
```

### API Service Layer

Pass the `apiKey` from the component state down to the service functions. Do not import it from environment variables.

## 3. Gemini Image Generation Implementation

The `gemini-3-pro-image-preview` model requires specific configuration for image output.

### Service Function

```typescript
// geminiService.ts
import { GoogleGenAI } from "@google/genai";

export async function generateImage(
  apiKey: string,
  prompt: string,
  base64ReferenceImage?: string // Optional reference image
): Promise<string> {
  // 1. Initialize Client with User's Key
  const ai = new GoogleGenAI({ apiKey });

  // 2. Select Model
  const model = 'gemini-3-pro-image-preview';

  // 3. Configuration (Critical for Image Gen)
  const config = {
    imageConfig: {
      aspectRatio: "1:1", // Options: "1:1", "4:3", "3:4", "16:9", "9:16"
      imageSize: "1K"    // Options: "1K"
    }
  };

  // 4. Construct Content Parts
  const parts: any[] = [{ text: prompt }];

  // Add reference image if provided (Image-to-Image)
  if (base64ReferenceImage) {
    parts.unshift({
      inlineData: {
        data: base64ReferenceImage.split(',')[1], // Remove header
        mimeType: 'image/jpeg',
      },
    });
  }

  try {
    // 5. Generate Content
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts }],
      config: config
    });

    // 6. Extract Image from Response
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error("No image generated.");

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
}
```

## 4. Best Practices

- **Model Name**: Always use `gemini-3-pro-image-preview` for generation tasks.
- **Safety Settings**: The image model has strict safety filters. Handle finish reasons other than `STOP`.
- **Error Handling**: specifically check for 401/403 errors to prompt the user to re-enter their key.

```typescript
if (error.message?.includes("403") || error.message?.includes("401")) {
    // Trigger UI to show Key Modal
}
```
