import React from 'react';
import { useTranslation } from 'react-i18next';
import { AutoCollageTab } from './AutoCollageTab';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

export const PhotoCollageApp = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen pb-20 select-none font-sans text-bronze-text bg-background">
            {/* Main Content */}
            <main className="container mx-auto px-4 max-w-[1920px]">
                <div className="h-[calc(100vh-100px)] w-full bg-slate-50/50 rounded-3xl shadow-xl overflow-hidden border border-cream-dark">
                    <AutoCollageTab />
                </div>
            </main>
        </div>
    );
};

export default PhotoCollageApp;
