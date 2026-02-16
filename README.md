# ✨ Sticker Universe (CreativeOS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)

> **Sticker Universe (CreativeOS)** is a unified creative suite for designing, generating, and packaging digital content. It consolidates AI generation, image processing, background removal, and creative layouts into a single powerful web application.
>
> **Sticker Universe (CreativeOS)** 是一個專為創作者打造的綜合創意套件。它將 AI 生成、圖片編輯、自動去背、拼貼排版等功能整合在一個強大的網頁應用中。

---

## 📑 Table of Contents / 目錄

- [✨ Features / 功能特色](#-features--功能特色)
- [🛠️ Installation / 安裝說明](#️-installation--安裝說明)
- [📖 Usage Guide / 使用指南](#-usage-guide--使用指南)
- [🔧 Tech Stack / 技術棧](#-tech-stack--技術棧)
- [📝 License / 授權](#-license--授權)

---

## ✨ Features / 功能特色

| Module | Features (English) | 功能特色 (中文) |
| :--- | :--- | :--- |
| **🚀 Generator** | **AI Sticker Generation**<br>Powered by Google Gemini. Generate unique stickers from text prompts with consistent character styles. | **AI 貼圖生成器**<br>基於 Google Gemini 模型。從文字提示生成風格一致的貼圖角色。 |
| **📦 Packager** | **Batch Processor**<br>Local AI background removal (`@imgly`), auto-stroke/shadow effects, and batch export for Line/Telegram. | **批量打包工具**<br>本地端 AI 自動去背 (`@imgly`)、自動加白邊/陰影，支援 Line/Telegram 規格批量導出。 |
| **🎨 Editor** | **Visual Composition**<br>Layer-based editor with drag-and-drop support, text tools, and element composition. | **圖層編輯器**<br>支援拖放操作的圖層編輯系統，提供文字工具與素材合成功能。 |
| **🪄 Eraser** | **Magic Eraser**<br>Manual background refinement tool for precise edits on generated assets. | **魔術橡皮擦**<br>用於微調去背結果的手動修圖工具。 |

---

## 🛠️ Installation / 安裝說明

### Prerequisites / 前置需求

- **Node.js** (v18 or higher recommended)
- **Git**

### Steps / 步驟

1. **Clone the repository / 下載專案**

    ```bash
    git clone https://github.com/Ttingyu1123/Sticker_Universe.git
    cd Sticker_Universe
    ```

2. **Install Dependencies / 安裝依賴**

    ```bash
    npm install
    # This project uses modern Vite + Tailwind CSS v4, ensure a clean install if updating.
    ```

3. **Start Development Server / 啟動開發伺服器**

    ```bash
    npm run dev
    ```

4. **Open Browser / 開啟瀏覽器**
    Visit `http://localhost:5173` to start using the app.

---

## 📖 Usage Guide / 使用指南

### 1. Setup API Key (Generator)

- The **Generator** tool requires a Google Gemini API Key.
- Click the **Settings (設定)** icon in the Generator app.
- Paste your API Key. It is stored locally in your browser (`localStorage`).
- **中文**: 進入 Generator 頁面，點擊設定圖示，輸入您的 Google Gemini API Key。金鑰僅儲存於您的瀏覽器本地端。

### 2. Create Stickers

- **Prompting**: Enter a prompt (e.g., "A cute cat eating pizza").
- **Style**: Choose a predefined style (e.g., Anime, Watercolor).
- **Generate**: Click generate to create assets.

### 3. Package & Export

- **Import**: Send generated images to the **Packager**.
- **Process**: The app automatically removes backgrounds.
- **Stylize**: Add white strokes (stickers effect) or shadows.
- **Export**: Download as a ZIP file formatted for Line or Telegram.

---

## 🔧 Tech Stack / 技術棧

**Core Framework**

- **React 19**: Modern UI library with Hooks and Suspense.
- **Vite 6**: Next-generation frontend tooling.
- **TypeScript**: Type-safe code.

**Styling & UI**

- **Tailwind CSS v4**: Latest utility-first CSS engine.
- **Lucide React**: Beautiful vector icons.
- **Framer Motion**: Smooth animations.

**AI & Processing**

- **Google GenAI SDK**: Interface for Gemini models.
- **@imgly/background-removal**: Client-side WASM-based background removal.
- **JSZip**: Browser-side file packaging.

---

## 📝 License / 授權

This project is open-source and available under the **MIT License**.
See the [LICENSE](LICENSE) file for more information.

---
*Created with ❤️ by Antigravity*
