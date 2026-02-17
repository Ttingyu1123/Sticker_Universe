

// Aspect Ratios for UI
export const ASPECT_RATIOS = ['11:6', '16:9', '3:2', '4:3', '1:1', '3:4', '2:3', '9:16', '6:11'] as const;

// Aspect Ratios supported directly by the Imagen API
export const API_SUPPORTED_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

// Fix: Add missing SAM_SEGMENTS export to resolve build errors.
// --- S.A.M. Constants ---
export const SAM_SEGMENTS = [
  { id: 'person', label: '主要人物' },
  { id: 'face', label: '臉部' },
  { id: 'hair', label: '頭髮' },
  { id: 'sky', label: '天空' },
  { id: 'background', label: '背景' },
  { id: 'foreground', label: '前景' },
  { id: 'clothing', label: '衣服' },
  { id: 'vehicle', label: '載具' },
  { id: 'building', label: '建築' },
];

// --- VEO Constants ---
export const VEO_ASPECT_RATIOS: ReadonlyArray<"16:9" | "1:1" | "9:16"> = ['16:9', '1:1', '9:16'] as const;

export const VEO_MEME_PROMPTS = [
  { label: '一切都很好', prompt: "『This is Fine』迷因裡的柴犬，戴著太陽眼鏡坐在燃燒的沙灘椅上，周圍是海嘯警報，牠啜飲著一杯小雨傘著火的飲料，輕聲說：『沒事的。』" },
  { label: '永恆的節拍', prompt: "薛西弗斯（Sisyphus）在一個地下電音派對上擔任 DJ，音樂是他推著巨石上山的沉重撞擊聲，每當巨石滾落時就是一次『Drop』，台下是面無表情、隨節奏搖擺的殭屍。" },
  { label: '企業塗鴉', prompt: "一位面帶虛偽微笑的人力資源經理，在午夜用過期咖啡和螢光筆，在公司大樓外牆上噴塗『我們是個大家庭』和『提升協同效應』等標語。" },
  { label: '深海瘟疫', prompt: "一位中世紀瘟疫醫生穿著全套鳥嘴面具裝備，在充滿塑膠袋和廢棄物的混濁海底「治療」一隻變異的魚。" },
  { label: '克蘇魯吃播', prompt: "一位美食網紅正直播開箱一本用海草包裹、會蠕動的《死靈之書》，並用叉子戳著書頁上長出的觸手，對著鏡頭說：『嘿，各位粉絲，今天我們來嚐嚐遠古的恐懼！』" },
  { label: '究極鍛鍊', prompt: "『Gigachad』迷因裡的那個男人，在健身房裡不是舉啞鈴，而是用槓鈴舉著自己巨大的下巴，鏡子裡反射出他完美的下顎線。" },
  { label: '末日騎士', prompt: "『分心男友』迷因裡的那個男友，騎著一輛重型機車，回頭看著一個新出現的「災難預兆」（彗星），而他的女友（代表「現有的全球危機」）在他身後憤怒地大喊。" },
  { label: '太空垃圾人', prompt: "一位在太空站工作的清潔工，穿著笨重的太空服，用一支長長的夾子費力地將一個漂浮的披薩盒塞進已經滿出來的太空垃圾桶裡。" },
  { label: '賽博禪修', prompt: "一個有著七彩跑馬燈的電競主機，被放置在日本寺廟的枯山水庭園中央，發出嗡嗡的風扇聲，試圖在數位世界與現實之間尋求內心的平靜。" },
  { label: '地獄廚房', prompt: "一位惡魔在電視廚藝大賽上，用靈魂和悔恨作為調味料，烹煮一道名叫「永恆的折磨」的菜餚，評審嚐了一口後流下了感動（或痛苦）的淚水。" },
  { label: '存在主義偵探', prompt: "一個被畫壞的火柴人偵探，站在一片虛無的白色背景中，對著地上一條鉛筆線索喃喃自語：『這一切的意義是什麼？是誰畫下了我？』" },
  { label: 'NFT農夫', prompt: "一位穿著格子衫的農夫，在他-的虛擬農場裡，驕傲地抱著一顆他剛「挖礦」挖出來、價值三百萬美金的巨大像素化南瓜 JPEG 檔案。" },
  { label: '線上對線', prompt: "一位鍵盤戰士戴著VR頭盔，坐在堆滿能量飲料空罐的電競椅上，正用一套價值不菲的模擬器，與論壇上的另一個網友進行激烈的「真人快打」。" },
  { label: '演算法管理員', prompt: "YouTube 的演算法化身為一個疲憊的圖書館員，面對堆積如山的影片，它隨手拿起一個貓咪影片和一個陰謀論影片，然後把它們一起蓋上「推薦」的印章。" },
  { label: '打卡聖地', prompt: "一位喪屍網紅背著登山包，在傾頹的末日城市廢墟中擺出陽光開朗的姿勢自拍，並在照片下標註：#末日旅行 #廢土風 #活在當下。" },
  { label: '選擇困難症', prompt: "哲學家沙特推著購物車，在宜家（IKEA）面對兩款幾乎一模一樣的置物櫃，陷入了關於「自由選擇的重負」的深度思考，最終癱坐在地上。" },
  { label: '情緒勞動', prompt: "一位微笑面具人（Wojak 迷因）在咖啡店擔任咖啡師，面具上掛著燦爛的笑容，但面具下滴著眼淚，為客人拉花時手微微顫抖。" },
  { label: '精神內耗', prompt: "兩隻正在打架的貓（Cat Fight 迷因），在山頂上試圖一起完成一個雙人瑜珈動作，結果扭打了起來。" },
  { label: '濾鏡人生', prompt: "一位開了十級美顏濾鏡的網路主播，在羅馬競技場前直播，濾鏡嚴重變形，把後面的古蹟都P成了光滑的圓柱體。" },
  { label: '安慰劑市場', prompt: "一位穿著白袍的庸醫，在農夫市集上販售他自己裝瓶的「正能量空氣」和「有機安慰劑藥丸」，生意絡繹不絕。" },
  { label: '知識的詛咒', prompt: "一位剛學會上網的穴居人，在大學講堂裡用石板展示他從網路論壇上學到的「地球是平的」理論，台下學生一片茫然。" },
  { label: '待辦事項', prompt: "死神在他的車庫裡，拿著一把巨大的鐮刀，笨拙地修理一台卡住的印表機，因為「死亡名單」列印不出來，導致他今天的工作嚴重延遲。" },
  { label: '觀景窗悖論', prompt: "薛丁格的貓身穿迷彩服，拿著一台相機，悄悄地拍攝一隻既存在又不存在的獅子。" },
  { label: '資本主義的抉擇', prompt: "一個身穿西裝的華爾街之狼，在超市的冰淇淋區，正在用複雜的股票分析模型，計算哪一種口味的冰淇淋能帶來最高的「幸福感投資報酬率」。" },
  { label: '無盡的循環', prompt: "一隻正在電腦前打字的倉鼠，在地下酒吧擔任鼓手，用牠小小的爪子在一個滾輪改造的鼓上瘋狂奔跑，製造出快速但單調的節奏。" },
  { label: '畫大餅', prompt: "一位新創公司的 CEO，穿著黑色高領毛衣，在空無一物的會議室裡，對著一群想像出來的投資人，激情地介紹他那個能「顛覆人類生活」的共用單車App。" },
  { label: '數位典藏', prompt: "一個病毒（電腦病毒），在博物館裡欣賞著一幅由藍白當機畫面構成的數位藝術品，看得入了迷。" },
  { label: '物理Bug', prompt: "一位遊戲裡的 NPC（非玩家角色），因為程式碼出錯，從飛機上跳下來後卡在了半空中，保持著自由落體的姿勢，表情茫然。" },
  { label: '最後一哩路', prompt: "一位外送平台的外送員，騎著一匹筋疲力盡的殭屍馬，背著外送箱，穿梭在充滿惡靈的街道上，只是為了一單即將超時的訂單。" },
  { label: '資訊繭房', prompt: "一個被演算法餵養大的年輕人，穿著睡衣癱在沙發上，電視、手機、平板同時播放著同一個網紅推薦的同一部劇，爆米花是演算法推薦的口味。" }
];

