
export type ProcessingStatus = 'idle' | 'removing_bg' | 'splitting' | 'formatting' | 'success' | 'error';
export type ExportPreset = 'none' | 'line' | 'telegram';
export type OutputFormat = 'png' | 'webp';

export interface SplitConfig {
  rows: number;
  cols: number;
  useAI: boolean;
  tolerance: number;
  protectInternal: boolean;
  retainText: boolean;
  manualMode: boolean;
  rowLines: number[];
  colLines: number[];
  scaleFactor: number;
  allowOuterCrop: boolean;

  // 輸出設定
  preset: ExportPreset;
  margin: number;
  outputFormat: OutputFormat;
  filenamePrefix: string;

  // 貼圖美化加工
  useStroke: boolean;
  strokeThickness: number;
  strokeColor: string;
  useDoubleStroke: boolean;
  secondStrokeThickness: number;
  secondStrokeColor: string;
  useShadow: boolean;
  useFeathering: boolean;
}
