import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { ArrowRight } from 'lucide-react';

interface TabCardProps {
    id: string;
    icon: string;
    path: string;
    tab?: string;
    titleKey: string;
    descKey: string;
    featuresKey: string;
    color: string;
    iconColor: string;
}

export const TabCard: React.FC<TabCardProps> = ({
    icon,
    path,
    tab,
    titleKey,
    descKey,
    featuresKey,
    color,
    iconColor
}) => {
    const { t } = useTranslation();

    // Dynamically get icon component
    const IconComponent = (Icons as any)[icon] || Icons.Sparkles;

    // Build the full path with tab parameter if provided
    const fullPath = tab ? `${path}?tab=${tab}` : path;

    // Get translated content
    const title = t(titleKey);
    const desc = t(descKey);
    const features = t(featuresKey, { returnObjects: true }) as string[] || [];

    return (
        <Link
            to={fullPath}
            className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/50 p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${color}`} />

            {/* Icon background decoration */}
            <div className="absolute -right-6 -top-6 opacity-5">
                <IconComponent size={120} className={iconColor} />
            </div>

            {/* Icon */}
            <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent size={32} className="text-white" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h3 className="relative text-xl font-black text-slate-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-slate-800 group-hover:to-slate-600 transition-all">
                {title}
            </h3>

            {/* Description */}
            <p className="relative text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                {desc}
            </p>

            {/* Features */}
            {Array.isArray(features) && features.length > 0 && (
                <ul className="relative space-y-1.5 mb-5">
                    {features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-slate-500">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 bg-gradient-to-br ${color}`} />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* CTA */}
            <div className={`relative flex items-center gap-2 text-sm font-bold bg-gradient-to-br ${color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                <span>{t('landing.cta.launch')}</span>
                <ArrowRight size={16} className={`${iconColor} group-hover:translate-x-1 transition-transform`} />
            </div>
        </Link>
    );
};
