export interface CharacterTag {
  zh: string;
  en: string;
}

export type CharacterCategoryKey =
  | 'character'
  | 'pose'
  | 'outfit'
  | 'env'
  | 'color'
  | 'shot'
  | 'style'
  | 'light'
  | 'rare';

export type CharacterWorldMode =
  | 'fantasy'
  | 'modern'
  | 'scifi'
  | 'historical'
  | 'horror'
  | 'oriental';

export interface CharacterPromptState {
  character: string;
  pose: string;
  outfit: string;
  env: string;
  color: string;
  shot: string;
  style: string;
  light: string;
  rare: string;
  negative: string;
}

export type CharacterWorldData = Record<
  CharacterWorldMode,
  {
    character: CharacterTag[];
    pose: CharacterTag[];
    outfit: CharacterTag[];
    env: CharacterTag[];
    rare: CharacterTag[];
  }
>;
