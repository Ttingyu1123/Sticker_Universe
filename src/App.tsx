import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';

// Lazy load pages for better performance
const LandingApp = React.lazy(() => import('./pages/Landing/App').catch(err => { console.error("Failed to load Landing:", err); return { default: () => <div className="p-10 text-red-500">Landing Load Error: {err.message}</div> }; }));
const GeneratorApp = React.lazy(() => import('./pages/Generator/App').catch(err => { console.error("Failed to load Generator:", err); return { default: () => <div className="p-10 text-red-500">Generator Load Error: {err.message}</div> }; }));
const EditorApp = React.lazy(() => import('./pages/Editor/App').catch(err => { console.error("Failed to load Editor:", err); return { default: () => <div className="p-10 text-red-500">Editor Load Error: {err.message}</div> }; }));
const PackagerApp = React.lazy(() => import('./pages/Packager/App').catch(err => { console.error("Failed to load Packager:", err); return { default: () => <div className="p-10 text-red-500">Packager Load Error: {err.message}</div> }; }));
const EraserApp = React.lazy(() => import('./pages/Eraser/App').catch(err => { console.error("Failed to load Eraser:", err); return { default: () => <div className="p-10 text-red-500">Eraser Load Error: {err.message}</div> }; }));
const SvgConverterApp = React.lazy(() => import('./pages/SvgConverter/App').catch(err => { console.error("Failed to load SvgConverter:", err); return { default: () => <div className="p-10 text-red-500">SvgConverter Load Error: {err.message}</div> }; }));
const PrintSheetApp = React.lazy(() => import('./pages/PrintSheet/App').catch(err => { console.error("Failed to load PrintSheet:", err); return { default: () => <div className="p-10 text-red-500">PrintSheet Load Error: {err.message}</div> }; }));
const GalleryApp = React.lazy(() => import('./pages/Gallery/App').catch(err => { console.error("Failed to load Gallery:", err); return { default: () => <div className="p-10 text-red-500">Gallery Load Error: {err.message}</div> }; }));
const AnimatorApp = React.lazy(() => import('./pages/Animator/App').then(module => ({ default: module.AnimatorApp })).catch(err => { console.error("Failed to load Animator:", err); return { default: () => <div className="p-10 text-red-500">Animator Load Error: {err.message}</div> }; }));

const Loading = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
    </div>
);

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={
                    <Suspense fallback={<Loading />}>
                        <LandingApp />
                    </Suspense>
                } />

                <Route path="/generator/*" element={
                    <Suspense fallback={<Loading />}>
                        <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GeneratorApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/editor/*" element={
                    <Suspense fallback={<Loading />}>
                        <div className="p-6 max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EditorApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/packager/*" element={
                    <Suspense fallback={<Loading />}>
                        <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PackagerApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/eraser/*" element={
                    <Suspense fallback={<Loading />}>
                        <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EraserApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/svg-converter" element={
                    <Suspense fallback={<Loading />}>
                        <div className="p-6 max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SvgConverterApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/print-sheet" element={
                    <Suspense fallback={<Loading />}>
                        <div className="p-6 max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PrintSheetApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/gallery" element={
                    <Suspense fallback={<Loading />}>
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GalleryApp />
                        </div>
                    </Suspense>
                } />

                <Route path="/animator" element={
                    <Suspense fallback={<Loading />}>
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AnimatorApp />
                        </div>
                    </Suspense>
                } />
            </Route>
        </Routes>
    );
}

export default App;
