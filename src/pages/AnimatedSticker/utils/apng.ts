import UPNG from 'upng-js';

const APNG_CONTROL_CHUNK = 'acTL';

const crcTable = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    return value >>> 0;
});

const calculateCrc32 = (bytes: Uint8Array, start: number, length: number): number => {
    let crc = 0xffffffff;
    for (let index = start; index < start + length; index += 1) {
        crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const findChunk = (bytes: Uint8Array, type: string): { typeOffset: number; length: number } | null => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 8;
    while (offset + 12 <= bytes.length) {
        const length = view.getUint32(offset);
        const typeOffset = offset + 4;
        if (typeOffset + 4 + length + 4 > bytes.length) return null;
        const chunkType = String.fromCharCode(...bytes.slice(typeOffset, typeOffset + 4));
        if (chunkType === type) return { typeOffset, length };
        offset = typeOffset + 4 + length + 4;
    }
    return null;
};

export const getLineLoopCount = (durationSeconds: number): number => {
    const duration = Math.min(4, Math.max(1, Math.round(durationSeconds)));
    return Math.max(1, Math.min(4, Math.floor(4 / duration)));
};

export const getApngLoopCount = (buffer: ArrayBuffer): number | null => {
    const bytes = new Uint8Array(buffer);
    const chunk = findChunk(bytes, APNG_CONTROL_CHUNK);
    if (!chunk || chunk.length < 8) return null;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(chunk.typeOffset + 8);
};

export const setApngLoopCount = (buffer: ArrayBuffer, loopCount: number): ArrayBuffer => {
    const bytes = new Uint8Array(buffer.slice(0));
    const chunk = findChunk(bytes, APNG_CONTROL_CHUNK);
    if (!chunk || chunk.length < 8) return bytes.buffer;

    const view = new DataView(bytes.buffer);
    view.setUint32(chunk.typeOffset + 8, Math.max(1, Math.min(4, Math.round(loopCount))));
    const crc = calculateCrc32(bytes, chunk.typeOffset, 4 + chunk.length);
    view.setUint32(chunk.typeOffset + 4 + chunk.length, crc);
    return bytes.buffer;
};

export const encodeAnimatedPng = (
    frames: Uint8ClampedArray[],
    width: number,
    height: number,
    durationMs: number,
    colorCount: number,
): { buffer: ArrayBuffer; loopCount: number } => {
    const roundedDurationMs = Math.round(durationMs);
    const baseFrameDelay = Math.floor(roundedDurationMs / frames.length);
    const remainder = roundedDurationMs % frames.length;
    const frameDelays = Array.from(
        { length: frames.length },
        (_, index) => baseFrameDelay + (index < remainder ? 1 : 0),
    );
    const buffers = frames.map((frame) => new Uint8ClampedArray(frame).buffer);
    const encoded = UPNG.encode(
        buffers,
        width,
        height,
        colorCount,
        frameDelays,
    );
    const loopCount = getLineLoopCount(durationMs / 1000);
    return { buffer: setApngLoopCount(encoded, loopCount), loopCount };
};

export const encodeStaticPng = (
    frame: Uint8ClampedArray,
    width: number,
    height: number,
): ArrayBuffer => UPNG.encode(
    [new Uint8ClampedArray(frame).buffer],
    width,
    height,
    0,
);
