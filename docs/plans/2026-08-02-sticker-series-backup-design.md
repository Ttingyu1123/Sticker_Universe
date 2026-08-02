# Sticker Series Portable Backup Design

## Goal

Allow users to download a lightweight, durable backup of an AI sticker series and later import it either to continue producing that series or to add its concepts to the duplicate-avoidance list. The browser's 20-series local archive remains a convenient cache rather than the only copy.

## User experience

The AI sticker series workspace adds two explicit actions:

- **Download series backup** exports the current series as `<series-name>.sticker-series.zip`.
- **Import series backup** accepts that ZIP and shows a summary before the user chooses either **Continue this series** or **Use only to avoid repeats**.

Export is available after at least one batch has been completed. Import never silently replaces the active workspace. The confirmation dialog shows the series name, completed sticker count, export date, and whether every completed batch contains its original generation prompt.

Continuing a series restores the reference image, character description and analysis, art settings, required captions, completed batches, current draft concepts, and recorded generation prompts. Importing only for duplicate avoidance appends or replaces one local archive by ID, selects it for exclusion, and leaves the active workspace untouched.

## File format

The ZIP contains only:

```text
manifest.json
reference-image.<png|jpg|webp>
```

`manifest.json` has a stable format marker (`sticker-universe-series`), integer version (`1`), series/export timestamps, reference-image filename, and a project payload. The payload includes:

- series ID and name;
- character description and AI character summary;
- style, background color, and caption-rendering preference;
- required captions;
- completed batches and any current draft concepts;
- for each completed batch, its concepts, signature, creation time, exact generation prompt, provider, and model.

API keys, generated 4×2 images, Gallery records, Blob URLs, and other browser-specific identifiers are never exported.

## Data model and compatibility

`StickerSeriesBatch` gains optional generation metadata. It remains optional so existing local data continues to load. New and regenerated batches record the exact prompt and the provider/model used at generation time. `StickerSeriesArchive` remains concept-focused for local duplicate prevention; imported backups can be converted into that existing shape without storing the reference image in `localStorage`.

The ZIP parser validates the marker, version, style, dimensions of arrays, required string fields, and referenced image entry before returning a normalized project. Unsupported versions and malformed archives produce localized errors without changing current state. Old series created before this feature can still be backed up, but unavailable historical prompts remain absent and are reported as incomplete.

## Implementation architecture

A focused `seriesBackup.ts` module owns manifest creation, ZIP serialization/parsing, image conversion, validation, and safe filename generation. It uses the existing JSZip dependency and returns browser-native `Blob`/data URL values. The generator controller owns UI state and applies the two import modes, while the workspace renders buttons, a hidden file input, and the confirmation dialog.

The controller persists continued-series batches to the existing series local-storage key and persists duplicate-only imports through the existing capped archive helpers. Downloaded files are independent of the 20-entry cap.

## Error handling and testing

Export rejects missing reference images and empty completed series. Import rejects files over the configured limit, invalid ZIPs, missing manifests/images, unsupported versions, and malformed concepts. All failures use localized toasts and are non-destructive.

Unit tests cover round-trip ZIP serialization, prompt/provider/model preservation, omission of API keys and generated images, filename sanitization, legacy batches without prompts, and invalid archives. Series tests cover generation metadata. Source integration tests verify both import modes, file controls, localized labels, and preservation of the existing 20-entry cap. Full TypeScript, test, and production-build verification completes the change.
