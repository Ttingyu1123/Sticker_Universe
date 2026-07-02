
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI, Modality } from "@google/genai";
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Upload, Camera, Sparkles, Scissors, Trash2, Image as ImageIcon, Download, User, FolderHeart, Wand2, Zap, ZoomIn, Edit3, Key } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { GalleryPicker } from '../../../components/GalleryPicker';
import { ProviderSwitcher } from '../../../components/shared/ProviderSwitcher';
import { AiProvider } from '../../../shared/geminiApiKey';
import { generateOpenAiImage } from '../services/openaiImageService';

// Mock types if not available, or import from types.ts
interface SubStyle {
    id: string;
    nameKey: string;
    prompt: string;
}

interface PortraitStyle {
    id: string;
    icon: string;
    nameKey: string;
    descKey: string;
    prompt: string;
    subStyles?: SubStyle[];
}

interface GeneratedImage {
    id: string;
    src: string;
    style: string;
    ratio: string;
}

interface PortraitMasterTabProps {
    provider: AiProvider;
    apiKeys: Record<AiProvider, string>;
    onProviderChange: (provider: AiProvider) => void;
    onSuccess?: (imageUrl: string, prompt: string) => void;
    onError?: (msg: string) => void;
    onNeedApiKey?: (provider: AiProvider) => void;
}

const GEMINI_PORTRAIT_MODEL = 'gemini-3-pro-image-preview';
const OPENAI_PORTRAIT_MODEL = 'gpt-image-2';

const VARIATION_HINT_POOL = {
    outfit: ['layered fabrics', 'mixed material texture', 'ornamental accessories', 'alternative outfit details', 'secondary costume accents'],
    scene: ['different background depth', 'new environmental props', 'atmospheric foreground elements', 'alternate weather mood', 'cinematic framing shift'],
    lighting: ['soft rim light', 'dramatic side light', 'gentle haze lighting', 'warm-cool contrast light', 'high-key portrait light'],
    camera: ['slightly different lens perspective', 'dynamic composition angle', 'editorial close framing', 'storytelling medium shot', 'cinematic depth of field'],
    micro: ['hair styling variation', 'fabric pattern variation', 'jewelry variation', 'makeup detail variation', 'pose nuance variation'],
};

const pickRandom = (list: string[], count: number) => {
    const copy = [...list];
    const picks: string[] = [];
    for (let i = 0; i < count && copy.length > 0; i += 1) {
        const idx = Math.floor(Math.random() * copy.length);
        picks.push(copy[idx]);
        copy.splice(idx, 1);
    }
    return picks;
};

