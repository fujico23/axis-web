/**
 * 商標登録関連の定数
 * 商標登録申請に使用される区分やカテゴリの定義
 */

/**
 * 商品・サービスのカテゴリオプション
 */
export const CATEGORY_OPTIONS = [
  "商品・サービス",
  "商品",
  "サービス",
] as const;

export type AiCategoryOption = (typeof CATEGORY_OPTIONS)[number];

/**
 * カテゴリオプションの型ガード関数
 */
export function isAiCategoryOption(value: string): value is AiCategoryOption {
  return CATEGORY_OPTIONS.some((option) => option === value);
}

/**
 * ニース分類（Nice Classification）の45区分
 * 商標登録における商品・サービスの国際分類
 */
export const NICE_CLASS_OPTIONS = [
  { code: "1", description: "工業用、科学用又は農業用の化学品" },
  { code: "2", description: "塗料、着色料及び腐食の防止用の調整品" },
  { code: "3", description: "洗浄剤、化粧品、香料、歯磨き、石鹸など" },
  { code: "4", description: "工業用油、潤滑油、燃料、光剤など" },
  { code: "5", description: "薬剤、医薬用製剤、殺菌剤など" },
  { code: "6", description: "金属、金属製品等" },
  { code: "7", description: "機械、原動機、工作機械など" },
  { code: "8", description: "手工具、刃物、道具など" },
  { code: "9", description: "電気・電子機器、情報処理機器、測定器など" },
  { code: "10", description: "医療用機械器具・医療用品" },
  { code: "11", description: "照明、加熱、冷却、給水、換気、乾燥などの装置" },
  { code: "12", description: "移動用装置（車両、輸送用具など）" },
  { code: "13", description: "火器、花火、爆発物など" },
  { code: "14", description: "貴金属、宝飾品、時計など" },
  { code: "15", description: "楽器" },
  { code: "16", description: "紙、紙製品、事務用品など" },
  { code: "17", description: "プラスチック、ゴム、絶縁材料、断熱材料など" },
  { code: "18", description: "革製品、かばん、旅行用品、馬具など" },
  { code: "19", description: "金属製でない建築材料など" },
  { code: "20", description: "家具、寝具、装飾品、プラスチック製品など" },
  { code: "21", description: "台所用品、家庭用器具、ガラス・磁器製品など" },
  { code: "22", description: "ロープ、テント、帆布、織物用原料など" },
  { code: "23", description: "織物用の糸" },
  { code: "24", description: "織物、布製品、カバー、寝具など" },
  { code: "25", description: "衣類、履物、帽子など" },
  { code: "26", description: "裁縫用品、装飾品、ボタン・ファスナーなど" },
  { code: "27", description: "敷物、カーペット、マット、壁紙など" },
  { code: "28", description: "玩具、運動用具、ゲーム器具など" },
  { code: "29", description: "動物性食品、加工肉、魚介、乳製品など" },
  { code: "30", description: "加工植物性食品、菓子、調味料など" },
  { code: "31", description: "生鮮農産物、魚介、生き物、飼料など" },
  { code: "32", description: "非アルコール飲料、果汁、ジュース、水など" },
  { code: "33", description: "アルコール飲料（ビールを除く）など" },
  { code: "34", description: "たばこ、喫煙用具、マッチなど" },
  {
    code: "35",
    description: "広告、事業の管理・運営、事務処理、小売・卸売などのサービス",
  },
  { code: "36", description: "金融、保険、不動産などのサービス" },
  { code: "37", description: "建設、修理、メンテナンス、設置事業など" },
  {
    code: "38",
    description: "通信、インターネット、放送、電気通信サービスなど",
  },
  { code: "39", description: "輸送、物流、旅行手配、運送業務など" },
  { code: "40", description: "物品の加工、加工処理サービス全般" },
  { code: "41", description: "教育、娯楽、文化活動、スポーツ、研修など" },
  {
    code: "42",
    description: "科学技術、設計、IT開発、ソフトウェア、調査研究など",
  },
  { code: "43", description: "飲食店運営、宿泊業、ケータリングなど" },
  {
    code: "44",
    description: "医療、美容、衛生、動物医療、農業・園芸等のサービス",
  },
  {
    code: "45",
    description: "法律事務、警備、結婚相談、占い、個人サービスなど",
  },
] as const;

/**
 * 各ニース分類区分の詳細な指定商品・指定役務リスト
 * AI による商品・サービス選択で使用（モック用に一部のみ）
 */
export const AI_CLASS_DETAILS: Record<string, string[]> = {
  "9": [
    "コンピュータソフトウェア",
    "情報処理用プログラム",
    "データベース",
  ],
  "42": [
    "ソフトウェア開発",
    "情報処理サービス",
    "技術調査",
  ],
  "45": [
    "法律事務",
    "知的財産権に関する相談",
  ],
};

