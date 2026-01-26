import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';

// Lazy load pages for better performance
const LandingApp = React.lazy(() => import('./pages/Landing/App').catch(err => { console.error("Failed to load Landing:", err); return { default: () => <div className="p-10 text-red-500">Landing Load Error: {err.message}</div> }; }));
const GeneratorApp = React.lazy(() => import('./pages/Generator/App').catch(err => { console.error("Failed to load Generator:", err); return { default: () => <div className="p-10 text-red-500">Generator Load Error: {err.message}</div> }; }));
const EditorApp = React.lazy(() => import('./pages/Editor/App').catch(err => { console.error("Failed to load Editor:", err); return { default: () => <div className="p-10 text-red-500">Editor Load Error: {err.message}</div> }; }));
const PackagerApp = React.lazy(() => import('./pages/Packager/App').catch(err => { console.error("Failed to load Packager:", err); return { default: () => <div className="p-10 text-red-500">Packager Load Error: {err.message}</div> }; }));
const EraserApp = React.lazy(() => import('./pages/Eraser/App').catch(err => { console.error("Failed to load Eraser:", err); return { default: () => <div className="p-10 text-red-500">Eraser Load Error: {err.message}</div> }; }));

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
            </Route>
        </Routes>
    );
}

export default App;
