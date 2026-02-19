import { CharacterTag, CharacterWorldData } from './types';

export const CHARACTER_COMMON_TAGS: Record<
  'shot' | 'style' | 'light' | 'color',
  CharacterTag[]
> = {
  shot: [
    { zh: '全身', en: 'full body' },
    { zh: '半身', en: 'upper body' },
    { zh: '特寫', en: 'close-up' },
    { zh: '側臉', en: 'profile view' },
    { zh: '仰角', en: 'low angle' },
  ],
  style: [
    { zh: '寫實電影感', en: 'cinematic realistic style' },
    { zh: '日系動畫', en: 'japanese anime style' },
    { zh: '韓系網漫', en: 'korean webtoon style' },
    { zh: '現代扁平插畫', en: 'modern flat illustration style' },
    { zh: '水彩夢幻', en: 'soft watercolor dreamy style' },
  ],
  light: [
    { zh: '自然光', en: 'natural light' },
    { zh: '黃金時刻', en: 'golden hour lighting' },
    { zh: '霓虹光', en: 'neon lighting' },
    { zh: '背光', en: 'backlighting' },
    { zh: '棚燈', en: 'studio lighting' },
  ],
  color: [
    { zh: '高飽和', en: 'high saturation palette' },
    { zh: '莫蘭迪', en: 'morandi palette' },
    { zh: '黑白', en: 'monochrome palette' },
    { zh: '藍橘對比', en: 'teal and orange palette' },
    { zh: '柔和粉彩', en: 'pastel color palette' },
  ],
};

