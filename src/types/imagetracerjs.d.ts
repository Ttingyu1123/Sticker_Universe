declare module 'imagetracerjs' {
  interface ImageTracerOptions {
    [key: string]: unknown;
  }

  interface ImageTracerStatic {
    imageToSVG(
      url: string,
      callback: (svgstr: string) => void,
      options?: ImageTracerOptions
    ): void;
  }

  const ImageTracer: ImageTracerStatic;
  export default ImageTracer;
}
