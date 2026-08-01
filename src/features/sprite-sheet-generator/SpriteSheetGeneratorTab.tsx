import type { AiProvider } from '../../shared/geminiApiKey';
import { SpriteSheetWorkspace } from './components/SpriteSheetWorkspace';
import { useSpriteSheetGeneratorController } from './useSpriteSheetGeneratorController';

interface SpriteSheetGeneratorTabProps {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onNeedApiKey: (provider?: AiProvider) => void;
}

const SpriteSheetGeneratorTab = ({
    provider,
    apiKeys,
    onProviderChange,
    onNeedApiKey,
}: SpriteSheetGeneratorTabProps) => {
    const controller = useSpriteSheetGeneratorController({
        provider,
        apiKeys,
        onNeedApiKey,
    });

    return <SpriteSheetWorkspace
        provider={provider}
        onProviderChange={onProviderChange}
        onNeedApiKey={onNeedApiKey}
        controller={controller}
    />;
};

export default SpriteSheetGeneratorTab;