export const CHARACTER_WORLD_DATA: CharacterWorldData = {
  fantasy: {
    character: [
      { zh: '精靈弓手', en: 'elf archer' },
      { zh: '龍裔少女', en: 'dragonkin girl' },
      { zh: '符文法師', en: 'rune mage' },
      { zh: '聖騎士', en: 'paladin knight' },
      { zh: '九尾狐靈', en: 'nine-tailed fox spirit' },
    ],
    pose: [
      { zh: '施法中', en: 'casting a spell' },
      { zh: '拉弓瞄準', en: 'drawing a bow' },
      { zh: '持劍站姿', en: 'sword-ready stance' },
      { zh: '飄浮半空', en: 'floating in mid-air' },
      { zh: '祈禱', en: 'praying pose' },
    ],
    outfit: [
      { zh: '法袍', en: 'ornate mage robe' },
      { zh: '輕甲斗篷', en: 'light armor with cloak' },
      { zh: '旅行者皮裝', en: 'adventurer leather outfit' },
      { zh: '神官服', en: 'priestess attire' },
      { zh: '華麗晚禮服', en: 'fantasy evening gown' },
    ],
    env: [
      { zh: '魔法森林', en: 'enchanted forest' },
      { zh: '水晶洞穴', en: 'crystal cave' },
      { zh: '浮空城', en: 'floating citadel' },
      { zh: '古代遺跡', en: 'ancient ruins' },
      { zh: '月夜神殿', en: 'moonlit temple' },
    ],
    rare: [
      { zh: '發光符文', en: 'glowing runes' },
      { zh: '精靈耳', en: 'elf ears' },
      { zh: '龍角', en: 'dragon horns' },
      { zh: '漂浮水晶', en: 'floating crystals' },
      { zh: '星塵光暈', en: 'stardust aura' },
    ],
  },
  modern: {
    character: [
      { zh: '時尚模特', en: 'fashion model' },
      { zh: '街頭創作者', en: 'street creator' },
      { zh: '音樂人', en: 'indie musician' },
      { zh: '職場菁英', en: 'business professional' },
      { zh: '潮流攝影師', en: 'urban photographer' },
    ],
    pose: [
      { zh: '看手機', en: 'checking smartphone' },
      { zh: '回眸', en: 'looking back pose' },
      { zh: '走路抓拍', en: 'walking candid pose' },
      { zh: '靠牆站立', en: 'leaning on wall' },
      { zh: '自信交叉手', en: 'confident crossed-arms pose' },
    ],
    outfit: [
      { zh: '西裝套裝', en: 'tailored suit set' },
      { zh: 'Smart Casual', en: 'smart casual outfit' },
      { zh: '街頭潮服', en: 'streetwear fit' },
      { zh: '牛仔外套', en: 'denim jacket look' },
      { zh: '極簡黑白穿搭', en: 'minimal black-white styling' },
    ],
    env: [
      { zh: '城市街頭', en: 'city street scene' },
      { zh: '咖啡館', en: 'cozy coffee shop' },
      { zh: '攝影棚', en: 'studio backdrop' },
      { zh: '夜景天台', en: 'night rooftop' },
      { zh: '藝廊空間', en: 'modern art gallery' },
    ],
    rare: [
      { zh: '霓虹反光', en: 'neon reflections' },
      { zh: '膠片顆粒', en: 'film grain texture' },
      { zh: '雨夜水光', en: 'wet street reflections' },
      { zh: '光斑散景', en: 'bokeh highlights' },
      { zh: '雙重曝光感', en: 'double exposure feel' },
    ],
  },
  scifi: {
    character: [
      { zh: '機甲駕駛員', en: 'mecha pilot' },
      { zh: '星際遊俠', en: 'space ranger' },
      { zh: '賽博忍者', en: 'cyber ninja' },
      { zh: '仿生人', en: 'android operative' },
      { zh: '量子工程師', en: 'quantum engineer' },
    ],
    pose: [
      { zh: '啟動全息介面', en: 'activating holographic UI' },
      { zh: '戰術戒備', en: 'tactical ready stance' },
      { zh: '漂浮失重', en: 'zero-gravity floating pose' },
      { zh: '持能量刃', en: 'wielding energy blade' },
      { zh: '觀測遠方', en: 'scanning horizon' },
    ],
    outfit: [
      { zh: '戰術外骨骼', en: 'tactical exosuit' },
      { zh: '賽博裝甲', en: 'cyber armor suit' },
      { zh: '太空制服', en: 'space uniform' },
      { zh: '機能風長外套', en: 'techwear long coat' },
      { zh: '高科技頭盔', en: 'advanced combat helmet' },
    ],
    env: [
      { zh: '賽博都市', en: 'cyberpunk megacity' },
      { zh: '太空艙', en: 'spaceship interior' },
      { zh: '高科技實驗室', en: 'futuristic lab' },
      { zh: '霓虹巷道', en: 'neon alleyway' },
      { zh: '外星基地', en: 'alien outpost' },
    ],
    rare: [
      { zh: '全息投影', en: 'holographic projection' },
      { zh: '機械義肢', en: 'cybernetic limb' },
      { zh: '能量核心', en: 'glowing energy core' },
      { zh: '數據流特效', en: 'data stream effect' },
      { zh: '反重力碎片', en: 'anti-gravity debris' },
    ],
  },
  historical: {
    character: [
      { zh: '宮廷貴族', en: 'court noble' },
      { zh: '武士', en: 'samurai warrior' },
      { zh: '女偵探', en: 'vintage detective' },
      { zh: '航海船長', en: 'age-of-sail captain' },
      { zh: '古典學者', en: 'classical scholar' },
    ],
    pose: [
      { zh: '持扇掩面', en: 'fan-cover pose' },
      { zh: '持刀站姿', en: 'katana-ready stance' },
      { zh: '閱讀信件', en: 'reading a letter' },
      { zh: '敬禮', en: 'formal salute' },
      { zh: '端杯凝視', en: 'goblet-holding pose' },
    ],
    outfit: [
      { zh: '古典禮服', en: 'period formal dress' },
      { zh: '和風武士服', en: 'samurai attire' },
      { zh: '維多利亞風套裝', en: 'victorian suit' },
      { zh: '刺繡長袍', en: 'embroidered robe' },
      { zh: '宮廷軍裝', en: 'ceremonial uniform' },
    ],
    env: [
      { zh: '古城街道', en: 'old town street' },
      { zh: '宮殿長廊', en: 'palace corridor' },
      { zh: '茶館庭園', en: 'tea garden courtyard' },
      { zh: '歌劇院', en: 'grand opera hall' },
      { zh: '古堡書房', en: 'castle study room' },
    ],
    rare: [
      { zh: '古董懷錶', en: 'antique pocket watch' },
      { zh: '復古底片質感', en: 'vintage film texture' },
      { zh: '手寫墨跡', en: 'calligraphy ink effect' },
      { zh: '燭光煙霧', en: 'candle smoke glow' },
      { zh: '金邊刺繡細節', en: 'golden embroidery details' },
    ],
  },
  horror: {
    character: [
      { zh: '幽影使者', en: 'shadow stalker' },
      { zh: '詛咒人偶師', en: 'cursed puppeteer' },
      { zh: '黑夜獵手', en: 'night hunter' },
      { zh: '異界祭司', en: 'eldritch priest' },
      { zh: '廢墟倖存者', en: 'ruin survivor' },
    ],
    pose: [
      { zh: '緩慢回頭', en: 'slow turning-back pose' },
      { zh: '俯身潛伏', en: 'crouched lurking pose' },
      { zh: '伸手逼近', en: 'reaching-forward pose' },
      { zh: '牆角凝視', en: 'corner stare pose' },
      { zh: '奔跑逃離', en: 'running-away pose' },
    ],
    outfit: [
      { zh: '破舊長袍', en: 'tattered robe' },
      { zh: '暗色風衣', en: 'dark trench coat' },
      { zh: '詭異制服', en: 'eerie uniform' },
      { zh: '儀式袍', en: 'ritual outfit' },
      { zh: '血痕繃帶', en: 'blood-stained bandages' },
    ],
    env: [
      { zh: '廢棄醫院', en: 'abandoned hospital' },
      { zh: '霧夜森林', en: 'foggy night forest' },
      { zh: '地下室走廊', en: 'basement corridor' },
      { zh: '破敗劇院', en: 'derelict theatre' },
      { zh: '詛咒宅邸', en: 'haunted manor' },
    ],
    rare: [
      { zh: '紅光眼神', en: 'red glowing eyes' },
      { zh: '影子觸手', en: 'shadow tendrils' },
      { zh: '霧氣環繞', en: 'mist aura' },
      { zh: '裂紋特效', en: 'cracked distortion effect' },
      { zh: '恐怖粒子感', en: 'horror particle effect' },
    ],
  },
  oriental: {
    character: [
      { zh: '劍仙', en: 'sword immortal' },
      { zh: '狐妖', en: 'fox spirit' },
      { zh: '陰陽師', en: 'onmyoji master' },
      { zh: '龍宮公主', en: 'dragon palace princess' },
      { zh: '古風俠客', en: 'wuxia hero' },
    ],
    pose: [
      { zh: '御劍飛行', en: 'sword-riding pose' },
      { zh: '持傘漫步', en: 'walking with oil-paper umbrella' },
      { zh: '撫琴', en: 'playing guqin' },
      { zh: '掐訣施法', en: 'hand-seal casting pose' },
      { zh: '回眸含笑', en: 'gentle turning-back smile' },
    ],
    outfit: [
      { zh: '漢服', en: 'hanfu outfit' },
      { zh: '仙俠長袍', en: 'xianxia robe' },
      { zh: '和風和服', en: 'kimono style' },
      { zh: '華麗宮裝', en: 'imperial palace attire' },
      { zh: '武俠勁裝', en: 'wuxia combat outfit' },
    ],
    env: [
      { zh: '竹林', en: 'bamboo forest' },
      { zh: '雲海山巔', en: 'mountain above cloud sea' },
      { zh: '古風庭院', en: 'classical courtyard' },
      { zh: '燈火古城', en: 'lantern-lit ancient city' },
      { zh: '桃花谷', en: 'peach blossom valley' },
    ],
    rare: [
      { zh: '符咒光效', en: 'talisman glow effect' },
      { zh: '飛舞花瓣', en: 'falling petals effect' },
      { zh: '靈氣光環', en: 'spiritual aura' },
      { zh: '墨韻特效', en: 'ink wash effect' },
      { zh: '祥雲環繞', en: 'auspicious cloud aura' },
    ],
  },
};

