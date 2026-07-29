export interface PixelCropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FixedCropPreviewTransform {
    widthPercent: number;
    heightPercent: number;
    leftPercent: number;
    topPercent: number;
}

const positiveInteger = (value: number, fallback = 1): number => (
    Number.isFinite(value) ? Math.max(1, Math.round(value)) : fallback
);

export const movePixelCrop = (
    crop: PixelCropRect,
    x: number,
    y: number,
    imageWidth: number,
    imageHeight: number,
): PixelCropRect => {
    const safeImageWidth = positiveInteger(imageWidth);
    const safeImageHeight = positiveInteger(imageHeight);
    const width = Math.min(positiveInteger(crop.width), safeImageWidth);
    const height = Math.min(positiveInteger(crop.height), safeImageHeight);

    return {
        x: Math.max(0, Math.min(safeImageWidth - width, Math.round(x))),
        y: Math.max(0, Math.min(safeImageHeight - height, Math.round(y))),
        width,
        height,
    };
};

export const createCenteredPixelCrop = (
    imageWidth: number,
    imageHeight: number,
    cropWidth: number,
    cropHeight: number,
): PixelCropRect => {
    const safeImageWidth = positiveInteger(imageWidth);
    const safeImageHeight = positiveInteger(imageHeight);
    const width = Math.min(positiveInteger(cropWidth), safeImageWidth);
    const height = Math.min(positiveInteger(cropHeight), safeImageHeight);

    return movePixelCrop(
        { x: 0, y: 0, width, height },
        (safeImageWidth - width) / 2,
        (safeImageHeight - height) / 2,
        safeImageWidth,
        safeImageHeight,
    );
};

export const resizePixelCrop = (
    crop: PixelCropRect,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
): PixelCropRect => {
    const nextWidth = Math.min(positiveInteger(width), positiveInteger(imageWidth));
    const nextHeight = Math.min(positiveInteger(height), positiveInteger(imageHeight));
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;

    return movePixelCrop(
        { x: 0, y: 0, width: nextWidth, height: nextHeight },
        centerX - nextWidth / 2,
        centerY - nextHeight / 2,
        imageWidth,
        imageHeight,
    );
};

export const getMinimumImageScale = (
    cropWidth: number,
    cropHeight: number,
    imageWidth: number,
    imageHeight: number,
): number => Math.max(
    positiveInteger(cropWidth) / positiveInteger(imageWidth),
    positiveInteger(cropHeight) / positiveInteger(imageHeight),
);

const getSafeImageScale = (
    crop: PixelCropRect,
    imageScale: number,
    imageWidth: number,
    imageHeight: number,
): number => Math.max(
    Number.isFinite(imageScale) ? imageScale : 1,
    getMinimumImageScale(crop.width, crop.height, imageWidth, imageHeight),
);

export const getScaledSourceCrop = (
    crop: PixelCropRect,
    imageScale: number,
    imageWidth: number,
    imageHeight: number,
): PixelCropRect => {
    const safeImageWidth = positiveInteger(imageWidth);
    const safeImageHeight = positiveInteger(imageHeight);
    const safeScale = getSafeImageScale(crop, imageScale, safeImageWidth, safeImageHeight);
    const width = crop.width / safeScale;
    const height = crop.height / safeScale;

    return {
        x: Math.max(0, Math.min(safeImageWidth - width, crop.x)),
        y: Math.max(0, Math.min(safeImageHeight - height, crop.y)),
        width,
        height,
    };
};

export const getFixedCropPreviewTransform = (
    imageWidth: number,
    imageHeight: number,
    sourceCrop: PixelCropRect,
): FixedCropPreviewTransform => {
    const safeImageWidth = positiveInteger(imageWidth);
    const safeImageHeight = positiveInteger(imageHeight);
    const sourceWidth = Math.max(Number.EPSILON, sourceCrop.width);
    const sourceHeight = Math.max(Number.EPSILON, sourceCrop.height);

    return {
        widthPercent: safeImageWidth / sourceWidth * 100,
        heightPercent: safeImageHeight / sourceHeight * 100,
        leftPercent: -sourceCrop.x / sourceWidth * 100,
        topPercent: -sourceCrop.y / sourceHeight * 100,
    };
};

