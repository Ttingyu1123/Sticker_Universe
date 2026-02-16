import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabCard } from './TabCard';
import { CategoryConfig } from '../../../config/landingTabs';

interface CategorySectionProps {
    category: CategoryConfig;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ category }) => {
    const { t } = useTranslation();

    return (
        <section className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Category Header */}
            <div className="text-center mb-12">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${category.bgColor} border border-current/10 mb-4`}>
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${category.color}`} />
                    <span className={`text-sm font-bold bg-gradient-to-br ${category.color} bg-clip-text text-transparent`}>
                        {t(category.titleKey)}
                    </span>
                </div>
                <p className="text-slate-600 text-base max-w-2xl mx-auto">
                    {t(category.descKey)}
                </p>
            </div>

            {/* Tab Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.tabs.map((tab) => (
                    <TabCard
                        key={tab.id}
                        {...tab}
                        color={category.color}
                        iconColor={category.iconColor}
                    />
                ))}
            </div>
        </section>
    );
};