const CHARACTER_COMMON_TAGS_EXTRA: Record<
  'shot' | 'style' | 'light' | 'color',
  CharacterTag[]
> = {
  shot: [
    { zh: '俯角', en: 'high angle' },
    { zh: '鳥瞰', en: 'bird-eye view' },
    { zh: '背影', en: 'back view' },
    { zh: '超近特寫', en: 'extreme close-up' },
    { zh: '對稱構圖', en: 'symmetrical composition' },
  ],
  style: [
    { zh: '賽博龐克', en: 'cyberpunk style' },
    { zh: '概念藝術', en: 'concept art style' },
    { zh: '油畫厚塗', en: 'oil painting impasto style' },
    { zh: '像素風', en: 'pixel art style' },
    { zh: '復古 90 年代動畫', en: 'retro 90s anime style' },
  ],
  light: [
    { zh: '輪廓光', en: 'rim lighting' },
    { zh: '體積光', en: 'volumetric lighting' },
    { zh: '燭光', en: 'candlelight' },
    { zh: '月光', en: 'moonlight' },
    { zh: '聚光燈', en: 'spotlight lighting' },
  ],
  color: [
    { zh: '復古暖色', en: 'vintage warm palette' },
    { zh: '冷色調', en: 'cool tone palette' },
    { zh: '大地色', en: 'earth tone palette' },
    { zh: '糖果色', en: 'candy palette' },
    { zh: '金黑配色', en: 'gold and black palette' },
  ],
};

