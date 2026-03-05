import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
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
                    <h2 className="text-xl font-semibold text-red-600">頁面發生錯誤</h2>
                    <p className="text-sm text-gray-500 max-w-md">
                        {this.state.error?.message ?? '未知錯誤'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                    >
                        重試
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
