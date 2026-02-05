import React, { useState, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scissors, Eraser, Image, Sparkles, Video, FileCode } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import EditorTab from './components/EditorTab';
import PackagerTab from './components/PackagerTab';
import EraserTab from './components/EraserTab';
import SmartRemoveTab from './components/SmartRemoveTab';
import AnimatorTab from './components/AnimatorTab';
import SvgConverterTab from './components/SvgConverterTab';
import BeautifyTab from './components/BeautifyTab';

import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';

const ImageEditorApp: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [selectedTab, setSelectedTab] = useState('packager');

    useEffect(() => {
        if (location.state?.tab) {
            setSelectedTab(location.state.tab);
        }
    }, [location.state]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}


            <div className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6">
                <Tabs className="flex flex-col h-full gap-6" selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
                    <TabList className="flex gap-1 p-1 bg-slate-100/50 backdrop-blur-md rounded-2xl w-fit mx-auto border border-slate-200/50 flex-wrap justify-center mb-2">
                        <Tab
                            id="packager"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <Image size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.packager') || 'Batch Tools'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="beautify"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <Sparkles size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.beautify') || 'Beautify'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="smart-remove"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <Sparkles size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.smartRemove') || 'AI Remove BG'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="eraser"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <Eraser size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.eraser') || 'Magic Eraser'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="animator"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <Video size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.animator') || 'Animator'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="editor"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <Scissors size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.cropEdit') || 'Crop & Edit'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="svg"
                            className={({ isSelected }) => `
                        px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none flex items-center gap-2.5 select-none
                        ${isSelected
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60'
                                }
                    `}
                        >
                            {({ isSelected }) => (
                                <>
                                    <FileCode size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('editor.tabs.svg') || 'SVG Magic'}
                                </>
                            )}
                        </Tab>
                    </TabList>

                    <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-white overflow-hidden min-h-[600px] relative">
                        <TabPanel id="packager" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <PackagerTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="beautify" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <BeautifyTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="smart-remove" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <SmartRemoveTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="eraser" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <EraserTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="animator" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <AnimatorTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="editor" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <EditorTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="svg" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <SvgConverterTab />
                            </Suspense>
                        </TabPanel>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default ImageEditorApp;