const CHARACTER_WORLD_DATA_EXTRA: CharacterWorldData = {
  fantasy: {
    character: [
      { zh: '黑暗騎士', en: 'dark knight' },
      { zh: '女武神', en: 'valkyrie' },
      { zh: '召喚師', en: 'summoner' },
    ],
    pose: [
      { zh: '拔劍衝刺', en: 'sword dash pose' },
      { zh: '召喚法陣', en: 'summoning circle pose' },
      { zh: '踏在浮石上', en: 'standing on floating rocks' },
    ],
    outfit: [
      { zh: '龍鱗鎧甲', en: 'dragon-scale armor' },
      { zh: '長羽披肩', en: 'feather mantle' },
      { zh: '古代符文腰帶', en: 'ancient rune belt' },
    ],
    env: [
      { zh: '天空之塔', en: 'tower above the clouds' },
      { zh: '龍骨荒原', en: 'dragonbone wasteland' },
      { zh: '魔法圖書館', en: 'arcane library hall' },
    ],
    rare: [
      { zh: '雙色瞳', en: 'heterochromia eyes' },
      { zh: '漂浮符文書', en: 'floating rune tome' },
      { zh: '元素光環', en: 'elemental aura effect' },
    ],
  },
  modern: {
    character: [
      { zh: 'K-pop 偶像', en: 'k-pop idol' },
      { zh: '滑板少年', en: 'skater youth' },
      { zh: '調酒師', en: 'bartender' },
    ],
    pose: [
      { zh: '手插口袋', en: 'hands-in-pocket pose' },
      { zh: '跑步動態', en: 'running motion pose' },
      { zh: '回頭微笑', en: 'turn-back smile pose' },
    ],
    outfit: [
      { zh: '連帽外套', en: 'hoodie outfit' },
      { zh: '皮衣', en: 'leather jacket outfit' },
      { zh: '運動套裝', en: 'tracksuit outfit' },
    ],
    env: [
      { zh: '地鐵月台', en: 'subway platform' },
      { zh: '便利商店', en: 'convenience store' },
      { zh: '演唱會舞台', en: 'concert stage' },
    ],
    rare: [
      { zh: '城市雨霧', en: 'urban rain mist effect' },
      { zh: '鏡面倒影', en: 'mirror reflection effect' },
      { zh: '街燈光束', en: 'streetlight beam effect' },
    ],
  },
  scifi: {
    character: [
      { zh: '星艦艦長', en: 'starship captain' },
      { zh: '機器獵人', en: 'android hunter' },
      { zh: '駭客工程師', en: 'cyber hacker engineer' },
    ],
    pose: [
      { zh: '駭入系統', en: 'hacking interface pose' },
      { zh: '拔出能量槍', en: 'drawing plasma pistol pose' },
      { zh: '躍遷前準備', en: 'pre-jump ready pose' },
    ],
    outfit: [
      { zh: '反應裝甲', en: 'reactive armor suit' },
      { zh: '全息披風', en: 'holographic cloak' },
      { zh: '戰術頭戴裝置', en: 'tactical visor headset' },
    ],
    env: [
      { zh: '軌道空間站', en: 'orbital station' },
      { zh: '量子核心艙', en: 'quantum core chamber' },
      { zh: '火星殖民地', en: 'mars colony district' },
    ],
    rare: [
      { zh: '電路紋身', en: 'circuit tattoo effect' },
      { zh: '故障閃爍', en: 'glitch flicker effect' },
      { zh: '奈米粒子流', en: 'nanoparticle stream effect' },
    ],
  },
  historical: {
    character: [
      { zh: '文藝復興畫師', en: 'renaissance painter' },
      { zh: '帝國將軍', en: 'imperial general' },
      { zh: '宮廷樂師', en: 'court musician' },
    ],
    pose: [
      { zh: '揮旗指揮', en: 'banner-command pose' },
      { zh: '抄寫卷軸', en: 'manuscript writing pose' },
      { zh: '舞會旋轉', en: 'ballroom spin pose' },
    ],
    outfit: [
      { zh: '金線禮袍', en: 'gold-thread ceremonial robe' },
      { zh: '軍官披風', en: 'officer cape uniform' },
      { zh: '蕾絲領口', en: 'lace ruff collar outfit' },
    ],
    env: [
      { zh: '鏡廳舞會', en: 'hall of mirrors ballroom' },
      { zh: '石板市集', en: 'cobblestone market street' },
      { zh: '宮廷花園', en: 'royal palace garden' },
    ],
    rare: [
      { zh: '羊皮紙紋理', en: 'parchment texture effect' },
      { zh: '古典暗角', en: 'vintage vignette effect' },
      { zh: '金箔細節', en: 'gold leaf detailing' },
    ],
  },
  horror: {
    character: [
      { zh: '無面旅人', en: 'faceless wanderer' },
      { zh: '夜行修女', en: 'night nun apparition' },
      { zh: '深淵低語者', en: 'abyss whisperer' },
    ],
    pose: [
      { zh: '拖行前進', en: 'dragging walk pose' },
      { zh: '直視鏡頭', en: 'deadpan stare pose' },
      { zh: '扭曲站姿', en: 'twisted posture pose' },
    ],
    outfit: [
      { zh: '破碎婚紗', en: 'torn wedding gown' },
      { zh: '舊醫護服', en: 'aged nurse uniform' },
      { zh: '黑袍兜帽', en: 'black hooded robe' },
    ],
    env: [
      { zh: '廢棄遊樂園', en: 'abandoned amusement park' },
      { zh: '血色浴室', en: 'blood-stained bathroom' },
      { zh: '地下停屍間', en: 'underground morgue room' },
    ],
    rare: [
      { zh: '牆面血痕', en: 'blood smear wall effect' },
      { zh: '詭異笑容', en: 'eerie smile effect' },
      { zh: '黑霧纏繞', en: 'black fog wrapping effect' },
    ],
  },
  oriental: {
    character: [
      { zh: '白蛇妖', en: 'white snake spirit' },
      { zh: '敦煌飛天', en: 'dunhuang apsara' },
      { zh: '古風琴師', en: 'ancient guqin musician' },
    ],
    pose: [
      { zh: '舞袖', en: 'flowing sleeve dance pose' },
      { zh: '拈花微笑', en: 'holding flower smile pose' },
      { zh: '執卷吟詩', en: 'poetry recitation pose' },
    ],
    outfit: [
      { zh: '唐風錦衣', en: 'tang-style brocade outfit' },
      { zh: '道袍', en: 'taoist robe' },
      { zh: '織錦披帛', en: 'embroidered shawl ribbons' },
    ],
    env: [
      { zh: '亭台樓閣', en: 'classical pavilion complex' },
      { zh: '月下長安', en: 'night changan street' },
      { zh: '洞天福地', en: 'mythic grotto-heaven' },
    ],
    rare: [
      { zh: '符紙飄散', en: 'flying talisman paper effect' },
      { zh: '祥龍虛影', en: 'ethereal dragon silhouette' },
      { zh: '流光墨痕', en: 'flowing ink light trails' },
    ],
  },
};