export const UNIFIED_DIRECTOR_STYLES = [
  { name: '隨機導演', prompt: '' },
  { name: 'Abbas Kiarostami (阿巴斯·奇亞羅斯塔米)', prompt: '伊朗新浪潮，模糊紀錄片與劇情片的界線，兒童視角，對生命意義的哲學探討，如《橄欖樹下的情人》。' },
  { name: 'Akira Kurosawa (黑澤明)', prompt: '武士精神與榮譽，大氣磅礴的史詩感，運用多機位拍攝和精準的構圖，如《七武士》般古典而永恆。' },
  { name: 'Alfonso Cuarón (阿方索·卡隆)', prompt: '長鏡頭的敘事魔力，如《人類之子》般緊張壓抑的科幻末日，或《羅馬》般細膩的個人史詩，情感豐富。' },
  { name: 'Andrei Tarkovsky (安德烈·塔可夫斯基)', prompt: '詩意的長鏡頭，對記憶、信仰和自然的深刻思考，緩慢而沉靜的節奏，如《潛行者》。' },
  { name: 'Ang Lee (李安)', prompt: '細膩的情感刻畫，東西方文化交融的衝突與和解，如《臥虎藏龍》般詩意與武俠的結合，或《少年Pi的奇幻漂流》般壮麗的視覺史詩。' },
  { name: 'Antoine Fuqua', prompt: 'The scene is directed in the signature style of Antoine Fuqua. The action is visceral and hard-hitting, with a focus on character-driven conflict and the brutal consequences of violence. The visuals are often dark, stylish, and intense.' },
  { name: 'Ava DuVernay (艾娃·杜威內)', prompt: '歷史題材中的種族與正義，強大的情感驅動，如《逐夢大道》般鼓舞人心。' },
  { name: 'Bernardo Bertolucci (貝爾納多·貝托魯奇)', prompt: '史詩般的政治與情慾糾葛，華麗的視覺風格，如《末代皇帝》。' },
  { name: 'Bong Joon-ho (奉俊昊)', prompt: '社會批判與黑色幽默，類型片結構下的階級矛盾，如《寄生上流》般從荒誕走向驚悚的氛圍。' },
  { name: 'Brad Bird', prompt: 'The scene is directed in the signature style of Brad Bird. The action is inventive, beautifully choreographed, and spatially clear, whether in animation or live-action. The sequences are a masterclass in building suspense and excitement through clever staging.' },
  { name: 'Chad Stahelski (John Wick)', prompt: 'The scene is directed in the signature style of Chad Stahelski. Showcase "gun-fu" with clean, wide-angle long takes that emphasize choreography. The lighting is heavily influenced by neon, with deep shadows and a sleek, modern, and brutal aesthetic.' },
  { name: 'Chloé Zhao (趙婷)', prompt: '自然風景中的個人故事，寫實的鏡頭捕捉邊緣人物的生存狀態，如《游牧人生》般詩意而真實。' },
  { name: 'Christopher McQuarrie', prompt: 'The scene is directed in the signature style of Christopher McQuarrie. Feature complex, high-stakes action sequences that are meticulously planned and executed with a focus on practical effects and clear, coherent geography.' },
  { name: 'Christopher Nolan (克里斯多福·諾蘭)', prompt: '燒腦的非線性敘事，時間與記憶的哲學探討，IMAX級的宏大視覺效果，低沉配樂，如《全面啟動》或《星際效應》。' },
  { name: 'Clint Eastwood (克林·伊斯威特)', prompt: '經典的西部片或犯罪片風格，深沉的男性氣概，簡單而有力的敘事，如《不可饒恕》。' },
  { name: 'Coen Brothers (科恩兄弟)', prompt: '黑色幽默與荒誕諷刺，犯罪故事與意外事件，獨特的對白和地域特色，如《冰血暴》。' },
  { name: 'Corey Yuen (元奎)', prompt: 'The scene is directed in the signature style of Corey Yuen. The action is a showcase of high-flying, acrobatic martial arts. The choreography is elegant and powerful, blending traditional kung fu with modern cinematic techniques for maximum visual impact.' },
  { name: 'Daniels - Kwan & Scheinert (丹尼爾·關 & 丹尼爾·舒奈特)', prompt: '瘋狂的創意和天馬行空的敘事，多重宇宙的視覺盛宴，如《媽的多重宇宙》般充滿想像力。' },
  { name: 'David Ayer', prompt: 'The scene is directed in the signature style of David Ayer. The action is gritty, tactical, and grounded in street-level realism. The camera is often in the thick of the fight, capturing the raw and chaotic nature of urban combat.' },
  { name: 'David Fincher (大衛·芬奇)', prompt: '冷峻的藍灰色調，精準的剪輯和鏡頭控制，探討人性的黑暗面，如《社群網戰》或《火線追緝令》般的懸疑與緊張。' },
  { name: 'David Leitch', prompt: 'The scene is directed in the signature style of David Leitch. A former stuntman, the action is clean, creative, and built around incredible stunt work. The choreography is top-notch, with a neon-lit, stylish, and often humorous tone.' },
  { name: 'David Lynch (大衛·林奇)', prompt: '超現實主義，詭異的夢境與潛意識，扭曲的現實和神秘符號，如《穆赫蘭大道》般迷幻。' },
  { name: 'Denis Villeneuve', prompt: 'The scene is directed in the signature style of Denis Villeneuve. The action is tense, brutal, and grounded in a stark reality. Use a muted color palette and immersive sound design to create a sense of overwhelming scale and suspense.' },
  { name: 'Doug Liman', prompt: 'The scene is directed in the signature style of Doug Liman. The action has a sense of grounded, innovative realism. The camera work is often handheld and immersive, creating a feeling of immediacy and clever, on-the-fly problem-solving.' },
  { name: 'Edgar Wright', prompt: 'The scene is directed in the signature style of Edgar Wright. The action is tightly choreographed to the rhythm of the music, with kinetic, whip-pan editing, and a heavy use of visual comedy and creative sound design.' },
  { name: 'Edward Yang (楊德昌)', prompt: '台北都市生活群像，理性而冷靜的鏡頭，對人際關係和現代化的批判，如《牯嶺街少年殺人事件》。' },
  { name: 'F. Gary Gray', prompt: 'The scene is directed in the signature style of F. Gary Gray. Craft slick, large-scale action sequences, especially car chases, with a high-energy, commercial aesthetic. The action is exciting, well-shot, and often has a heist or street-racing flavor.' },
  { name: 'Federico Fellini (費德里柯·費里尼)', prompt: '魔幻現實主義，對社會和人性的諷刺，嘉年華般的熱鬧場景與荒誕元素，如《八又二分之一》。' },
  { name: 'François Truffaut (楚浮)', prompt: '新浪潮的浪漫主義，對童年和愛情的探索，流暢的敘事和人道關懷，如《四百擊》。' },
  { name: 'Gareth Evans', prompt: 'The scene is directed in the signature style of Gareth Evans. Showcase brutal and intricate Silat martial arts with dynamic, flowing camera work that moves with the fighters. The editing is fast-paced, highlighting the raw impact of every blow.' },
  { name: 'George Miller (Mad Max)', prompt: 'The scene is directed in the signature style of George Miller. Create a sense of practical, kinetic chaos. Use tight, center-framed shots on the action, rapid-fire editing, and a vibrant, often monochromatic desert color palette to create relentless forward momentum.' },
  { name: 'Greta Gerwig (葛莉塔·潔薇)', prompt: '女性成長與自我探索，充滿智慧和幽默的對白，如《淑女鳥》或《小婦人》般真誠而生動。' },
  { name: 'Guillermo del Toro (吉勒摩·戴托羅)', prompt: '哥德式奇幻美學，怪物與人性的界線模糊，如《水形物語》般黑暗浪漫的童話故事。' },
  { name: 'Guy Ritchie', prompt: 'The scene is directed in the signature style of Guy Ritchie. Use a frenetic mix of speed-ramping, quick cuts, and gritty, street-level action, often accompanied by witty narration or dialogue and a cool, stylish soundtrack.' },
  { name: 'Hayao Miyazaki (宮崎駿)', prompt: '手繪動畫的奇幻世界，環保與和平的主題，充滿想像力的生物和場景，如《神隱少女》般溫暖而深邃。' },
  { name: 'Hirokazu Kore-eda (是枝裕和)', prompt: '平實細膩的家庭故事，日常對話中的情感流動，呈現《小偷家族》般溫暖而感傷的現實主義。' },
  { name: 'Hou Hsiao-Hsien (侯孝賢)', prompt: '台灣新電影代表，長鏡頭的日常捕捉，對歷史與鄉愁的詩意呈現，如《悲情城市》。' },
  { name: 'Ingmar Bergman (英格瑪·柏格曼)', prompt: '對信仰、死亡和人際關係的哲學探討，黑白影像的強烈對比，特寫鏡頭中的人物內心，如《第七封印》。' },
  { name: 'J.J. Abrams', prompt: 'The scene is directed in the signature style of J.J. Abrams. The action is fast-paced and full of spectacle, characterized by signature lens flares, a constantly moving camera, and a sense of mystery and adventure.' },
  { name: 'James Cameron', prompt: 'The scene is directed in the signature style of James Cameron. Combine high-stakes, technologically advanced action with a strong emotional core. Use a cool, blue-tinted color palette, and depict large-scale, meticulously detailed set pieces.' },
  { name: 'James Wan', prompt: 'The scene is directed in the signature style of James Wan. The camera is incredibly dynamic, moving through environments in long, seemingly impossible takes. The action is a blend of horror kinetics and high-octane spectacle.' },
  { name: 'Jean-Luc Godard (尚盧·高達)', prompt: '法國新浪潮的代表，跳躍剪輯，打破第四道牆，對電影形式的實驗，如《斷了氣》。' },
  { name: 'Jia Zhangke (賈樟柯)', prompt: '中國社會變遷下的個體命運，寫實而沉鬱的風格，大量非專業演員，如《三峽好人》。' },
  { name: 'John Cassavetes (約翰·卡薩維蒂)', prompt: '寫實的即興表演，對人物心理的深入挖掘，獨立電影的粗獷感，如《受影響的女人》。' },
  { name: 'John McTiernan', prompt: 'The scene is directed in the signature style of John McTiernan. Craft suspenseful, spatially aware action sequences. Utilize wide-angle lenses and clever blocking to make the environment a key part of the action, with a focus on a lone, resourceful hero.' },
  { name: 'John Woo (吳宇森)', prompt: 'The scene is directed in the signature style of John Woo. Feature hyper-stylized "heroic bloodshed" gun-fu, with dramatic slow-motion, dynamic dove-like visual motifs, and intense, emotionally charged action.' },
  { name: 'Johnnie To (杜琪峰)', prompt: 'The scene is directed in the signature style of Johnnie To. Feature meticulously staged, static-camera shootouts where positioning and strategy are key. The action is tense, minimalist, and punctuated by sudden bursts of violence.' },
  { name: 'Justin Lin', prompt: 'The scene is directed in the signature style of Justin Lin. Known for large-scale, physics-defying vehicular action. The sequences are elaborate, over-the-top, and executed with a slick, blockbuster sensibility.' },
  { name: 'Kathryn Bigelow', prompt: 'The scene is directed in the signature style of Kathryn Bigelow. Employ a gritty, visceral, and immersive documentary style. Use handheld cameras and long takes to create a sense of chaotic realism and intense, life-or-death tension.' },
  { name: 'Kenji Mizoguchi (溝口健二)', prompt: '對女性悲劇命運的深刻描繪，長鏡頭與精緻的構圖，如《雨月物語》般古典而淒美。' },
  { name: 'Kim Jee-woon (金知雲)', prompt: 'The scene is directed in the signature style of Kim Jee-woon. Blend stylish, genre-inflected action with high-octane energy. The visuals are polished and dynamic, whether in a Western-style shootout, a spy thriller chase, or a tale of brutal revenge.' },
  { name: 'Lars von Trier (拉斯·馮·提爾)', prompt: '極具爭議的實驗性風格，對人性的黑暗面進行極端探索，手持攝影與自然光，如《破浪》。' },
  { name: 'Lena Dunham (莉娜·杜漢)', prompt: '年輕女性在城市中的掙扎與成長，帶有自嘲與真實感的幽默，如《女孩我最大》的坦率。' },
  { name: 'Luc Besson', prompt: 'The scene is directed in the signature style of Luc Besson. The action is slick, highly stylized, and has a European "cinéma du look" sensibility. The visuals are colorful and cool, often centered around a memorable, formidable protagonist.' },
  { name: 'Luis Buñuel (路易斯·布紐爾)', prompt: '超現實主義，對宗教和資產階級的諷刺，夢境與現實的交織，如《中產階級的審慎魅力》。' },
  { name: 'Martin Scorsese (馬丁·史柯西斯)', prompt: '粗獷寫實的城市生活，罪惡與救贖的主題，快速剪輯與獨白，呈現《好傢伙》或《計程車司機》般的黑幫史詩。' },
  { name: 'Matthew Vaughn', prompt: 'The scene is directed in the signature style of Matthew Vaughn. Showcase inventive, hyper-violent, and flawlessly choreographed action set pieces, often set to anachronistic music, with a slick, energetic, and unapologetically stylish flair.' },
  { name: 'Michael Bay', prompt: 'The scene is directed in the signature style of Michael Bay. Incorporate "Bayhem" aesthetics: massive explosions, epic-scale destruction, sweeping low-angle tracking shots, dramatic lens flares, and a high-contrast, saturated color palette.' },
  { name: 'Michael Haneke (麥可·哈內克)', prompt: '對現代社會的冷酷批判，心理驚悚與暴力，長鏡頭和疏離感，如《鋼琴教師》。' },
  { name: 'Neill Blomkamp', prompt: 'The scene is directed in the signature style of Neill Blomkamp. Blend gritty, realistic action with futuristic sci-fi concepts. The visuals have a documentary feel, with realistic VFX and a focus on social commentary within the action.' },
  { name: 'Park Chan-wook (朴贊郁)', prompt: 'The scene is directed in the signature style of Park Chan-wook. The action is a brutal, beautifully composed, and often single-take "hallway fight" sequence. The violence is raw and visceral, framed with a meticulous, almost operatic elegance.' },
  { name: 'Paul Greengrass', prompt: 'The scene is directed in the signature style of Paul Greengrass. Utilize a shaky-cam, documentary-like "cinéma vérité" style. The editing is rapid and disorienting, creating a chaotic and intensely realistic sense of immersion in the action.' },
  { name: 'Paul Thomas Anderson (保羅·湯瑪斯·安德森)', prompt: '複雜的人物心理，社會邊緣人的故事，流暢的攝影機運動，如《黑金企業》般史詩。' },
  { name: 'Paul Verhoeven', prompt: 'The scene is directed in the signature style of Paul Verhoeven. The action is shockingly violent, over-the-top, and often serves as a satirical commentary on society. The visuals are graphic, explosive, and unapologetically brutal.' },
  { name: 'Pedro Almodóvar (佩德羅·阿莫多瓦)', prompt: '鮮豔的色彩與巴洛克風格，複雜的女性視角和情感糾葛，西班牙文化與戲劇性，如《玩美女人》。' },
  { name: 'Peter Berg', prompt: 'The scene is directed in the signature style of Peter Berg. The action is chaotic, intense, and grounded in a sense of patriotic, real-world heroism. The editing is fast and the camera is often right in the middle of the conflict.' },
  { name: 'Prachya Pinkaew', prompt: 'The scene is directed in the signature style of Prachya Pinkaew. The action highlights the raw, bone-crunching power of Muay Thai. The choreography is grounded and brutal, with a focus on practical stunts that showcase the incredible athleticism of the performers.' },
  { name: 'Quentin Tarantino (昆汀·塔倫提諾)', prompt: '非線性敘事，風格化的暴力美學，大量流行文化引用和經典配樂，對白充滿張力，如《黑色追緝令》般獨特。' },
  { name: 'Ridley Scott', prompt: 'The scene is directed in the signature style of Ridley Scott. Create a richly detailed, atmospheric world. The action is often brutal and realistic, framed with a painterly eye for composition and texture, whether in historical epics or sci-fi horror.' },
  { name: 'Ringo Lam (林嶺東)', prompt: 'The scene is directed in the signature style of Ringo Lam. Create a gritty, realistic, and often desperate sense of action. The violence is unglamorous and impactful, with characters pushed to their absolute limits in chaotic urban environments.' },
  { name: 'Sam Peckinpah', prompt: 'The scene is directed in the signature style of Sam Peckinpah. The action is a chaotic, slow-motion ballet of violence. The editing is complex and multi-angled, emphasizing the brutal and tragic consequences of every gunshot.' },
  { name: 'Sarah Polley (莎拉·波利)', prompt: '對家庭關係和記憶的細膩探討，充滿同情心的角色塑造，如《她的時代》般深刻而動人。' },
  { name: 'Sergio Leone (賽吉歐·李昂尼)', prompt: '經典義大利西部片，特寫鏡頭和廣闊的沙漠風景形成對比，沉默與暴力並存，如《黃昏三鏢客》。' },
  { name: 'Shane Black', prompt: 'The scene is directed in the signature style of Shane Black. The action is a subversion of genre tropes, often witty, and punctuated by sharp dialogue. The sequences are typically set against a Christmas backdrop and feature buddy-cop dynamics.' },
  { name: 'Stanley Kubrick (史丹利·庫柏力克)', prompt: '冰冷而精確的攝影，對稱構圖，宏大的哲學命題，如《2001太空漫遊》或《發條橘子》。' },
  { name: 'Steven Spielberg (史蒂芬·史匹柏)', prompt: '宏偉的史詩感，探索人性的善惡與希望，運用經典的攝影機運動和音樂，營造《侏羅紀公園》或《E.T.》般的奇幻與冒險。' },
  { name: 'Takashi Miike (三池崇史)', prompt: 'The scene is directed in the signature style of Takashi Miike. The action is surreal, often absurdly violent, and completely unpredictable. The tone can shift from slapstick comedy to horrifying brutality in an instant.' },
  { name: 'Takeshi Kitano (北野武)', prompt: 'The scene is directed in the signature style of Takeshi Kitano. The action is characterized by minimalist long takes, abrupt and shocking moments of violence, and a detached, almost serene aesthetic that contrasts with the brutality.' },
  { name: 'Terrence Malick (泰倫斯·馬力克)', prompt: '詩意的自然光攝影，旁白與意識流敘事，探索人與自然的關係，如《生命之樹》。' },
  { name: 'The Wachowskis (The Matrix)', prompt: 'The scene is directed in the signature style of The Wachowskis. Utilize iconic "bullet time" slow-motion effects, intricate wire-fu martial arts, a cool green and black color grade, and a sense of reality-bending, high-concept action.' },
  { name: 'Timo Tjahjanto', prompt: 'The scene is directed in the signature style of Timo Tjahjanto. The action is relentlessly brutal, gory, and masterfully choreographed. The violence is extreme and visceral, pushing the boundaries of the action genre with a horror-infused intensity.' },
  { name: 'Timur Bekmambetov', prompt: 'The scene is directed in the signature style of Timur Bekmambetov. The action is defined by a wildly inventive use of extreme slow-motion, physics-bending special effects, and a unique visual flair that often feels like a graphic novel brought to life.' },
  { name: 'Tony Scott', prompt: 'The scene is directed in the signature style of Tony Scott. Use a hyper-kinetic style with rapid-fire editing, saturated colors, and a restless camera. The action is slick, high-energy, and has the feel of a high-budget music video.' },
  { name: 'Tsai Ming-liang (蔡明亮)', prompt: '極簡主義的長鏡頭，城市邊緣人物的疏離與孤寂，少對白，注重環境聲和肢體語言，如《愛情萬歲》。' },
  { name: 'Tsui Hark (徐克)', prompt: 'The scene is directed in the signature style of Tsui Hark. Depict fantastical Wuxia-style action with gravity-defying wire-fu, rapid, almost chaotic editing, and imaginative special effects that create a whirlwind of motion and energy.' },
  { name: 'Vittorio De Sica (維托里奧·德西卡)', prompt: '義大利新現實主義，關注二戰後普通人的掙扎，如《偷自行車的人》般感人。' },
  { name: 'Walter Hill', prompt: 'The scene is directed in the signature style of Walter Hill. The action is tough, masculine, and minimalist, with a cool, almost mythic quality. The visuals are gritty and often have a neo-western or comic book-like simplicity.' },
  { name: 'Wes Anderson (韋斯·安德森)', prompt: '極致對稱的構圖，鮮豔飽和的復古色調，古怪的角色和細膩的道具設計，充滿童話感，如《布達佩斯大飯店》。' },
  { name: 'William Friedkin', prompt: 'The scene is directed in the signature style of William Friedkin. Capture a raw, documentary-level of realism. The action, especially car chases, is visceral, dangerous, and feels completely out of control.' },
  { name: 'Wong Kar-wai (王家衛)', prompt: 'The scene is directed in the signature style of Wong Kar-wai. While not a typical action director, capture the moment with a dreamy, atmospheric quality. Use step-printing for blurred motion, neon-drenched, moody lighting, and tight, intimate framing to create a sense of poetic, fleeting intensity.' },
  { name: 'Woody Allen (伍迪·艾倫)', prompt: '知識分子式的幽默對白，對愛情、生活和死亡的哲學思考，城市背景，如《安妮霍爾》。' },
  { name: 'Yasujirō Ozu (小津安二郎)', prompt: '日常生活的溫馨與感傷，固定機位，低機位視角，家庭關係的細膩觀察，如《東京物語》。' },
  { name: 'Yuen Woo-ping (袁和平)', prompt: 'The scene is directed by the legendary martial arts choreographer Yuen Woo-ping. The focus is on intricate, inventive, and masterfully executed hand-to-hand combat and weapon choreography, captured with clear, dynamic camera work that highlights the skill of the fighters.' },
  { name: 'Zack Snyder', prompt: 'The scene is directed in the signature style of Zack Snyder. Employ dramatic speed ramping (alternating between slow-motion and high-speed), high-contrast "crushed blacks" visuals, and carefully composed shots that resemble epic comic book panels.' },
  { name: 'Zhang Yimou (張藝謀)', prompt: '色彩斑斕的視覺美學，史詩般的歷史背景，對抗強權或命運的主題，如《英雄》般詩意的武俠。' }
];

// Example prompts for the initial screen
export const EXAMPLE_PROMPTS = [
  '一隻可愛的貓咪太空人，漂浮在銀河中',
  '一座未來城市的霓虹燈夜景，賽博龐克風格',
  '一幅梵高風格的向日葵星夜畫',
  '一座維多利亞時代的豪宅，住著傳說中的吸血鬼',
  '一位身穿盔甲的女騎士，站在山頂上',
  '一個廢棄的太空站，被外星人佔領',
  '一片超現實的沙漠景觀，瘋狂麥斯車隊正在追逐',
  '一個舒適的書房，窗外下著雨',
];

// For "Inspire Me" feature
export const SUBJECTS = ['一隻貓', '一位機器人', '一位巫師', '一位太空人', '一條龍', '一位偵探'];
export const BACKGROUNDS = ['一座繁華的未來城市', '一片寧靜的魔法森林', '一個廢棄的太空站', '一座維多利亞時代的豪宅', '一片超現實的沙漠景觀'];
export const ACTIONS_POSES = ['正在閱讀一本古老的書', '正在喝咖啡', '正在凝視遠方', '正在跳舞', '正在修理一個複雜的裝置'];
export const EMOTIONS = ['快樂的', '沉思的', '神秘的', '勇敢的', '悲傷的'];
export const CLOTHING = ['現代時尚服裝', '中世紀盔甲', '賽博龐克外套', '優雅的長袍', '蒸汽龐克風格的服飾'];
export const DETAILS_OBJECTS = ['發光的植物', '漂浮的水晶', '古老的時鐘', '未來派的小工具', '一群蝴蝶'];
export const ART_STYLES = ['梵高風格', '達利超現實主義', '日本浮世繪風格', '賽博龐克藝術', '吉卜力工作室動畫風格'];
export const LIGHTING = ['柔和的晨光', '霓虹燈光', '戲劇性的倫勃朗光', '溫暖的燭光', '月光'];
export const COMPOSITIONS = ['對稱構圖', '黃金比例構圖', '特寫鏡頭', '廣角鏡頭', '鳥瞰視角'];
export const TONES_TEXTURES = ['溫暖的色調', '冷酷的藍色調', '高對比度的黑白', '柔和的粉彩色', '粗糙的油畫質感'];

// Function buttons for quick prompt additions
export const FUNCTION_BUTTONS = [
  { label: '3D公仔', prompt: '4K, create a 1/7 scale commercialized figure of the character, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a EANDAI-style toy packaging box printed with the original artwork' },
  { label: '三視圖', prompt: 'character design sheet, orthographic view, front view, side view, back view, T-pose, detailed, clean line art, white background' },
  { label: '3D紙雕', prompt: '3D sculpted paper art, layered paper, intricate papercraft, quilling, detailed, delicate lighting' },
  { label: '撲克牌', prompt: 'A hyper-detailed cinematic playing card artwork, Queen card format, standing slightly tilted on a wooden surface, shallow depth of field, soft bokeh background. The central subject: [YOUR MAIN SUBJECT], close-up bust portrait (from chest up), designed with a strong 3D pop-out effect, partially emerging from the card surface. Front part of the subject appears outside the card frame, while the back part blends seamlessly into the card texture. Highly detailed face, realistic skin texture, sharp eyes, expressive lighting. Surrounded by intricate ornamental elements, colorful layered textures, metallic accents, sculpted fantasy decorations. Premium embossed card material, realistic paper texture, subtle wear, sharp edges. Soft cinematic lighting, warm highlights, realistic shadows, ambient occlusion. Ultra-detailed semi-3D painterly realism, photorealistic fusion, 8k resolution, macro photography look, masterpiece quality.' },
  { label: '向量圖標', prompt: 'convert this into a clean, simple, flat 2D vector icon' },
  { label: '黏土模型', prompt: 'claymation style, plasticine model, stop-motion animation look' },
  { label: '像素藝術', prompt: 'pixel art, 16-bit, retro video game style' },
  { label: '雙重曝光', prompt: 'double exposure effect with a silhouette of a person and a forest scene' },
  { label: '低多邊形', prompt: 'low poly art style, geometric, faceted' },
  { label: '黑白素描', prompt: 'black and white pencil sketch, detailed shading' },
  { label: '產品攝影', prompt: 'commercial product photography, clean studio background, professional lighting' },
  { label: '開箱照', prompt: 'Knolling photography, objects arranged neatly at 90-degree angles, flat lay, top-down view, clean studio lighting on a flat surface, organized, hyper-detailed, photorealistic' },
  { label: '等距可愛', prompt: 'Isometric 3D cute art, miniature diorama, soft pastel colors, clay-like texture, clean studio lighting, detailed, high quality' },
  { label: '電影感', prompt: 'cinematic lighting, dramatic, movie still' },
  { label: '吉卜力風格', prompt: 'ghibli studio style, anime, beautiful scenery' },
  { label: '品牌視覺設計', prompt: '使用上傳的產品圖片，製作一張垂直版 9:16 比例的品牌設計規格海報。設計風格需貼合產品的細分市場定位與視覺標誌。海報需劃分清晰美觀的版塊，具體包含：（1）品牌標誌醒目展示及安全區域使用規範；（2）產品樣機居中突出呈現；（3）主輔色卡搭配十六進制色值標註；（4）字體規範，涵蓋標題、副標題、正文字體示例及行間距參數；（5）品牌常用圖示或圖形元素範例；（6）圖片處理風格，附生活場景或棚拍效果範例圖；（7）網格系統與版面配置規則；（8）包裝樣機及實體應用效果展示；（9）設計注意事項，搭配標註說明圖。背景採用簡約白色或柔和中性色調，輔以規則的版塊分割線及投影效果。最終成品需視覺豐富、版面整潔，適用於印刷版或電子版品牌手冊。' },
  { label: '真人角色設計表', prompt: '請根據這張照片中的人物，建立一份詳細的角色設計表。這將用於真人電影，因此請注意不要製作成動漫風格的藝術作品。它必須包含以下三個角色元素。完成後，請移除人物的原始圖像。(1)角色多角度（三視圖）轉向圖 (2)表情表，顯示基本情緒狀態，例如喜悅、悲傷、憤怒、驚訝、恐懼和中性 (3) 姿勢表，顯示典型動作，例如角色跑步、跳躍、大笑和哭泣' },
  { label: '角色設計表', prompt: 'Best quality, masterpiece, ultra high res, Create a photo character sheet of her with identically consistent facial features. Include different angles: front, side, back, quarter. List different expressions and details with photos. White background. Landscape mode. Render at max resolution., detailed lighting, 8k wallpaper' },
  { label: 'typography', prompt: 'Create a typographic illustration shaped like a {OBJECT), where the text itself forms the shape - bold and playful lettering style that fills the entire silhouette - letters adapt fluidly to the curves and contours of the object - vibrant and contrasting color palette that fits the theme - background is solid and enhances the focus on the main shape - vector-style, clean, high resolution.' },
  { label: '英文單字卡', prompt: 'Draw a detailed {{carnival}} scene and label every object with English words. Label format: (1)First line: English word (2)Second line: IPA pronunciation (3)Third line: Traditional Chinese (zh-tw) translation' },
  { label: '商品拆解圖', prompt: 'Create a technical infographic of [OBJECT] with a 45-degree isometric 3D perspective showing the device slightly tilted to reveal depth and dimension. Combine a realistic photoreal render with black ink technical annotations on pure white background. Include: (1)Key component labels with color-coded callout boxes (2)Internal component visibility through transparent/ cutaway sections (3)Measurements, dimensions, and precise scale markers (4)Material callouts and quantities (5)Color-coded arrows for function/flow: RED (power/ battery), BLUE (data/connectivity), ORANGE (thermal/processor), GREEN (sensors/haptics) (6)Simple schematics or cross-sectional diagrams where relevant. (7)Place  [OBJECT] title in a hand-drawn technical box (top-left corner). (8)Style: Black linework (technical pen/architectural), sketched but precise. Object remains clearly visible. (9)Educational museum-exhibit vibe. Clean composition, balanced negative space. (10)Perspective: Isometric 3D angle-tilted to show depth, dimension, and internal architecture dramatically. Like a professional product teardown or engineering manual. (11)Colors: ~10-15% accent density. Black dominant. White background. (12)Output: 1080x1080, ultra-crisp, social-feed optimized.' },
  { label: '照片塗鴉(腦粉)', prompt: '生成圖片，把這張照片處理得像是「列印在紙上的實體照片」。接著，用紅色奇異筆（Marker）在上面瘋狂地加上「繁體中文」的手寫批註、塗鴉、亂畫。請發揮超級腦粉模式，極盡所能地瘋狂稱讚照片裡的人（例如穿著、表情、動作）。視覺上要充滿愛意，畫上很多愛心圖案、星星、爆炸驚嘆號，並隨機貼上一些可愛的、帶有正面詞彙的小貼紙圖案。' },
  { label: '照片塗鴉(酸民)', prompt: '生成圖片，把這張照片處理得像是「列印在紙上的實體照片」。這張照片被用「粗頭紅色奇異筆」瘋狂地塗鴉和破壞。上面寫滿了憤怒且刻薄的「繁體中文」手寫批註（例如：「品味極差」、「這臉是在哈囉？」、「醜到哭」）。請發揮毒舌風格，針對照片中的人物進行吐槽（例如穿著、表情、動作）。視覺上充滿了紅色的箭頭指向人物的衣服和表情，臉部被畫上圓圈或大叉叉。照片周圍隨意貼著廉價、怪異的迷因小貼紙（meme stickers） 和剪貼簿素材。整體風格混亂、充滿嘲諷意味，像是一個崩潰的酸民在發洩情緒。' },
  { label: '便條紙牆', prompt: '極簡主義的電影彩色海報，由肩膀到頭頂的角色肖像。面部採用少量大、方形切割的紙片，以簡單的格子排列［大約4x5或5x6片］。每張紙片都含有臉部的失處部分，一起重構肖像。構成臉部的內部紙片片並不完美平整；許多有些微彎曲的邊緣和捲起的角落，施放著微小的寫實陰影，使其呈現立體、被打倒的樣貌。其中4個方格直接在皮膚/圖像上有微妙的黑色手寫［文字1、文字2、文字3、文字4］。在此中央網格的外圍不規則散落在各種隨意擺放的位置（不限於角落），幾個【黏紙條顏色】黏紙條貼在【顏色】牆上，包含手寫的【外部文字內容，例如標誌性引文】。整體佈局略有不規則，件件之間有可見的縫隙顯示［顏色］混凝土牆背景。寫實紙張紋理整個，高端工作室打燈強調掀邊，鋒利著重墨水與紙紋。' },
  { label: '漫畫背景', prompt: 'The central figure, extracted from the uploaded image, is rendered in full, vibrant photorealistic color and sharp detail. They are dramatically lit to powerfully stand out. The background is an intricately detailed, multi-panel, black and white comic strip, entirely wordless and filled with humorous, exaggerated narratives directly featuring the central figure. These comic panels should not only depict the subject in funny, light-hearted, or slightly absurd scenarios, but also seamlessly integrate the central figure into the surrounding comic world. The colorful main subject should appear as if they are an integral part of this dynamic, monochromatic comic reality, perhaps \'stepping out\' or \'frozen within\' a specific comic panel, with their pose and expression directly interacting with the surrounding black and white narrative. The comic panels are drawn in a classic, high-contrast comic book style with bold lines, and creatively arranged to create a cohesive and engaging narrative backdrop, strongly linking the vibrant figure to the detailed monochrome comic environment.' },
];

