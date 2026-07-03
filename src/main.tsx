import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css';
import 'react-image-crop/dist/ReactCrop.css';
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import * as Sentry from '@sentry/react'
import './i18n';

Sentry.init({
    dsn: 'https://3e08ca60967115abb76e834a5176ed87@o4511669121384448.ingest.us.sentry.io/4511669244395520',
    enabled: import.meta.env.PROD,
    sendDefaultPii: false,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
        <Analytics />
    </React.StrictMode>,
)
