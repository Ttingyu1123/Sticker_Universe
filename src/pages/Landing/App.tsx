import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Palette, Layers, Eraser, ArrowRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FeatureCard = ({ to, icon: Icon, title, desc, color, cta }: { to: string, icon: any, title: string, desc: string, color: string, cta: string }) => (
    <Link to={to} className="group relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-md border border-white/60 p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={120} />
        </div>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${color.replace('text-', 'bg-').replace('500', '100')} text-${color.split('-')[1]}-600`}>
            <Icon size={28} strokeWidth={2.5} />
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">{desc}</p>

        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-violet-600 transition-colors">
            <span>{cta}</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
    </Link>
);

const Landing = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                            <Sparkles size={20} fill="currentColor" className="text-white/90" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-800">
                            {t('app.title')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600"></span>
                        </span>
                    </div>

                    <a href="https://github.com/Ttingy/Sticker_Universe" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white hover:shadow-lg transition-all">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        v1.0.0
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-bold uppercase tracking-widest mb-6 border border-violet-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap size={14} fill="currentColor" />
                        {t('landing.tagline')}
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        {t('landing.heroTitle').split('AI')[0]} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500">AI {t('landing.heroTitle').split('AI')[1] || t('landing.heroTitle')}</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        {t('landing.heroDesc')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Link to="/generator" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:scale-105 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 transition-all flex items-center justify-center gap-3">
                            <Sparkles size={20} />
                            {t('landing.startCreating')}
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                            {t('landing.exploreTools')}
                        </a>
                    </div>
                </div>

                {/* Feature Grid */}
                <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                    <FeatureCard
                        to="/generator"
                        icon={Sparkles}
                        title={t('landing.features.generatorTitle')}
                        desc={t('landing.features.generatorDesc')}
                        color="text-violet-500"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/editor"
                        icon={Palette}
                        title={t('landing.features.editorTitle')}
                        desc={t('landing.features.editorDesc')}
                        color="text-pink-500"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/eraser"
                        icon={Eraser}
                        title={t('landing.features.eraserTitle')}
                        desc={t('landing.features.eraserDesc')}
                        color="text-indigo-500"
                        cta={t('landing.launchApp')}
                    />
                    <FeatureCard
                        to="/packager"
                        icon={Layers}
                        title={t('landing.features.packagerTitle')}
                        desc={t('landing.features.packagerDesc')}
                        color="text-cyan-500"
                        cta={t('landing.launchApp')}
                    />
                </div>

                {/* Info Section */}
                <div className="mt-24 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        {t('landing.footer')}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Landing;
