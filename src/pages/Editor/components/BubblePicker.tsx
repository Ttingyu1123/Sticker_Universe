import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';

interface BubblePickerProps {
    onSelect: (svgContent: string) => void;
    onClose: () => void;
}

export const BubblePicker: React.FC<BubblePickerProps> = ({ onSelect, onClose }) => {
    const { t } = useTranslation();

    const bubbles = [
        {
            name: t('editor.bubblePicker.standard') || 'Standard',
            svg: `<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M360 40H40C23.4315 40 10 53.4315 10 70V200C10 216.569 23.4315 230 40 230H80V280L160 230H360C376.569 230 390 216.569 390 200V70C390 53.4315 376.569 40 360 40Z" fill="white" stroke="black" stroke-width="8" stroke-linejoin="round"/>
</svg>`
        },
        {
            name: t('editor.bubblePicker.thought') || 'Thought',
            svg: `<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M70 150C30 150 10 120 10 90C10 60 40 40 70 40C80 10 130 10 150 30C170 10 230 10 250 40C290 10 350 40 360 80C390 80 400 120 380 150C400 180 380 220 340 230C340 260 290 270 260 250C230 280 170 280 150 250C110 270 70 250 60 220C20 210 10 180 30 150Z" fill="white" stroke="black" stroke-width="8" stroke-linejoin="round"/>
<circle cx="80" cy="270" r="10" fill="white" stroke="black" stroke-width="4"/>
<circle cx="60" cy="290" r="6" fill="white" stroke="black" stroke-width="4"/>
</svg>`
        },
        {
            name: t('editor.bubblePicker.shout') || 'Shout',
            svg: `<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M370 100 L390 40 L330 60 L300 10 L260 50 L200 10 L160 50 L100 10 L80 60 L20 40 L50 100 L10 150 L50 200 L20 260 L80 240 L100 290 L160 250 L200 290 L260 250 L300 290 L330 240 L390 260 L360 200 L390 150 Z" fill="white" stroke="black" stroke-width="8" stroke-linejoin="round"/>
</svg>`
        },
        {
            name: t('editor.bubblePicker.oval') || 'Oval',
            svg: `<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="200" cy="140" rx="180" ry="110" fill="white" stroke="black" stroke-width="8" />
<path d="M120 230 L100 280 L180 240" fill="white" stroke="black" stroke-width="8" stroke-linejoin="round"/>
<path d="M115 231 L175 241" stroke="white" stroke-width="10" />
</svg>`
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-indigo-50 bg-indigo-50/30">
                    <h2 className="text-xl font-bold text-indigo-900">
                        {t('editor.bubblePicker.chooseStyle') || 'Select Bubble Style'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-indigo-300 hover:text-indigo-600 hover:bg-white rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                    {bubbles.map((bubble, index) => (
                        <button
                            key={bubble.name}
                            onClick={() => onSelect(bubble.svg)}
                            className="group relative flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                        >
                            <div
                                className="w-full aspect-[4/3] flex items-center justify-center p-2"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bubble.svg.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"'), { USE_PROFILES: { svg: true } }) }}
                            />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600">
                                {bubble.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
