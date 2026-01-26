# Troubleshooting Log

## [2025-01-26] @imgly/background-removal Failure (Sticker Universe Integration)

### 🔴 Symptoms

1. **"Unexpected token '<'"**:
    * Console error when loading library.
    * Network tab shows `200 OK` for `.wasm` or `.json` files, but the response is `text/html` (the App Shell/index.html).
2. **"WebAssembly.instantiate(): expected magic word..."**:
    * Similar to above. The browser tried to compile the file but received HTML (DocType `<!DOCTYPE html>`) instead of the WASM binary header (`\0asm`).
3. **"Error: Failed to fetch ... with size undefined"**:
    * The library successfully loads `resources.json` but crashes when processing it.
    * Indicates the library expected a `size` property for each chunk, but the JSON file didn't have it.

### 🔍 Root Causes

1. **Version Mismatch (The "Silent Upgrade")**:
    * `package.json` had `^1.3.0`.
    * `npm install` resolved `@imgly/background-removal` to `1.7.0` (latest).
    * `@imgly/background-removal-data` matches the requested version (e.g., `1.4.5`), causing a schema mismatch.
    * *Result:* Library 1.7.0 requires a newer manifest schema (with `size` property) than Data 1.4.5 provides.
2. **PWA Interception (The "Offline" Trap)**:
    * `vite-plugin-pwa` is configured to cache navigation requests (SPA behavior).
    * Requesting `/imgly-data/file.wasm` isn't an "asset" in the build pipeline (it's in `public/`), so the Service Worker treated it as a "Navigation" and served the fallback `index.html`.
    * *Result:* Browser gets HTML instead of WASM => Magic Word / Token errors.

### ✅ Solution

1. **Strict Version Pinning**:
    * Ensure **both** packages are pinned to exact versions that match.
    * `package.json`:

        ```json
        "@imgly/background-removal": "1.4.5",
        "@imgly/background-removal-data": "1.4.5"
        ```

2. **Vite / PWA Configuration**:
    * Explicitly exclude the AI assets folder from the PWA's navigation fallback.
    * `vite.config.ts`:

        ```ts
        workbox: {
            navigateFallbackDenylist: [/^\/imgly-data/]
        }
        ```

    * This tells the Service Worker: "If the URL starts with `/imgly-data/`, do NOT serve index.html. Let it go to the network/server."

### 📝 Key Takeaways

* **Always check `npm view [package] version`**: Don't trust `package.json` carets (`^`).
* **"Unexpected token <" almost always means you got HTML instead of Code**: Check your 404s and SPA routing rules.
* **PWA and Public Assets**: Dynamic assets in `public/` (like AI models) need explicit exceptions in Service Workers if they mimic route paths.