// Art styles for the accordion - Expanded to over 100
export const ART_STYLES_CATEGORIES = [
  {
    name: "現代藝術流派 (Modern Art Movements)",
    styles: [
      { en: 'Impressionism', zh: '印象派' },
      { en: 'Post-Impressionism', zh: '後印象派' },
      { en: 'Expressionism', zh: '表現主義' },
      { en: 'Cubism', zh: '立體主義' },
      { en: 'Surrealism', zh: '超現實主義' },
      { en: 'Abstract Expressionism', zh: '抽象表現主義' },
      { en: 'Pop Art', zh: '普普藝術' },
      { en: 'Minimalism', zh: '極簡主義' },
      { en: 'Futurism', zh: '未來主義' },
      { en: 'Dadaism', zh: '達達主義' },
      { en: 'Constructivism', zh: '構成主義' },
      { en: 'Fauvism', zh: '野獸派' },
      { en: 'Art Nouveau', zh: '新藝術運動' },
      { en: 'Art Deco', zh: '裝飾藝術' },
      { en: 'Bauhaus', zh: '包浩斯' },
      { en: 'Op Art', zh: '歐普藝術' },
      { en: 'Kinetic Art', zh: '動態藝術' },
    ]
  },
  {
    name: "古典與歷史藝術 (Classical & Historical)",
    styles: [
      { en: 'Renaissance', zh: '文藝復興' },
      { en: 'Baroque', zh: '巴洛克' },
      { en: 'Rococo', zh: '洛可可' },
      { en: 'Neoclassicism', zh: '新古典主義' },
      { en: 'Romanticism', zh: '浪漫主義' },
      { en: 'Realism', zh: '現實主義' },
      { en: 'Gothic Art', zh: '哥德藝術' },
      { en: 'Byzantine Art', zh: '拜占庭藝術' },
      { en: 'Pre-Raphaelite', zh: '前拉斐爾派' },
    ]
  },
  {
    name: "數位與當代藝術 (Digital & Contemporary)",
    styles: [
      { en: 'Cyberpunk', zh: '賽博龐克' },
      { en: 'Steampunk', zh: '蒸汽龐克' },
      { en: 'Solarpunk', zh: '太陽龐克' },
      { en: 'Vaporwave', zh: '蒸汽波' },
      { en: 'Glitch Art', zh: '故障藝術' },
      { en: 'Pixel Art', zh: '像素藝術' },
      { en: 'Voxel Art', zh: '體素藝術' },
      { en: 'Low Poly', zh: '低多邊形' },
      { en: 'Fractal Art', zh: '碎形藝術' },
      { en: 'Generative Art', zh: '生成藝術' },
      { en: 'Digital Painting', zh: '數位繪畫' },
      { en: 'Concept Art', zh: '概念藝術' },
      { en: 'Matte Painting', zh: '霧面繪畫' },
      { en: 'Photobashing', zh: '照片拼貼' },
      { en: 'Synthwave', zh: '合成波' },
      { en: 'Holographic', zh: '全息影像' },
    ]
  },
  {
    name: "插畫與平面設計 (Illustration & Graphic)",
    styles: [
      { en: 'Anime Style', zh: '日本動畫' },
      { en: 'Manga Style', zh: '日本漫畫' },
      { en: 'Ghibli Studio Style', zh: '吉卜力風格' },
      { en: 'Disney Style', zh: '迪士尼風格' },
      { en: 'Cartoon Style', zh: '卡通風格' },
      { en: 'Comic Book Art', zh: '美式漫畫' },
      { en: 'Flat Design', zh: '扁平化設計' },
      { en: 'Vector Art', zh: '向量藝術' },
      { en: 'Infographic Style', zh: '資訊圖表' },
      { en: 'Psychedelic Art', zh: '迷幻藝術' },
      { en: 'Vintage Poster', zh: '復古海報' },
      { en: 'Fantasy Art', zh: '奇幻藝術' },
      { en: 'Sci-Fi Art', zh: '科幻藝術' },
      { en: 'Children\'s Book Illustration', zh: '童書插畫' },
    ]
  },
  {
    name: "文化與區域風格 (Cultural & Regional)",
    styles: [
      { en: 'Ukiyo-e', zh: '浮世繪' },
      { en: 'Sumi-e (Ink Wash Painting)', zh: '水墨畫' },
      { en: 'Chinese Painting (Guohua)', zh: '國畫' },
      { en: 'Aboriginal Art', zh: '澳洲原住民藝術' },
      { en: 'African Art', zh: '非洲藝術' },
      { en: 'Islamic Art', zh: '伊斯蘭藝術' },
      { en: 'Mandala', zh: '曼陀羅' },
      { en: 'Celtic Knotwork', zh: '凱爾特結' },
      { en: 'Mayan Art', zh: '馬雅藝術' },
      { en: 'Aztec Art', zh: '阿茲特克藝術' },
      { en: 'Indian Miniature Painting', zh: '印度細密畫' },
      { en: 'Tibetan Thangka', zh: '西藏唐卡' },
      { en: 'Mexican Muralism', zh: '墨西哥壁畫' },
    ]
  },
  {
    name: "傳統媒材模擬 (Traditional Mediums)",
    styles: [
      { en: 'Oil Painting', zh: '油畫' },
      { en: 'Watercolor Painting', zh: '水彩畫' },
      { en: 'Acrylic Painting', zh: '壓克力畫' },
      { en: 'Gouache Painting', zh: '水粉畫' },
      { en: 'Pencil Sketch', zh: '鉛筆素描' },
      { en: 'Charcoal Drawing', zh: '炭筆素描' },
      { en: 'Ink Drawing', zh: '墨水畫' },
      { en: 'Woodcut Print', zh: '木刻版畫' },
      { en: 'Linocut Print', zh: '油氈版畫' },
      { en: 'Etching', zh: '蝕刻版畫' },
      { en: 'Lithography', zh: '石版畫' },
      { en: 'Collage', zh: '拼貼' },
      { en: 'Mosaic', zh: '馬賽克' },
      { en: 'Stained Glass', zh: '彩繪玻璃' },
      { en: 'Graffiti Art', zh: '塗鴉藝術' },
      { en: 'Street Art', zh: '街頭藝術' },
      { en: 'Calligraphy', zh: '書法' },
      { en: 'Pastel Drawing', zh: '粉彩畫' },
      { en: 'Ballpoint Pen Art', zh: '原子筆藝術' },
    ]
  },
  {
    name: "攝影與電影風格 (Photographic & Cinematic)",
    styles: [
      { en: 'Cinematic', zh: '電影感' },
      { en: 'Film Noir', zh: '黑色電影' },
      { en: 'Documentary Style', zh: '紀錄片風格' },
      { en: 'Golden Hour Photography', zh: '黃金時刻攝影' },
      { en: 'Blue Hour Photography', zh: '藍色時刻攝影' },
      { en: 'Long Exposure Photography', zh: '長曝光攝影' },
      { en: 'Macro Photography', zh: '微距攝影' },
      { en: 'Double Exposure', zh: '雙重曝光' },
      { en: 'Black and White Photography', zh: '黑白攝影' },
      { en: 'Sepia Tone', zh: '棕褐色調' },
      { en: 'Infrared Photography', zh: '紅外線攝影' },
      { en: 'Tilt-Shift Photography', zh: '移軸攝影' },
      { en: 'Lomography', zh: 'LOMO風格' },
      { en: 'Pinhole Photography', zh: '針孔攝影' },
      { en: 'Drone Photography', zh: '空拍攝影' },
      { en: 'Polaroid Photo', zh: '拍立得風格' },
    ]
  },
  {
    name: "特殊與小眾風格 (Unique & Niche)",
    styles: [
      { en: 'Knolling', zh: '擺拍藝術' },
      { en: 'Claymation', zh: '黏土動畫' },
      { en: 'Quilling', zh: '衍紙' },
      { en: 'Origami', zh: '摺紙' },
      { en: 'Tattoo Art', zh: '紋身藝術' },
      { en: 'Body Painting', zh: '人體彩繪' },
      { en: 'Light Painting', zh: '光繪' },
      { en: 'Diorama', zh: '立體透視模型' },
      { en: 'Miniature Faking', zh: '微縮景觀' },
      { en: 'Anamorphic Art', zh: '變形藝術' },
      { en: 'Cross-Stitch', zh: '十字繡' },
      { en: 'Stipple Art', zh: '點畫' },
    ]
  }
];

// Combine all styles into a flat list for backward compatibility if needed, 
// or simply use this for searching.
export const ART_STYLES_LIST = ART_STYLES_CATEGORIES.flatMap(cat => cat.styles);

export const EDITING_EXAMPLES = [
  {
    category: '主體變換',
    examples: [
      { title: '變換材質', prompt: '將 [主體] 的材質變成 [玻璃/木頭/金屬/石頭]' },
      { title: '添加發光效果', prompt: '讓 [主體] 的 [特定部位] 發出 [顏色] 的光芒' },
      { title: '風格化', prompt: '將 [主體] 變成 [像素/卡通/素描] 風格，保持構圖不變' },
      { title: '擬人化', prompt: '將 [物體] 擬人化，賦予其人類的表情和動作' },
    ]
  },
  {
    category: '編輯圖片',
    examples: [
      { title: '移除文字', prompt: 'remove all text, subtitles, and logos from the image' },
      { title: '線稿提取', prompt: 'extract the line art from this image, clean white background' },
      { title: '圖案提取', prompt: '從[上衣] 中提取圖案並將其放置在純白色背景上，確保圖案與背景分離，邊緣清晰，色彩鮮艷，分辨率高。背景應為純白色，無任何干擾。清晰對焦，高質量，細節豐富' },
      { title: '修復模糊', prompt: '修復這張照片，消除裂痕，增強清晰度，校正色彩，還原原始照片，達到超高清畫質' },
      { title: '老照片上色', prompt: '將這張照片上色及高清處理成現代照片，並保持人物面部調整不變' },
    ]
  },
  {
    category: '背景與環境',
    examples: [
      { title: '更換背景', prompt: '將背景更換為 [未來城市/魔法森林/廢棄工廠], 保持主體不變，注意光影和場景的自然融合。' },
      { title: '電商產品換背景', prompt: '將背景改為電商場景，專業攝影打光，氛圍感，保持商品主體不變' },

      { title: '改變天氣', prompt: '將天氣變為 [下雨/下雪/起霧/黃昏]' },
      { title: '添加元素', prompt: '在背景中添加 [漂浮的島嶼/巨大的月亮/飛過的龍]' },
      { title: '時間變換', prompt: '將場景的時間變為 [白天/夜晚/黎明]' },
    ]
  },
  {
    category: '構圖與視角',
    examples: [
      { title: '改變視角', prompt: '將視角變為 [鳥瞰/仰視/魚眼]' },
      { title: '聚焦主體', prompt: '使用淺景深效果，模糊背景，突出主體' },
      { title: '延伸畫布 (Outpainting)', prompt: '將畫布向 [上下左右] 延伸，並智慧填充內容' },
      { title: '畫面裁切', prompt: '將畫面裁切為 [16:9/4:3/方形] 比例，重新構圖' },
    ]
  },
  {
    category: '特效與氛圍',
    examples: [
      { title: '添加動態模糊', prompt: '為主體添加運動模糊效果，營造速度感' },
      { title: '電影感色調', prompt: '為整張圖片套上電影感色調，參考 [駭客任務/銀翼殺手] 的風格' },
      { title: '雙重曝光', prompt: '將 [主體輪廓] 與 [另一張圖片，如森林/星空] 進行雙重曝光' },
      { title: '故障藝術', prompt: '為圖片添加 Glitch Art (故障藝術) 效果，如數據錯誤、色彩分離' },
    ]
  },
];

// --- Night City Legends Constants ---

export const NIGHT_CITY_LEGENDS_SCENES = {
  hedonism: [
    // Bars, Clubs, Apartments, and Red Light Districts
    '麗姿酒吧', 'V 的公寓', '扭扭街', '雲頂', '暗物質俱樂部', '朱蒂的公寓', '來生酒吧', 'El Coyote Cojo 酒吧', '威爾斯家的公寓', '迪諾·迪諾維奇的酒吧', 'No-Tell Motel', '共情', '歡愉玩偶的房間', 'V 的狗命鎮公寓', '斯巴達人俱樂部',
  ],
  nightCity: [
    // Watson
    '歌舞伎町市集', '超級摩天樓 H10', '小唐人街', 'NID 卡丁車賽道', '德拉曼總部', '歌舞伎町碼頭', '漩戰幫的食品工廠', '虎鉤眾的道場', '阿洛厄斯·克萊恩的診所', '電玩城', '櫻花市集', '貝爾艾爾長者照護中心',
    // Westbrook
    '日本城', '和歌子的柏青哥店', '憲章山', '北橡區', '科爾法克斯街天橋', '巨型公司會議室', '豪華空中別墅', 'Westbrook 櫻花園', '日本城碼頭', '虎鉤眾的賭場', '名人街', '科羅納多農場', '水上日式餐廳',
    // City Center
    '公司廣場', '荒坂塔', '軍用科技大樓', '夜城紀念公園', '市政廳', '公司總部天台', '荒坂塔紀念館', '漢茲的精品店', '中央車站', '高檔餐廳', '摩天大樓間的空中走廊', 'NCPD 總部', '市長辦公室', '股票交易所',
    // Heywood
    '維斯塔德佩區', '谷地區', '嗯嗯公園', '聖阿馬羅街', '瓦倫提諾幫的街頭派對', 'Heywood 醫療中心', '河谷區的豪宅', '天際線與共和路', '城市農場', '海伍德教堂', '海濱長廊', '海景摩天輪',
    // Santo Domingo
    '亞羅育', '聖多明哥之心', '蘭喬科羅納多', '河床', '戴爾斯工業區', '紅泥沼', 'El Padre 的車庫', '大型發電廠', '機器人工廠', '廢棄的體育場', '貨櫃堆疊區', '聖多明哥的露天電影院', '貧民窟', '河邊的釣魚點', '賽車場',
    // Pacifica
    '西風莊園', '海濱', '大帝國購物中心', '巫毒幫的教堂', 'GIM (Grand Imperial Mall)', '雲霄飛車', '海濱遊樂園', '巴蒂的旅館', '墜毀的AV停機坪', '海岸線', '廢棄的度假村', '體育館', 'NetWatch 探員的藏身處', '沿海高速公路',
    // Badlands
    '惡土邊緣汽車旅館', '垃圾掩埋場', '太陽能發電廠', '高速公路追逐', '流浪者的營地', 'Rocky Ridge', '生物科技農場', '廢棄的機場', '邊境檢查站', '沙漠中的舊教堂', '油田', '風力發電場', '蛋白質農場', '日落汽車旅館', '流浪者賽道', '舊礦坑',
    // Special
    '賽博精神病屠殺現場', 'NCPD 封鎖線', '地下鐵車站', '貨櫃港口', '豪華賭場', '秘密的 Netrunner 巢穴', '廢棄的購物中心', '屋頂花園', '暴雨中的小巷', '霓虹燈招牌叢林', '高架公路下方', '清道夫的黑市診所', '夜之城巨型紀念碑', '太空發-射中心', '水力發電大壩', '荒坂海濱',
  ],
  dogtown: [
    '韓遜的體育場指揮中心', '飛蛾酒吧', '狗命鎮檢查站(夜晚)', '黑藍寶Pai對', '狗命鎮正門(白天)', '犯罪活動升級區域', '重鎚俱樂部', '廢棄停車場的伏擊', '俯瞰體育場的狙擊點', '地下走私隧道', '艾瑟的藏身處', '狗命鎮的臨時市場', '韓遜的私人包廂', '巷子裡的改造醫生', 'NUSA 航天飛機墜毀點', '犬魔設施入口', '水壩觀景點', 'V的狗命鎮公寓', '「魔犬」訓練場', '空投補給區', '犬魔設施核心', '無線電塔「針」', '拾荒者在舊樓的巢穴', '克雷斯街橋上的對峙', '「魔犬」的坦克巡邏', '狗命鎮邊界的圍牆', '黑市武器交易', '李德的藏身處', '廢棄公園的寧靜時刻', '密室裡的高賭注牌局', '狗命鎮的駭客窩點', '逃離淹水的地下墓穴', '重鎚俱樂部頂樓', '「魔犬」奇美拉坦克庫', '萬象隨觀的廢墟', '史萊德的秘密藏身處', '在重鎚俱樂部見漢茲先生', '「魔犬」控制的防空砲塔', '探索廢棄的會議中心', '狗命鎮的醫療點', '狗命鎮的雨天街角', '「魔犬」的宣傳螢幕', '體育場市場的槍戰', '潛入「魔犬」基地', '與李德在屋頂的片刻', '韓遜的戰利品室', '狗命鎮窄巷的飛車追逐', '街頭戰鬥的餘波', '黑藍寶石露台的夜景'
  ]
};