const MIN_OPTIONS_PER_CATEGORY = 15;

const CATEGORY_FILLERS: Record<CharacterCategoryKey, CharacterTag[]> = {
  character: [
    { zh: '神秘旅人', en: 'mysterious wanderer' },
    { zh: '學院優等生', en: 'academy honor student' },
    { zh: '天才發明家', en: 'genius inventor' },
    { zh: '守護者', en: 'vigilant guardian' },
    { zh: '流浪詩人', en: 'wandering poet' },
    { zh: '傭兵隊長', en: 'mercenary captain' },
    { zh: '刺客', en: 'assassin operative' },
    { zh: '占卜師', en: 'oracle seer' },
    { zh: '鍊金術師', en: 'alchemist' },
    { zh: '舞者', en: 'performance dancer' },
    { zh: '槍手', en: 'precision gunslinger' },
    { zh: '樂團主唱', en: 'band lead vocalist' },
  ],
  pose: [
    { zh: '回頭注視', en: 'turning-back glance pose' },
    { zh: '單手叉腰', en: 'one-hand-on-hip pose' },
    { zh: '向前衝刺', en: 'forward sprint pose' },
    { zh: '蹲姿戒備', en: 'crouched guard pose' },
    { zh: '雙手展開', en: 'arms-wide-open pose' },
    { zh: '抬頭仰望', en: 'looking-upward pose' },
    { zh: '坐姿沉思', en: 'seated contemplation pose' },
    { zh: '躍起動作', en: 'jumping action pose' },
    { zh: '轉身拔武器', en: 'weapon-draw turn pose' },
    { zh: '手勢施法', en: 'gesture spellcast pose' },
  ],
  outfit: [
    { zh: '戰術背心', en: 'tactical vest outfit' },
    { zh: '長版風衣', en: 'long trench coat outfit' },
    { zh: '輕量盔甲', en: 'lightweight armor set' },
    { zh: '學院制服', en: 'academy uniform outfit' },
    { zh: '儀式服', en: 'ceremonial outfit' },
    { zh: '機能工裝', en: 'utility workwear outfit' },
    { zh: '皮革束腰', en: 'leather corset outfit' },
    { zh: '披肩斗篷', en: 'cape and mantle outfit' },
    { zh: '街頭夾克', en: 'street bomber jacket' },
    { zh: '寬袖長袍', en: 'wide-sleeve robe outfit' },
  ],
  env: [
    { zh: '霧中街道', en: 'misty city street' },
    { zh: '高塔頂端', en: 'tower rooftop scene' },
    { zh: '地下實驗室', en: 'underground laboratory' },
    { zh: '雨夜巷弄', en: 'rainy night alley' },
    { zh: '荒原廢墟', en: 'wasteland ruins' },
    { zh: '港口碼頭', en: 'harbor dock scene' },
    { zh: '雪山山徑', en: 'snow mountain trail' },
    { zh: '古神殿廣場', en: 'ancient temple plaza' },
    { zh: '森林湖畔', en: 'forest lakeside' },
    { zh: '都會高樓群', en: 'metropolitan skyline' },
  ],
  color: [
    { zh: '高對比黑白', en: 'high-contrast monochrome palette' },
    { zh: '紫藍霓虹', en: 'purple-blue neon palette' },
    { zh: '暮色橘紫', en: 'sunset orange-violet palette' },
    { zh: '低飽和灰調', en: 'desaturated gray palette' },
    { zh: '寶石色系', en: 'jewel tone palette' },
    { zh: '柔霧奶油色', en: 'soft creamy pastel palette' },
    { zh: '深海藍綠', en: 'deep sea teal-blue palette' },
    { zh: '赤紅黑曜', en: 'crimson obsidian palette' },
  ],
  shot: [
    { zh: '中景', en: 'medium shot' },
    { zh: '遠景', en: 'wide shot' },
    { zh: 'POV 視角', en: 'pov camera shot' },
    { zh: '肩後鏡位', en: 'over-the-shoulder shot' },
    { zh: '中央構圖', en: 'center composition shot' },
    { zh: '電影運鏡感', en: 'cinematic tracking shot' },
    { zh: '魚眼鏡頭', en: 'fisheye lens shot' },
    { zh: '三分法構圖', en: 'rule-of-thirds composition shot' },
  ],
  style: [
    { zh: '超寫實 3D', en: 'hyper-realistic 3d render style' },
    { zh: '蒸氣龐克', en: 'steampunk illustration style' },
    { zh: '吉卜力系', en: 'ghibli-inspired illustration style' },
    { zh: '新海誠光影', en: 'makoto-shinkai lighting style' },
    { zh: '黑色電影風', en: 'film noir visual style' },
    { zh: '浮世繪', en: 'ukiyo-e art style' },
    { zh: '寫意水墨', en: 'expressive ink-wash style' },
    { zh: '黏土動畫風', en: 'claymation style' },
  ],
  light: [
    { zh: '邊緣逆光', en: 'edge back rim light' },
    { zh: '柔和漫反射', en: 'soft diffused lighting' },
    { zh: '高反差硬光', en: 'high-contrast hard light' },
    { zh: '舞台頂光', en: 'stage top light' },
    { zh: '街燈夜光', en: 'night streetlamp light' },
    { zh: '冷白日光', en: 'cool daylight tone' },
    { zh: '暖黃室內光', en: 'warm indoor tungsten light' },
    { zh: '霧中體積光', en: 'foggy volumetric beams' },
  ],
  rare: [
    { zh: '流體粒子', en: 'fluid particle effect' },
    { zh: '能量裂痕', en: 'energy fracture effect' },
    { zh: '漂浮符號', en: 'floating sigil symbols' },
    { zh: '裂鏡反射', en: 'shattered mirror reflection' },
    { zh: '煙霧尾跡', en: 'smoke trail effect' },
    { zh: '發光刻紋', en: 'luminous engravings' },
    { zh: '電弧特效', en: 'electric arc effects' },
    { zh: '幻影殘像', en: 'afterimage ghosting effect' },
    { zh: '飄雪粒子', en: 'snow particle effect' },
    { zh: '金屬磨損細節', en: 'metal wear detailing' },
  ],
};

