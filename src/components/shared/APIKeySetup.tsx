import React, { useEffect, useMemo, useState } from 'react';
import { Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { AiProvider, clearApiKey, getApiKeyUrl, isValidApiKey, loadApiKey, saveApiKey } from '../../shared/geminiApiKey';

const PROVIDERS: Array<{ id: AiProvider; label: string }> = [
    { id: 'gemini', label: 'Gemini' },
    { id: 'openai', label: 'OpenAI' },
];

export const APIKeySetup: React.FC = () => {
    const { t } = useTranslation();
    const [provider, setProvider] = useState<AiProvider>('gemini');
    const [savedKeys, setSavedKeys] = useState<Record<AiProvider, string>>({ gemini: '', openai: '' });
    const [tempKey, setTempKey] = useState('');
    const [rememberKey, setRememberKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const gemini = loadApiKey('gemini');
        const openai = loadApiKey('openai');

        setSavedKeys({
            gemini: gemini?.key || '',
            openai: openai?.key || '',
        });

        if (gemini) {
            setTempKey(gemini.key);
            setRememberKey(gemini.remember);
            return;
        }

        if (openai) {
            setProvider('openai');
            setTempKey(openai.key);
            setRememberKey(openai.remember);
        }
    }, []);

    const providerMeta = useMemo(() => (
        provider === 'gemini'
            ? {
                title: t('generator.apiKey.title') || 'Google Gemini API Key',
                desc: t('generator.apiKey.desc') || 'We need your Google Gemini API Key to generate stickers.',
                placeholder: t('generator.apiKey.placeholder') || 'Paste your Gemini API key',
                invalid: t('generator.apiKey.invalid') || 'Please enter a valid Gemini API key.',
            }
            : {
                title: 'OpenAI API Key',
                desc: 'Use your OpenAI API key for the AI Image Gen page. It will be stored locally in your browser.',
                placeholder: 'Paste your OpenAI API key',
                invalid: 'Please enter a valid OpenAI API key.',
            }
    ), [provider, t]);

    const handleProviderChange = (nextProvider: AiProvider) => {
        setProvider(nextProvider);
        const stored = loadApiKey(nextProvider);
        setTempKey(stored?.key || savedKeys[nextProvider] || '');
        setRememberKey(stored?.remember || false);
        setMessage(null);
    };

    const handleSaveKey = () => {
        const key = tempKey.trim();
        if (!isValidApiKey(provider, key)) {
            setMessage({ type: 'error', text: providerMeta.invalid });
            return;
        }

        saveApiKey(provider, key, rememberKey);
        setSavedKeys((prev) => ({ ...prev, [provider]: key }));
        setMessage({ type: 'success', text: t('generator.apiKey.saved') || 'API key saved.' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleClearKey = () => {
        const currentKey = savedKeys[provider];
        if (!currentKey) return;
        if (!confirm(t('generator.apiKey.clearConfirm') || 'Are you sure?')) return;

        clearApiKey(provider);
        setSavedKeys((prev) => ({ ...prev, [provider]: '' }));
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
                        <h3 className="text-xl font-black text-bronze">{providerMeta.title}</h3>
                    </div>

                    <p className="text-base text-bronze-light leading-relaxed">{providerMeta.desc}</p>

                    <div className="grid grid-cols-2 gap-2">
                        {PROVIDERS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleProviderChange(option.id)}
                                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${provider === option.id
                                    ? 'bg-primary text-white border-primary shadow-md'
                                    : 'bg-white border-cream-dark text-bronze-light hover:border-primary/30 hover:text-bronze-text'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <a
                        href={getApiKeyUrl(provider)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-base font-bold text-primary hover:text-primary-hover hover:underline"
                    >
                        {provider === 'gemini' ? (t('generator.apiKey.get') || 'Get API Key') : 'Get OpenAI API Key'} ↗
                    </a>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-4">
                    <input
                        type="password"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder={providerMeta.placeholder}
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
                        {savedKeys[provider] && (
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
