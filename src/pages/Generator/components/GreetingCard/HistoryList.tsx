
import React from 'react';
import { useTranslation } from 'react-i18next';
import { History as HistoryIcon, Clock } from 'lucide-react';
import { HistoryItem } from './Constants';

interface HistoryListProps {
    history: HistoryItem[];
    currentId?: string;
    onSelect: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, currentId, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div className="col-span-1 lg:col-span-2 pt-8 border-t border-cream-dark/30">
            <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-6 flex items-center gap-2">
                <HistoryIcon size={16} /> {t('generator.greetingCard.history.title')}
            </h3>
            {history.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${currentId === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                        >
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-xs font-bold line-clamp-1">{item.title}</p>
                                <p className="text-white/70 text-[10px] flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 opacity-50 border-2 border-dashed border-cream-dark rounded-xl">
                    <HistoryIcon size={48} className="mx-auto text-bronze-light mb-2" />
                    <p className="text-bronze-light font-bold">{t('generator.greetingCard.history.emptyTitle')}</p>
                    <p className="text-xs text-bronze-light/70">{t('generator.greetingCard.history.emptyHint')}</p>
                </div>
            )}
        </div>
    );
};