const WORLD_CHARACTER_VARIATION_FILLERS: Record<CharacterWorldMode, CharacterTag[]> = {
  fantasy: [
    { zh: '月光德魯伊', en: 'moonlight druid' },
    { zh: '秘銀鐵匠', en: 'mythril blacksmith' },
    { zh: '龍語先知', en: 'dragon-tongue oracle' },
    { zh: '森林守望者', en: 'forest sentinel ranger' },
    { zh: '深海女巫', en: 'abyssal sea witch' },
    { zh: '風暴召雷者', en: 'stormcaller mage' },
    { zh: '聖域守門人', en: 'sanctum gatekeeper' },
    { zh: '秘境探險者', en: 'relic dungeon explorer' },
    { zh: '鳳羽祭司', en: 'phoenix-feather priestess' },
    { zh: '星界吟遊詩人', en: 'astral bard' },
  ],
  modern: [
    { zh: '新創創辦人', en: 'startup founder' },
    { zh: '街舞舞者', en: 'street dance performer' },
    { zh: '潮流買手', en: 'fashion concept buyer' },
    { zh: '旅行 Vlogger', en: 'travel vlogger' },
    { zh: '咖啡烘豆師', en: 'specialty coffee roaster' },
    { zh: '刺青藝術家', en: 'tattoo artist' },
    { zh: '獨立導演', en: 'indie film director' },
    { zh: '電競選手', en: 'esports pro gamer' },
    { zh: '產品設計師', en: 'product designer' },
    { zh: '潮牌主理人', en: 'streetwear label founder' },
  ],
  scifi: [
    { zh: '時間航行員', en: 'time-jump navigator' },
    { zh: '機械醫官', en: 'cyber medic officer' },
    { zh: '星門維修師', en: 'stargate maintenance engineer' },
    { zh: '神經網路術士', en: 'neural-net sorcerer' },
    { zh: '軌道傭兵', en: 'orbital mercenary' },
    { zh: '反抗軍情報員', en: 'resistance intelligence agent' },
    { zh: '量子潛行者', en: 'quantum infiltrator' },
    { zh: '外星語譯員', en: 'xeno linguist' },
    { zh: '無人機牧者', en: 'drone swarm shepherd' },
    { zh: '時空巡查官', en: 'chrono patrol officer' },
  ],
  historical: [
    { zh: '王室御廚', en: 'royal court chef' },
    { zh: '絲路商旅', en: 'silk road merchant' },
    { zh: '宮廷畫師', en: 'court portrait painter' },
    { zh: '帝國書記官', en: 'imperial scribe' },
    { zh: '馬車信使', en: 'carriage courier' },
    { zh: '城邦外交官', en: 'city-state diplomat' },
    { zh: '古典舞者', en: 'classical stage dancer' },
    { zh: '港口領航員', en: 'harbor navigator' },
    { zh: '神殿守衛', en: 'temple guardian guard' },
    { zh: '鑄幣工匠', en: 'mint coin artisan' },
  ],
  horror: [
    { zh: '夢魘行者', en: 'nightmare walker' },
    { zh: '停電夜守', en: 'blackout night watchman' },
    { zh: '失語修道者', en: 'mute cloister acolyte' },
    { zh: '深井召喚者', en: 'well-depth summoner' },
    { zh: '無聲追跡者', en: 'silent pursuit stalker' },
    { zh: '裂口信徒', en: 'rift-mouth cultist' },
    { zh: '紙偶降靈師', en: 'paper effigy medium' },
    { zh: '陰影擺渡人', en: 'shadow ferryman' },
    { zh: '夜霧獵犬使', en: 'night-fog hound handler' },
    { zh: '舊鐘塔看守', en: 'old bell tower keeper' },
  ],
  oriental: [
    { zh: '傣族少女', en: 'dai ethnicity girl' },
    { zh: '藏族少女', en: 'tibetan girl' },
    { zh: '京劇花旦', en: 'peking opera actress' },
    { zh: '苗族銀飾少女', en: 'miao silver-ornament girl' },
    { zh: '維吾爾舞者', en: 'uyghur dancer' },
    { zh: '蒙古騎手', en: 'mongolian rider' },
    { zh: '壯族歌者', en: 'zhuang folk singer' },
    { zh: '白族少女', en: 'bai ethnicity girl' },
    { zh: '彝族首領', en: 'yi chieftain' },
    { zh: '哈薩克獵鷹手', en: 'kazakh eagle hunter' },
    { zh: '敦煌壁畫仕女', en: 'dunhuang mural maiden' },
    { zh: '昆曲旦角', en: 'kunqu opera dan role' },
    { zh: '苗疆蠱師', en: 'miao shaman alchemist' },
    { zh: '唐風女將', en: 'tang dynasty shield maiden' },
    { zh: '古琴雅士', en: 'guqin literati musician' },
  ],
};

