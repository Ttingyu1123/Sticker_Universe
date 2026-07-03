import React from 'react';
import i18n from '../../i18n';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// i18n resources are bundled synchronously (see src/i18n.ts), but guard against
// the rare case a chunk-reload path renders before init resolves.
function translate(key: string, fallback: string): string {
    if (!i18n.isInitialized) return fallback;
    const value = i18n.t(key);
    return value && value !== key ? value : fallback;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);

        // Detect stale chunk errors caused by new deployments invalidating old hashed filenames.
        // Auto-reload once to fetch the fresh index.html and updated chunks.
        const isChunkLoadError =
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Importing a module script failed') ||
            error.message.includes('Unable to preload CSS') ||
            error.name === 'ChunkLoadError';

        if (isChunkLoadError) {
            const reloadKey = 'chunkErrorReloaded';
            if (!sessionStorage.getItem(reloadKey)) {
                sessionStorage.setItem(reloadKey, '1');
                window.location.reload();
            }
        }
    }

    handleReset = () => {
        sessionStorage.removeItem('chunkErrorReloaded');
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-10 text-center">
                    <div className="text-4xl">⚠️</div>
                    <h2 className="text-xl font-semibold text-red-600">{translate('common.errorBoundary.title', 'Something went wrong')}</h2>
                    <p className="text-sm text-bronze-text/60 max-w-md">
                        {this.state.error?.message ?? translate('common.errorBoundary.unknownError', 'Unknown error')}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                    >
                        {translate('common.errorBoundary.retry', 'Retry')}
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