export const NIGHT_CITY_SCENE_PROMPTS = {
  // Hedonism
  '麗姿酒吧': 'A strip club and bar in Watson\'s Kabuki district, serving as the headquarters for the Moxes gang and known for its braindance parlor.',
  'V 的公寓': 'V\'s iconic apartment in the H10 Megabuilding, with its weapon wall, city view, and personal touches.',
  '扭扭街': 'Night City\'s most famous red-light district, located in Japantown, known for its neon-lit streets and a high concentration of joytoys.',
  '雲頂': 'A high-end \'dollhouse\' brothel in Japantown, specializing in highly customized companionship and sexual services.',
  '暗物質俱樂部': 'A high-end nightclub in Westbrook where V can encounter more expensive or specialized joytoys, often related to specific questlines.',
  '朱蒂的公寓': 'Judy Alvarez\'s cozy, tech-filled apartment overlooking a moody, rain-slicked street.',
  '來生酒吧': 'The legendary bar for mercenaries in Night City, not a red-light district itself, but a central hub for fixers and mercs where a lot of illicit deals happen.',
  'El Coyote Cojo 酒吧': 'The Welles family\'s bar, a warm and welcoming place with a strong sense of community.',
  '威爾斯家的公寓': 'Mama Welles\' apartment, a place filled with memories and tradition.',
  '迪諾·迪諾維奇的酒吧': 'A smoky, dimly lit bar where fixer Dino Dinovic conducts his business.',
  'No-Tell Motel': 'A cheap, discreet motel on the edge of Watson, perfect for shady deals.',
  '共情': 'A braindance club in City Center, offering adult entertainment in a more exclusive and upscale setting compared to other locations.',
  '歡愉玩偶的房間': 'A private room where a joytoy provides companionship services, typically dimly lit and intimate.',
  'V 的狗命鎮公寓': 'V\'s new, more tactical apartment in the heart of Dogtown.',
  '斯巴達人俱樂部': 'A grimy, intense club where Dogtown\'s toughest mercs gather.',
  // Watson
  '歌舞伎町市集': 'A crowded, steamy market in Kabuki, filled with street food stalls, neon signs, and shady vendors.',
  '超級摩天樓 H10': 'The massive H10 Megabuilding, a city within a city, showing the vertical slice of life in Night City.',
  '小唐人街': 'The vibrant, lantern-lit streets of Little China, with holographic dragons and traditional architecture mixed with high-tech.',
  'NID 卡丁車賽道': 'A neon-lit underground go-kart racing track, filled with enthusiasts and illegal betting.',
  '德拉曼總部': 'The sleek, futuristic headquarters of the Delamain taxi corporation.',
  '歌舞伎町碼頭': 'The grimy, industrial docks of Kabuki, a place for smuggling and secrets.',
  '漩戰幫的食品工廠': 'The All Foods plant, a Maelstrom gang stronghold, filled with industrial machinery and a sense of dread.',
  '虎鉤眾的道場': 'A traditional Tyger Claws dojo, where ancient martial arts meet modern cyberware.',
  '阿洛厄斯·克萊恩的診所': 'The cluttered, makeshift ripperdoc clinic of Dr. Fingers.',
  '電玩城': 'A noisy, flashing arcade in Japantown, filled with classic and futuristic games.',
  'Jig-Jig Street': 'The infamous Jig-Jig Street at night, a sensory overload of illicit braindances, streetwalkers, and neon signs.',
  '櫻花市集': 'A bustling open-air market with a blend of Japanese cultural goods and high-tech street stalls.',
  '貝爾艾爾長者照護中心': 'A seemingly peaceful senior care facility with hidden secrets within its walls.',
  // Westbrook
  '日本城': 'The bustling, neon-drenched streets of Japantown, a hub of culture, entertainment, and danger.',
  '和歌子的柏青哥店': 'Wakako Okada\'s pachinko parlor, a front for her fixer operations, filled with the sounds of machines and smoke.',
  '憲章山': 'The affluent district of Charter Hill, featuring modern architecture, luxury condos, and expensive cars.',
  '北橡區': 'The luxurious, heavily guarded North Oak district, home to Night City\'s wealthiest celebrities and corpo execs.',
  '科爾法克斯街天橋': 'A high pedestrian overpass in Japantown offering stunning views of the neon cityscape.',
  '巨型公司會議室': 'A sterile, high-tech boardroom in a Westbrook skyscraper with panoramic city views.',
  '豪華空中別墅': 'An opulent penthouse apartment in a Westbrook skyscraper, with panoramic views of the entire city.',
  'Westbrook 櫻花園': 'A beautiful, serene park with cherry blossom trees, a stark contrast to the surrounding city.',
  '日本城碼頭': 'The busy docks of Japantown, where fishing boats and cargo ships operate under neon lights.',
  '虎鉤眾的賭場': 'A Tyger Claws-run casino, blending traditional Japanese aesthetics with high-tech gambling.',
  '名人街': 'The main boulevard in North Oak, lined with mansions of the rich and famous.',
  '科羅納多農場': 'A corporate-owned agricultural farm in the hills of Westbrook, utilizing advanced technology.',
  '水上日式餐廳': 'A traditional Japanese restaurant built on stilts over the water in Japantown.',
  // City Center
  '公司廣場': 'A bustling corporate plaza in the heart of Night City, surrounded by towering skyscrapers and flying vehicles.',
  '荒坂塔': 'The imposing, iconic Arasaka Tower, a symbol of corporate power and dominance in the city center.',
  '軍用科技大樓': 'The heavily fortified Militech headquarters, showcasing military-grade hardware and security.',
  '夜城紀念公園': 'A solemn memorial park in the city center, a place of reflection amidst the urban chaos.',
  '市政廳': 'The grand, imposing building of Night City\'s City Hall, a center of political power.',
  '公司總部天台': 'The rooftop of a massive corporate headquarters, overlooking the entire city at night.',
  '荒坂塔紀念館': 'The memorial site for the Arasaka Tower bombing, a place of reflection and conspiracy.',
  '漢茲的精品店': 'An exclusive, high-fashion boutique in the city center catering to the elite.',
  '中央車站': 'The main Maglev train station in the city center, a hub of transportation and activity.',
  '高檔餐廳': 'An expensive, luxurious restaurant with a stunning view of the city skyline.',
  '摩天大樓間的空中走廊': 'A glass skybridge connecting two massive skyscrapers, high above the bustling streets.',
  'NCPD 總部': 'The heavily secured headquarters of the Night City Police Department.',
  '市長辦公室': 'The opulent office of the Mayor of Night City, located in City Hall.',
  '股票交易所': 'The chaotic floor of the Night City Stock Exchange, with holographic data streams everywhere.',
  // Heywood
  '維斯塔德佩區': 'The diverse and vibrant district of Vista Del Rey, with a mix of cultures and communities.',
  '谷地區': 'The Glen, a district with a mix of corpo offices, luxury apartments, and gang territory.',
  '嗯嗯公園': 'A public park in Heywood, a rare patch of green in the dense urban environment.',
  '聖阿馬羅街': 'A street in Heywood controlled by the Valentinos, known for its vibrant murals and low-riders.',
  '瓦倫提諾幫的街頭派對': 'A vibrant Valentinos street party, with low-riders, colorful murals, and loud music.',
  'Heywood 醫療中心': 'A large, modern hospital in Heywood, often dealing with the aftermath of street violence.',
  '河谷區的豪宅': 'A luxurious mansion in the wealthier part of The Glen, overlooking the city.',
  '天際線與共和路': 'A major intersection in Heywood, where the monorail runs above the busy streets.',
  '城市農場': 'An urban farm in Heywood, growing food in a controlled, high-tech environment.',
  '海伍德教堂': 'An old, grand church that stands as a relic of the past in the modern city.',
  '海濱長廊': 'A scenic promenade along the coast of Heywood, popular with residents.',
  '海景摩天輪': 'A large Ferris wheel on the Heywood coast, offering views of the city and the ocean.',
  // Santo Domingo
  '亞羅育': 'The industrial district of Arroyo, filled with factories, warehouses, and the smell of pollution.',
  '聖多明哥之心': 'The central hub of Santo Domingo, a working-class neighborhood with a strong sense of community.',
  '蘭喬科羅納多': 'A residential district in Santo Domingo, characterized by its dense housing projects.',
  '河床': 'A dried-up riverbed that cuts through Santo Domingo, now used as a makeshift road and dumping ground.',
  '戴爾斯工業區': 'A heavily industrialized zone with massive factories and automated machinery.',
  '紅泥沼': 'A polluted, reddish swamp area on the outskirts of Santo Domingo.',
  'El Padre 的車庫': 'The garage of fixer Sebastian "Padre" Ibarra, a hub of activity for local mercs.',
  '大型發電廠': 'A massive power plant that supplies energy to a large portion of the city.',
  '機器人工廠': 'A factory where automated robots assemble vehicles and other machinery.',
  '廢棄的體育場': 'An old, crumbling stadium that is now home to squatters and gangs.',
  '貨櫃堆疊區': 'A labyrinthine area filled with stacked shipping containers, used for storage and illegal activities.',
  '聖多明哥的露天電影院': 'A drive-in movie theater that still operates, showing old films to a nostalgic audience.',
  '貧民窟': 'A shantytown on the edge of Santo Domingo, where the poorest residents live in makeshift homes.',
  '河邊的釣魚點': 'A spot along the polluted river where people still try to catch fish.',
  '賽車場': 'An illegal street racing circuit in the industrial areas of Santo Domingo.',
  // Pacifica
  '西風莊園': 'The district of West Wind Estate, a failed corporate development now controlled by the Voodoo Boys.',
  '海濱': 'The once-popular beach of Pacifica, now littered with debris and home to squatters.',
  '大帝國購物中心': 'The Grand Imperial Mall (GIM), a massive, abandoned shopping center now used as a base by the Animals gang.',
  '巫毒幫的教堂': 'A repurposed old church that serves as the spiritual and operational center for the Voodoo Boys.',
  'GIM (Grand Imperial Mall)': 'The massive, abandoned Grand Imperial Mall, a battleground for gangs.',
  '雲霄飛車': 'A derelict roller coaster on the Pacifica pier, a haunting silhouette against the sky.',
  '海濱遊樂園': 'An abandoned amusement park on the coast, its rides rusting and overgrown.',
  '巴蒂的旅館': 'A dilapidated hotel that serves as a neutral ground in the chaotic district.',
  '墜毀的AV停機坪': 'A rooftop where a large AV has crashed, creating a dangerous and scavenge-rich environment.',
  '海岸線': 'The beautiful but dangerous coastline of Pacifica, with crumbling infrastructure.',
  '廢棄的度假村': 'A once-luxurious resort that has fallen into ruin, its pools empty and buildings decaying.',
  '體育館': 'A large stadium in Pacifica, now used for various illicit activities.',
  'NetWatch 探員的藏身處': 'A hidden location where NetWatch agents monitor the Voodoo Boys\' activities.',
  '沿海高速公路': 'A crumbling highway that runs along the Pacifica coast, offering dangerous routes.',
  // Badlands
  '惡土邊緣汽車旅館': 'A dusty, isolated motel on the edge of the Badlands, a common meeting spot for shady deals.',
  '垃圾掩埋場': 'The vast, desolate landfill outside Night City, a place where secrets and bodies are buried.',
  '太陽能發電廠': 'A massive solar power farm in the desert, its panels glistening under the sun.',
  '高速公路追逐': 'A high-speed chase on a multi-level highway, with vehicles weaving through traffic under the neon glow.',
  '流浪者的營地': 'A Nomad camp in the Badlands, a collection of modified vehicles and makeshift homes under the open sky.',
  'Rocky Ridge': 'An abandoned town in the Badlands, now a ghost town and a place for showdowns.',
  '生物科技農場': 'A massive, sterile Biotech farm, with genetically engineered crops under artificial lights.',
  '廢棄的機場': 'An old, abandoned airfield in the desert, its runway cracked and buildings in ruin.',
  '邊境檢查站': 'A heavily guarded checkpoint on the border of the NUSA, a tense and dangerous place.',
  '沙漠中的舊教堂': 'A small, isolated church in the middle of the desert, a place of solitude and secrets.',
  '油田': 'A working oil field in the Badlands, with pumps and derricks dotting the landscape.',
  '風力發電場': 'A large wind farm with towering turbines spinning in the desert wind.',
  '蛋白質農場': 'A corporate facility raising genetically engineered insects and animals for food production.',
  '日落汽車旅館': 'A classic, neon-lit motel in the Badlands, a beacon in the dark desert.',
  '流浪者賽道': 'A makeshift racetrack in the desert, where Nomads test their driving skills.',
  '舊礦坑': 'An abandoned mine in the Badlands, its tunnels dark and dangerous.',
  // Special
  '賽博精神病屠殺現場': 'The aftermath of a cyberpsycho attack, with MaxTac units securing the area.',
  'NCPD 封鎖線': 'An NCPD crime scene, cordoned off with holographic tape, surrounded by armored vehicles and officers.',
  '地下鐵車站': 'A grimy, graffiti-covered subway station, a cross-section of Night City\'s populace.',
  '貨櫃港口': 'The industrial, labyrinthine container port, a hotspot for smuggling and corporate espionage.',
  '豪華賭場': 'A high-stakes, opulent casino, filled with chrome, neon, and desperate gamblers.',
  '秘密的 Netrunner 巢穴': 'A hidden Netrunner den, filled with servers, cables, and immersion chairs.',
  '廢棄的購物中心': 'An abandoned shopping mall, now a haven for gangs and squatters.',
  '屋頂花園': 'A serene, hidden rooftop garden, a stark contrast to the concrete jungle below.',
  '暴雨中的小巷': 'A narrow, dark alleyway during a torrential downpour, with neon reflections in the puddles.',
  '霓虹燈招牌叢林': 'Looking up from the street level, surrounded by a dense jungle of holographic and neon signs.',
  '高架公路下方': 'The gritty, shadowy space beneath a massive overpass, a makeshift home for the city\'s forgotten.',
  '清道夫的黑市診所': 'A horrifying Scavenger-run ripperdoc clinic, located in a dirty, undisclosed location.',
  '夜之城巨型紀念碑': 'A colossal monument in the city center, a symbol of corporate power and control.',
  '太空發-射中心': 'The orbital space center, with a rocket ready for launch against a starry sky.',
  '水力發電大壩': 'A massive, imposing hydroelectric dam, a feat of engineering and corporate control.',
  '荒坂海濱': 'The clean, corporate-controlled Arasaka Waterfront, with luxury yachts and a view of the city skyline.',
  // Dogtown
  "韓遜的體育場指揮中心": "The user is inside Kurt Hansen's command center, high up in the Dogtown stadium. The room is filled with military maps, communication equipment, and a view of his private army.",
  "飛蛾酒吧": "The user is at The Moth, a smoky, dimly lit spy bar in Dogtown. Fixers and spies exchange information in quiet booths. The atmosphere is tense and secretive.",
  "狗命鎮檢查站(夜晚)": "The user is trying to sneak through the heavily guarded Dogtown checkpoint at night. Searchlights sweep the area, and Barghest soldiers are on high alert.",
  "黑藍寶Pai對": "The user is at a lavish, decadent party inside the Black Sapphire. The elite of Night City and beyond are here, making deals under the guise of celebration.",
  "狗命鎮正門(白天)": "The user is at the bustling main gate of Dogtown during the day. The market is in full swing, and the oppressive presence of Barghest soldiers is everywhere.",
  "犯罪活動升級區域": "The user is in a \"Increased Criminal Activity\" zone in Dogtown, a chaotic firefight between Barghest and another faction is taking place in the streets.",
  "重鎚俱樂部": "The user is inside the Heavy Hearts club, a pyramid-shaped building in Dogtown known for its black market cyberware and shady deals.",
  "廢棄停車場的伏擊": "The user is in a multi-level concrete parking garage, caught in a tense ambush. The sound of gunfire echoes through the enclosed space.",
  "俯瞰體育場的狙擊點": "The user is in a sniper's nest in a ruined building, looking down at the Dogtown stadium through the scope of a high-powered rifle.",
  '地下走私隧道': 'The user is in a dark, damp smuggling tunnel beneath the streets of Dogtown, used for moving illicit goods and people.',
  "艾瑟的藏身處": "The user is in Mr. Hands' secret office, a sophisticated and hidden command center from where he orchestrates his operations as the fixer of Dogtown.",
  "狗命鎮的臨時市場": "The user is in a makeshift street market in Dogtown, where vendors sell everything from scavenged tech to illegal weapons from the back of armored trucks.",
  "韓遜的私人包廂": "The user is in Kurt Hansen's private box overlooking the stadium, a place of luxury and power from where he watches over his domain.",
  "巷子裡的改造醫生": "The user is in a grimy, unsanctioned ripperdoc clinic in a Dogtown alley, a place for those who need cyberware installed off the books.",
  "NUSA 航天飛機墜毀點": "The user is at the crash site of the Space Force One shuttle, a chaotic scene of wreckage, smoke, and NUSA soldiers trying to secure the area.",
  "犬魔設施入口": "The user is at the heavily guarded entrance to the Cynosure facility, a hidden underground bunker filled with dark pre-Net technology.",
  "水壩觀景點": "The user is at an observation point overlooking the dam that separates Dogtown from the rest of Night City, a massive concrete structure.",
  "V的狗命鎮公寓": "The user is in V's safehouse apartment in Dogtown, a small but secure spot to lay low, with a view of the district's chaotic streets.",
  "「魔犬」訓練場": "The user is at a Barghest training ground, watching Hansen's soldiers run through combat drills and tactical exercises.",
  "空投補給區": "The user is scrambling for a high-value airdrop in Dogtown, competing with other factions to secure the valuable loot.",
  "犬魔設施核心": "The user is in the core of the Cynosure facility, a terrifying place where the malevolent AIs of the Blackwall are contained.",
  "無線電塔「針」": "The user is climbing \"The Needle,\" a massive radio tower in Dogtown, to get a vantage point or to complete a mission.",
  "拾荒者在舊樓的巢穴": "The user is in a scavenger hideout within a ruined apartment block in Dogtown, a dangerous and dilapidated space.",
  "克雷斯街橋上的對峙": "The user is on the Kress Street bridge, a key chokepoint in Dogtown, engaged in a tense standoff with enemy forces.",
  "「魔犬」的坦克巡邏": "The user is hiding as a Barghest Chimera tank patrols the streets of Dogtown, its heavy armor and cannons a formidable presence.",
  "狗命鎮邊界的圍牆": "The user is looking at the massive, floodlit wall that isolates Dogtown, a stark symbol of its lawless nature.",
  "黑市武器交易": "The user is at a secret black market deal in Dogtown, buying a powerful and illegal weapon from a shady vendor.",
  "李德的藏身處": "The user is in Solomon Reed's unassuming hideout, a place that looks ordinary but is filled with spy gadgets and secrets.",
  "廢棄公園的寧靜時刻": "The user is in a small, overgrown and abandoned park within Dogtown, a rare moment of quiet in the chaotic district.",
  "密室裡的高賭注牌局": "The user is playing a high-stakes poker game in a secret backroom with some of Dogtown's most dangerous figures.",
  "狗命鎮的駭客窩點": "The user is in a netrunner's den in Dogtown, a room filled with servers, cables, and multiple computer monitors displaying flowing code.",
  "逃離淹水的地下墓穴": "The user is making a desperate escape through a flooded, crumbling underground tunnel system beneath Dogtown.",
  "重鎚俱樂部頂樓": "The user is on the rooftop of the Heavy Hearts club, with a neon-lit view of the Dogtown skyline.",
  "「魔犬」奇美拉坦克庫": "The user is sneaking through a Barghest hangar filled with Chimera combat tanks undergoing maintenance.",
  "萬象隨觀的廢墟": "The user is exploring the eerie, abandoned ruins of the Vexelstrom building, a place with a dark history.",
  "史萊德的秘密藏身處": "The user is in Slider's hidden netrunning den, a place filled with esoteric and powerful old-Net technology.",
  "在重鎚俱樂部見漢茲先生": "The user is having a secret meeting with Mr. Hands in a private booth at the Heavy Hearts club.",
  "「魔犬」控制的防空砲塔": "The user is trying to disable a Barghest-controlled anti-aircraft turret that is dominating the Dogtown skyline.",
  "探索廢棄的會議中心": "The user is exploring a large, abandoned convention center in Dogtown, its halls now silent and decaying.",
  "狗命鎮的醫療點": "The user is at a makeshift medical clinic in Dogtown, where overworked doctors treat the wounded from the district's constant violence.",
  "狗命鎮的雨天街角": "The user is on a street corner in Dogtown on a rainy night. The neon signs of the stadium reflect in the puddles on the broken pavement.",
  "「魔犬」的宣傳螢幕": "The user is standing in front of a giant propaganda screen broadcasting Kurt Hansen's messages to the people of Dogtown.",
  "體育場市場的槍戰": "The user is in the middle of a chaotic firefight in the crowded stadium market, with civilians scrambling for cover.",
  "潛入「魔犬」基地": "The user is stealthily infiltrating a heavily guarded Barghest base under the cover of darkness.",
  "與李德在屋頂的片刻": "The user is having a quiet, tense conversation with Solomon Reed on a rooftop, with the lights of Dogtown spread out below.",
  "韓遜的戰利品室": "The user is in Kurt Hansen's private trophy room, a space filled with memorabilia from his past military victories and conquests.",
  "狗命鎮窄巷的飛車追逐": "The user is in a high-speed vehicle chase through the narrow, crowded backstreets of Dogtown.",
  "街頭戰鬥的餘波": "The user is standing in a street moments after a violent firefight, with smoking wreckage, bullet-riddled walls, and the bodies of the fallen.",
  "黑藍寶石露台的夜景": "The user is on an open-air terrace at the Black Sapphire, looking down at the controlled chaos of Dogtown under the night sky."
};