const PORTRAIT_STYLES: PortraitStyle[] = [
    {
        id: 'new_year',
        icon: 'Flower2',
        nameKey: 'generator.portrait.styles.new_year',
        descKey: 'generator.portrait.styles.new_year_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Wearing a red brocade jacket with golden auspicious patterns and snowy plum blossoms embroidery, draped with a snow-white fox fur cape.
        Makeup: Festive New Year makeup with cherry red lips.
        Background: Traditional Chinese Spring Festival courtyard with festive red lanterns and calligraphy.
        Style: High-quality fashion photography, festive, elegant.
        `,
        subStyles: [
            { id: 'classic', nameKey: 'generator.portrait.sub_styles.ny_classic', prompt: 'Clothing: Red brocade jacket with gold auspicious embroidery. Background: Festive courtyard with red lanterns.' },
            { id: 'cheongsam', nameKey: 'generator.portrait.sub_styles.ny_cheongsam', prompt: 'Clothing: Modern cheongsam with white fur collar. Setting: Elegant winter garden with light snow.' },
            { id: 'calligraphy', nameKey: 'generator.portrait.sub_styles.ny_calligraphy', prompt: 'Background: Grand black calligraphy strokes on red paper. Style: Artistic, minimalist, powerful.' },
            { id: 'lion_dance', nameKey: 'generator.portrait.sub_styles.ny_lion_dance', prompt: 'Setting: Dynamic Chinese lion dance performance in a festive street. Elements: Colorful lion masks, red firecrackers.' },
            { id: 'opera', nameKey: 'generator.portrait.sub_styles.ny_opera', prompt: 'Style: Traditional Peking Opera aesthetic. Makeup: Elaborate face paint. Clothing: Ornate opera costume.' },
            { id: 'red', nameKey: 'generator.portrait.sub_styles.ny_traditional_red', prompt: 'Style: Pure festive red theme. Background: Wall of red envelopes and spring couplets.' },
            { id: 'golden', nameKey: 'generator.portrait.sub_styles.ny_golden_fortune', prompt: 'Theme: Wealth and prosperity. Elements: Gold ingots, golden ornaments, warm glowing light.' },
            { id: 'lantern', nameKey: 'generator.portrait.sub_styles.ny_lantern_festival', prompt: 'Setting: Night festival with thousands of floating sky lanterns. Lighting: Warm glowing orange light.' },
            { id: 'ink', nameKey: 'generator.portrait.sub_styles.ny_ink_wash', prompt: 'Style: Traditional Chinese ink wash painting. Minimal color, focus on brushwork and flow.' },
            { id: 'floral', nameKey: 'generator.portrait.sub_styles.ny_floral_blossom', prompt: 'Theme: Peony flowers in bloom. Setting: Rich garden with pink and red blossoms, representing wealth.' }
        ]
    },
    {
        id: 'hanfu_studio',
        icon: 'Wand2',
        nameKey: 'generator.portrait.styles.hanfu_studio',
        descKey: 'generator.portrait.styles.hanfu_studio_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Elegant traditional Hanfu, flowing silk robes in pastel colors.
        Setting: Classical Chinese studio with ink wash painting screens and traditional props.
        Style: Classical Chinese portrait, poetic, refined photography.
        `,
        subStyles: [
            { id: 'tang', nameKey: 'generator.portrait.sub_styles.hanfu_tang', prompt: 'Clothing: Grand Tang dynasty style, vibrant colors, high-waisted skirt. Style: Royal, magnificent.' },
            { id: 'song', nameKey: 'generator.portrait.sub_styles.hanfu_song', prompt: 'Clothing: Simple and elegant Song dynasty style, light colors, long coat. Style: Intellectual, refined.' },
            { id: 'ming', nameKey: 'generator.portrait.sub_styles.hanfu_ming', prompt: 'Clothing: Stately Ming dynasty style, cross-collar robe with standing collar. Style: Dignified, traditional.' },
            { id: 'dunhuang', nameKey: 'generator.portrait.sub_styles.hanfu_dunhuang', prompt: 'Style: Dunhuang flying Apsaras. Clothing: Flowing colorful ribbons, ornate jewelry. Pose: Ethereal and dancing.' },
            { id: 'scholar', nameKey: 'generator.portrait.sub_styles.hanfu_scholar', prompt: 'Style: Ancient scholar. Setting: Bamboo forest with a stone table and tea set. Mood: Peaceful, scholarly.' },
            { id: 'fairy', nameKey: 'generator.portrait.sub_styles.hanfu_fairy', prompt: 'Style: Immortal fairy. Setting: Above the clouds with a crescent moon. Mood: Ethereal, celestial.' },
            { id: 'martial', nameKey: 'generator.portrait.sub_styles.hanfu_martial', prompt: 'Style: Wuxia warrior. Clothing: Simple robust travel robes. Elements: Long sword, weathered straw hat.' },
            { id: 'court', nameKey: 'generator.portrait.sub_styles.hanfu_court', prompt: 'Style: Imperial court. Setting: Grand Palace hall with golden pillars and red carpets.' },
            { id: 'simple', nameKey: 'generator.portrait.sub_styles.hanfu_simple', prompt: 'Style: Everyday ancient life. Clothing: Plain linen robes in earth tones. Setting: Rustic village garden.' },
            { id: 'ceremony', nameKey: 'generator.portrait.sub_styles.hanfu_ceremony', prompt: 'Style: Wedding ceremony. Clothing: Deep red robes with intricate phoenix/dragon embroidery.' }
        ]
    },
    {
        id: 'cyberpunk_city',
        icon: 'Zap',
        nameKey: 'generator.portrait.styles.cyberpunk',
        descKey: 'generator.portrait.styles.cyberpunk_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Futuristic techwear jacket with glowing neon accents.
        Setting: Rainy cyberpunk city street at night with multi-colored neon reflections.
        Style: Cyberpunk aesthetic, futuristic, edgy, high contrast.
        `,
        subStyles: [
            { id: 'neon', nameKey: 'generator.portrait.sub_styles.cyber_neon', prompt: 'Setting: Crowded neon-lit alleyway with holographic advertisements and flying cars.' },
            { id: 'lab', nameKey: 'generator.portrait.sub_styles.cyber_lab', prompt: 'Setting: Clean laboratory with blue holographic interfaces and high-tech equipment.' },
            { id: 'wasteland', nameKey: 'generator.portrait.sub_styles.cyber_wasteland', prompt: 'Clothing: Distressed post-apocalyptic techwear. Setting: Desert wasteland with scrap metal structures.' },
            { id: 'hacker', nameKey: 'generator.portrait.sub_styles.cyber_hacker', prompt: 'Setting: Dimly lit room filled with multiple monitors and green cascading code screens.' },
            { id: 'underground', nameKey: 'generator.portrait.sub_styles.cyber_underground', prompt: 'Setting: Nightclub with pink and purple laser lights and heavy smoke effects.' },
            { id: 'rooftop', nameKey: 'generator.portrait.sub_styles.cyber_rooftop', prompt: 'Setting: Skyscraper rooftop overlooking a vast futuristic city with flying traffic.' },
            { id: 'market', nameKey: 'generator.portrait.sub_styles.cyber_market', prompt: 'Setting: Bustling futuristic street market with synthetic food stalls and robot vendors.' },
            { id: 'glitch', nameKey: 'generator.portrait.sub_styles.cyber_glitch', prompt: 'Style: Digital glitch art. Elements: Corrupted data visual effects, chromatic aberration.' },
            { id: 'android', nameKey: 'generator.portrait.sub_styles.cyber_android', prompt: 'Style: Cyborg/Android. Elements: Visible metallic joints, glowing internal circuits on skin.' },
            { id: 'virtual', nameKey: 'generator.portrait.sub_styles.cyber_virtual', prompt: 'Setting: Inside a virtual reality world with geometric grids and digital light trees.' }
        ]
    },
    {
        id: 'nature_fresh',
        icon: 'Palmtree',
        nameKey: 'generator.portrait.styles.nature',
        descKey: 'generator.portrait.styles.nature_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Casual, light summer outfit.
        Setting: Sunlit meadow with wildflowers under a clear sky.
        Style: Fresh, Japanese magazine style, natural, candid, warm tones.
        `,
        subStyles: [
            { id: 'forest', nameKey: 'generator.portrait.sub_styles.nature_forest', prompt: 'Setting: Deep misty forest with sunlight filtering through tall ancient trees.' },
            { id: 'meadow', nameKey: 'generator.portrait.sub_styles.nature_meadow', prompt: 'Setting: Infinite rolling green hills under a bright midday sun.' },
            { id: 'sea', nameKey: 'generator.portrait.sub_styles.nature_sea', prompt: 'Setting: Quiet sandy beach at sunset with soft blue ocean waves.' },
            { id: 'mountain', nameKey: 'generator.portrait.sub_styles.nature_mountain', prompt: 'Setting: High mountain ridge with a sea of clouds below. Mood: Grand, majestic.' },
            { id: 'autumn', nameKey: 'generator.portrait.sub_styles.nature_autumn', prompt: 'Setting: Path covered in golden and red maple leaves. Lighting: Warm autumn glow.' },
            { id: 'spring', nameKey: 'generator.portrait.sub_styles.nature_spring', prompt: 'Setting: Under a large blooming cherry blossom tree with falling pink petals.' },
            { id: 'desert', nameKey: 'generator.portrait.sub_styles.nature_desert', prompt: 'Setting: Vast sand dunes at golden hour. Style: Travel photography vibes.' },
            { id: 'lake', nameKey: 'generator.portrait.sub_styles.nature_lake', prompt: 'Setting: Crystal clear mountain lake reflecting the surrounding peaks.' },
            { id: 'garden', nameKey: 'generator.portrait.sub_styles.nature_garden', prompt: 'Setting: Lush English country garden with roses and lavender.' },
            { id: 'greenhouse', nameKey: 'generator.portrait.sub_styles.nature_greenhouse', prompt: 'Setting: Modern glass conservatory filled with exotic tropical plants.' }
        ]
    },
    {
        id: 'wedding_dress',
        icon: 'Heart',
        nameKey: 'generator.portrait.styles.wedding_dress',
        descKey: 'generator.portrait.styles.wedding_dress_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Gorgeous white wedding dress with fine details.
        Lighting: Soft, romantic backlighting.
        Style: High-end bridal photography, elegant, dreamy.
        `,
        subStyles: [
            { id: 'classic', nameKey: 'generator.portrait.sub_styles.wedding_classic', prompt: 'Style: European classic cathedral setting, grand and timeless.' },
            { id: 'forest', nameKey: 'generator.portrait.sub_styles.wedding_forest', prompt: 'Style: Minimalist forest aesthetic, natural green background, sheer materials.' },
            { id: 'modern_chinese', nameKey: 'generator.portrait.sub_styles.wedding_chinese', prompt: 'Style: Modern Chinese style, red and white elements, artistic fusion.' },
            { id: 'beach', nameKey: 'generator.portrait.sub_styles.wedding_beach', prompt: 'Style: Tropical beach wedding, sunset colors, flowing chiffon dress.' },
            { id: 'castle', nameKey: 'generator.portrait.sub_styles.wedding_castle', prompt: 'Style: Royal castle wedding, grand staircase, opulent decorations.' },
            { id: 'vintage', nameKey: 'generator.portrait.sub_styles.wedding_vintage', prompt: 'Style: 1920s vintage glam, lace details, sepia-toned lighting.' },
            { id: 'underwater', nameKey: 'generator.portrait.sub_styles.wedding_underwater', prompt: 'Style: Surreal underwater wedding. Ethereal floating fabric, bubbles, blue light.' },
            { id: 'night', nameKey: 'generator.portrait.sub_styles.wedding_night', prompt: 'Style: Night garden wedding with hanging fairy lights and dark blue sky.' },
            { id: 'minimal', nameKey: 'generator.portrait.sub_styles.wedding_minimal', prompt: 'Style: Ultra-minimalist studio bridal. Pure white background, high-fashion pose.' },
            { id: 'urban', nameKey: 'generator.portrait.sub_styles.wedding_urban', prompt: 'Style: Modern rooftop city wedding. Industrial chic, skyscrapers in background.' }
        ]
    },
    {
        id: 'ethnic_style',
        icon: 'Map',
        nameKey: 'generator.portrait.styles.ethnic_style',
        descKey: 'generator.portrait.styles.ethnic_style_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Detailed traditional ethnic costume with rich ornaments and cultural patterns.
        Style: Authentic cultural travel photography, vibrant, rich textures.
        `,
        subStyles: [
            { id: 'tibetan', nameKey: 'generator.portrait.sub_styles.ethnic_tibetan', prompt: 'Clothing: Tibetan traditional robe (chuba) with colorful sashes and prayer beads. Background: High plateau with snow mountains.' },
            { id: 'mongolian', nameKey: 'generator.portrait.sub_styles.ethnic_mongolian', prompt: 'Clothing: Mongolian deel with leather belt and ornate hat. Background: Vast green grassland with yurts.' },
            { id: 'miao', nameKey: 'generator.portrait.sub_styles.ethnic_miao', prompt: 'Clothing: Miao ethnic costume with heavy silver headgear and intricate embroidery. Background: Ancient stone village.' },
            { id: 'dai', nameKey: 'generator.portrait.sub_styles.ethnic_dai', prompt: 'Clothing: Dai wrap-around skirt and silk top. Background: Tropical rainforest or golden temple.' },
            { id: 'uyghur', nameKey: 'generator.portrait.sub_styles.ethnic_uyghur', prompt: 'Style: Uyghur dance. Clothing: Vibrant dress with pleated skirt, small embroidered cap. Setting: Sunny orchard.' },
            { id: 'yi', nameKey: 'generator.portrait.sub_styles.ethnic_yi', prompt: 'Style: Yi Torch Festival. Clothing: Traditional black and red garments. Setting: Night bonfire celebration.' },
            { id: 'zhuang', nameKey: 'generator.portrait.sub_styles.ethnic_zhuang', prompt: 'Style: Zhuang mountain songs. Setting: Near a river with lush green mountains (Guilin style).' },
            { id: 'bai', nameKey: 'generator.portrait.sub_styles.ethnic_bai', prompt: 'Clothing: White and blue Bai costume. Setting: Beside a peaceful Dali lake with ancient pagodas.' },
            { id: 'kazakh', nameKey: 'generator.portrait.sub_styles.ethnic_kazakh', prompt: 'Style: Kazakh eagle hunter. Clothing: Thick fur-trimmed robes. Setting: Rugged mountain peaks.' },
            { id: 'korean', nameKey: 'generator.portrait.sub_styles.ethnic_korean', prompt: 'Style: Korean traditional hanbok. Setting: Traditional courtyard in autumn with yellow ginkgo leaves.' }
        ]
    },
    {
        id: 'pure_desire',
        icon: 'Sun',
        nameKey: 'generator.portrait.styles.pure_desire',
        descKey: 'generator.portrait.styles.pure_desire_desc',
        prompt: `
        Subject: A person (based on input image)
        Lighting: Diffused natural light, bright and airy.
        Style: "Pure desire" aesthetic, ethereal, soft focus, extremely gentle.
        `,
        subStyles: [
            { id: 'white_shirt', nameKey: 'generator.portrait.sub_styles.pure_white_shirt', prompt: 'Clothing: Crisp white oversized shirt. Setting: Cozy sunlit bedroom.' },
            { id: 'knitwear', nameKey: 'generator.portrait.sub_styles.pure_knitwear', prompt: 'Clothing: Soft knit sweater in beige or cream tones.' },
            { id: 'floral', nameKey: 'generator.portrait.sub_styles.pure_floral', prompt: 'Clothing: Light floral pattern slip dress. Setting: Summer garden breeze.' },
            { id: 'bathrobe', nameKey: 'generator.portrait.sub_styles.pure_bathrobe', prompt: 'Style: Morning routine. Clothing: Fluffy white bathrobe. Lighting: Bright morning sunlight.' },
            { id: 'ribbon', nameKey: 'generator.portrait.sub_styles.pure_ribbon', prompt: 'Style: Artistic. Element: Long silk ribbons weaving around. Mood: Ethereal and poetic.' },
            { id: 'wet_hair', nameKey: 'generator.portrait.sub_styles.pure_wet_hair', prompt: 'Style: After shower look. Detail: Wet hair, damp skin texture, steam in background.' },
            { id: 'sun_shadow', nameKey: 'generator.portrait.sub_styles.pure_sun_shadow', prompt: 'Lighting: Cinematic shadows from window blinds across the face and body. Mood: Moody yet pure.' },
            { id: 'glass', nameKey: 'generator.portrait.sub_styles.pure_glass', prompt: 'Style: Dreamy photography. Element: Looking through a blurred frosted glass panel.' },
            { id: 'feather', nameKey: 'generator.portrait.sub_styles.pure_feather', prompt: 'Element: Floating white feathers. Setting: Soft white cloud-like background.' },
            { id: 'milk_bath', nameKey: 'generator.portrait.sub_styles.pure_milk_bath', prompt: 'Setting: In a white ceramic tub filled with milky water and white roses.' }
        ]
    },
    {
        id: 'business_elite',
        icon: 'Briefcase',
        nameKey: 'generator.portrait.styles.business_elite',
        descKey: 'generator.portrait.styles.business_elite_desc',
        prompt: `
        Subject: A person (based on input image)
        Style: Professional corporate headshot, confident, sharp, clean.
        `,
        subStyles: [
            { id: 'executive', nameKey: 'generator.portrait.sub_styles.business_executive', prompt: 'Clothing: Formal navy suit with white shirt. Setting: High-end wood-paneled executive office.' },
            { id: 'tech', nameKey: 'generator.portrait.sub_styles.business_tech', prompt: 'Clothing: Smart casual, blazer over T-shirt. Setting: Modern tech office with glass walls.' },
            { id: 'creative', nameKey: 'generator.portrait.sub_styles.business_creative', prompt: 'Clothing: Fashionable artistic business attire. Setting: Industrial chic studio or gallery.' },
            { id: 'lawyer', nameKey: 'generator.portrait.sub_styles.business_lawyer', prompt: 'Style: Sharp legal professional. Setting: Modern law library with organized files.' },
            { id: 'medical', nameKey: 'generator.portrait.sub_styles.business_medical', prompt: 'Style: Top-tier doctor. Clothing: Clean white lab coat. Setting: High-tech medical research center.' },
            { id: 'architect', nameKey: 'generator.portrait.sub_styles.business_architect', prompt: 'Style: Architect. Element: Holding architectural blueprints or a scale model. Setting: Bright studio.' },
            { id: 'journalist', nameKey: 'generator.portrait.sub_styles.business_journalist', prompt: 'Style: Field reporter. Setting: Busy street corner with news equipment.' },
            { id: 'pilot', nameKey: 'generator.portrait.sub_styles.business_pilot', prompt: 'Style: Commercial pilot. Setting: In front of an airplane hangar at sunset.' },
            { id: 'diplomat', nameKey: 'generator.portrait.sub_styles.business_diplomat', prompt: 'Style: Diplomat. Setting: International conference hall with world flags.' },
            { id: 'trader', nameKey: 'generator.portrait.sub_styles.business_trader', prompt: 'Style: Day trader. Setting: Wall street office with multiple financial stock charts.' }
        ]
    },
    {
        id: 'retro_hk',
        icon: 'Clapperboard',
        nameKey: 'generator.portrait.styles.retro_hk',
        descKey: 'generator.portrait.styles.retro_hk_desc',
        prompt: `
        Subject: A person (based on input image)
        Lighting: Cinematic low-key, warm tones, grainy film texture.
        Style: 90s Hong Kong movie aesthetic, nostalgic, moody.
        `,
        subStyles: [
            { id: 'street', nameKey: 'generator.portrait.sub_styles.hk_street', prompt: 'Setting: Night street with glowing neon signs and bustling city vibe.' },
            { id: 'studio', nameKey: 'generator.portrait.sub_styles.hk_studio', prompt: 'Setting: Vintage photography studio with red velvet curtains and soft lighting.' },
            { id: 'cafe', nameKey: 'generator.portrait.sub_styles.hk_cafe', prompt: 'Setting: Old-fashioned Hong Kong tea house (Cha Chaan Teng) with green tiles.' },
            { id: 'detective', nameKey: 'generator.portrait.sub_styles.hk_detective', prompt: 'Style: Noir detective movie. Lighting: High contrast, heavy shadows. Element: Rain on window.' },
            { id: 'underworld', nameKey: 'generator.portrait.sub_styles.hk_underworld', prompt: 'Style: Triad brotherhood thriller. Setting: Dark mahjong parlor with intense atmosphere.' },
            { id: 'bar', nameKey: 'generator.portrait.sub_styles.hk_classic_bar', prompt: 'Setting: Dimly lit lounge with amber lighting and vintage liquor bottles.' },
            { id: 'rooftop', nameKey: 'generator.portrait.sub_styles.hk_rooftop', prompt: 'Setting: Rooftop with laundry lines, overlooking the dense Kowloon city skyline at dusk.' },
            { id: 'shop', nameKey: 'generator.portrait.sub_styles.hk_vintage_shop', prompt: 'Setting: Dusty antique record shop filled with vinyls and old posters.' },
            { id: 'taxi', nameKey: 'generator.portrait.sub_styles.hk_taxi', prompt: 'Setting: Inside a red HK taxi. Lighting: Moving city lights through the window.' },
            { id: 'cinema', nameKey: 'generator.portrait.sub_styles.hk_cinema', prompt: 'Setting: Empty 80s movie theater with plush red seats and flickering projector light.' }
        ]
    },
    {
        id: 'magazine_cover',
        icon: 'ImageIcon',
        nameKey: 'generator.portrait.styles.magazine_cover',
        descKey: 'generator.portrait.styles.magazine_cover_desc',
        prompt: `
        Subject: A person (based on input image)
        Style: High-end fashion magazine editorial.
        Lighting: Professional studio lighting, sharp focus on eyes.
        Composition: Magazine cover layout with polished skin textures and high-fashion pose.
        `,
        subStyles: [
            { id: 'story', nameKey: 'generator.portrait.sub_styles.magazine_cover_story', prompt: 'Style: Iconic Vogue cover style, minimalist background, bold typography vibes.' },
            { id: 'editorial', nameKey: 'generator.portrait.sub_styles.magazine_editorial', prompt: 'Style: High-fashion editorial, avant-garde makeup, dramatic shadows.' },
            { id: 'street', nameKey: 'generator.portrait.sub_styles.magazine_street_look', prompt: 'Style: Street style magazine look, natural outdoor lighting, casual but chic.' },
            { id: 'bw', nameKey: 'generator.portrait.sub_styles.magazine_bw_classic', prompt: 'Style: Classic black and white portrait, high grain, sharp focus, Leica aesthetic.' },
            { id: 'pop', nameKey: 'generator.portrait.sub_styles.magazine_pop_art', prompt: 'Style: Vibrant pop art magazine, high saturation, flat background, bold colors.' },
            { id: 'glam', nameKey: 'generator.portrait.sub_styles.magazine_vintage_glam', prompt: 'Style: Old Hollywood glamour, glittering jewelry, elegant evening gown.' },
            { id: 'sport', nameKey: 'generator.portrait.sub_styles.magazine_sport_illustrated', prompt: 'Style: Athletic/Active look. Setting: High-end tennis court or fitness studio.' },
            { id: 'minimal', nameKey: 'generator.portrait.sub_styles.magazine_minimalist', prompt: 'Style: Extreme minimalism. Setting: Soft grey background, neutral clothing, clean lines.' },
            { id: 'traveler', nameKey: 'generator.portrait.sub_styles.magazine_traveler', prompt: 'Style: National Geographic explorer. Setting: Rugged outdoor environment, natural light.' },
            { id: 'cyber', nameKey: 'generator.portrait.sub_styles.magazine_cyber_vibe', prompt: 'Style: Tech-fashion fusion, glowing futuristic fabrics, metallic makeup.' }
        ]
    },
    {
        id: 'winter_snow',
        icon: 'Sparkles',
        nameKey: 'generator.portrait.styles.winter_snow',
        descKey: 'generator.portrait.styles.winter_snow_desc',
        prompt: `
        Subject: A person (based on input image)
        Clothing: Cozy winter fashion, thick oversized scarf and elegant wool coat.
        Setting: Beautiful snowy landscape with soft falling snowflakes.
        Lighting: Dreamy, soft winter sunlight.
        `,
        subStyles: [
            { id: 'palace', nameKey: 'generator.portrait.sub_styles.winter_ice_palace', prompt: 'Setting: Majestic ice palace with crystalline structures and blue glowing light.' },
            { id: 'forest', nameKey: 'generator.portrait.sub_styles.winter_snowy_forest', prompt: 'Setting: Deep forest covered in thick white snow, misty and romantic.' },
            { id: 'cabin', nameKey: 'generator.portrait.sub_styles.winter_cozy_cabin', prompt: 'Setting: Beside a warm wooden cabin, glowing windows, warm lantern light in the snow.' },
            { id: 'lake', nameKey: 'generator.portrait.sub_styles.winter_frozen_lake', prompt: 'Setting: Standing on a frozen crystal clear lake with white cracks. Background: Snowy peaks.' },
            { id: 'aurora', nameKey: 'generator.portrait.sub_styles.winter_aurora_night', prompt: 'Setting: Night sky with vibrant green aurora borealis. Lighting: Surreal green glow.' },
            { id: 'ski', nameKey: 'generator.portrait.sub_styles.winter_ski_resort', prompt: 'Setting: Luxurious ski resort with cable cars and people skiing in background. Mood: Active, high-end.' },
            { id: 'cave', nameKey: 'generator.portrait.sub_styles.winter_crystal_cave', prompt: 'Setting: Deep inside a glowing blue crystal ice cave. Lighting: Magical, ethereal.' },
            { id: 'sleigh', nameKey: 'generator.portrait.sub_styles.winter_reindeer_sleigh', prompt: 'Element: Sitting in a vintage wooden sleigh pulled by reindeer. Mood: Dreamy, fairy tale.' },
            { id: 'white', nameKey: 'generator.portrait.sub_styles.winter_white_christmas', prompt: 'Setting: Village covered in thick white snow with Christmas lights. Style: Warm, festive, cozy.' },
            { id: 'sculpture', nameKey: 'generator.portrait.sub_styles.winter_ice_sculpture', prompt: 'Setting: Ice sculpture festival with massive illuminated ice carvings.' }
        ]
    },
    {
        id: 'fantasy_animal',
        icon: 'Wand2',
        nameKey: 'generator.portrait.styles.fantasy_animal',
        descKey: 'generator.portrait.styles.fantasy_animal_desc',
        prompt: `
        Subject: A person (based on input image)
        Style: Epic fantasy adventure, mystical and legendary.
        Companion: Accompanied by a beautiful mythical spirit animal.
        Atmosphere: Magical particles, glowing ancient symbols, ethereal light.
        `,
        subStyles: [
            { id: 'phoenix', nameKey: 'generator.portrait.sub_styles.fantasy_phoenix', prompt: 'Companion: A magnificent flaming phoenix. Setting: Ancient celestial temple.' },
            { id: 'dragon', nameKey: 'generator.portrait.sub_styles.fantasy_dragon_tamer', prompt: 'Companion: A massive noble dragon in the background. Setting: Peaks above the clouds.' },
            { id: 'elf', nameKey: 'generator.portrait.sub_styles.fantasy_forest_elf', prompt: 'Companion: A glowing white spirit stag. Setting: Enchanted luminescent forest.' },
            { id: 'pegasus', nameKey: 'generator.portrait.sub_styles.fantasy_pegasus', prompt: 'Companion: A winged white pegasus. Setting: Floating marble platform in a blue sky.' },
            { id: 'mermaid', nameKey: 'generator.portrait.sub_styles.fantasy_mermaid_reef', prompt: 'Setting: Underwater coral kingdom with glowing sea life. Style: Ethereal, liquid motion.' },
            { id: 'wizard', nameKey: 'generator.portrait.sub_styles.fantasy_wizard_tower', prompt: 'Setting: High wizard tower filled with floating books and magical artifacts.' },
            { id: 'kitsune', nameKey: 'generator.portrait.sub_styles.fantasy_kitsune', prompt: 'Companion: Multi-tailed mystical white fox. Setting: Torii gates in a magical mist.' },
            { id: 'steampunk', nameKey: 'generator.portrait.sub_styles.fantasy_steampunk', prompt: 'Setting: Brass and copper steampunk airship deck. Elements: Gears, steam, goggles.' },
            { id: 'island', nameKey: 'generator.portrait.sub_styles.fantasy_floating_island', prompt: 'Setting: Standing on a small island floating in space. Background: Planets and nebulae.' },
            { id: 'abyss', nameKey: 'generator.portrait.sub_styles.fantasy_dark_abyss', prompt: 'Style: Dark fantasy. Background: Shadowy fortress with crimson lightning.' }
        ]
    },
    {
        id: 'christmas',
        icon: 'Sparkles',
        nameKey: 'generator.portrait.styles.christmas',
        descKey: 'generator.portrait.styles.christmas_desc',
        prompt: `
        Subject: A person (based on input image)
        Style: Heartwarming and vibrant Christmas celebration.
        Decor: Surrounded by rich holiday decorations, pine branches, and warm fairy lights.
        Colors: Festive red, deep green, and glittering gold.
        `,
        subStyles: [
            { id: 'workshop', nameKey: 'generator.portrait.sub_styles.christmas_workshop', prompt: 'Setting: Santa\'s cozy workshop filled with toys and magical atmosphere.' },
            { id: 'tree', nameKey: 'generator.portrait.sub_styles.christmas_sparkling_tree', prompt: 'Setting: Right next to a giant, heavily decorated Christmas tree at night.' },
            { id: 'vintage_red', nameKey: 'generator.portrait.sub_styles.christmas_vintage_red', prompt: 'Style: Classy vintage Christmas dinner, candle lights, elegant red silk.' },
            { id: 'market', nameKey: 'generator.portrait.sub_styles.christmas_snowy_market', prompt: 'Setting: European outdoor Christmas market with wooden stalls and hot cocoa.' },
            { id: 'fireplace', nameKey: 'generator.portrait.sub_styles.christmas_fireplace', prompt: 'Setting: Cozy living room with a crackling fireplace and stockings.' },
            { id: 'gingerbread', nameKey: 'generator.portrait.sub_styles.christmas_gingerbread', prompt: 'Style: Whimsical candy land. Elements: Gingerbread house, candy cane forest.' },
            { id: 'carol', nameKey: 'generator.portrait.sub_styles.christmas_carol', prompt: 'Style: Victorian carol singer. Setting: Snowy cobblestone street with vintage gas lamps.' },
            { id: 'reindeer', nameKey: 'generator.portrait.sub_styles.christmas_reindeer_park', prompt: 'Setting: Snowy park filled with friendly reindeer wearing bells.' },
            { id: 'starry', nameKey: 'generator.portrait.sub_styles.christmas_starry_night', prompt: 'Setting: Silent night under a massive bright guiding star. Mood: Peaceful, spiritual.' },
            { id: 'modern', nameKey: 'generator.portrait.sub_styles.christmas_modern_minimal', prompt: 'Style: High-end modern Christmas. Color palette: White, silver, and ice blue.' }
        ]
    },
    {
        id: 'handsome_god',
        icon: 'Zap',
        nameKey: 'generator.portrait.styles.handsome_god',
        descKey: 'generator.portrait.styles.handsome_god_desc',
        prompt: `
        Subject: A person (based on input image)
        Style: Masculine, charismatic, and powerful portrait.
        Lighting: Dramatic chiaroscuro lighting, emphasizing deep facial features and strong silhouette.
        Atmosphere: Epic, heroic, and dignified.
        `,
        subStyles: [
            { id: 'knight', nameKey: 'generator.portrait.sub_styles.handsome_dark_knight', prompt: 'Style: Dark knight aesthetic, wearing black leather armor in a moonlit castle.' },
            { id: 'prince', nameKey: 'generator.portrait.sub_styles.handsome_gentle_prince', prompt: 'Style: Noble prince in a grand library, soft sunlight, refined and elegant.' },
            { id: 'warrior', nameKey: 'generator.portrait.sub_styles.handsome_ancient_warrior', prompt: 'Style: Grizzled ancient warrior on a battlefield, cinematic embers and dust.' },
            { id: 'commander', nameKey: 'generator.portrait.sub_styles.handsome_scifi_commander', prompt: 'Style: Galactic commander. Setting: Starship bridge with cosmic nebula outside.' },
            { id: 'noir', nameKey: 'generator.portrait.sub_styles.handsome_noir_detective', prompt: 'Style: 1940s noir headshot. Elements: Fedora hat, cigarette smoke, harsh shadows.' },
            { id: 'vanguard', nameKey: 'generator.portrait.sub_styles.handsome_cyber_vanguard', prompt: 'Style: Cyberpunk street racer. Elements: Glowing visor, neon jackets, futuristic bike.' },
            { id: 'chief', nameKey: 'generator.portrait.sub_styles.handsome_tribal_chief', prompt: 'Style: Tribal leader. Elements: Intricate face paint, fur cloak, ancient forest setting.' },
            { id: 'god', nameKey: 'generator.portrait.sub_styles.handsome_olymphic_god', prompt: 'Style: Greek god (Apollo/Ares). Elements: Golden laurel wreath, marble statues, divine light.' },
            { id: 'wasteland', nameKey: 'generator.portrait.sub_styles.handsome_wasteland_wanderer', prompt: 'Style: Mad Max inspired survivor. Elements: Dust-covered face, scavenged armor.' },
            { id: 'rockstar', nameKey: 'generator.portrait.sub_styles.handsome_modern_rockstar', prompt: 'Style: Modern rockstar. Setting: Under stage lights with electric guitars and smoke.' }
        ]
    }
];

