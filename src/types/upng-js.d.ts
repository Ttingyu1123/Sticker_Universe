declare module 'upng-js' {
    interface UpngApi {
        encode(
            buffers: ArrayBuffer[],
            width: number,
            height: number,
            colorCount: number,
            delays?: number[],
        ): ArrayBuffer;
    }

    const UPNG: UpngApi;
    export default UPNG;
}
