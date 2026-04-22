// ============================================================
// フーディスト管理アプリ 型定義
// ============================================================

// --- タグカテゴリ（固定8種） ---
export type TagCategory =
    | '得意な料理ジャンル'
    | '資格・専門'
    | '実績'
    | '対応可能業務'
    | 'よく発信しているテーマ'
    | 'ターゲット適性'
    | 'NG・留意事項';

export const TAG_CATEGORIES: TagCategory[] = [
    '得意な料理ジャンル',
    '資格・専門',
    '実績',
    '対応可能業務',
    'よく発信しているテーマ',
    'ターゲット適性',
    'NG・留意事項',
];

// --- タグマスタ ---
export interface Tag {
    id: string;
    name: string;
    category: TagCategory;
    description?: string;
    sortOrder: number;
    /** false = 無効化。検索サイドバーには表示しない。詳細・編集画面では参照可能 */
    active: boolean;
    /** サイドバーの絞り込みに表示するか（active=trueの場合のみ有効） */
    searchVisible: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- SNS・媒体種別 ---
export type MediaType =
    | 'ブログ'
    | 'Instagram'
    | 'X'
    | 'TikTok'
    | 'YouTube'
    | '公式ホームページ'
    | 'その他';

export const MEDIA_TYPES: MediaType[] = [
    'ブログ',
    'Instagram',
    'X',
    'TikTok',
    'YouTube',
    '公式ホームページ',
    'その他',
];

/** totalFollowers の合算対象となる媒体種別 */
export const FOLLOWER_CONTRIBUTING_MEDIA: MediaType[] = [
    'Instagram',
    'X',
    'TikTok',
    'YouTube',
];

export type MetricType = 'PV' | 'フォロワー数' | 'チャンネル登録者数' | 'なし';

export const METRIC_TYPES: MetricType[] = [
    'フォロワー数',
    'チャンネル登録者数',
    'PV',
    'なし',
];

// --- SNS・媒体情報テーブル ---
export interface MediaAccount {
    id: string;
    mediaType: MediaType;
    accountName?: string;
    url?: string;
    metricType: MetricType;
    metricValue?: number;
    /** リール動画の投稿頻度 (Instagram用) */
    reelsFrequency?: string;
    /** 詳細画面上部のアイコンリンク表示対象かどうか */
    showOnDetail: boolean;
    sortOrder: number;
    updatedAt: string;
}

// --- 評価・メモテーブル ---
export type NoteType = '提案時メモ' | 'その他';

export const NOTE_TYPES: NoteType[] = [
    '提案時メモ',
    'その他',
];

export interface FoodieNote {
    id: string;
    noteType: NoteType;
    content: string;
    updatedAt: string;
}

// --- 年代（固定選択肢） ---
export type AgeGroup = '10代以下' | '20代' | '30代' | '40代' | '50代以上';

export const AGE_GROUPS: AgeGroup[] = [
    '10代以下',
    '20代',
    '30代',
    '40代',
    '50代以上',
];

// --- 子育てステージ ---
export const CHILD_STAGES = [
    '乳幼児あり',
    '未就学児あり',
    '小学生の子あり',
    '中高生の子あり',
    '成人した子あり',
    '非公開',
    '未確認',
] as const;
export type ChildStage = typeof CHILD_STAGES[number];

// --- フーディスト基本マスタ ---
export interface Foodist {
    id: string;
    displayName: string;         // 活動名（必須）
    realName?: string;           // 本名
    title?: string;              // 肩書き（表示用。検索はタグ側で）
    membershipStatus: 'あり' | 'なし' | '要確認';  // フーディスト会員登録状況
    maritalStatus?: '未婚' | '既婚' | '非公開' | '未確認'; // 婚姻状況
    area?: string;               // 居住地（都道府県）
    birthplace?: string;         // 出身地（都道府県）
    birthDate?: string;          // 生年月日（YYYY-MM-DD）
    age?: number;                // 年齢
    ageGroup?: AgeGroup;         // 年代（固定選択肢）
    gender?: string;
    faceVisibility: '可' | '条件付き可' | '不可' | '未設定';
    hasChildren: 'あり' | 'なし' | '非公開' | '未確認';
    childrenCount?: string;      // '0'/'1'/'2'/'3'/'4人以上'/'非公開'/'未確認'
    childStage: string[];        // 子育てステージ（複数選択可）
    listIntro?: string;          // 一覧用紹介文（カード表示用の短文）
    profileText?: string;        // 詳細プロフィール（詳細画面用の長文）
    avatarUrl?: string;
    /**
     * 総フォロワー数（Instagram + X + TikTok + YouTube の合算）
     * mediaAccounts 保存時に自動再計算。読込時は保存値をそのまま使用。
     */
    totalFollowers?: number;
    /** タグIDの配列（名称ではなくID参照。将来の中間テーブル移行も容易） */
    tagIds: string[];
    mediaAccounts: MediaAccount[];
    notes: FoodieNote[];
    createdAt: string;
    updatedAt: string;
}

// --- ユーティリティ: totalFollowers を mediaAccounts から計算 ---
export const calcTotalFollowers = (accounts: MediaAccount[]): number | undefined => {
    const contributingAccounts = accounts.filter(a => FOLLOWER_CONTRIBUTING_MEDIA.includes(a.mediaType) && a.metricValue != null);
    if (contributingAccounts.length === 0) return undefined;
    return contributingAccounts.reduce((sum, a) => sum + (a.metricValue || 0), 0);
};
