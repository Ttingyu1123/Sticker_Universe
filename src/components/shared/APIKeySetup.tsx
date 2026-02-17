import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export const APIKeySetup: React.FC = () => {
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const [tempKey, setTempKey] = useState('');
    const [rememberKey, setRememberKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const localKey = localStorage.getItem('gemini_api_key');
        const sessionKey = sessionStorage.getItem('gemini_api_key');
        if (localKey) {
            setApiKey(localKey);
            setTempKey(localKey);
            setRememberKey(true);
        } else if (sessionKey) {
            setApiKey(sessionKey);
            setTempKey(sessionKey);
            setRememberKey(false);
        }
    }, []);

    const handleSaveKey = () => {
        if (!tempKey.trim()) {
            setMessage({ type: 'error', text: '請輸入有效的 API Key' });
            return;
        }
        const key = tempKey.trim();
        setApiKey(key);

        if (rememberKey) {
            localStorage.setItem('gemini_api_key', key);
            sessionStorage.removeItem('gemini_api_key');
        } else {
            sessionStorage.setItem('gemini_api_key', key);
            localStorage.removeItem('gemini_api_key');
        }
        setMessage({ type: 'success', text: 'API Key 已儲存' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleClearKey = () => {
        if (confirm(t('generator.apiKey.clearConfirm') || "Are you sure?")) {
            setApiKey('');
            setTempKey('');
            localStorage.removeItem('gemini_api_key');
            sessionStorage.removeItem('gemini_api_key');
            setMessage(null);
        }
    };

    return (
        <div className="bg-white/60 backdrop-blur-md border border-cream-dark rounded-3xl p-6 shadow-sm max-w-3xl mx-auto mt-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Description Column */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Key size={20} />
                        </div>
                        <h3 className="text-xl font-black text-bronze">
                            {t('generator.apiKey.title') || "Google Gemini API Key"}
                        </h3>
                    </div>

                    <p className="text-base text-bronze-light leading-relaxed">
                        {t('generator.apiKey.desc')}
                    </p>

                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-base font-bold text-primary hover:text-primary-hover hover:underline"
                    >
                        {t('generator.apiKey.get') || "獲取 API Key"} ↗
                    </a>

                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm text-bronze-light space-y-2">
                        <p className="font-bold text-primary flex items-center gap-1 text-base mb-2">
                            🛡️ {t('generator.apiKey.securityTitle') || "Security Notice"}
                        </p>
                        <ul className="list-disc pl-4 space-y-1 opacity-80 leading-relaxed">
                            <li>{t('generator.apiKey.securityLocalStorage')}</li>
                            <li>{t('generator.apiKey.securityDirect')}</li>
                        </ul>
                    </div>
                </div>

                {/* Input Column */}
                <div className="flex-1 flex flex-col justify-center space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder={t('generator.apiKey.placeholder')}
                            className="w-full px-4 py-4 bg-white border border-cream-dark rounded-xl font-bold text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-sm placeholder-bronze-light/50"
                        />
                        {apiKey && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 text-sm font-bold bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                ✓ {t('generator.apiKey.settings')}
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-3 px-1">
                        <input
                            type="checkbox"
                            id="landingRememberKey"
                            checked={rememberKey}
                            onChange={(e) => setRememberKey(e.target.checked)}
                            className="mt-1.5 w-4 h-4 rounded border-cream-dark text-primary focus:ring-primary/20"
                        />
                        <label htmlFor="landingRememberKey" className="text-sm text-bronze-light leading-relaxed cursor-pointer select-none">
                            <span className="font-bold text-bronze-text block text-base">{t('generator.apiKey.rememberKey')}</span>
                            {t('generator.apiKey.rememberKeyDesc')}
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSaveKey}
                            className="flex-1 bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 text-base py-3"
                        >
                            {t('generator.apiKey.save')}
                        </Button>
                        {apiKey && (
                            <Button
                                onClick={handleClearKey}
                                className="px-6 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 text-base"
                            >
                                {t('generator.apiKey.clear')}
                            </Button>
                        )}
                    </div>

                    {message && (
                        <div className={`text-center text-sm font-bold p-3 rounded-lg animate-in fade-in slide-in-from-top-1 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                            }`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