function mergeUniqueTags(base: CharacterTag[], extra: CharacterTag[]): CharacterTag[] {
  const map = new Map<string, CharacterTag>();
  for (const item of [...base, ...extra]) {
    const key = item.en.trim().toLowerCase();
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

for (const key of Object.keys(CHARACTER_COMMON_TAGS_EXTRA) as Array<keyof typeof CHARACTER_COMMON_TAGS>) {
  CHARACTER_COMMON_TAGS[key] = mergeUniqueTags(
    CHARACTER_COMMON_TAGS[key],
    CHARACTER_COMMON_TAGS_EXTRA[key]
  );
}

for (const mode of Object.keys(CHARACTER_WORLD_DATA_EXTRA) as Array<keyof CharacterWorldData>) {
  for (const category of Object.keys(CHARACTER_WORLD_DATA_EXTRA[mode]) as Array<keyof CharacterWorldData[typeof mode]>) {
    CHARACTER_WORLD_DATA[mode][category] = mergeUniqueTags(
      CHARACTER_WORLD_DATA[mode][category],
      CHARACTER_WORLD_DATA_EXTRA[mode][category]
    );
  }
}

for (const key of Object.keys(CHARACTER_COMMON_TAGS) as Array<keyof typeof CHARACTER_COMMON_TAGS>) {
  let list = CHARACTER_COMMON_TAGS[key];
  if (list.length < MIN_OPTIONS_PER_CATEGORY) {
    list = mergeUniqueTags(list, CATEGORY_FILLERS[key as CharacterCategoryKey]);
  }
  CHARACTER_COMMON_TAGS[key] = list.slice(0, Math.max(MIN_OPTIONS_PER_CATEGORY, list.length));
}

for (const mode of Object.keys(CHARACTER_WORLD_DATA) as Array<keyof CharacterWorldData>) {
  for (const category of Object.keys(CHARACTER_WORLD_DATA[mode]) as Array<keyof CharacterWorldData[typeof mode]>) {
    let list = CHARACTER_WORLD_DATA[mode][category];
    if (category === 'character') {
      list = mergeUniqueTags(list, WORLD_CHARACTER_VARIATION_FILLERS[mode]);
    }
    if (list.length < MIN_OPTIONS_PER_CATEGORY) {
      // Keep character options world-specific first; only use generic fallback if still short.
      if (category === 'character') {
        list = mergeUniqueTags(list, CATEGORY_FILLERS.character);
      } else {
        list = mergeUniqueTags(list, CATEGORY_FILLERS[category as CharacterCategoryKey]);
      }
    }
    CHARACTER_WORLD_DATA[mode][category] = list.slice(0, Math.max(MIN_OPTIONS_PER_CATEGORY, list.length));
  }
}

export const CHARACTER_DEFAULT_STATE = {
  character: '',
  pose: '',
  outfit: '',
  env: '',
  color: '',
  shot: '',
  style: '',
  light: '',
  rare: '',
  negative: '',
};
