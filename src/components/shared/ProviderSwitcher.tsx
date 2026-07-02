import { AI_PROVIDERS, PROVIDER_LABELS } from '../../shared/geminiApiKey';
import type { AiProvider } from '../../shared/geminiApiKey';

interface ProviderSwitcherProps {
    value: AiProvider;
    onChange: (provider: AiProvider) => void;
    disabled?: boolean;
}

export function ProviderSwitcher({ value, onChange, disabled }: ProviderSwitcherProps) {
    return (
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AI provider">
            {AI_PROVIDERS.map((option) => (
                <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={value === option}
                    disabled={disabled}
                    onClick={() => onChange(option)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${value === option
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white border-cream-dark text-bronze-text hover:bg-white/80'} disabled:opacity-50`}
                >
                    {PROVIDER_LABELS[option]}
                </button>
            ))}
        </div>
    );
}
