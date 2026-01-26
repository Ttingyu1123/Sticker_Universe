
export interface EditorState {
  image: HTMLImageElement | null;
  brushSize: number;
  history: string[];
  historyIndex: number;
}

export type Point = {
  x: number;
  y: number;
};
