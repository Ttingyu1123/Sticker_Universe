export interface TabFeature {
    id: string;
    icon: string;
    path: string;
    tab?: string; // Optional tab parameter
    titleKey: string;
    descKey: string;
    featuresKey: string;
}

export interface CategoryConfig {
    id: string;
    titleKey: string;
    descKey: string;
    color: string;
    bgColor: string;
    iconColor: string;
    tabs: TabFeature[];
}

export const LANDING_CATEGORIES: CategoryConfig[] = [
    {
        id: 'ai-generation',
        titleKey: 'landing.categories.aiGeneration.title',
        descKey: 'landing.categories.aiGeneration.desc',
        color: 'from-primary via-primary-hover to-bronze',
        bgColor: 'bg-primary/5',
        iconColor: 'text-primary',
        tabs: [
            {
                id: 'style-sticker',
                icon: 'Sparkles',
                path: '/generator',
                tab: 'sticker',
                titleKey: 'landing.tabs.styleSticker.title',
                descKey: 'landing.tabs.styleSticker.desc',
                featuresKey: 'landing.tabs.styleSticker.features'
            },
            {
                id: 'holiday-sticker',
                icon: 'Calendar',
                path: '/generator',
                tab: 'holiday',
                titleKey: 'landing.tabs.holidaySticker.title',
                descKey: 'landing.tabs.holidaySticker.desc',
                featuresKey: 'landing.tabs.holidaySticker.features'
            },
            {
                id: 'greeting-card',
                icon: 'Heart',
                path: '/generator',
                tab: 'greeting',
                titleKey: 'landing.tabs.greetingCard.title',
                descKey: 'landing.tabs.greetingCard.desc',
                featuresKey: 'landing.tabs.greetingCard.features'
            },
            {
                id: 'manga-master',
                icon: 'BookOpen',
                path: '/generator',
                tab: 'manga',
                titleKey: 'landing.tabs.mangaMaster.title',
                descKey: 'landing.tabs.mangaMaster.desc',
                featuresKey: 'landing.tabs.mangaMaster.features'
            },
            {
                id: 'cinematic-poster',
                icon: 'Film',
                path: '/generator',
                tab: 'cinematic',
                titleKey: 'landing.tabs.cinematicPoster.title',
                descKey: 'landing.tabs.cinematicPoster.desc',
                featuresKey: 'landing.tabs.cinematicPoster.features'
            },
            {
                id: 'image-generator',
                icon: 'Image',
                path: '/generator',
                tab: 'image-gen',
                titleKey: 'landing.tabs.imageGenerator.title',
                descKey: 'landing.tabs.imageGenerator.desc',
                featuresKey: 'landing.tabs.imageGenerator.features'
            },
            {
                id: 'headshot-master',
                icon: 'User',
                path: '/generator',
                tab: 'headshot',
                titleKey: 'landing.tabs.headshotMaster.title',
                descKey: 'landing.tabs.headshotMaster.desc',
                featuresKey: 'landing.tabs.headshotMaster.features'
            }
        ]
    },
    {
        id: 'image-processing',
        titleKey: 'landing.categories.imageProcessing.title',
        descKey: 'landing.categories.imageProcessing.desc',
        color: 'from-primary via-primary-hover to-bronze',
        bgColor: 'bg-secondary/5',
        iconColor: 'text-primary',
        tabs: [
            {
                id: 'batch-crop',
                icon: 'Layers',
                path: '/image-editor',
                tab: 'packager',
                titleKey: 'landing.tabs.batchCrop.title',
                descKey: 'landing.tabs.batchCrop.desc',
                featuresKey: 'landing.tabs.batchCrop.features'
            },
            {
                id: 'smart-remove-bg',
                icon: 'Wand2',
                path: '/image-editor',
                tab: 'smart-remove',
                titleKey: 'landing.tabs.smartRemoveBg.title',
                descKey: 'landing.tabs.smartRemoveBg.desc',
                featuresKey: 'landing.tabs.smartRemoveBg.features'
            },
            {
                id: 'animator',
                icon: 'Video',
                path: '/image-editor',
                tab: 'animator',
                titleKey: 'landing.tabs.animator.title',
                descKey: 'landing.tabs.animator.desc',
                featuresKey: 'landing.tabs.animator.features'
            },
            {
                id: 'layer-editor',
                icon: 'Scissors',
                path: '/image-editor',
                tab: 'editor',
                titleKey: 'landing.tabs.layerEditor.title',
                descKey: 'landing.tabs.layerEditor.desc',
                featuresKey: 'landing.tabs.layerEditor.features'
            },
            {
                id: 'image-resizer',
                icon: 'Expand',
                path: '/image-editor',
                tab: 'resizer',
                titleKey: 'landing.tabs.imageResizer.title',
                descKey: 'landing.tabs.imageResizer.desc',
                featuresKey: 'landing.tabs.imageResizer.features'
            },
            {
                id: 'svg-converter',
                icon: 'FileCode',
                path: '/image-editor',
                tab: 'svg-converter',
                titleKey: 'landing.tabs.svgConverter.title',
                descKey: 'landing.tabs.svgConverter.desc',
                featuresKey: 'landing.tabs.svgConverter.features'
            }
        ]
    },
    {
        id: 'creative',
        titleKey: 'landing.categories.creative.title',
        descKey: 'landing.categories.creative.desc',
        color: 'from-primary via-primary-hover to-bronze',
        bgColor: 'bg-accent/5',
        iconColor: 'text-primary',
        tabs: [
            {
                id: 'photo-collage',
                icon: 'LayoutGrid',
                path: '/photo-collage',
                titleKey: 'landing.tabs.photoCollage.title',
                descKey: 'landing.tabs.photoCollage.desc',
                featuresKey: 'landing.tabs.photoCollage.features'
            }
        ]
    },
    {
        id: 'printing',
        titleKey: 'landing.categories.printing.title',
        descKey: 'landing.categories.printing.desc',
        color: 'from-primary via-primary-hover to-bronze',
        bgColor: 'bg-bronze/5',
        iconColor: 'text-bronze',
        tabs: [
            {
                id: 'sticker-print',
                icon: 'Printer',
                path: '/print-sheet',
                tab: 'print-studio',
                titleKey: 'landing.tabs.stickerPrint.title',
                descKey: 'landing.tabs.stickerPrint.desc',
                featuresKey: 'landing.tabs.stickerPrint.features'
            },
            {
                id: 'id-photo-print',
                icon: 'IdCard',
                path: '/print-sheet',
                tab: 'id-print',
                titleKey: 'landing.tabs.idPhotoPrint.title',
                descKey: 'landing.tabs.idPhotoPrint.desc',
                featuresKey: 'landing.tabs.idPhotoPrint.features'
            }
        ]
    },
    {
        id: 'management',
        titleKey: 'landing.categories.management.title',
        descKey: 'landing.categories.management.desc',
        color: 'from-primary via-primary-hover to-bronze',
        bgColor: 'bg-bronze-light/5',
        iconColor: 'text-bronze-light',
        tabs: [
            {
                id: 'gallery',
                icon: 'FolderOpen',
                path: '/gallery',
                titleKey: 'landing.tabs.gallery.title',
                descKey: 'landing.tabs.gallery.desc',
                featuresKey: 'landing.tabs.gallery.features'
            }
        ]
    }
];
