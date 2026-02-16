import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles, Calendar, Heart, BookOpen, Film, Image, User,
    Layers, Wand2, Video, Scissors, Expand, FileCode,
    LayoutGrid,
    Printer, IdCard,
    FolderOpen
} from 'lucide-react';
import { LANDING_CATEGORIES } from '../../config/landingTabs';

const ManualSection = ({
    title,
    icon: Icon,
    children
}: {
    title: string;
    icon: any;
    children: React.ReactNode;
}) => (
    <section className="bg-cream-medium/50 backdrop-blur-sm border border-cream-dark rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-md">
                <Icon size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-bronze">{title}</h3>
        </div>
        <div className="space-y-3 text-bronze-text/90 leading-relaxed font-medium text-sm">
            {children}
        </div>
    </section>
);

const CategoryBlock = ({
    title,
    desc,
    children
}: {
    title: string;
    desc: string;
    children: React.ReactNode;
}) => (
    <div className="mb-12">
        <div className="mb-6">
            <h2 className="text-2xl font-black text-bronze mb-2">{title}</h2>
            <p className="text-bronze-light text-sm font-medium">{desc}</p>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const Manual = () => {
    const { t } = useTranslation();

    const iconMap: Record<string, any> = {
        Sparkles, Calendar, Heart, BookOpen, Film, Image, User,
        Layers, Wand2, Video, Scissors, Expand, FileCode,
        LayoutGrid,
        Printer, IdCard,
        FolderOpen
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-6 pb-32">
            {/* Header */}
            <div className="mb-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                    <BookOpen size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-black text-bronze mb-2">
                    {t('manual.title')}
                </h1>
                <p className="text-bronze-light font-bold text-lg">
                    {t('manual.subtitle')}
                </p>
            </div>

            {/* All Categories */}
            <div className="space-y-12">
                {LANDING_CATEGORIES.map((category) => (
                    <CategoryBlock
                        key={category.id}
                        title={t(category.titleKey)}
                        desc={t(category.descKey)}
                    >
                        {category.tabs.map((tab) => {
                            const Icon = iconMap[tab.icon] || Sparkles;
                            return (
                                <ManualSection
                                    key={tab.id}
                                    title={t(tab.titleKey)}
                                    icon={Icon}
                                >
                                    <p className="font-semibold">{t(tab.descKey)}</p>
                                    <ul className="list-disc list-inside space-y-1.5 mt-3 ml-2 text-bronze-text/80">
                                        {(t(tab.featuresKey, { returnObjects: true }) as string[]).map((feature, idx) => (
                                            <li key={idx}>{feature}</li>
                                        ))}
                                    </ul>
                                </ManualSection>
                            );
                        })}
                    </CategoryBlock>
                ))}
            </div>

            {/* Footer Note */}
            <div className="mt-16 p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center">
                <p className="text-bronze-text font-bold text-sm">
                    💡 {t('manual.tip')}
                </p>
            </div>
        </div>
    );
};

export default Manual;
