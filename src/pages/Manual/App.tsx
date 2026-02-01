import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Layers, Eraser, Palette, Video, FileCode, Printer, FolderHeart, Wand2, BookOpen } from 'lucide-react';

const ManualSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <section className="bg-white/60 backdrop-blur-sm border border-cream-dark rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Icon size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-bronze-text">{title}</h2>
        </div>
        <div className="space-y-4 text-bronze-text/80 leading-relaxed font-medium">
            {children}
        </div>
    </section>
);

const Manual = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto py-8 px-6 pb-32">
            <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-cream-dark/20 rounded-full flex items-center justify-center mx-auto mb-4 text-bronze-light">
                    <BookOpen size={32} />
                </div>
                <h1 className="text-3xl font-black text-bronze-text mb-2">{t('manual.title')}</h1>
                <p className="text-bronze-light font-bold opacity-70">{t('manual.subtitle')}</p>
            </div>

            <div className="grid gap-6">
                <ManualSection title={t('app.generator')} icon={Sparkles}>
                    <p>{t('manual.generator.desc')}</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-2">
                        <li>{t('manual.generator.step1')}</li>
                        <li>{t('manual.generator.step2')}</li>
                        <li>{t('manual.generator.step3')}</li>
                        <li>{t('manual.generator.step4')}</li>
                    </ul>
                </ManualSection>

                <ManualSection title={t('app.packager')} icon={Layers}>
                    <p>{t('manual.packager.desc')}</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-2">
                        <li>{t('manual.packager.step1')}</li>
                        <li>{t('manual.packager.step2')}</li>
                        <li>{t('manual.packager.step3')}</li>
                    </ul>
                </ManualSection>

                <ManualSection title={t('app.smartEraser')} icon={Wand2}>
                    <p>{t('manual.smartEraser.desc')}</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-2">
                        <li>{t('manual.smartEraser.step1')}</li>
                        <li>{t('manual.smartEraser.step2')}</li>
                    </ul>
                </ManualSection>

                <ManualSection title={t('app.eraser')} icon={Eraser}>
                    <p>{t('manual.eraser.desc')}</p>
                </ManualSection>

                <ManualSection title={t('app.editor')} icon={Palette}>
                    <p>{t('manual.editor.desc')}</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-2">
                        <li>{t('manual.editor.step1')}</li>
                        <li>{t('manual.editor.step2')}</li>
                    </ul>
                </ManualSection>

                <ManualSection title={t('app.animator')} icon={Video}>
                    <p>{t('manual.animator.desc')}</p>
                </ManualSection>

                <ManualSection title={t('app.svgConverter')} icon={FileCode}>
                    <p>{t('manual.svgConverter.desc')}</p>
                </ManualSection>

                <ManualSection title={t('app.printSheet')} icon={Printer}>
                    <p>{t('manual.printSheet.desc')}</p>
                </ManualSection>

                <ManualSection title={t('app.gallery')} icon={FolderHeart}>
                    <p>{t('manual.gallery.desc')}</p>
                </ManualSection>
            </div>
        </div>
    );
};

export default Manual;
