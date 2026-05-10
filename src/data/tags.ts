import type { Tag } from './types';

const now = '2026-03-18T10:00:00Z';

export const DEFAULT_TAGS: Tag[] = [
    // =============================================
    // 資格・専門
    // =============================================
    { id: 'tag_q001', name: '管理栄養士', category: '資格・専門', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q002', name: '栄養士', category: '資格・専門', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q018', name: '調理師', category: '資格・専門', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q015', name: '製菓衛生師', category: '資格・専門', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q020', name: '食品衛生責任者', category: '資格・専門', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q005', name: 'フードコーディネーター', category: '資格・専門', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q008', name: '野菜ソムリエ', category: '資格・専門', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q022', name: 'フードスタイリスト', category: '資格・専門', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q019', name: '食生活アドバイザー', category: '資格・専門', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q009', name: '薬膳関連資格', category: '資格・専門', sortOrder: 10, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q010', name: '発酵関連資格', category: '資格・専門', sortOrder: 11, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q011', name: '食育関連資格', category: '資格・専門', sortOrder: 12, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q012', name: '離乳食関連資格', category: '資格・専門', sortOrder: 13, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 実績
    // =============================================
    { id: 'tag_a005', name: '書籍出版', category: '実績', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a006', name: 'テレビ出演', category: '実績', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a007', name: '雑誌掲載', category: '実績', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a008', name: 'Webメディア掲載', category: '実績', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a013', name: 'イベント登壇', category: '実績', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a017', name: '受賞歴', category: '実績', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 対応可能業務
    // =============================================
    { id: 'tag_w001', name: 'レシピ開発', category: '対応可能業務', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w003', name: '監修', category: '対応可能業務', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w002', name: '記事執筆', category: '対応可能業務', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w005', name: '写真撮影', category: '対応可能業務', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w019', name: 'フードスタイリング', category: '対応可能業務', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a011', name: '商品開発', category: '対応可能業務', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a012', name: '企業タイアップ', category: '対応可能業務', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w004', name: 'SNS投稿', category: '対応可能業務', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w009', name: '動画制作', category: '対応可能業務', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w011', name: 'ライブ配信', category: '対応可能業務', sortOrder: 10, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w020', name: '出張講師・レッスン', category: '対応可能業務', sortOrder: 11, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w012', name: 'イベント登壇', category: '対応可能業務', sortOrder: 12, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 得意な料理ジャンル
    // =============================================
    { id: 'tag_d036', name: '簡単', category: '得意な料理ジャンル', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d001', name: '時短', category: '得意な料理ジャンル', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d002', name: '節約', category: '得意な料理ジャンル', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d003', name: '作り置き', category: '得意な料理ジャンル', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d004', name: '冷凍作り置き', category: '得意な料理ジャンル', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d005', name: 'お弁当', category: '得意な料理ジャンル', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d006', name: '朝ごはん', category: '得意な料理ジャンル', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d007', name: '家族ごはん', category: '得意な料理ジャンル', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d015', name: '和食', category: '得意な料理ジャンル', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d016', name: '洋食', category: '得意な料理ジャンル', sortOrder: 10, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d017', name: '中華', category: '得意な料理ジャンル', sortOrder: 11, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d018', name: '韓国料理', category: '得意な料理ジャンル', sortOrder: 12, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d019', name: 'エスニック', category: '得意な料理ジャンル', sortOrder: 13, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d034', name: 'イタリアン', category: '得意な料理ジャンル', sortOrder: 14, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d035', name: 'フレンチ', category: '得意な料理ジャンル', sortOrder: 15, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d008', name: 'パン', category: '得意な料理ジャンル', sortOrder: 16, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d009', name: 'お菓子', category: '得意な料理ジャンル', sortOrder: 17, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d013', name: '発酵', category: '得意な料理ジャンル', sortOrder: 18, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d014', name: '米粉', category: '得意な料理ジャンル', sortOrder: 19, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d020', name: 'ダイエット', category: '得意な料理ジャンル', sortOrder: 20, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d021', name: '腸活', category: '得意な料理ジャンル', sortOrder: 21, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d022', name: '健康ごはん', category: '得意な料理ジャンル', sortOrder: 22, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d023', name: '離乳食', category: '得意な料理ジャンル', sortOrder: 23, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d024', name: '幼児食', category: '得意な料理ジャンル', sortOrder: 24, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d025', name: '食育', category: '得意な料理ジャンル', sortOrder: 25, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d026', name: 'アレルギー対応', category: '得意な料理ジャンル', sortOrder: 26, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d027', name: 'おもてなし', category: '得意な料理ジャンル', sortOrder: 27, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d028', name: '季節レシピ', category: '得意な料理ジャンル', sortOrder: 28, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d029', name: 'おつまみ', category: '得意な料理ジャンル', sortOrder: 29, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d033', name: 'アウトドア', category: '得意な料理ジャンル', sortOrder: 30, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 飲酒について
    // =============================================
    { id: 'tag_al01', name: 'お酒を飲む', category: '飲酒について', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_al02', name: 'お酒を飲まない', category: '飲酒について', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_al03', name: 'お酒は飲まないがPR可', category: '飲酒について', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
];
