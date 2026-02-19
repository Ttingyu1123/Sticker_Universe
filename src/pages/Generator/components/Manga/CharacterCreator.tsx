import { useState } from 'react';
import { Character } from './types';
import { useTranslation } from 'react-i18next';
import { Plus, X, Upload, User, FolderHeart } from 'lucide-react';
import { MAX_CHARACTERS } from './constants';
import { GalleryPicker } from '../../../../components/GalleryPicker';

interface Props {
    characters: Character[];
    onChange: (chars: Character[]) => void;
}

export const CharacterCreator: React.FC<Props> = ({ characters, onChange }) => {
    const { t } = useTranslation();
    const [showGalleryPicker, setShowGalleryPicker] = useState(false);
    const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
    const handleAddCharacter = () => {
        if (characters.length >= MAX_CHARACTERS) return;
        const newChar: Character = {
            id: crypto.randomUUID(),
            name: '',
            description: '',
            image: null,
            previewUrl: null
        };
        onChange([...characters, newChar]);
    };

    const handleRemove = (id: string) => {
        onChange(characters.filter(c => c.id !== id));
    };

    const handleUpdate = (id: string, field: keyof Character, value: any) => {
        onChange(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleImageUpload = (id: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            onChange(characters.map(c => {
                if (c.id === id) {
                    return {
                        ...c,
                        previewUrl: reader.result as string,
                        image: file
                    };
                }
                return c;
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0 && activeCharacterId) {
            const blob = blobs[0];
            const file = new File([blob], `manga_char_${Date.now()}.png`, { type: blob.type || 'image/png' });
            handleImageUpload(activeCharacterId, file);
        }
        setShowGalleryPicker(false);
        setActiveCharacterId(null);
    };

    return (
        <div className="space-y-4">
            {characters.map((char) => (
                <div key={char.id} className="relative group bg-white border border-cream-dark rounded-xl p-3 transition-all hover:shadow-sm">
                    <button
                        onClick={() => handleRemove(char.id)}
                        className="absolute -top-2 -right-2 p-1 bg-white border border-cream-dark hover:bg-red-50 text-red-400 hover:text-red-500 rounded-full shadow-sm transition-colors z-20"
                    >
                        <X className="w-3 h-3" />
                    </button>

                    <div className="flex gap-4">
                        {/* Image Upload Area */}
                        <div className="shrink-0 relative w-16 h-16 bg-cream-light rounded-lg border border-dashed border-cream-dark flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-colors">
                            {char.previewUrl ? (
                                <img src={char.previewUrl} alt={char.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-bronze-light" />
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                title="Upload reference image"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(char.id, file);
                                }}
                            />
                            {!char.previewUrl && (
                                <div className="absolute bottom-1 right-1 pointer-events-none">
                                    <Upload className="w-3 h-3 text-bronze-light/70" />
                                </div>
                            )}
                        </div>

                        {/* Inputs */}
                        <div className="flex-1 space-y-2 min-w-0">
                            <input
                                type="text"
                                placeholder={t('generator.manga.labels.characterName')}
                                value={char.name}
                                onChange={(e) => handleUpdate(char.id, 'name', e.target.value)}
                                className="w-full bg-cream-light border border-cream-dark rounded-md px-2 py-1.5 text-xs text-bronze-text focus:border-primary outline-none font-bold placeholder-bronze-light/50"
                                aria-label={t('generator.manga.labels.characterName')}
                            />
                            <textarea
                                placeholder={t('generator.manga.labels.appearance')}
                                value={char.description}
                                onChange={(e) => handleUpdate(char.id, 'description', e.target.value)}
                                className="w-full bg-cream-light border border-cream-dark rounded-md px-2 py-1.5 text-xs text-bronze-text focus:border-primary outline-none resize-none h-14 leading-tight placeholder-bronze-light/50"
                                aria-label={t('generator.manga.labels.appearance')}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveCharacterId(char.id);
                                    setShowGalleryPicker(true);
                                }}
                                className="w-full px-2 py-1.5 rounded-md border border-secondary/20 bg-secondary/5 text-bronze-text text-xs font-bold hover:bg-secondary/10 transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                                <FolderHeart className="w-3 h-3" />
                                {t('app.selectFromGallery') || 'From Gallery'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {characters.length < MAX_CHARACTERS && (
                <button
                    onClick={handleAddCharacter}
                    className="w-full flex items-center justify-center p-3 border border-dashed border-cream-dark rounded-xl bg-white hover:bg-cream-light hover:border-primary/50 hover:text-primary text-bronze-light transition-all text-sm gap-2 font-bold"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('generator.manga.actions.addCharacter')}</span>
                </button>
            )}

            {showGalleryPicker && (
                <GalleryPicker
                    onSelect={handleGallerySelect}
                    onClose={() => {
                        setShowGalleryPicker(false);
                        setActiveCharacterId(null);
                    }}
                />
            )}
        </div>
    );
};