export const NIGHT_CITY_MISSIONS = [
  {
    label: '隨機任務',
    options: []
  },
  {
    label: "戰鬥與衝突",
    options: [
      "在一場激烈的槍戰中從掩體後方探出頭來",
      "從高處進行狙擊，瞄準下方的敵人",
      "與一群幫派份子進行白刃戰",
      "在爆炸的火光中衝刺",
      "使用智能武器，子彈在空中轉彎",
      "啟動沙德威斯坦，在子彈時間中閃避攻擊",
      "被NCPD或創傷小組包圍",
      "駭入敵人的義體使其失靈",

      "在高速公路上的飛車追逐戰",
      "從墜毀的飛行器殘骸中爬出",
      "背靠背與夥伴共同抵禦敵人",
      "使用螳螂刀進行殘酷的處決",
      "在煙霧或沙塵暴中作戰",
      "守衛一個重要的據點，抵擋一波波的攻擊",
      "與一個巨大的戰鬥機甲對峙",
      "在狹窄的走廊中進行近距離戰鬥 (CQC)",
      "使用重型武器摧毀敵方載具",
      "在一場黑幫戰爭中衝鋒陷陣",
    ]
  },
  {
    label: "潛入與偵查",
    options: [
      "悄悄地從守衛身後溜過",
      "使用光學迷彩潛入戒備森嚴的設施",
      "從通風管道中窺視下方的會議",
      "駭入監控攝影機以觀察敵情",
      "在雷射網中穿梭",
      "在高樓的窗戶外緣攀爬",
      "在黑暗中無聲地放倒一個敵人",
      "在目標的電腦上安裝竊聽裝置",
      "偽裝成工作人員，混入派對",
      "使用無人機進行遠程偵察",
      "破解一個複雜的電子鎖",
      "在水下潛入一個秘密基地",
    ]
  },
  {
    label: "社交與談判",
    options: [
      "在來生酒吧的吧台與傳奇傭兵交談",
      "與一位公司高管進行緊張的談判",
      "在一個奢華的派對上收集情報",
      "在街頭與線人進行秘密交易",
      "審問一個被捕獲的敵人",
      "向一位重要的客戶簡報任務計畫",
      "在一個搖滾演唱會的後台與樂手見面",
      "說服一個幫派頭目達成協議",
      "在一個黑市上討價-還價",
      "在一個高級餐廳進行一場虛偽的商業晚宴",
      "在法庭上或聽證會上作證",
    ]
  },
  {
    label: "日常生活與情感",
    options: [
      "獨自一人在公寓的窗邊凝視著雨中的城市",
      "在街頭小吃攤吃著合成麵",
      "修理或改造自己的義體或武器",
      "在虛擬實境中放鬆",
      "開車或騎車在夜城的高速公路上兜風",
      "在一個熙熙攘攘的市場中穿梭",
      "探望一位住在超級摩天樓裡的朋友",
      "在惡地的星空下露營",
      "與伴侶在一家隱密的餐廳約會",
      "與伴侶在公寓裡享受寧靜的時光",
      "男友/女友視角下的溫馨互動",
      "一個深情的擁抱或親吻",
      "在雨中激烈地爭吵",
      "因為背叛而心碎，獨自一人流淚",
      "與曾經的夥伴或愛人決裂，分道揚鑣",
      "在戰鬥後互相為對方包紮傷口",
      "在墓地或紀念館悼念逝去的友人",
      "收到一個意想不到的壞消息，表情震驚",
      "在一端超夢中重溫過去的回憶",
      "疲憊地回到家，倒在沙發上",
      "在鏡子前審視自己滿身的傷疤和義體",
    ]
  },
  {
    label: "場面調度與構圖",
    options: [
      "廣角鏡頭下，一個渺小的人影站在巨大的建築前",
      "特寫鏡頭，捕捉角色臉上複雜的表情",
      "從下往上的仰視鏡頭，突顯角色的氣勢",
      "從上往下的俯視鏡頭，展現場景的全貌",
      "荷蘭角（傾斜）鏡頭，營造不安和混亂感",
      "過肩鏡頭，表現兩人之間的對話",
      "剪影效果，角色站在明亮的背景前",
      "角色被霓虹燈的倒影所包圍",
      "在鏡子或水面的反射中看到角色的另一面",
      "角色的一部分被陰影或物體遮擋，製造懸念",
      "使用淺景深，只有角色是清晰的，背景完全模糊",
      "角色處於畫面的黃金分割點上",
      "對稱構圖，角色位於畫面的正中央",
      "框架式構圖，透過門框或窗戶看角色",
      "引導線構圖，利用公路或建築的線條將視線引向角色",
    ]
  }
];

export const DYNAMIC_ACTION_PROMPTS = [
  "從高處跳下，進行英雄式落地",
  "在牆壁上飛簷走壁",
  "滑鏟進入掩體，同時開火",
  "一個帥氣的戰術翻滾來閃避攻擊",
  "踹開一扇門，突襲房間",
  "從一台行駛中的車輛跳到另一台上",
  "與敵人進行激烈的近身格鬥",
  "騎著摩托車翹起前輪",
  "優雅地拔出或收回武士刀",
  "在奔跑中更換彈匣",
  "駭入周遭環境，引發混亂（例如讓灑水器啟動）",
  "靠在一輛跑車上，酷酷地點燃一根菸",
  "在吧台前悠閒地擦拭著自己的手槍",
  "啟動二段跳，越過障礙物",
  "使用射彈發射系統，轟炸一片區域",
  "從敵人手中奪取武器",
  "在空中使用空中衝刺來改變方向",
  "使用單分子線進行悄無聲息的暗殺",
  "撞碎玻璃，破窗而入",
  "在爆炸的衝擊波中站穩腳跟",
];

export const IMMERSIVE_QUALITY_PROMPTS = [
  "電影級光影，體積光，空氣中飄浮著灰塵顆粒",
  "8K超高解析度，銳利的細節，逼真的皮膚紋理",
  "強烈的鏡頭光暈，畫面帶有膠片顆粒感",
  "潮濕的地面反射著霓虹燈光，空氣中有水蒸氣",
  "高動態範圍（HDR），暗部細節豐富，亮部不過曝",
  "寬銀幕電影鏡頭（Anamorphic lens），帶有橢圓形的光斑",
  "使用了移軸鏡頭，營造出微縮模型般的景觀",
  "畫面有輕微的色差（Chromatic Aberration）效果",
  "霧氣或煙霧瀰漫，光線在其中產生丁達爾效應",
  "高對比度的黑白攝影，光影分明，風格強烈",
  "復古的CRT螢幕掃描線效果",
  "長時間曝光攝影效果，光軌拖曳成線",
  "魚眼鏡頭的誇張透視效果",
  "手持攝影機的輕微晃動感，增加真實性",
  "柔焦效果，畫面帶有一種夢幻感",
  "哥德式恐怖氛圍，陰影深邃，色調偏冷",
  "賽博龐克風格的數位雜訊和Glitch效果",
  "背景有動態模糊，突顯主體的移動速度",
  "使用了偏光鏡，色彩飽和度極高，天空湛藍",
];

export const NIGHT_CITY_WEAPONS = {
  '義體改造 (Cyberware Arms)': [
    'Mantis Blades (螳螂刀)', 'Gorilla Arms (大力拳套)', 'Monowire (單分子線)', 'Projectile Launch System (射彈發射系統)'
  ],
  '不朽武士刀 (Iconic Katanas)': [
    'Jinchu-Maru (盡忠丸)', 'Satori (悟)', 'Scalpel (手術刀)', 'Tsumetogi (爪磨)', 'Byakko (白虎)', 'Nehan (涅槃)', 'Errata (正宗)'
  ],
  '手槍 (Pistols)': [
    'A-22B Chao (超)', 'M-10AF Lexington (列星頓)', 'Slaught-O-Matic (販賣機)', 'Unity (團結)', 'Liberty (自由)', 'Kongou (金剛)', 'La Chingona Dorada (金色狠婆娘)', 'Malorian Arms 3516 (マロリアン・アームズ 3516)', 'nue (鵺)', 'Pride (傲天)', 'Seraph (熾天使)', 'Tamayura (玉響)', 'Dying Night (垂死之夜)', 'Genjiroh (源二郎)', 'JKE-X2 Kenshin (覺)', 'Lexington x-MOD2', 'Her Majesty (女王陛下)', 'Skippy (小嗶)', 'Plan B (B計畫)', 'Apparition (幽靈)', 'Death and Taxes (死亡與稅金)'
  ],
  '左輪手槍 (Revolvers)': [
    'DR-5 Nova (新星)', 'Overture (序曲)', 'RT-46 Burya (風暴)', 'Amnesty (大赦)', "Archangel (大天使)", "Comrade's Hammer (同志的鐵鎚)", "Crash (克拉什)", 'DR12 Quasar (類星體)', 'M-76E Omaha (奧馬哈)', 'Metel (暴雪)', 'Rasetsu (羅剎)', 'Riskit', "Rosco", "Taigan (大我)"
  ],
  '衝鋒槍 (Submachine Guns)': [
    'DS1 Pulsar (脈衝星)', 'M2038 Tactician (戰術家)', 'G-58 Dian (電光)', 'M221 Saratoga (薩拉多加)', 'TKI-20 Shingen (信玄)', 'Buzzsaw (電鋸)', 'Chesapeake', 'Fenrir (芬里爾)', 'Guinevere (桂妮薇兒)', 'Haumea', 'Pizdets (滅 pistola)', 'Problem Solver (問題解決者)', 'Shigure (時雨)', 'Warden (典獄長)', 'Yinglong (應龍)'
  ],
  '突擊步槍 (Assault Rifles)': [
    'D5 Copperhead (銅斑蛇)', 'M251s Ajax (阿賈克斯)', 'MA70 HB (MA70 HB)', 'Nokota D5 Sidewinder', 'HJSH-18 Masamune (正宗)', 'DA8 Umbra (本影)', 'Nowaki (野分)', 'Divided We Stand (團結則存)', 'Hawk', 'Hercules 3AX', 'Kyubi (九尾)', 'Moron Labe (莫倫拉貝)', 'Prejudice (偏見)', 'Psalm 11:6 (詩篇 11:6)', 'Carmen', 'PDR', 'UDA'
  ],
  '步槍 (Rifles)': [
    'Achilles (阿基里斯)', 'SOR-22 (SOR-22)', 'ARASAKA KAGE-BOSHI', 'Overwatch (守望)', 'Widow Maker (寡婦製造者)', 'Tsunami (海嘯)', 'Ashura (阿修羅)', 'Nekomata (貓又)', 'Breakthrough (突破)', "Raiju (雷獸)", "Sparky"
  ],
  '狙擊步槍 (Sniper Rifles)': [
    'SPT32 Grad (冰雹)', 'Nekomata (貓又)', 'O\'Five (零五)', 'Borzaya', "Ilya's SNIPER RIFLE", 'KSR-29', "NDI-46 'Reaper'"
  ],
  '霰彈槍 (Shotguns)': [
    'Carnage (殺戮)', 'DB-2 Satara (薩塔拉)', 'DB-4 Igla (伊格拉)', 'M2038 Tactician (戰術家)', 'VST-37 Pozhar', 'Zhuo Ba-Xing Chong (八星銃)', 'Alabai', "Baobab", "Bloody Maria", "Dezerter", "Guts (腸子)", "Headsman (劊子手)", "Mox", "Rebecca's Shotgun", "Sovereign (元首)", "The Devil"
  ],
  '輕機槍 (Light Machine Guns)': [
    'Defender (防衛者)', 'MA70 HB (MA70 HB)', 'Wild Dog', "MA70 HB X-MOD2", "Nekomata X-MOD2"
  ],
  '重機槍 (Heavy Machine Guns)': [
    'HMG MK.31', 'Budget Arms Carnage'
  ],
  '近戰武器 (Melee Weapons)': [
    'Katana (武士刀)', 'Tanto (短刀)', 'Machete (彎刀)', 'Axe (斧)', 'Baseball Bat (球棒)', 'Crowbar (撬棍)', 'Hammer (錘)', 'Knife (小刀)', 'Pipe Wrench (管鉗)', 'Tire Iron (輪胎扳手)', 'Gold-Plated Baseball Bat (鍍金球棒)', 'Cottonmouth (水蝮蛇)', 'Stinger (毒刺)', "Cocktail Stick (雞尾酒棒)", "Gwynbleidd", "Headhunter (獵頭)", "Ol' Reliable", "Rose"
  ],
};

export const NIGHT_CITY_VEHICLES = {
  '摩托車 (Motorcycles)': [
    'ARCH Nazaré', 'ARCH Nazaré "Itsumade"', 'ARCH Nazaré "Racer"', 'Yaiba Kusanagi CT-3X', 'Brennan Apollo', 'Brennan Apollo "Scorpion"', 'Yaiba Kusanagi "Akira Bike"', 'Yaiba Kusanagi "Jackie\'s Tuned"', 'Yaiba Kusanagi "Tiger Claw"', 'Yaiba Kusanagi "Tyger"', 'Nazare "Racer" Purple', 'Nazare "Malina" Pink'
  ],
  '經濟型汽車 (Economy)': [
    'Thorton Galena G240', 'Thorton Galena "Gecko"', 'Makigai Maimai P126', 'Mahir Supron FS3', 'Thorton Colby C125', 'Thorton Colby "Little Mule"', 'Villefort Alvarado V4F 570 Delegate', 'Archer Quartz "Bandit"', 'Thorton Galena "Rattler"', 'Makigai Maimai "Beast"', 'Villefort Alvarado "Vato"'
  ],
  '行政級轎車 (Executive)': [
    'Villefort Cortes V5000 Valor', 'Chevillon Thrax 388 Jefferson', 'Herrera Outlaw GTS', 'Villefort Alvarado V4F 570 Delegate', 'Roycefleet "Emperor" 620', 'Chevillon Emperor 620 Ragnar', 'Herrera Outlaw "Weiler"'
  ],
  '重型卡車 (Heavy Duty)': [
    'Kaukaz Zeya U420', 'Militech Behemoth', 'Bratsk U-410', 'Kaukaz Bratsk U-410', 'Militech Behemoth "Goliath"', 'Thorton Mackinaw MTL1', 'Thorton Mackinaw "Warhorse"', 'Thorton Mackinaw "Saguaro"'
  ],
  '跑車 (Sports Cars)': [
    'Mizutani Shion MZ2', 'Mizutani Shion "Coyote"', 'Quadra Turbo-R 740', 'Quadra Turbo-R V-Tech', 'Porsche 911 II (930) Turbo', 'Mizutani Shion "Nomad"', 'Quadra Type-66 "Javelina"', 'Quadra Type-66 "Jen Rowley"', 'Quadra Type-66 "Cthulhu"', 'Mizutani Shion "Mizuchi"'
  ],
  '超級跑車 (Hypercars)': [
    'Rayfield Caliburn', 'Rayfield Aerondight S9 "Guinevere"', 'Herrera Outlaw GTS', 'Rayfield Caliburn "Murkmobile"', 'Rayfield Caliburn "CrystalCoat"', 'Herrera Riptide "Terrier"', 'Rayfield "Excalibur"'
  ],
  '飛行器 (AVs - Aerodynes)': [
    'Trauma Team AV-4A', 'Arasaka AV', 'Kang Tao Armored AV', 'Zetatech AV', 'Delamain AV', 'MaxTac AV', 'Trauma Team "Elite" AV', 'Kang Tao "Dragon" AV', 'Zetatech "Sky-Reaper"', 'News Chopper AV'
  ],
};

