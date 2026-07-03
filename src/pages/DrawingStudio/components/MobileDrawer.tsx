import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useModalA11y } from '../../../hooks/useModalA11y';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    titleId: string;
    title: string;
    children: React.ReactNode;
}

// Mobile bottom-sheet drawer for DrawingStudio side panels (brush/layers/tools).
// Mirrors the pattern used in ImageEditor/SmartRemoveTab.tsx.
export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, titleId, title, children }) => {
    const { t } = useTranslation();
    const drawerRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

    if (!isOpen) return null;

    return (
        <div className="lg:hidden fixed inset-0 z-40" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40" />
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="absolute inset-x-0 bottom-0 max-h-[78dvh] rounded-t-3xl border-t border-cream-dark bg-white p-4 shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-3 flex items-center justify-between">
                    <h3 id={titleId} className="text-sm font-bold text-bronze-text">{title}</h3>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg border border-cream-dark bg-cream-light text-bronze-text flex items-center justify-center"
                        title={t('common.close', { defaultValue: '關閉' })}
                        aria-label={t('common.close', { defaultValue: '關閉' })}
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="space-y-4 pb-4">{children}</div>
            </div>
        </div>
    );
};