const ASPECT_RATIOS = [
    { id: '3:4', label: '3:4 (Portrait)', width: 3, height: 4 },
    { id: '1:1', label: '1:1 (Square)', width: 1, height: 1 },
    { id: '4:3', label: '4:3 (Landscape)', width: 4, height: 3 },
    { id: '9:16', label: '9:16 (Story)', width: 9, height: 16 }
];

const PortraitMasterTab: React.FC<PortraitMasterTabProps> = ({
    provider,
    apiKeys,
    onProviderChange,
    onSuccess,
    onError,
    onNeedApiKey,
}) => {
    const { t } = useTranslation();
    const apiKey = apiKeys[provider];

    // State
    const [image, setImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');

    // Settings
    const [selectedStyleId, setSelectedStyleId] = useState('new_year');
    const [selectedSubStyleId, setSelectedSubStyleId] = useState<string | null>(null);
    const [selectedRatio, setSelectedRatio] = useState('3:4');
    const [manualPrompt, setManualPrompt] = useState<string | null>(null);
    const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false);
    const [variationLevel, setVariationLevel] = useState(55);
    const [variationSeed, setVariationSeed] = useState(Date.now());
    const [faceRefStrength, setFaceRefStrength] = useState(72);
    const [useFaceCropReference, setUseFaceCropReference] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropperRef = useRef<Cropper | null>(null);
    const imageElementRef = useRef<HTMLImageElement>(null);

    // Auto Prompt Generation
    const autoPrompt = useMemo(() => {
        const style = PORTRAIT_STYLES.find(s => s.id === selectedStyleId)!;
        const subStyle = style.subStyles?.find(s => s.id === selectedSubStyleId);

        const combinedStylePrompt = subStyle
            ? `${style.prompt}\nSpecific Detail: ${subStyle.prompt}`
            : style.prompt;

        return `
You are a world-class portrait photographer and digital artist. 
Recreate the person from the reference image into a new high-quality stylized portrait.
PRESERVE THE FACIAL IDENTITY, features, and expression of the subject.

Target Style Description:
${combinedStylePrompt.trim()}

Technical Requirements:
- Aspect Ratio: ${selectedRatio}
- High Resolution, highly detailed.
- Perfect lighting and composition.
- Ensure the face looks like the person in the reference image.

${customPrompt ? `Additional User Request (Items/Scene): ${customPrompt}` : ''}
        `.trim();
    }, [selectedStyleId, selectedSubStyleId, selectedRatio, customPrompt]);

    const variationHint = useMemo(() => {
        if (variationLevel <= 0) return '';
        const count = variationLevel >= 70 ? 4 : variationLevel >= 35 ? 3 : 2;
        const chunks = [
            ...pickRandom(VARIATION_HINT_POOL.outfit, 1),
            ...pickRandom(VARIATION_HINT_POOL.scene, 1),
            ...pickRandom(VARIATION_HINT_POOL.lighting, 1),
            ...pickRandom(VARIATION_HINT_POOL.camera, 1),
            ...pickRandom(VARIATION_HINT_POOL.micro, 1),
        ].slice(0, count);
        return `Variation level ${variationLevel}/100. Keep identity consistent, but introduce: ${chunks.join(', ')}.`;
    }, [variationLevel, variationSeed]);

    const faceReferenceHint = useMemo(() => {
        if (faceRefStrength >= 80) {
            return 'Keep facial identity highly consistent (eyes, nose, mouth, face shape), but adapt hairstyle and clothing to the selected style. Do not copy original outfit literally.';
        }
        if (faceRefStrength >= 50) {
            return 'Keep recognizable facial identity while allowing moderate reinterpretation of hairstyle, hair texture, and makeup to match the target era/style.';
        }
        return 'Use the uploaded face as a loose identity reference only. Prioritize target style coherence for hairstyle, makeup, and costume. Do not transfer source hairstyle directly.';
    }, [faceRefStrength]);

    const createFaceCropReference = async (sourceDataUrl: string): Promise<string> => {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = sourceDataUrl;
        });

        let crop = {
            x: img.width * 0.2,
            y: img.height * 0.08,
            w: img.width * 0.6,
            h: img.height * 0.68,
        };

        try {
            const FaceDetectorCtor = (window as any).FaceDetector;
            if (FaceDetectorCtor && typeof createImageBitmap === 'function') {
                const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
                const bitmap = await createImageBitmap(img);
                const faces = await detector.detect(bitmap);
                if (typeof (bitmap as any).close === 'function') {
                    (bitmap as any).close();
                }

                if (Array.isArray(faces) && faces.length > 0) {
                    const box = faces[0].boundingBox;
                    const padX = box.width * 0.28;
                    const padY = box.height * 0.4;
                    crop = {
                        x: box.x - padX,
                        y: box.y - padY,
                        w: box.width + padX * 2,
                        h: box.height + padY * 1.9,
                    };
                }
            }
        } catch {
            // Fallback to heuristic crop when FaceDetector is unavailable.
        }

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const x = clamp(crop.x, 0, img.width - 1);
        const y = clamp(crop.y, 0, img.height - 1);
        const w = clamp(crop.w, 1, img.width - x);
        const h = clamp(crop.h, 1, img.height - y);

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext('2d');
        if (!ctx) return sourceDataUrl;
        ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.95);
    };

    // Handle manual prompt edits
    const handlePromptChange = (val: string) => {
        setManualPrompt(val);
        setIsPromptManuallyEdited(true);
    };

    const resetPrompt = () => {
        setManualPrompt(null);
        setIsPromptManuallyEdited(false);
    };

    // Initial Cropper Setup
    useEffect(() => {
        if (isCropping && image && imageElementRef.current) {
            if (cropperRef.current) cropperRef.current.destroy();
            cropperRef.current = new Cropper(imageElementRef.current, {
                aspectRatio: NaN, // Free crop for initial upload
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.8,
                background: false,
            });
        }
        return () => {
            cropperRef.current?.destroy();
            cropperRef.current = null;
        };
    }, [isCropping, image]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) {
                    setImage(evt.target.result as string);
                    setIsCropping(true);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = async (blobs: Blob[]) => {
        if (blobs.length > 0) {
            const blob = blobs[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) {
                    setImage(evt.target.result as string);
                    setIsCropping(true);
                    setShowGallery(false);
                }
            };
            reader.readAsDataURL(blob);
        }
    };

    const confirmCrop = () => {
        if (cropperRef.current) {
            const canvas = cropperRef.current.getCroppedCanvas();
            if (canvas) {
                setCroppedImage(canvas.toDataURL());
                setIsCropping(false);
            }
        }
    };

    const cancelCrop = () => {
        setImage(null);
        setCroppedImage(null);
        setIsCropping(false);
    };

    const generatePortrait = async () => {
        if (!apiKey) {
            onNeedApiKey?.(provider);
            return;
        }
        if (!croppedImage) return;

        setIsGenerating(true);
        try {
            const basePrompt = manualPrompt ?? autoPrompt;
            const faceModeGuidance = useFaceCropReference
                ? 'Face-crop reference mode is ON. The reference image is face-only. Rebuild hairstyle and head accessories based on target style, not source hairstyle.'
                : 'Face-crop reference mode is OFF. You may use broader source context, but prioritize target style coherence for hairstyle and outfit.';
            const identityGuidance = `Face reference strength: ${faceRefStrength}/100.\n${faceReferenceHint}\n${faceModeGuidance}`;
            const finalPrompt = `${basePrompt}\n\nIdentity Guidance:\n${identityGuidance}${variationHint ? `\n\nVariation Guidance:\n${variationHint}` : ''}`;

            const referenceImage = useFaceCropReference
                ? await createFaceCropReference(croppedImage)
                : croppedImage;
            const newImages: GeneratedImage[] = [];

            if (provider === 'openai') {
                const src = await generateOpenAiImage(
                    apiKey,
                    finalPrompt,
                    referenceImage,
                    selectedRatio,
                    OPENAI_PORTRAIT_MODEL,
                    'high',
                );

                newImages.push({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    src,
                    style: selectedStyleId,
                    ratio: selectedRatio,
                });
            } else {
                const ai = new GoogleGenAI({ apiKey });
                const base64Data = referenceImage.split(',')[1];
                const mimeType = referenceImage.split(';')[0].split(':')[1];

                const result = await ai.models.generateContent({
                    model: GEMINI_PORTRAIT_MODEL,
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType } },
                            { text: finalPrompt }
                        ]
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                        imageConfig: {
                            aspectRatio: selectedRatio
                        }
                    }
                });

                if (result.candidates?.[0]?.content?.parts) {
                    for (const part of result.candidates[0].content.parts) {
                        if (part.inlineData) {
                            newImages.push({
                                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                                src: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                                style: selectedStyleId,
                                ratio: selectedRatio
                            });
                        }
                    }
                }
            }

            if (newImages.length > 0) {
                setGeneratedImages(prev => [...newImages, ...prev]);
                onSuccess?.(newImages[0].src, finalPrompt);
            }
        } catch (err: any) {
            console.error("Generation failed:", err);
            onError?.(err.message || "Failed to generate portrait");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadPortrait = (img: GeneratedImage) => {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `portrait_${img.style}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans text-bronze-text">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- Left Panel: Controls --- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* 1. Upload Section */}
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Camera size={16} /> {t('generator.portrait.steps.upload')}
                        </h3>
                        {!croppedImage ? (
                            <>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-3 border-dashed border-cream-dark/50 hover:border-primary bg-cream-light/50 hover:bg-white rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] group"
                                >
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={24} className="text-primary" />
                                    </div>
                                    <p className="font-bold text-bronze-text text-sm">{t('generator.portrait.upload_hint') || "上傳照片"}</p>
                                </div>
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-bronze-text rounded-xl text-sm font-bold transition-colors"
                                >
                                    <FolderHeart size={18} />
                                    {t('generator.action.fromGallery') || "從作品集選取"}
                                </button>
                            </>
                        ) : (
                            <div className="relative group space-y-3">
                                <div className="rounded-3xl overflow-hidden border border-cream-dark/50 shadow-md">
                                    <img src={croppedImage} alt="Source" className="w-full h-auto object-cover max-h-[300px]" />
                                </div>
                                <button
                                    onClick={() => { setIsCropping(true); setImage(croppedImage); }}
                                    className="absolute top-2 right-2 p-2 bg-white text-bronze-text rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <Scissors size={14} />
                                </button>
                                <button
                                    onClick={() => { setCroppedImage(null); setImage(null); }}
                                    className="absolute top-2 right-12 p-2 bg-white text-red-500 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <button
                                    onClick={() => { setCroppedImage(null); setImage(null); }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
                                >
                                    {t('common.reset')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. Configuration */}
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles size={16} /> {t('generator.portrait.steps.style')}
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-bold text-bronze-light mb-1.5 block">Provider</label>
                                <button
                                    type="button"
                                    onClick={() => onNeedApiKey?.(provider)}
                                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                                >
                                    <Key size={14} />
                                    Set API Key
                                </button>
                            </div>
                            <ProviderSwitcher value={provider} onChange={onProviderChange} />
                            <p className="text-[11px] text-bronze-light">
                                {provider === 'openai' ? `Model: ${OPENAI_PORTRAIT_MODEL}` : `Model: ${GEMINI_PORTRAIT_MODEL}`}
                            </p>
                        </div>

                        {/* Style Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {PORTRAIT_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => {
                                        setSelectedStyleId(style.id);
                                        setSelectedSubStyleId(style.subStyles?.[0]?.id || null);
                                    }}
                                    className={`relative px-3 py-2 rounded-xl border-2 transition-all text-center flex items-center justify-center ${selectedStyleId === style.id
                                        ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                                        : 'border-cream-dark/50 bg-white/50 hover:bg-white hover:border-primary/50'
                                        }`}
                                >
                                    <div className={`text-xs font-bold ${selectedStyleId === style.id ? 'text-primary' : 'text-bronze-text'}`}>
                                        {t(style.nameKey)}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Sub Styles */}
                        {PORTRAIT_STYLES.find(s => s.id === selectedStyleId)?.subStyles && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-bold text-bronze-light mb-3 block flex items-center gap-2">
                                    <Wand2 size={12} /> {t('generator.portrait.settings.sub_style')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PORTRAIT_STYLES.find(s => s.id === selectedStyleId)?.subStyles?.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setSelectedSubStyleId(sub.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedSubStyleId === sub.id
                                                ? 'bg-secondary text-white border-secondary shadow-sm'
                                                : 'bg-white text-bronze-text border-cream-dark/50 hover:border-secondary/50'
                                                }`}
                                        >
                                            {t(sub.nameKey)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Aspect Ratio */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-2 block">{t('generator.portrait.settings.ratio')}</label>
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setSelectedRatio(ratio.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedRatio === ratio.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-bronze-text border-cream-dark hover:border-primary/50'
                                            }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Prompt Input */}
                        <div>
                            <label className="text-xs font-bold text-bronze-light mb-2 block">{t('generator.portrait.settings.custom')}</label>
                            <input
                                type="text"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder={t('generator.portrait.settings.custom_placeholder')}
                                className="w-full px-4 py-2 rounded-xl border border-cream-dark bg-white/50 text-sm font-bold text-bronze-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-bronze-light/50"
                            />
                        </div>

                        <div className="bg-white/60 border border-cream-dark/60 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-bronze-light">{t('generator.portrait.settings.variationLevel', { defaultValue: 'Variation level' })}</label>
                                <button
                                    type="button"
                                    onClick={() => setVariationSeed(Date.now())}
                                    className="text-[11px] font-bold text-secondary hover:text-secondary/80"
                                >
                                    {t('generator.portrait.settings.variationReseed', { defaultValue: 'Reseed details' })}
                                </button>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={variationLevel}
                                onChange={(e) => setVariationLevel(Number(e.target.value))}
                                className="w-full accent-secondary"
                            />
                            <p className="text-[11px] text-bronze-light">
                                {t('generator.portrait.settings.variationHint', { defaultValue: 'Higher value adds more outfit/scene/lighting variation while preserving identity.' })}
                            </p>
                        </div>
                        <div className="bg-white/60 border border-cream-dark/60 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-bronze-light">{t('generator.portrait.settings.faceCropMode', { defaultValue: 'Face-crop reference mode' })}</label>
                                <button
                                    type="button"
                                    onClick={() => setUseFaceCropReference((v) => !v)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useFaceCropReference ? 'bg-secondary' : 'bg-cream-dark'}`}
                                    aria-pressed={useFaceCropReference}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useFaceCropReference ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-bronze-light">
                                {t('generator.portrait.settings.faceCropModeHint', { defaultValue: 'When ON, only a face-focused crop is used as identity reference to reduce source hairstyle carryover.' })}
                            </p>
                        </div>
                        <div className="bg-white/60 border border-cream-dark/60 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-bronze-light">{t('generator.portrait.settings.faceReferenceStrength', { defaultValue: 'Face reference strength' })}</label>
                                <span className="text-[11px] font-bold text-secondary">{faceRefStrength}</span>
                            </div>
                            <input
                                type="range"
                                min={30}
                                max={95}
                                value={faceRefStrength}
                                onChange={(e) => setFaceRefStrength(Number(e.target.value))}
                                className="w-full accent-secondary"
                            />
                            <p className="text-[11px] text-bronze-light">
                                {t('generator.portrait.settings.faceReferenceHint', { defaultValue: 'Suggested 60-78. Lower values reduce hairstyle carryover; higher values keep facial identity closer.' })}
                            </p>
                        </div>
                        {/* Prompt Preview Editor */}
                        <div className="bg-bronze-light/5 p-4 rounded-3xl border border-bronze/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-bronze-light uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                    <Edit3 size={12} className="text-primary" /> {t('generator.portrait.settings.prompt_preview')}
                                </label>
                                {isPromptManuallyEdited && (
                                    <button
                                        onClick={resetPrompt}
                                        className="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                                    >
                                        <Zap size={10} /> {t('generator.portrait.settings.prompt_reset')}
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={manualPrompt ?? autoPrompt}
                                onChange={(e) => handlePromptChange(e.target.value)}
                                className="w-full bg-white/40 border-none rounded-2xl p-3 text-[11px] font-bold text-bronze-text focus:ring-1 focus:ring-primary/30 min-h-[100px] resize-none leading-relaxed placeholder:text-bronze-light/30"
                                placeholder={t('generator.portrait.settings.prompt_manual_hint')}
                            />
                        </div>

                        {/* Description of current style */}
                        <div className="bg-white/50 p-3 rounded-xl border border-cream-dark/30 text-xs text-bronze-text/80 leading-relaxed italic">
                            {t(PORTRAIT_STYLES.find(s => s.id === selectedStyleId)?.descKey || '')}
                        </div>

                        <Button
                            onClick={generatePortrait}
                            disabled={!croppedImage || isGenerating}
                            className="w-full h-12 bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 rounded-xl text-base font-black flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} className={isGenerating ? "animate-spin" : ""} />
                            {isGenerating ? t('generator.portrait.action.generating') : t('generator.portrait.action.generate')}
                        </Button>
                    </div>
                </div>

                {/* --- Right Panel: Results --- */}
                <div className="lg:col-span-8">
                    <div className="bg-cream backdrop-blur-xl border border-cream-dark rounded-[2rem] p-8 min-h-[600px] flex flex-col">
                        <h3 className="text-sm font-black text-bronze-light uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ImageIcon size={16} /> {t('generator.portrait.results')}
                        </h3>

                        {generatedImages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-bronze-light/50 space-y-4">
                                <div className="p-6 bg-cream-dark/10 rounded-full">
                                    <User size={48} />
                                </div>
                                <p className="font-bold">{t('generator.portrait.empty_hint')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {generatedImages.map(img => (
                                    <div key={img.id} className="group relative rounded-2xl overflow-hidden shadow-lg border border-cream-dark bg-white">
                                        <div className={`aspect-[${img.ratio.replace(':', '/')}] bg-cream-light relative`}>
                                            <img src={img.src} alt="Generated Portrait" className="w-full h-full object-cover" />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <button onClick={() => setPreviewImage(img)} className="p-3 bg-white text-primary rounded-full shadow-xl hover:scale-110 transition-transform" title={t('generator.action.zoom')}>
                                                    <ZoomIn size={20} />
                                                </button>
                                                <button onClick={() => downloadPortrait(img)} className="p-3 bg-white text-primary rounded-full shadow-xl hover:scale-110 transition-transform" title={t('generator.action.download')}>
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cropping Modal */}
            {
                isCropping && image && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-lg font-black text-bronze-text flex items-center gap-2">
                                    <Scissors size={20} className="text-primary" /> {t('generator.portrait.crop_title')}
                                </h3>
                                <button onClick={cancelCrop} className="text-bronze-light hover:text-bronze-text font-bold">✕</button>
                            </div>
                            <div className="flex-1 bg-neutral-100 rounded-2xl overflow-hidden relative min-h-[400px]">
                                <img ref={imageElementRef} src={image} alt="Crop target" className="max-w-full max-h-[60vh] object-contain mx-auto" />
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <Button variant="secondary" onClick={cancelCrop}>
                                    {t('common.cancel')}
                                </Button>
                                <Button onClick={confirmCrop} className="bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20">
                                    {t('common.confirm')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Preview Modal */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center gap-4">
                            <img
                                src={previewImage.src}
                                alt="Preview"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => downloadPortrait(previewImage)}
                                    className="px-4 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary-hover transition-all flex items-center gap-2"
                                >
                                    <Download size={16} /> {t('generator.action.download')}
                                </button>
                            </div>
                            <button
                                className="absolute top-4 right-4 md:-top-12 md:right-0 text-white hover:text-gray-300 transition-colors bg-black/50 md:bg-transparent p-2 rounded-full"
                                onClick={() => setPreviewImage(null)}
                            >
                                <span className="text-xl font-bold">✕</span>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Gallery Picker */}
            {showGallery && (
                <GalleryPicker
                    onClose={() => setShowGallery(false)}
                    onSelect={handleGallerySelect}
                />
            )}
        </div >
    );
};

export default PortraitMasterTab;
