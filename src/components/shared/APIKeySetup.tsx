import React, { useEffect, useState } from 'react';
import { Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { clearGeminiApiKey, loadGeminiApiKey, saveGeminiApiKey } from '../../shared/geminiApiKey';

export const APIKeySetup: React.FC = () => {
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const [tempKey, setTempKey] = useState('');
    const [rememberKey, setRememberKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const stored = loadGeminiApiKey();
        if (!stored) return;
        setApiKey(stored.key);
        setTempKey(stored.key);
        setRememberKey(stored.remember);
    }, []);

    const handleSaveKey = () => {
        const key = tempKey.trim();
        if (!key) {
            setMessage({ type: 'error', text: t('generator.apiKey.required') || 'Please enter a valid API key.' });
            return;
        }

        saveGeminiApiKey(key, rememberKey);
        setApiKey(key);
        setMessage({ type: 'success', text: t('generator.apiKey.saved') || 'API key saved.' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleClearKey = () => {
        if (!confirm(t('generator.apiKey.clearConfirm') || 'Are you sure?')) return;
        clearGeminiApiKey();
        setApiKey('');
        setTempKey('');
        setMessage(null);
    };

    return (
        <div className="bg-white/60 backdrop-blur-md border border-cream-dark rounded-3xl p-6 shadow-sm max-w-3xl mx-auto mt-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Key size={20} />
                        </div>
                        <h3 className="text-xl font-black text-bronze">{t('generator.apiKey.title') || 'Google Gemini API Key'}</h3>
                    </div>

                    <p className="text-base text-bronze-light leading-relaxed">{t('generator.apiKey.desc')}</p>

                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-base font-bold text-primary hover:text-primary-hover hover:underline"
                    >
                        {t('generator.apiKey.get') || 'Get API Key'} ↗
                    </a>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                    <input
                        type="password"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder={t('generator.apiKey.placeholder') || 'Paste your API key'}
                        className="w-full px-4 py-4 bg-white border border-cream-dark rounded-xl font-bold text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-bronze-text shadow-sm placeholder-bronze-light/50"
                    />

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
                        <Button onClick={handleSaveKey} className="flex-1 bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 text-base py-3">
                            {t('generator.apiKey.save')}
                        </Button>
                        {apiKey && (
                            <Button onClick={handleClearKey} className="px-6 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 text-base">
                                {t('generator.apiKey.clear')}
                            </Button>
                        )}
                    </div>

                    {message && (
                        <div className={`text-center text-sm font-bold p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
