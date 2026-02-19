import { Link } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { CategorySection } from './components/CategorySection';
import { LANDING_CATEGORIES } from '../../config/landingTabs';

const Landing = () => {
    const { t } = useTranslation();
    const totalTools = LANDING_CATEGORIES.reduce((acc, category) => acc + category.tabs.length, 0);
    const totalCategories = LANDING_CATEGORIES.length;

    return (
        <div className="min-h-screen bg-cream-light selection:bg-primary-light selection:text-bronze-text overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-white/80 backdrop-blur-md border-b border-cream-dark/50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25">
                            <Sparkles size={20} fill="currentColor" className="text-white/90" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-bronze hidden sm:inline">
                            {t('app.title')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center max-w-4xl mx-auto mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream-medium text-bronze text-xs font-bold uppercase tracking-widest mb-6 border border-cream-dark animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap size={14} fill="currentColor" />
                        {t('landing.tagline')}
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-bronze mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        {t('landing.heroTitle').split('AI')[0]}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-hover to-bronze">
                            AI {t('landing.heroTitle').split('AI')[1] || t('landing.heroTitle')}
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-bronze-text font-medium leading-relaxed mb-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        {t('landing.heroDesc')}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-2xl font-black text-primary">{totalTools}</span>
                            </div>
                            <span className="text-sm font-bold text-bronze-text">{t('landing.stats.tools')}</span>
                        </div>
                        <div className="w-px h-8 bg-cream-dark hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-2xl font-black text-primary">{totalCategories}</span>
                            </div>
                            <span className="text-sm font-bold text-bronze-text">{t('landing.stats.categories')}</span>
                        </div>
                        <div className="w-px h-8 bg-cream-dark hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles size={20} className="text-primary" fill="currentColor" />
                            </div>
                            <span className="text-sm font-bold text-bronze-text">{t('landing.stats.aiPowered')}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                        <Link
                            to="/generator"
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3"
                        >
                            <Sparkles size={20} />
                            {t('landing.startCreating')}
                        </Link>
                        <a
                            href="#tools"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-bronze border-2 border-cream-dark rounded-2xl font-bold text-lg hover:bg-cream-medium hover:border-bronze-light transition-all flex items-center justify-center gap-3"
                        >
                            {t('landing.exploreTools')}
                        </a>
                    </div>
                </div>

                {/* All Categories */}
                <div id="tools" className="scroll-mt-24">
                    {LANDING_CATEGORIES.map((category) => (
                        <CategorySection key={category.id} category={category} />
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-32 text-center border-t border-cream-dark/50 pt-12">
                    <p className="text-bronze-light text-sm font-medium">
                        {t('landing.footer')}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Landing;