export const movePixelCropAtScale = (
    crop: PixelCropRect,
    x: number,
    y: number,
    imageWidth: number,
    imageHeight: number,
    imageScale: number,
): PixelCropRect => {
    const safeImageWidth = positiveInteger(imageWidth);
    const safeImageHeight = positiveInteger(imageHeight);
    const sourceCrop = getScaledSourceCrop(
        { ...crop, x: 0, y: 0 },
        imageScale,
        safeImageWidth,
        safeImageHeight,
    );

    return {
        ...crop,
        x: Math.max(0, Math.min(Math.floor(safeImageWidth - sourceCrop.width), Math.round(x))),
        y: Math.max(0, Math.min(Math.floor(safeImageHeight - sourceCrop.height), Math.round(y))),
    };
};

export const changePixelCropScale = (
    crop: PixelCropRect,
    previousScale: number,
    nextScale: number,
    imageWidth: number,
    imageHeight: number,
): PixelCropRect => {
    const previousSourceCrop = getScaledSourceCrop(
        crop,
        previousScale,
        imageWidth,
        imageHeight,
    );
    const nextSourceCrop = getScaledSourceCrop(
        { ...crop, x: 0, y: 0 },
        nextScale,
        imageWidth,
        imageHeight,
    );
    const centerX = previousSourceCrop.x + previousSourceCrop.width / 2;
    const centerY = previousSourceCrop.y + previousSourceCrop.height / 2;

    return movePixelCropAtScale(
        crop,
        centerX - nextSourceCrop.width / 2,
        centerY - nextSourceCrop.height / 2,
        imageWidth,
        imageHeight,
        nextScale,
    );
};

export const resizePixelCropAtScale = (
    crop: PixelCropRect,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    imageScale: number,
): PixelCropRect => {
    const currentSourceCrop = getScaledSourceCrop(
        crop,
        imageScale,
        imageWidth,
        imageHeight,
    );
    const nextCrop = {
        x: 0,
        y: 0,
        width: Math.min(positiveInteger(width), positiveInteger(imageWidth)),
        height: Math.min(positiveInteger(height), positiveInteger(imageHeight)),
    };
    const nextSourceCrop = getScaledSourceCrop(
        nextCrop,
        imageScale,
        imageWidth,
        imageHeight,
    );
    const centerX = currentSourceCrop.x + currentSourceCrop.width / 2;
    const centerY = currentSourceCrop.y + currentSourceCrop.height / 2;

    return movePixelCropAtScale(
        nextCrop,
        centerX - nextSourceCrop.width / 2,
        centerY - nextSourceCrop.height / 2,
        imageWidth,
        imageHeight,
        imageScale,
    );
};

export const extractRgbaCrop = (
    frame: Uint8ClampedArray,
    imageWidth: number,
    imageHeight: number,
    crop: PixelCropRect,
): Uint8ClampedArray => {
    const width = positiveInteger(imageWidth);
    const height = positiveInteger(imageHeight);
    if (frame.length !== width * height * 4) {
        throw new RangeError('RGBA frame dimensions do not match its pixel data.');
    }

    const safeCrop = movePixelCrop(crop, crop.x, crop.y, width, height);
    const output = new Uint8ClampedArray(safeCrop.width * safeCrop.height * 4);

    for (let row = 0; row < safeCrop.height; row += 1) {
        const sourceStart = ((safeCrop.y + row) * width + safeCrop.x) * 4;
        const sourceEnd = sourceStart + safeCrop.width * 4;
        output.set(frame.subarray(sourceStart, sourceEnd), row * safeCrop.width * 4);
    }

    return output;
};
