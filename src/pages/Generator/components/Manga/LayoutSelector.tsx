import React from 'react';
import { useTranslation } from 'react-i18next';
import { LAYOUT_OPTIONS } from './constants';
import { ComicLayout } from './types';

interface Props {
    selected: ComicLayout;
    onSelect: (layout: ComicLayout) => void;
}

export const LayoutSelector: React.FC<Props> = ({ selected, onSelect }) => {
    const { t } = useTranslation();

    // Helper to render custom SVG icons for each layout type
    const renderLayoutIcon = (type: ComicLayout) => {
        const commonClass = "w-full h-full fill-bronze-light/20 stroke-bronze-light stroke-2 group-hover:stroke-bronze transition-colors";
        const selectedClass = "fill-primary/20 stroke-primary";
        const isActive = selected === type;
        const className = `${commonClass} ${isActive ? selectedClass : ''}`;

        switch (type) {
            case ComicLayout.Single:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                    </svg>
                );
            case ComicLayout.TwoVertical:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="20" height="9" rx="1" />
                        <rect x="2" y="13" width="20" height="9" rx="1" />
                    </svg>
                );
            case ComicLayout.ThreeVertical:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="20" height="6" rx="1" />
                        <rect x="2" y="9" width="20" height="6" rx="1" />
                        <rect x="2" y="16" width="20" height="6" rx="1" />
                    </svg>
                );
            case ComicLayout.ThreeSplit:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="20" height="9" rx="1" />
                        <rect x="2" y="13" width="9" height="9" rx="1" />
                        <rect x="13" y="13" width="9" height="9" rx="1" />
                    </svg>
                );
            case ComicLayout.FourVertical:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="20" height="4" rx="1" />
                        <rect x="2" y="7" width="20" height="4" rx="1" />
                        <rect x="2" y="12" width="20" height="4" rx="1" />
                        <rect x="2" y="17" width="20" height="4" rx="1" />
                    </svg>
                );
            case ComicLayout.FourGrid:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="9" height="9" rx="1" />
                        <rect x="13" y="2" width="9" height="9" rx="1" />
                        <rect x="2" y="13" width="9" height="9" rx="1" />
                        <rect x="13" y="13" width="9" height="9" rx="1" />
                    </svg>
                );
            case ComicLayout.FiveMix:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <path d="M2 2h9v13H2z M13 2h9v6h-9z M13 10h9v5h-9z M2 17h11v5H2z M15 17h7v5h-7z" strokeLinejoin="round" />
                    </svg>
                );
            case ComicLayout.SixGrid:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="9" height="6" rx="1" />
                        <rect x="13" y="2" width="9" height="6" rx="1" />
                        <rect x="2" y="9" width="9" height="6" rx="1" />
                        <rect x="13" y="9" width="9" height="6" rx="1" />
                        <rect x="2" y="16" width="9" height="6" rx="1" />
                        <rect x="13" y="16" width="9" height="6" rx="1" />
                    </svg>
                );
            case ComicLayout.EightGrid:
                return (
                    <svg viewBox="0 0 24 24" className={className}>
                        <rect x="2" y="2" width="9" height="4.5" rx="0.5" />
                        <rect x="13" y="2" width="9" height="4.5" rx="0.5" />
                        <rect x="2" y="7.5" width="9" height="4.5" rx="0.5" />
                        <rect x="13" y="7.5" width="9" height="4.5" rx="0.5" />
                        <rect x="2" y="13" width="9" height="4.5" rx="0.5" />
                        <rect x="13" y="13" width="9" height="4.5" rx="0.5" />
                        <rect x="2" y="18.5" width="9" height="4.5" rx="0.5" />
                        <rect x="13" y="18.5" width="9" height="4.5" rx="0.5" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LAYOUT_OPTIONS.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onSelect(option.id)}
                    className={`
            group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
            ${selected === option.id
                            ? 'border-primary bg-primary/5 shadow-inner'
                            : 'border-cream-dark bg-white hover:border-primary/50 hover:bg-cream-light'}
          `}
                >
                    <div className="w-10 h-10 mb-2">
                        {renderLayoutIcon(option.id)}
                    </div>
                    <span className={`text-xs font-bold text-center ${selected === option.id ? 'text-primary' : 'text-bronze-light group-hover:text-bronze'}`}>
                        {t(`generator.manga.labels.options.layouts.${option.id}`)}
                    </span>
                </button>
            ))}
        </div>
    );
};
