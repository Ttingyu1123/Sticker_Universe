import React, { Suspense, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Printer, IdCard } from 'lucide-react';
import PrintSheetTab from './components/PrintSheetTab';
import IDPrintStudioTab from './components/IDPrintStudioTab';

import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';

const PrintSheetApp: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [selectedTab, setSelectedTab] = useState<string>('print-studio');

    // 根據 URL 參數自動切換 tab
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'id-print') {
            setSelectedTab('id-print');
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <div className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6">
                <Tabs className="flex flex-col h-full gap-6" selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)}>
                    <TabList className="flex gap-1 p-1 bg-slate-100/50 backdrop-blur-md rounded-2xl w-fit mx-auto border border-slate-200/50 flex-wrap justify-center mb-2">
                        <Tab
                            id="print-studio"
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
                                    <Printer size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('printSheet.tabs.printStudio') || '貼紙列印室'}
                                </>
                            )}
                        </Tab>
                        <Tab
                            id="id-print"
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
                                    <IdCard size={18} className={isSelected ? 'fill-indigo-100/50' : ''} />
                                    {t('printSheet.tabs.idPrint') || '證件照列印'}
                                </>
                            )}
                        </Tab>
                    </TabList>

                    <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-white overflow-hidden min-h-[600px] relative">
                        <TabPanel id="print-studio" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <PrintSheetTab />
                            </Suspense>
                        </TabPanel>
                        <TabPanel id="id-print" className="h-full w-full outline-none animate-in fade-in zoom-in-95 duration-300">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                                <IDPrintStudioTab />
                            </Suspense>
                        </TabPanel>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default PrintSheetApp;
