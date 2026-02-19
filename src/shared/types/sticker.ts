export interface Sticker {
    id: string;
    imageUrl: string;
    phrase: string;
    semanticLabel?: string;
    qcIssues?: string[];
    timestamp: number;
    description?: string;
}
