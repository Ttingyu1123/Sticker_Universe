import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy load pages for better performance
const LandingApp = React.lazy(() => import('./pages/Landing/App').catch(err => { console.error("Failed to load Landing:", err); return { default: () => <div className="p-10 text-red-500">Landing Load Error: {err.message}</div> }; }));
const GeneratorApp = React.lazy(() => import('./pages/Generator/App').catch(err => { console.error("Failed to load Generator:", err); return { default: () => <div className="p-10 text-red-500">Generator Load Error: {err.message}</div> }; }));
const PrintSheetApp = React.lazy(() => import('./pages/PrintSheet/App').catch(err => { console.error("Failed to load PrintSheet:", err); return { default: () => <div className="p-10 text-red-500">PrintSheet Load Error: {err.message}</div> }; }));
const GalleryApp = React.lazy(() => import('./pages/Gallery/App').catch(err => { console.error("Failed to load Gallery:", err); return { default: () => <div className="p-10 text-red-500">Gallery Load Error: {err.message}</div> }; }));
const LayerLabApp = React.lazy(() => import('./pages/LayerLab/App').then(module => ({ default: module.LayerLabApp })).catch(err => { console.error("Failed to load LayerLab:", err); return { default: () => <div className="p-10 text-red-500">LayerLab Load Error: {err.message}</div> }; }));
const ImageEditorApp = React.lazy(() => import('./pages/ImageEditor/App').catch(err => { console.error("Failed to load ImageEditor:", err); return { default: () => <div className="p-10 text-red-500">ImageEditor Load Error: {err.message}</div> }; }));
const PhotoCollageApp = React.lazy(() => import('./pages/PhotoCollage/App').catch(err => { console.error("Failed to load PhotoCollage:", err); return { default: () => <div className="p-10 text-red-500">PhotoCollage Load Error: {err.message}</div> }; }));
const Loading = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
    </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

function App() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route element={<Layout />}>
                    <Route path="/" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <LandingApp />
                            </PageWrapper>
                        </Suspense>
                    } />

                    <Route path="/generator/*" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <div className="p-6 max-w-7xl mx-auto">
                                    <GeneratorApp />
                                </div>
                            </PageWrapper>
                        </Suspense>
                    } />

                    <Route path="/image-editor/*" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <div className="p-6 max-w-[1920px] mx-auto">
                                    <ImageEditorApp />
                                </div>
                            </PageWrapper>
                        </Suspense>
                    } />

                    <Route path="/photo-collage/*" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <div className="p-6 max-w-[1920px] mx-auto">
                                    <PhotoCollageApp />
                                </div>
                            </PageWrapper>
                        </Suspense>
                    } />

                    <Route path="/print-sheet" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <div className="p-6 max-w-[1920px] mx-auto">
                                    <PrintSheetApp />
                                </div>
                            </PageWrapper>
                        </Suspense>
                    } />

                    <Route path="/gallery" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <GalleryApp />
                            </PageWrapper>
                        </Suspense>
                    } />

                    <Route path="/layer-lab" element={
                        <Suspense fallback={<Loading />}>
                            <PageWrapper>
                                <LayerLabApp />
                            </PageWrapper>
                        </Suspense>
                    } />
                </Route>
            </Routes>
        </AnimatePresence>
    );
}

export default App;
