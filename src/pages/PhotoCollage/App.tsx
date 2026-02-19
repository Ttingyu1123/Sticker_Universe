import React from 'react';
import { useTranslation } from 'react-i18next';
import { AutoCollageTab } from './AutoCollageTab';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

export const PhotoCollageApp = () => {
    const { t } = useTranslation();

    return (
        <div className="pb-20 select-none font-sans text-bronze-text bg-background">
            {/* Main Content */}
            <main className="container mx-auto px-4 max-w-[1920px]">
                <div className="min-h-[calc(100dvh-120px)] md:h-[calc(100dvh-120px)] w-full bg-cream-light rounded-3xl shadow-xl md:overflow-hidden border border-cream-dark">
                    <AutoCollageTab />
                </div>
            </main>
        </div>
    );
};

export default PhotoCollageApp;
