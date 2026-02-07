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

## 5. Advanced Implementation Patterns

### A. Two-Step Generation Flow (Prompt Optimization)

For high-quality results, use a two-step process:

1. **Text Generation**: Use `gemini-3-pro-image-preview` to act as a "Prompt Engineer", converting user intent into a detailed English visual prompt (and optional structured data like JSON).
2. **Image Generation**: Use the generated visual prompt to create the actual image.

```typescript
// 1. Prompt Optimization (Text Mode)
const optimizePrompt = `You are a professional designer.
Inputs: "${userBuffer}"
Output: JSON with "visualPrompt" (detailed English description) and "title".`;

const textResult = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [{ text: optimizePrompt }] }],
    config: { responseMimeType: "application/json" }
});

// SANITIZATION: Strip Markdown code blocks from JSON response
const rawText = textResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
const jsonString = rawText.replace(/```json\n?|\n?```/g, '').trim();
const metadata = JSON.parse(jsonString);

// 2. Image Generation (Image Mode)
const imageResult = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [{ text: metadata.visualPrompt }] }],
    config: {
        imageConfig: { aspectRatio: "3:4", imageSize: "1K" }
    }
});
```

### B. Robustness & Error Handling

#### 1. Rendering Crashes (The "Blank Screen" Issue)

When using AI-generated JSON content in React, **ALWAYS** enforce string types. AI might return objects or arrays for fields you expect to be strings, which causes React to crash immediately (Blank Screen).

```typescript
// BAD: causing crash if title is an object
// <div>{metadata.title}</div> 

// GOOD: Safe Rendering
const safeData = {
    title: String(metadata.title || ""), // Force string
    description: String(metadata.description || "")
};
```

#### 2. LocalStorage Quota Management

Base64 images are large. Storing them in `localStorage` history will quickly hit the quota limit (usually 5MB), causing `QuotaExceededError` and crashing the app.

- **Limit History Size**: Keep only the last 3-5 items.
- **Try-Catch Block**: Always wrap `setItem` in a try-catch block.

```typescript
useEffect(() => {
    try {
        localStorage.setItem('history', JSON.stringify(history));
    } catch (e) {
        console.error("Storage quota exceeded", e);
        // Handle gracefully (e.g., pop oldest item and retry)
    }
}, [history]);
```
