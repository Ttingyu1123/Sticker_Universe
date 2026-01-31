import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Palette, Layers, Eraser, ArrowRight, Zap, FileCode, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

const FeatureCard = ({ to, icon: Icon, title, desc, color, cta }: { to: string, icon: any, title: string, desc: string, color: string, cta: string }) => (
    <Link to={to} className="group relative overflow-hidden rounded-3xl bg-cream-medium/50 backdrop-blur-md border border-cream-dark p-6 shadow-xl shadow-bronze/5 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={120} />
        </div>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${color.replace('text-', 'bg-')}/20 ${color}`}>
            <Icon size={28} strokeWidth={2.5} />
        </div>

        <h3 className="text-xl font-black text-bronze mb-2">{title}</h3>
        <p className="text-bronze-text font-medium text-sm leading-relaxed mb-6">{desc}</p>

        <div className="flex items-center gap-2 text-sm font-bold text-bronze-light group-hover:text-primary transition-colors">
            <span>{cta}</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
    </Link>
);

const Landing = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-cream-light selection:bg-primary-light selection:text-bronze-text overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:hidden">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25">
                            <Sparkles size={20} fill="currentColor" className="text-white/90" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-bronze">
                            {t('app.title')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"></span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <LanguageSwitcher />
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-medium text-bronze text-xs font-bold uppercase tracking-widest mb-6 border border-cream-dark animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap size={14} fill="currentColor" />
                        {t('landing.tagline')}
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-bronze mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        {t('landing.heroTitle').split('AI')[0]} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">AI {t('landing.heroTitle').split('AI')[1] || t('landing.heroTitle')}</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-bronze-text font-medium leading-relaxed mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        {t('landing.heroDesc')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Link to="/generator" className="w-full sm:w-auto px-8 py-4 bg-bronze text-white rounded-2xl font-bold text-lg hover:scale-105 hover:bg-bronze-text hover:shadow-xl hover:shadow-bronze/20 transition-all flex items-center justify-center gap-3">
                            <Sparkles size={20} />
                            {t('landing.startCreating')}
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-bronze border border-cream-dark rounded-2xl font-bold text-lg hover:bg-cream-medium hover:text-bronze-text transition-all flex items-center justify-center gap-3">
                            {t('landing.exploreTools')}
                        </a>
                    </div>
                </div>

                {/* Feature Grid */}
                <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                    <FeatureCard
                        to="/generator"
                        icon={Sparkles}
                        title={t('landing.features.generatorTitle')}
                        desc={t('landing.features.generatorDesc')}
                        color="text-primary"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/editor"
                        icon={Palette}
                        title={t('landing.features.editorTitle')}
                        desc={t('landing.features.editorDesc')}
                        color="text-secondary"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/animator"
                        icon={Video}
                        title={t('landing.features.animatorTitle')}
                        desc={t('landing.features.animatorDesc')}
                        color="text-accent"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/eraser"
                        icon={Eraser}
                        title={t('landing.features.eraserTitle')}
                        desc={t('landing.features.eraserDesc')}
                        color="text-bronze"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/packager"
                        icon={Layers}
                        title={t('landing.features.packagerTitle')}
                        desc={t('landing.features.packagerDesc')}
                        color="text-primary"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/svg-converter"
                        icon={FileCode}
                        title={t('landing.features.svgTitle')}
                        desc={t('landing.features.svgDesc')}
                        color="text-accent"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/layer-lab"
                        icon={Layers}
                        title="LayerLab"
                        desc="Non-destructive mask editor (BETA)"
                        color="text-secondary"
                        cta={t('landing.launchApp')}
                    />
                </div>

                {/* Info Section */}
                <div className="mt-24 text-center">
                    <p className="text-bronze-light text-sm font-medium">
                        {t('landing.footer')}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Landing;
