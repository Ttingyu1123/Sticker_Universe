import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Lazy load pages for better performance
const LandingApp = React.lazy(() => import('./pages/Landing/App'));
const GeneratorApp = React.lazy(() => import('./pages/Generator/App'));
const PrintSheetApp = React.lazy(() => import('./pages/PrintSheet/App'));
const GalleryApp = React.lazy(() => import('./pages/Gallery/App'));
const LayerLabApp = React.lazy(() => import('./pages/LayerLab/App').then(m => ({ default: m.LayerLabApp })));
const ImageEditorApp = React.lazy(() => import('./pages/ImageEditor/App'));
const PhotoCollageApp = React.lazy(() => import('./pages/PhotoCollage/App'));
const DrawingStudioApp = React.lazy(() => import('./pages/DrawingStudio/App'));

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

interface PageRouteProps {
    children: React.ReactNode;
    className?: string;
}

const PageRoute = ({ children, className }: PageRouteProps) => (
    <ErrorBoundary>
        <Suspense fallback={<Loading />}>
            <PageWrapper>
                {className ? <div className={className}>{children}</div> : children}
            </PageWrapper>
        </Suspense>
    </ErrorBoundary>
);

function App() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route element={<Layout />}>
                    <Route path="/" element={
                        <PageRoute>
                            <LandingApp />
                        </PageRoute>
                    } />

                    <Route path="/generator/*" element={
                        <PageRoute className="p-6 max-w-7xl mx-auto">
                            <GeneratorApp />
                        </PageRoute>
                    } />

                    <Route path="/image-editor/*" element={
                        <PageRoute className="p-6 max-w-[1920px] mx-auto">
                            <ImageEditorApp />
                        </PageRoute>
                    } />

                    <Route path="/photo-collage/*" element={
                        <PageRoute className="p-6 max-w-[1920px] mx-auto">
                            <PhotoCollageApp />
                        </PageRoute>
                    } />

                    <Route path="/drawing-studio/*" element={
                        <PageRoute className="p-6 max-w-[1920px] mx-auto">
                            <DrawingStudioApp />
                        </PageRoute>
                    } />

                    <Route path="/print-sheet" element={
                        <PageRoute className="p-6 max-w-[1920px] mx-auto">
                            <PrintSheetApp />
                        </PageRoute>
                    } />

                    <Route path="/gallery" element={
                        <PageRoute>
                            <GalleryApp />
                        </PageRoute>
                    } />

                    <Route path="/layer-lab" element={
                        <PageRoute>
                            <LayerLabApp />
                        </PageRoute>
                    } />
                </Route>
            </Routes>
        </AnimatePresence>
    );
}

export default App;