export const NIGHT_CITY_COMPANIONS = {
  '男性': [
    'Jackie Welles (傑奇·威爾斯)', 'Goro Takemura (竹村五郎)', 'Kerry Eurodyne (凱瑞·歐羅丹)', 'River Ward (瑞佛·沃德)', 'Solomon Reed (索羅門·李德)', 'Viktor Vektor (維克多·Vector)', 'Mitch Anderson (米契·安德森)', 'Saul Bright (索爾·布萊特)', 'Placide (普拉西德)', 'Ozob Bozo (噁心幫·波索)', 'Denny (丹妮)', 'Hideo Kojima (小島秀夫)',
  ],
  '女性': [
    'Judy Alvarez (茱蒂·阿爾瓦雷茲)', 'Panam Palmer (帕娜·帕莫)', 'Rogue Amendiares (蘿格·阿門迪亞雷斯)', 'Meredith Stout (梅瑞德斯·斯托特)', 'Alt Cunningham (奧特·坎寧安)', 'Claire Russell (克萊兒·羅素)', 'Evelyn Parker (艾芙琳·帕克)', 'Hanako Arasaka (荒坂華子)', 'Wakako Okada (岡田和歌子)', 'Mama Welles (威爾斯媽媽)', 'Misty Olszewski (米絲蒂·奧爾謝夫斯基)', 'Blue Moon (藍月)', 'Red Menace (紅禍)', 'Purple Force (紫力)',
  ],
  '其他': [
    'Johnny Silverhand (強尼·銀手)', 'Songbird (鳴鳥)', 'Delamain (德拉曼)', 'Brendan (布蘭登)', 'Skippy (小嗶)', 'Nibbles the Cat (小貓尼波)', 'Granny (老奶奶)', 'Sandra Dorsett (珊卓·多賽特)', 'Regina Jones (芮琪娜·瓊斯)', 'Mr. Hands (手手先生)',
  ]
};

export const NIGHT_CITY_COMPANION_PROMPTS: Record<string, string> = {
  'Johnny Silverhand (強尼·銀手)': "Johnny Silverhand, a digital ghost with the likeness of Keanu Reeves. He has a signature silver cybernetic arm, classic aviator sunglasses, a faded Samurai band tank top, and dog tags. He often appears as a semi-transparent, glitching blue construct, embodying a rebellious rockstar attitude.",
  'Judy Alvarez (茱蒂·阿爾瓦雷茲)': "Judy Alvarez, a skilled braindance technician. She has a distinctive undercut hairstyle, often with green and pink highlights. Her arms are covered in colorful tattoos, including a '13' and Mox-related imagery. Typically wears a tank top and cargo pants, reflecting her practical, tech-focused personality.",
  'Panam Palmer (帕娜·帕莫)': "Panam Palmer, a fiercely independent Nomad from the Aldecaldos clan. She has dark, shoulder-length hair, often wears a worn leather jacket with the Aldecaldos patch on the back, and practical, rugged clothing. Her expression is usually determined and she is often seen with a sniper rifle.",
  'Jackie Welles (傑奇·威爾斯)': "Jackie Welles, a loyal and burly mercenary. He has slicked-back dark hair, a thick mustache, and a muscular build. He favors a Valentino-style leather vest, often worn shirtless, and wields his signature gold-plated pistols. His personality is a mix of tough-guy swagger and genuine warmth.",
  'Rogue Amendiares (蘿格·阿門迪亞雷斯)': "Rogue Amendiares, the legendary queen of the Afterlife. An older, experienced fixer with shoulder-length blonde hair. She dresses in stylish, sharp, and practical all-black outfits, exuding an aura of cool confidence and undisputed authority.",
  'Goro Takemura (竹村五郎)': "Goro Takemura, a former Arasaka bodyguard with a strong sense of honor. An older Japanese man with sharp features and graying hair. He is always impeccably dressed in a high-quality Arasaka suit. His face has subtle cyberware lines, and he carries a stern, deeply serious expression.",
  'Kerry Eurodyne (凱瑞·歐羅丹)': "Kerry Eurodyne, an aging rockstar and former bandmate of Johnny Silverhand. He has a flamboyant style, often wearing gold, leather, and extravagant jackets. His hair is styled, and he often has a guitar nearby. He projects a mix of creative energy and world-weary cynicism.",
  'River Ward (瑞佛·沃德)': "River Ward, a troubled but dedicated NCPD detective. He has a rugged appearance with short brown hair and a tired, concerned expression. His clothing is simple and functional, usually a jacket over a plain shirt and jeans, reflecting his down-to-earth nature.",
  'Songbird (鳴鳥)': "Songbird (So Mi), an exceptionally talented netrunner with a deep connection to the Blackwall. She has a sleek, futuristic appearance with dark hair and extensive, intricate cyberware across her face and body, often glowing with red or orange light. She wears a form-fitting, high-tech black outfit, and her expression is intense and mysterious.",
  'Solomon Reed (索羅門·李德)': "Solomon Reed, a veteran FIA secret agent with the likeness of Idris Elba. He is a tall, imposing figure who dresses in a professional, understated style, often seen in a dark trench coat. He has a stoic, composed demeanor, and his face shows the experience of a seasoned spy.",
  'Red Menace (紅禍)': 'Red Menace is a core member of the pop band Us Cracks, known for her vibrant magenta hair styled in buns, a red outfit with a punk-style choker, and her eyes hidden behind dark, futuristic glasses.',
  'Blue Moon (藍月)': 'Blue Moon is another core member of the band, easily recognized by her bright blue hair in matching buns, a blue and pink outfit, and a distinct yellow collar.',
  'Purple Force (紫力)': 'The third member of the trio, Purple Force stands out with her bright purple hair in high pigtails and large, doll-like cybernetic eyes that cover most of her face.',
};

export const NCL_OPTIONS = {
  hairStyle: [
    "從掃描檔中自動偵測", "經典短髮", "龐克莫霍克髮型", "高科技感應辮", "霓虹漸層長髮", "剃邊 undercut", "武士髮髻", "凌亂的波波頭", "生化改造光頭", "數據流動的發光髮絲",
    "不對稱剪裁", "銀色金屬感髮辮", "火焰圖案的剃髮", "盤繞的頂髻", "帶有LED燈飾的髮型", "油頭 all-back", "尖刺髮型", "長直髮，髮尾染色", "捲曲的仿生羊毛髮型", "半邊剃光長髮",
    "帶有全息投影的髮型", "漂浮的能量髮絲", "水晶體植入的髮型", "光纖辮子", "幾何圖案剃髮", "髒辮 (Dreadlocks)", "雙馬尾", "日式姬髮式", "狼尾頭 (Wolf Cut)", "蘑菇頭",
    "爆炸頭 (Afro)", "復古波浪捲髮", "賽博丸子頭", "帶有金屬環的髮辮", "濕髮造型", "層次感豐富的羽毛剪", "短劉海", "側分長劉海", "帶有機械部件的髮型", "電路板圖案剃髮",
    "霧面質感的短髮", "全像顯示的動態髮型", "碳纖維質感的髮型", "發光凝膠固定的髮型", "帶有小型天線的髮飾", "羽毛裝飾的髮型", "彩虹色長髮", "星空圖案染髮", "液態金屬流動感髮型", "碎形圖案的剃髮",
  ],
  hairColor: [
    "從掃描檔中自動偵測", "霓虹粉", "電光藍", "酸性綠", "鉻合金銀", "石墨黑", "純淨白", "火焰橙", "深紫色", "黃金黃",
    "雙色染 (黑與白)", "彩虹漸變", "白金色", "深紅色", "青色", "全息幻彩", "碳纖維黑", "銅鏽綠", "鐵鏽紅", "數據流動的藍綠色",
    "粉彩漸變 (粉紅/粉藍)", "紫外線反應的隱形染髮", "帶有金屬光澤的棕色", "啞光黑", "陶瓷白", "鈷藍色", "翡翠綠", "紫水晶色", "紅寶石色", "藍寶石色",
    "熔岩橙紅色", "星雲紫藍色漸變", "極光綠", "電漿粉色", "石英粉", "琥珀色", "瀝青黑", "骨白色", "黃銅色", "鋼鐵灰",
    "帶有數位雜訊的混合色", "熱感應變色染髮", "夜光綠", "鏡面銀色", "透明質感", "煙燻灰", "玫瑰金", "深海藍", "森林綠", "酒紅色",
  ],
  expression: [
    "從掃描檔中自動偵測",
    // Positive
    "微笑", "大笑", "自信的 smirk (得意地笑)", "興奮", "滿足", "溫柔", "喜悅", "調情", "頑皮的", "充滿希望的", "自豪的",
    // Negative
    "憤怒", "悲傷", "恐懼", "厭惡", "驚訝", "輕蔑", "痛苦", "絕望", "嫉妒", "擔憂", "疲憊",
    // Neutral/Complex
    "面無表情", "沉思", "專注", "好奇", "懷疑", "冷漠", "諷刺的", "緊張的", "堅定的", "困惑的", "挑釁的",
    "醉醺醺的", "精神恍惚的 (嗑藥)", "賽博精神病發作的邊緣", "痛苦的", "咬緊牙關的", "喘息的", "嘲諷的", "麻木的", "警惕的",
    "沉著冷靜的", "遺憾的", "懷舊的", "狡猾的", "傲慢的", "謙卑的", "害羞的", "尷尬的", "著迷的",
  ],
  lifePath: [
    "不指定", "公司員工", "街頭小子", "流浪者", "網路駭客 (Netrunner)", "技師 (Techie)", "獨武俠 (Solo)", "媒體人 (Media)", "警察 (NCPD Officer)", "黑幫成員", "情報販子 (Fixer)", "叛逃的公司特工", "清道夫 (Scavenger)", "腦舞技師 (Braindance Technician)", "創傷小組成員 (Trauma Team)", "軍用科技士兵 (Militech Soldier)", "荒坂特工 (Arasaka Agent)", "超夢明星 (Braindance Star)", "賞金獵人", "走私客", "非法醫生 (Ripperdoc)", "宗教狂熱份子", "政治家", "地下拳擊手", "藝術家",
  ]
};

export const NCL_OUTFITS_AND_CYBERWARE = {
  headwear: {
    label: "頭部",
    options: ["不指定", "高科技安全帽", "戰術護目鏡", "強化現實(AR)眼罩", "防毒面具", "生化眼", "腦機介面插槽", "霓虹面紋", "金屬面具", "反光飛行員眼鏡", "兜帽", "棒球帽", "針織帽", "頭巾", "防彈面罩", "全罩式戰術頭盔", "附帶呼吸器的頭盔", "全像投影面罩", "數據流動護目鏡", "龐克風鉚釘頭帶", "浪人風格的斗笠", "武士風格的面甲", "惡鬼面具", "醫用級口罩", "技師用放大護目鏡", "網路駭客神經介面頭環", "公司標誌的貝雷帽", "流浪者皮革頭巾", "防沙塵護目鏡", "腦舞花環", "賽博龐克風格皇冠", "發光的貓耳耳機", "附帶探照燈的頭盔", "清道夫風格焊接面罩", "虎鉤眾風格的般若面具", "漩戰幫風格的強化光學鏡", "瓦倫提諾幫風格的頭巾", "飛行員帽", "附天線的通訊耳機", "蕾絲面紗", "附帶小型攝影機的頭盔", "能量護盾產生器頭環", "仿生獸耳", "水晶裝飾的頭飾", "智慧變色兜帽", "運動用智慧頭帶", "強化現實隱形眼鏡", "覆蓋半臉的機械面甲", "遮陽帽", "漁夫帽", "平頂帽", "帶有全息廣告的帽子", "臉部框架", "祭祀用頭冠", "帶有羽毛的裝飾"]
  },
  outerwear: {
    label: "外衣",
    options: ["不指定", "裝甲防彈背心", "經典皮夾克", "高領長版風衣", "公司西裝外套", "LED發光外套", "迷彩派克大衣", "流浪者風格補丁背心", "和服式外套", "機能夾克", "全像投影廣告披風", "厚重的毛領大衣", "防護外套", "無袖背心", "緊身胸衣", "短版騎士皮夾克", "霓虹飾邊飛行員夾克", "不對稱拉鍊機能外套", "科技綢緞和服式夾克", "金屬質感羽絨外套", "肩部裝甲西裝外套", "透明PVC雨衣外套", "仿舊牛仔夾克", "刺繡絲綢飛行夾克（龍/鳳凰）", "LED發光纖維風衣", "漆皮長外套", "無袖長版背心外套", "拼接材質外套", "羊羔毛領飛行員夾克", "戰術斗篷外套", "可拆卸模組化外套", "防彈纖維連帽衫", "緊身馬甲式夾克", "流蘇裝飾皮夾克", "蛇皮紋路長外套", "反光材質運動夾克", "天鵝絨刺繡外套", "戰術多口袋馬甲", "裝甲板緊身胸衣", "皮質馬甲背心", "鋼骨束腰", "鍊條裝飾馬甲", "全像投影馬甲", "鏤空設計皮馬甲", "機能背帶式馬甲", "長版西裝馬甲", "羽絨馬甲", "蕾絲拼接塑身衣", "拉鍊前開襟馬甲", "卯釘裝飾馬甲", "東方風格織錦馬甲", "未來感盔甲式胸衣", "高科技匿蹤斗篷", "連帽長披風", "不對稱剪裁披肩", "透明硬紗披風", "羽毛裝飾披肩", "針織流蘇斗篷", "單肩披風", "帶有LED飾邊的披風", "鎖子甲風格披肩", "防水機能布斗篷", "超短版波麗路外套", "單袖外套", "連身裙式長外套", "多層次披掛式外套", "背部鏤空設計外套", "燈籠袖外套", "高衩長版外套", "可變形模組化外套", "環繞式和服外套", "降落傘繩索裝飾外套", "液態金屬質感外套", "碳纖維紋理外套", "仿生皮膚質地外套", "數位迷彩外套", "螢光壓克力材質外套", "再生塑膠瓶環保外套", "變色龍塗層外套", "絲絨與皮革拼接外套", "數據流圖案發光外套", "磨砂金屬質感夾克", "蕾絲長袍", "短版毛呢外套", "運動風連帽衫", "教練夾克", "斗篷式大衣", "人造皮草大衣", "機車背心", "狩獵背心", "針織開襟衫", "長版針織外套", "運動外套", "風衣", "棒球外套", "皮草披肩", "絲質長袍", "手術袍風格外套"]
  },
  innerwear: {
    label: "內搭",
    options: ["不指定", "緊身機能衣", "網狀上衣", "防彈襯衫", "復古樂團T恤", "破洞背心", "高領毛衣", "公司制服襯衫", "半透明上衣", "運動胸衣", "無袖襯衫", "坦克背心", "有領襯衫", "蕾絲邊飾吊帶背心", "挖空設計短版上衣", "單肩不對稱上衣", "高領無袖緊身衣", "綁帶式露背上衣", "交叉綁帶短上衣", "皮質馬甲式上衣", "金屬環裝飾坦克背心", "絲綢緞面吊帶衫", "魚骨緊身胸衣", "掛脖式上衣", "平口抹胸", "全像投影材質背心", "拉鍊裝飾緊身上衣", "薄紗泡泡袖上衣", "側邊綁帶背心", "V領金屬鍊條上衣", "超短版針織衫", "高衩連體緊身衣", "蕾絲連身衣", "機能布料連身衣", "背部全開連身衣", "不對稱鏤空連身衣", "漁網連身衣", "皮質束帶連身衣", "長袖網紗連身衣", "仿生紋理緊身衣", "螢光條紋緊身衣", "透明硬紗襯衫", "Oversized男友風白襯衫", "綁結式短版襯衫", "立領荷葉邊襯衫", "金屬絲線襯衫", "露肩襯衫", "燈籠袖襯衫", "絲綢睡衣風格襯衫", "背部綁帶襯衫", "不對稱下擺襯衫", "皮革胸衣", "多重綁帶胸衣", "鍊條裝飾胸衣", "運動機能胸衣", "針織短版背心", "羅紋坦克背心", "絲絨吊帶背心", "卯釘裝飾胸衣", "亮片刺繡胸衣", "透視蕾絲胸衣", "液態乳膠上衣", "天鵝絨緊身衣", "反光材質上衣", "蛇皮紋路緊身上衣", "數位印花T恤", "破洞處理龐克T恤", "半透明乳膠上衣", "變色龍塗層上衣", "輕薄羊絨高領衫", "金屬網格上衣", "乳膠連身裙", "緞面連身裙", "針織連身裙", "襯衫式連身裙", "運動內衣", "絲綢襯衣", "絨面緊身衣", "基本款棉質T恤", "POLO衫", "法蘭絨襯衫", "亨利領上衣", "細肩帶背心", "削肩背心", "馬甲", "Bustier胸衣", "Bralette無鋼圈胸衣", "肚兜式上衣", "圍巾式上衣", "緞面馬甲", "天鵝絨連身裙", "鏤空針織衫", "短版帽T", "絲質睡袍式襯衫", "綢緞襯衫"]
  },
  legwear: {
    label: "腿部",
    options: [
      "不指定", "戰術長褲", "緊身皮褲", "機能緊身褲", "寬鬆工裝褲", "裝甲護腿", "公司西褲", "破洞牛仔褲", "運動短褲", "迷你裙", "長裙", "高腰褲", "連身褲",
      "多口袋軍規長褲", "抗撕裂機能褲", "生物纖維緊身褲", "附掛模組化口袋的工裝褲", "發光線條裝飾的運動褲", "不對稱設計的解構長褲", "和服式寬褲 (Hakama)", "熱褲", "皮質短褲",
      "重機騎士皮褲", "內置護膝的戰術褲", "數位迷彩褲", "高科技運動短褲", "全像投影廣告圖案的褲子", "透明PVC材質長褲", "金屬質感緊身褲", "拼接材質長褲", "流蘇皮褲",
      "側邊綁帶長褲", "高衩長裙", "不規則下擺裙", "戰術短裙", "皮質迷你裙", "百褶裙", "帶有外骨骼結構的長褲", "壓力褲", "瑜珈褲", "寬鬆的垮褲", "燈籠褲",
      "馬褲", "工作服連身褲", "緊身連身衣 (Catsuit)", "短版連身褲 (Romper)", "防護工作褲", "耐火材質長褲", "防水褲", "隔熱褲", "降落傘褲", "仿舊牛仔褲",
      "酸洗牛仔褲", "卯釘裝飾龐克褲", "格子褲", "絲質睡褲風格長褲", "天鵝絨寬褲", "蕾絲緊身褲", "漁網襪", "過膝長襪", "帶有發光圖案的絲襪", "盔甲護膝", "護脛甲", "外掛式大腿槍套"
    ]
  },
  footwear: {
    label: "足部",
    options: [
      "不指定", "重型戰鬥靴", "高筒運動鞋", "金屬護腿靴", "公司皮鞋", "輕便跑鞋", "磁懸浮靴", "西部靴", "過膝長靴", "涼鞋", "高跟鞋",
      "鋼頭工作靴", "軍用沙漠靴", "高科技潛入靴", "LED發光運動鞋", "厚底鬆糕鞋", "機車靴", "裝甲高跟鞋", "忍者分趾靴 (Tabi Boots)", "磁吸攀爬靴", "動力輔助跳躍靴",
      "隱形變色靴", "全地形適應靴", "防滑工作鞋", "絕緣靴", "抗衝擊運動鞋", "流線型賽車靴", "優雅的德比鞋", "樂福鞋", "牛津鞋", "鉚釘龐克靴",
      "帶有金屬扣環的靴子", "蛇皮紋路靴", "透明材質高跟鞋", "發光鞋帶", "自動繫帶運動鞋", "附帶滾輪的鞋子", "靜音潛行鞋", "防水涉水靴", "長筒馬靴", "木屐",
      "涼拖鞋", "戰術涼鞋", "運動拖鞋", "芭蕾平底鞋", "瑪莉珍鞋", "楔形跟鞋", "踝靴", "切爾西靴", "帆布鞋", "懶人鞋", "豆豆鞋", "過膝襪靴", "帶有小口袋的靴子", "外骨骼輔助靴", "能量回饋跑鞋", "可替換鞋底的模組化鞋", "帶有全像投影的鞋子", "腳踝護甲"
    ]
  },
  faceCyberware: {
    label: "臉部義體",
    options: [
      "不指定", "奇美拉光學儀", "克羅斯尼科夫眼", "面部金屬板", "皮膚下LED發光紋路", "改造下顎", "合成皮膚", "眼部攝影機", "語音合成器格柵", "鼻部過濾器",
      "多光譜視覺眼", "目標分析儀", "情緒感應器", "臉部 seams (接縫線)", "太陽穴數據端口", "可伸縮的天線", "虹膜變色隱形眼鏡", "全像投影化妝", "皮下通訊植入物", "下顎強化骨骼",
      "牙齒替換 (鉻合金/黃金)", "人工鰓 (水下呼吸)", "皮膚顯示器 (顯示文字/圖案)", "視網膜投影", "擴增聽覺感應器", "化學分析嗅探器", "微型臉部護盾發射器", "聲音過濾耳塞", "戰術目鏡", "單邊眼鏡式顯示器",
      "皮膚紋理改造", "防彈皮膚移植", "臉頰儲存囊", "舌頭數據接口", "喉部擴音器", "眼窩攝影機", "電子淚痕 (發光)", "鼻樑數據線", "額頭散熱片", "嘴唇金屬裝飾",
      "下巴植入物", "臉部骨骼重塑", "皮膚硬化處理", "可伸縮的面具", "生物辨識掃描儀", "臉部全像偽裝", "紅外線視覺", "夜視功能眼", "變焦鏡頭眼", "微型臉部無人機發射器",
      "臉部表情抑制器", "皮下微型電腦", "腦波讀取器接口", "記憶體擴充插槽", "神經接口"
    ]
  },
  bodyCyberware: {
    label: "身體義體",
    options: [
      "不指定", "皮下裝甲", "脊椎外骨骼", "合成肌肉纖維", "生物監測器植入", "胸口發光裝置", "外露的機械關節", "碳纖維骨骼", "肩部植入物", "腹部電鍍",
      "強化肌腱", "腎上腺素幫浦", "疼痛抑制器", "血液過濾系統", "人工肝臟/腎臟", "第二心臟", "皮膚下武器艙", "可伸縮的爪子", "手臂火箭發射器", "肩膀上的微型飛彈",
      "背部散熱口", "整合式工具臂", "全息投影儀", "皮膚硬化改造", "反射增強器", "骨骼強化", "毒素過濾器", "體內氧氣瓶", "微型工廠 (體內製造化學品)", "細胞再生器",
      "皮膚顏色/圖案變換", "磁性皮膚 (可吸附金屬)", "聲音模擬器", "體溫調節器", "輻射偵測器", "GPS追蹤器", "數據儲存硬碟", "可伸縮的翅膀 (滑翔用)", "腳底推進器", "手指上的小工具 (開鎖器/焊接器)",
      "掌心衝擊波", "電磁脈衝 (EMP) 發生器", "匿蹤皮膚 (光學迷彩)", "能量護盾產生器", "合成神經系統", "觸手附肢", "可分離的肢體", "內部武器架", "液壓增強腿部", "快速凝血系統",
      "強化感官套件", "生物駭客接口"
    ]
  }
};



export const TWELVE_GRID_CATEGORIES = [
  {
    "categoryName": "動漫與漫畫 (Anime & Comics)",
    "items": [
      {
        "label": "熱血少年漫風（Jump感）",
        "prompt": "將參考圖片角色變形，設計12款LINE貼紙，日系少年漫畫風格，強烈動作誇張姿勢，速度線與爆炸特效，台灣慣用語繁體中文，文字像漫畫對話框，情緒張力極強，每張如動畫戰鬥分鏡，構圖變化豐富"
      },
      {
        "label": "戀愛少女漫風（少女心爆炸）",
        "prompt": "參考角色變形為戀愛漫畫貼紙角色，設計12張LINE貼紙，少女漫畫風，夢幻花朵與閃光背景，台灣慣用語繁體中文，文字像戀愛漫畫旁白，姿勢優雅誇張"
      },
      {
        "label": "韓系Webtoon風（Naver漫畫感）",
        "prompt": "參考角色變形成韓系Webtoon漫畫角色，設計12張LINE貼紙，清爽扁平上色，強烈表情特寫，台灣慣用語繁體中文，文字像網漫字幕框，劇情感像戀愛或搞笑漫畫分鏡"
      },
      {
        "label": "Studio Trigger Anime Explosion（扳機社超燃）",
        "prompt": "Transform the character into Studio Trigger anime style, intense action poses, dramatic speedlines, explosive effects, 12 sticker scenes like anime battle frames"
      },
      {
        "label": "Anime Sports Hype Moment（運動畫面熱血）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，運動番熱血風格，角色像比賽中爆發瞬間，台灣慣用語繁體中文呈現，文字排版像體育轉播字幕，姿勢動感強烈，每張如高潮分鏡"
      },
      {
        "label": "Anime Cooking Battle（料理對決番）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，料理對決動畫風格，角色像在做浮誇料理戰鬥，台灣慣用語繁體中文呈現，文字排版像必殺菜名字幕，每張如熱血美食番"
      },
      {
        "label": "Wholesome Family Sitcom Style（家庭動畫喜劇）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，家庭動畫喜劇風格，角色像情境動畫主角，台灣慣用語繁體中文呈現，文字排版像電視字幕吐槽，每張像日常劇名場面"
      },
      {
        "label": "Reaction Screenshot Style（劇情截圖風）",
        "prompt": "Design 12 LINE stickers as if they are screenshots from an anime episode, cinematic framing, dramatic subtitles in English or Chinese, strong storytelling moments"
      }
    ]
  },
  {
    "categoryName": "迷因與搞笑 (Meme & Funny)",
    "items": [
      {
        "label": "搞笑泡麵番 Q版崩壞風",
        "prompt": "將參考角色Q版變形，設計12款LINE貼紙，搞笑泡麵番風格，顏藝崩壞表情，誇張動作，台灣慣用語繁體中文，文字巨大浮誇，像動畫搞笑名場面"
      },
      {
        "label": "超浮誇特效梗圖動畫風（迷因感）",
        "prompt": "參考角色迷因化變形，設計12張LINE貼紙，誇張特效與爆炸背景，台灣慣用語繁體中文，文字排版像網路梗圖，劇情反轉感強烈，動作超浮誇"
      },
      {
        "label": "迷因大字報風（Meme Poster）",
        "prompt": "參考角色迷因化設計12張LINE貼紙，誇張表情搭配超大繁體中文台灣慣用語，文字像迷因大字報，構圖強烈衝突感，像社群梗圖動畫截圖"
      },
      {
        "label": "Meme Cat/Dog Caption Style（國際迷因梗）",
        "prompt": "Create 12 meme-style LINE stickers from the reference character, exaggerated expressions, bold Impact-style captions in English, funny internet humor vibe"
      },
      {
        "label": "Cute Office Meme Style（上班族爆紅梗）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，上班族迷因風格，角色像社畜日常動畫，台灣慣用語繁體中文呈現，文字排版像辦公室便利貼吐槽，劇情感強烈，每張都像職場名場面"
      },
      {
        "label": "Cute Classroom Meme Pack（教室梗圖系列）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，校園教室迷因風格，角色像學生上課崩潰日常，台灣慣用語繁體中文呈現，文字排版像黑板吐槽，劇情感超強爆紅"
      },
      {
        "label": "Retro TV Variety Show Caption（綜藝復古字幕）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，復古綜藝節目字幕風格，角色像被主持人吐槽，台灣慣用語繁體中文呈現，文字排版像綜藝大字報，爆笑吸睛"
      },
      {
        "label": "CapCut Meme Subtitle Core（短影片大字幕潮）",
        "prompt": "Design 12 LINE stickers based on the reference character, CapCut meme subtitle style, bold oversized text, high-energy expressions, cinematic reaction moments, clean white background, social-media viral vibe"
      }
    ]
  },
  {
    "categoryName": "可愛與療癒 (Cute & Healing)",
    "items": [
      {
        "label": "吉卜力溫柔動畫風",
        "prompt": "以參考角色為主角，設計12張LINE貼紙，吉卜力動畫柔和筆觸，日常生活劇情感，台灣慣用語繁體中文，文字排版像手寫字幕，表情細膩可愛，每張像動畫片段截圖"
      },
      {
        "label": "超可愛貼貼風（LINE熱門商業款）",
        "prompt": "以參考角色為主角，設計12張LINE貼紙，簡潔可愛商業貼圖風，角色線條乾淨，背景留白，台灣慣用語繁體中文，文字排版整齊但活潑，動作變化豐富"
      },
      {
        "label": "Hello Kitty爆款可愛（Sanrio Kawaii Pop）",
        "prompt": "Turn the reference character into Sanrio-inspired kawaii style, pastel colors, soft outlines, 12 cute LINE stickers, sweet expressions, playful short English captions"
      },
      {
        "label": "嬰兒繪本萌（Ultra Soft Baby Picture Book）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，嬰兒繪本柔軟可愛風格，角色表情超純真，台灣慣用語繁體中文呈現，文字排版像睡前故事句子，治癒感極強"
      },
      {
        "label": "雲朵貼紙風（Dreamy Cloud Stickercore）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，雲朵Stickercore夢幻風格，角色像漂浮在柔軟雲裡，台灣慣用語繁體中文呈現，文字排版像天空小標籤，療癒感爆棚"
      },
      {
        "label": "日本廣告吉祥物風（Japanese Soft Commercial Mascot）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，日本商業吉祥物風格，角色圓潤親切帶治癒感，台灣慣用語繁體中文呈現，文字排版像便利商店宣傳語，每張像溫馨動畫廣告分鏡"
      },
      {
        "label": "果凍團子風（Cute Blob Character Trend）",
        "prompt": "Turn the reference character into a cute blob mascot style, squishy proportions, funny bouncing poses, 12 stickers with simple viral captions, ultra trendy kawaii meme"
      },
      {
        "label": "領養海報萌（Cute Pet Adoption Poster）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，寵物領養海報風格，角色像動物之家宣傳主角，台灣慣用語繁體中文呈現，文字排版像可愛公告，療癒又吸粉"
      },
      {
        "label": "療癒食物系（ASMR Cozy Foodie Sticker）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，ASMR療癒食物系風格，角色在吃喝或抱著食物，台灣慣用語繁體中文呈現，文字像甜點包裝小標籤，畫面溫暖可愛超流行"
      },
      {
        "label": "治癒系日常小幸福（Cozy Slice-of-Life）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，吉卜力式治癒日常動畫風格，溫暖柔光與手繪筆觸，角色在生活小場景中微笑、發呆、抱著小物，台灣慣用語繁體中文呈現，文字排版像動畫字幕，每張如溫馨日常分鏡"
      },
      {
        "label": "春日戀愛微光風（Romantic Blossom Anime）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，浪漫春日戀愛動畫風格，櫻花飄落與柔焦光暈，角色害羞告白、心動轉身，台灣慣用語繁體中文呈現，文字像少女漫畫旁白字幕，構圖夢幻吸睛，每張如戀愛動畫名場面"
      },
      {
        "label": "森林精靈童話風（Whimsical Forest Spirit）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，吉卜力森林精靈童話風格，柔和水彩背景與小動物陪伴，角色像在森林裡冒險與祝福，台灣慣用語繁體中文呈現，文字排版像故事書字幕，每張如童話動畫片段"
      },
      {
        "label": "夢境星空浪漫風（Dreamy Night Sky Romance）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，夢境星空浪漫動畫風格，夜晚柔藍光與星星閃爍，角色靜靜想念、溫柔擁抱，台灣慣用語繁體中文呈現，文字像詩意旁白，每張如劇場版溫柔鏡頭"
      },
      {
        "label": "甜點系戀愛可愛風（Sweet Dessert Romance）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，甜點戀愛動畫風格，馬卡龍粉彩與糖霜光澤，角色抱著草莓蛋糕、撒嬌微笑，台灣慣用語繁體中文呈現，文字像甜甜的告白台詞，每張如可愛戀愛番外篇"
      },
      {
        "label": "雨天溫柔陪伴風（Rainy Day Comfort）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，吉卜力雨天溫柔陪伴動畫風格，小雨傘與濕潤街道的柔光氛圍，角色安慰、守候、輕聲說話，台灣慣用語繁體中文呈現，文字排版像安靜字幕，每張如療癒電影片段"
      },
      {
        "label": "小小告白劇情風（Soft Confession Moments）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，溫柔告白劇情動畫風格，角色露出害羞表情、遞出小花或信，台灣慣用語繁體中文呈現，文字像戀愛動畫台詞，構圖簡潔留白，每張如心動瞬間分鏡"
      },
      {
        "label": "蜂蜜戀愛泡泡風（Honey Love Mood）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，蜂蜜般甜蜜戀愛動畫風格，柔金色光暈與愛心泡泡環繞，角色撒嬌、害羞、輕輕擁抱，台灣慣用語繁體中文呈現，文字排版像溫柔告白字幕，每張如戀愛動畫甜蜜名場面"
      },
      {
        "label": "草莓牛奶初戀風（Strawberry First Love）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，草莓牛奶初戀動畫風格，粉白柔霧配色與春日甜香氛圍，角色臉紅、偷看、心動微笑，台灣慣用語繁體中文呈現，文字像少女漫畫旁白，每張如初戀心跳分鏡"
      },
      {
        "label": "情侶日常小劇場風（Couple Cozy Moments）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，情侶日常甜蜜小劇場動畫風格，角色一起吃點心、牽手散步、互相鬧脾氣又和好，台灣慣用語繁體中文呈現，文字排版像動畫對話字幕，每張如戀愛番外篇"
      },
      {
        "label": "心動告白信件風（Love Letter Scene）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，戀愛情書動畫風格，角色拿著信封、小花束、偷偷告白，柔焦光暈與紙張手繪質感，台灣慣用語繁體中文呈現，文字像情書句子，每張如告白劇情高潮"
      },
      {
        "label": "甜點夢幻下午茶風（Tea Party Romance）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，夢幻下午茶戀愛動畫風格，馬卡龍、蛋糕與花朵背景，角色捧著甜點微笑撒嬌，台灣慣用語繁體中文呈現，文字排版像甜甜的邀約，每張如浪漫下午茶動畫場景"
      },
      {
        "label": "小動物助攻戀愛風（Animals Blessing Love）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，吉卜力小動物助攻戀愛風格，角色被貓咪、兔子、小鳥圍繞，浪漫祝福氣氛濃厚，台灣慣用語繁體中文呈現，文字像幸福小旁白，每張如童話戀愛鏡頭"
      },
      {
        "label": "星光擁抱甜蜜風（Starry Hug Scene）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，星光擁抱甜蜜動畫風格，夜晚柔藍星點與輕光包圍，角色輕輕抱抱、想念、說晚安，台灣慣用語繁體中文呈現，文字像詩意情話字幕，每張如劇場版溫柔高潮"
      },
      {
        "label": "戀愛害羞小表情包（Blushing Cute Romance）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，戀愛害羞表情包動畫風格，角色臉紅捂臉、偷笑、心跳加速，背景充滿小愛心與粉色光點，台灣慣用語繁體中文呈現，文字短句可愛，每張如心動反應名場面"
      },
      {
        "label": "幸福新婚童話風（Fairytale Wedding Sweetness）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，幸福童話新婚甜蜜動畫風格，角色穿著浪漫元素服飾與花環，氣氛像童話結局，台灣慣用語繁體中文呈現，文字排版像祝福台詞，每張如最甜結尾分鏡"
      }
    ]
  },
  {
    "categoryName": "平面與設計 (Graphic & Design)",
    "items": [
      {
        "label": "扁平插畫品牌風（像無印＋LINE Friends）",
        "prompt": "參考角色扁平插畫品牌化，設計12張LINE貼紙，簡約色塊與乾淨線條，台灣慣用語繁體中文，文字排版整齊有設計感，角色可愛耐看"
      },
      {
        "label": "極簡emoji貼圖風（爆款商業感）",
        "prompt": "將參考角色極簡化emoji貼圖風，設計12款LINE貼紙，粗線條簡單表情，台灣慣用語繁體中文，文字短句搭配角色動作，排版像社群表情包，乾淨留白"
      },
      {
        "label": "Luxury Minimal Emoji (Apple-like)（高級極簡）",
        "prompt": "Create 12 ultra-minimal luxury emoji-style stickers, reference character simplified, clean outlines, subtle typography, modern premium aesthetic, short captions only"
      },
      {
        "label": "Super Flat Icon System（扁平圖標系統）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，超扁平icon系統設計風格，角色像App圖示般高度簡化，台灣慣用語繁體中文呈現，文字排版像功能按鈕標籤，現代感極強"
      },
      {
        "label": "Sticker Bomb Maximalism（貼紙爆炸滿版風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，Sticker Bomb滿版潮流風格，構圖塞滿小元素與誇張裝飾，台灣慣用語繁體中文呈現，文字像街頭貼紙拼貼，姿勢變化極多，視覺衝擊強"
      },
      {
        "label": "Pinterest Sticker Collage Aesthetic（拼貼文青）",
        "prompt": "Design 12 LINE stickers in Pinterest collage aesthetic, layered paper textures, cute doodles, reference character integrated with trendy typography, soft modern layout"
      },
      {
        "label": "Notebook Margin Doodle（課本邊角塗鴉風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，課本邊角塗鴉風格，像學生隨手畫的小劇場角色，台灣慣用語繁體中文呈現，文字像筆記旁的吐槽註解，構圖自由可愛，青春感爆棚"
      },
      {
        "label": "Handwritten Chaos Doodle Stickers（亂畫感爆紅）",
        "prompt": "Reference character in chaotic handwritten doodle style, messy funny expressions, scribble text captions, 12 stickers like viral indie cartoon memes"
      },
      {
        "label": "Minimal Line Art + Punchline（極簡線稿梗句）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，極簡線稿插畫風格，角色用最少線條呈現但表情到位，台灣慣用語繁體中文呈現，文字像一句梗Punchline，排版俐落時髦，適合爆款貼圖"
      },
      {
        "label": "Luxury Calligraphy Brush Pop（書法潮流混搭）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，書法筆刷潮流混搭風格，角色搭配潑墨筆觸與動態字體，台灣慣用語繁體中文呈現，文字像帥氣書法招式名，每張如武俠動畫必殺技"
      }
    ]
  },
  {
    "categoryName": "立體與材質 (3D & Material)",
    "items": [
      {
        "label": "3D黏土動畫風（像Pingu/Stop-motion）",
        "prompt": "參考角色變形成3D黏土定格動畫風，設計12張LINE貼紙，立體材質柔軟可愛，台灣慣用語繁體中文，文字像貼紙標籤，動作幽默像動畫片段"
      },
      {
        "label": "Soft 3D Emoji Core（柔軟立體表情包）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，柔軟3D emoji風格，角色像手機貼圖般圓潤立體，台灣慣用語繁體中文呈現，文字短句搭配動作表情，構圖簡潔但吸睛，每張像社群反應包"
      },
      {
        "label": "AI潮流毛絨玩偶風（Plush Toy Core）",
        "prompt": "參考角色變形成毛絨玩偶公仔風格，設計12張LINE貼紙，柔軟材質3D可愛，台灣慣用語繁體中文，文字像玩具包裝標籤，動作誇張萌化"
      },
      {
        "label": "3D Toy Figure Stickers（潮流公仔風）",
        "prompt": "Turn the reference character into a designer toy figure style, 3D collectible look, cute big head proportions, 12 stickers with fun English catchphrases"
      },
      {
        "label": "Paper Cut Collage（紙雕拼貼風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，紙雕拼貼藝術風格，層層紙張材質與手作質感，台灣慣用語繁體中文呈現，文字排版像手帳貼紙，姿勢活潑多變，每張像童話動畫場景"
      },
      {
        "label": "Cute DIY Craft Sticker（手作拼貼風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，DIY手作拼貼風格，像剪紙與貼紙手帳作品，台灣慣用語繁體中文呈現，文字排版像手寫便利貼，溫暖可愛超耐看"
      },
      {
        "label": "Cute Luxury Gold Stamp（精品金印章）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，精品金印章風格，角色搭配燙金標章與極簡高級排版，台灣慣用語繁體中文呈現，文字像精品認證標籤，質感爆棚獨特"
      },
      {
        "label": "Luxury Marble Sculpture Meme（大理石雕像梗）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，大理石雕像奢華梗圖風格，角色像藝術雕塑卻在講廢話，台灣慣用語繁體中文呈現，文字排版像博物館標牌，反差感超吸睛"
      }
    ]
  },
  {
    "categoryName": "電影與攝影 (Cinematic & Photo)",
    "items": [
      {
        "label": "動漫劇場版電影海報感",
        "prompt": "參考角色變形設計12張LINE貼紙，每張像劇場版動畫截圖， cinematic lighting，強烈鏡頭構圖，台灣慣用語繁體中文，文字像電影台詞字幕，畫面震撼"
      },
      {
        "label": "Film Camera Snapshot Retro（底片快照復古）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，底片相機快照復古風格，帶顆粒與閃光燈效果，台灣慣用語繁體中文呈現，文字排版像拍立得日期標註，每張像青春動畫回憶片段"
      },
      {
        "label": "Cinematic Blur Motion Reaction（動態模糊反應包）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，動態模糊Motion Blur潮流風格，角色像突然衝出去或震驚瞬間，台灣慣用語繁體中文呈現，文字排版像短影音截圖，節奏超強吸睛"
      },
      {
        "label": "Neon Street Photography Flash（街拍閃光燈潮）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，霓虹街拍閃光燈風格，角色像夜生活抓拍瞬間，台灣慣用語繁體中文呈現，文字排版像潮流街拍標題，超酷吸睛"
      },
      {
        "label": "High Fashion Runway Reaction（伸展台表情包）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，高級時裝伸展台反應包風格，角色姿勢像時尚定格，台灣慣用語繁體中文呈現，文字排版像雜誌標題，冷酷又搞笑的反差感"
      },
      {
        "label": "Luxury Fashion Editorial Sticker（時尚雜誌貼圖）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，高級時尚雜誌Editorial風格，角色動作像伸展台定格，台灣慣用語繁體中文呈現，文字排版像精品雜誌標題，極簡但超有質感"
      },
      {
        "label": "Sci-Fi Retro Anime VHS（VHS復古科幻）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，VHS復古科幻動畫風格，畫面帶掃描線與舊電視質感，台灣慣用語繁體中文呈現，文字排版像80年代動畫字幕，潮流復古吸睛"
      }
    ]
  },
  {
    "categoryName": "遊戲與奇幻 (Gaming & Fantasy)",
    "items": [
      {
        "label": "像素遊戲 RPG 表情包風",
        "prompt": "將參考角色像素化RPG風格，設計12張LINE貼紙，台灣慣用語繁體中文，文字像遊戲UI提示框，動作像角色技能動畫，創意排版"
      },
      {
        "label": "Retro Pixel UI Sticker（復古像素介面風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，復古像素遊戲UI風格，角色像8-bit動畫角色，台灣慣用語繁體中文呈現，文字排版像遊戲提示框與狀態欄，每張像RPG劇情事件"
      },
      {
        "label": "Chibi RPG Status Effect Pack（遊戲狀態貼圖）",
        "prompt": "Reference character as chibi RPG character stickers, 12 status effects like “HP LOW” “STUNNED” “LEVEL UP”, game UI typography, anime emoji vibe"
      },
      {
        "label": "Cute Horror Game UI（恐怖遊戲介面萌）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，可愛恐怖遊戲UI風格，角色像驚悚遊戲裡的萌系主角，台灣慣用語繁體中文呈現，文字排版像任務提示框，反差感爆紅"
      },
      {
        "label": "Cute Space Mission Patch（太空任務徽章）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，太空任務徽章Patch風格，角色像NASA吉祥物，台灣慣用語繁體中文呈現，文字排版像任務代號標籤，每張如太空動畫番外篇"
      },
      {
        "label": "Futuristic AR Popup Sticker（AR彈窗未來感）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，AR彈窗未來介面風格，角色像從螢幕跳出的提示角色，台灣慣用語繁體中文呈現，文字排版像系統通知彈窗，科技感強烈又可愛"
      },
      {
        "label": "Cute Sci-Fi Control Panel（科幻控制面板）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，科幻控制面板UI風格，角色像太空艙內的操作員，台灣慣用語繁體中文呈現，文字排版像系統提示訊息，每張如未來動畫劇情"
      },
      {
        "label": "Cute Mythology Card Set（神話角色卡）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，可愛神話卡牌風格，角色像傳說小英雄，台灣慣用語繁體中文呈現，文字排版像技能說明，每張如動畫冒險番"
      }
    ]
  },
  {
    "categoryName": "氛圍與生活 (Mood & Lifestyle)",
    "items": [
      {
        "label": "Y2K潮流貼紙風（復古千禧）",
        "prompt": "參考角色變形成Y2K潮流貼紙風格，設計12張LINE貼紙，閃亮金屬質感背景，泡泡字繁體中文台灣慣用語，動作像偶像劇梗圖，潮流感強烈"
      },
      {
        "label": "Lo-fi Chill Mood Stickers（療癒系低飽和）",
        "prompt": "Reference character in lo-fi chill aesthetic, muted colors, cozy sleepy expressions, minimalist captions, 12 stickers like lo-fi animation stills, soft calm vibe"
      },
      {
        "label": "Lo-fi Night Bus Mood（深夜公車氛圍）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，深夜lo-fi公車氛圍風格，角色像在夜晚通勤發呆，台灣慣用語繁體中文呈現，文字排版像內心旁白字幕，療癒又有故事感"
      },
      {
        "label": "Dreamcore Pastel Surreal（夢核粉彩超現實）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，Dreamcore粉彩超現實風格，夢境般柔霧背景與怪奇可愛元素，台灣慣用語繁體中文呈現，文字像夢中旁白，姿勢奇幻多變，吸睛又療癒"
      },
      {
        "label": "Neon Karaoke Subtitle（霓虹卡拉OK字幕）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，霓虹卡拉OK字幕風格，角色像在唱歌或吐槽，台灣慣用語繁體中文呈現，文字排版像跳動歌詞字幕，動作誇張歡樂，每張像音樂動畫名場面"
      },
      {
        "label": "Cute Convenience Store Drama（超商小劇場）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，便利商店小劇場風格，角色像在7-11裡發生荒謬日常，台灣慣用語繁體中文呈現，文字排版像收據吐槽，超生活爆款"
      },
      {
        "label": "Bubble Tea Pop Culture（珍奶流行文化）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，珍奶流行文化風格，角色搭配飲料杯與Q彈元素，台灣慣用語繁體中文呈現，文字排版像手搖杯封膜，超台又超可愛"
      },
      {
        "label": "Cute Café Menu Sticker（咖啡廳菜單風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，咖啡廳菜單插畫風格，角色搭配飲料甜點情境，台灣慣用語繁體中文呈現，文字排版像餐廳手寫菜單，溫暖又流行"
      },
      {
        "label": "Luxury Coffee Roaster Label（咖啡豆包裝）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，精品咖啡烘豆包裝風格，角色搭配高級字排，台灣慣用語繁體中文呈現，文字像咖啡命名標籤，文青又時髦"
      },
      {
        "label": "Luxury Japanese Packaging Minimal（高級日式包裝）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，高級日式包裝設計風格，極簡留白與精緻字體排版，台灣慣用語繁體中文呈現，角色姿勢優雅，整體像精品伴手禮貼紙"
      },
      {
        "label": "Luxury Neon Sign Minimal（精品霓虹招牌）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，精品霓虹招牌極簡風格，角色搭配發光字體與大留白，台灣慣用語繁體中文呈現，文字排版像高級夜店招牌，極潮吸睛"
      },
      {
        "label": "Cute Weather Forecast Pack（天氣預報情緒貼）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，天氣預報情緒風格，角色搭配晴天雨天雷暴等心情象徵，台灣慣用語繁體中文呈現，文字排版像氣象ICON提示，每張都超可愛實用"
      },
      {
        "label": "Cute Dream Journal Mood（夢日記旁白）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，夢日記情緒風格，角色像在記錄奇怪夢境，台灣慣用語繁體中文呈現，文字排版像日記旁白，療癒又超現實"
      }
    ]
  },
  {
    "categoryName": "其他 (Others)",
    "items": [
      {
        "label": "浮世繪＋日式復古動畫融合",
        "prompt": "參考角色日式復古浮世繪動畫混合風格，設計12款LINE貼紙，台灣慣用語繁體中文，文字排版像復古招牌，構圖藝術化，動作誇張幽默"
      },
      {
        "label": "手繪塗鴉動畫風（獨立動畫感）",
        "prompt": "參考角色變形成手繪塗鴉動畫風，設計12款LINE貼紙，粗線條與隨性筆觸，台灣慣用語繁體中文，文字像手寫塗鴉，構圖自由有創意"
      },
      {
        "label": "可愛厭世風（Chill Doom Cute）",
        "prompt": "參考角色設計12張LINE貼紙，可愛厭世風格，表情呆萌但情緒疲倦，台灣慣用語繁體中文，文字小但致命，排版留白像文青貼紙，日常崩潰劇情感"
      },
      {
        "label": "韓團偶像Reaction風（追星梗）",
        "prompt": "參考角色偶像化變形，設計12款LINE貼紙，韓團reaction風格，誇張尖叫表情，台灣慣用語繁體中文，文字像舞台字幕，劇情像追星名場面"
      },
      {
        "label": "短影音字幕風（TikTok Reels感）",
        "prompt": "參考角色設計12張LINE貼紙，短影音字幕風格，角色動作像Reels截圖，台灣慣用語繁體中文，文字超大置中，排版像影片梗字幕，節奏感強"
      },
      {
        "label": "Kawaii Horror（可愛恐怖混搭）",
        "prompt": "參考角色設計12款LINE貼紙，可愛恐怖混搭風，萌系外表但氣氛詭異，台灣慣用語繁體中文，文字像恐怖童話台詞，劇情反差強"
      },
      {
        "label": "泡泡Q版動態感（Sticker Bounce Style）",
        "prompt": "參考角色Q版圓潤化，設計12張LINE貼紙，泡泡感強烈，動作像彈跳動畫，台灣慣用語繁體中文，文字排版跟著動作變形，超可愛活潑"
      },
      {
        "label": "超潮插畫塗層風（Poster Graphic Design）",
        "prompt": "參考角色設計12張LINE貼紙，潮流插畫海報風，強烈構圖與字體設計，台灣慣用語繁體中文，排版像潮牌宣傳圖，獨特視覺衝擊"
      },
      {
        "label": "Pixar Reaction Face Style（皮克斯誇張表情）",
        "prompt": "Reference character transformed into Pixar-style expressive sticker pack, 12 unique poses, exaggerated facial emotions, cinematic lighting, playful typography in English, meme-worthy reactions"
      },
      {
        "label": "Streetwear Graffiti Sticker Pack（潮牌塗鴉）",
        "prompt": "Design 12 LINE stickers with the reference character in streetwear graffiti style, bold spray typography, urban hype aesthetic, anime-meets-skate culture, energetic poses"
      },
      {
        "label": "Cyber Emoji Glow（科技emoji霓虹感）",
        "prompt": "Create 12 neon cyber emoji stickers from the reference character, glowing outlines, futuristic UI text, techno meme style, short English phrases like “LOL” “AFK” “BRUH”"
      },
      {
        "label": "Dreamy Soft Airbrush Style（柔霧噴槍風）",
        "prompt": "Reference character in dreamy soft airbrush illustration style, smooth gradients, glossy highlights, delicate emotions, 12 stickers like modern aesthetic emojis"
      },
      {
        "label": "Neo-Transparent Glassmorphism（玻璃感UI潮流）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，玻璃感Glassmorphism潮流風格，半透明UI質感與柔光邊緣，台灣慣用語繁體中文呈現，文字排版像未來手機介面浮動字幕，姿勢變化豐富，極具設計感"
      },
      {
        "label": "Neo-Chinese Pop Cute（新國潮可愛風）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，新國潮可愛風格，融合東方圖案與現代潮流配色，台灣慣用語繁體中文呈現，文字排版像潮流包裝設計，角色動作誇張，吸睛又獨特"
      },
      {
        "label": "Cute Chaos Scribble Pop（亂畫潮流崩壞可愛）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，可愛混亂塗鴉潮流風格，角色線條隨性但表情超有戲，台灣慣用語繁體中文呈現，文字像手寫爆炸塗鴉，姿勢誇張超吸睛"
      },
      {
        "label": "Holographic Prism Pop（全息棱鏡潮流）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，全息棱鏡Holographic潮流風格，角色表面帶彩虹折射光澤，台灣慣用語繁體中文呈現，文字排版像潮流包裝燙金標籤，姿勢誇張閃耀，吸睛度極強"
      },
      {
        "label": "Surreal Museum Art Sticker（美術館超現實）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，超現實美術館藝術風格，角色像出現在畫框中的奇幻人物，台灣慣用語繁體中文呈現，文字排版像展覽標籤，劇情感獨特高級"
      },
      {
        "label": "Cute Medieval Manuscript（中世紀手抄本萌）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，中世紀手抄本插畫風格，角色像古書邊角的可愛小怪物，台灣慣用語繁體中文呈現，文字排版像古卷註解，荒謬又吸睛"
      },
      {
        "label": "Futuristic Neon Snack Packaging（零食包裝潮）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，未來霓虹零食包裝風格，角色像新潮洋芋片吉祥物，台灣慣用語繁體中文呈現，文字排版像商品標語，潮到爆"
      },
      {
        "label": "Ultimate Viral Reaction Multiverse（爆紅反應宇宙）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，終極爆紅反應包宇宙風格，角色集合所有情緒誇張姿勢，台灣慣用語繁體中文呈現，文字排版像社群迷因合集，每張都是動畫名場面等級，變化最豐富吸睛"
      },
      {
        "label": "Luxury Perfume Label Style（香水標籤高級）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，高級香水標籤風格，角色搭配精品排版與留白，台灣慣用語繁體中文呈現，文字像香氛命名，極簡奢華感強烈"
      },
      {
        "label": "Glow Outline Neon Icon（霓虹線框icon）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，霓虹線框icon潮流風格，角色以發光輪廓呈現，台灣慣用語繁體中文呈現，文字排版像夜店招牌字幕，姿勢動感強烈，吸睛度爆表"
      },
      {
        "label": "黑暗哥德動畫風（Tim Burton感）",
        "prompt": "參考角色哥德式變形，設計12款LINE貼紙，暗黑童話動畫風，陰影強烈，怪誕可愛，台灣慣用語繁體中文，文字排版像電影字幕，劇情感強烈"
      },
      {
        "label": "Cute Minimal Pastel UI（粉彩介面簡約）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，粉彩UI極簡風格，角色像app介面中的可愛小助手，台灣慣用語繁體中文呈現，文字排版像按鈕標籤，乾淨又流行"
      },
      {
        "label": "Comic Sticker Speech Chaos（漫畫氣泡混亂）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，漫畫氣泡混亂風格，多重對話框與吐槽文字，台灣慣用語繁體中文呈現，排版像吵鬧動畫場景，誇張又爆笑"
      },
      {
        "label": "Cute Tarot Card Mystic（可愛塔羅神秘）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，可愛塔羅牌神秘風格，角色搭配占卜符號與夢幻框架，台灣慣用語繁體中文呈現，文字排版像命運旁白，每張都像魔法故事卡"
      },
      {
        "label": "Cute Airport Travel Sticker Pack（旅行行李貼）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，機場旅行行李貼紙風格，角色像旅遊紀念貼，台灣慣用語繁體中文呈現，文字排版像登機證標籤，每張如旅行動畫片段"
      },
      {
        "label": "Museum Poster Typography（美術館海報字排）",
        "prompt": "將參考圖片的角色變形並設計12種LINE貼紙，美術館海報字排風格，角色像展覽主視覺人物，台灣慣用語繁體中文呈現，文字排版像現代藝術展標題，構圖高級極簡，吸睛又獨特"
      }
    ]
  }
];

// Combine all styles into a flat list for backward compatibility if needed.
export const TWELVE_GRID_STYLES = TWELVE_GRID_CATEGORIES.flatMap(cat => cat.items);

import { TOP_100_STYLES_CATEGORIZED } from './src/constants/top100Styles';
export { TOP_100_STYLES_CATEGORIZED };
export const TOP_100_STYLES = TOP_100_STYLES_CATEGORIZED.flatMap((cat: any) => cat.items);


