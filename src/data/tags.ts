import type { Tag } from './types';

const now = '2026-03-18T10:00:00Z';

export const DEFAULT_TAGS: Tag[] = [
    // =============================================
    // 資格・専門
    // =============================================
    { id: 'tag_q001', name: '管理栄養士', category: '資格・専門', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q002', name: '栄養士', category: '資格・専門', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q003', name: '料理研究家', category: '資格・専門', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q004', name: '料理家', category: '資格・専門', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q005', name: 'フードコーディネーター', category: '資格・専門', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q006', name: 'パン講師', category: '資格・専門', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q007', name: '製菓講師', category: '資格・専門', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q008', name: '野菜ソムリエ', category: '資格・専門', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q009', name: '薬膳関連資格', category: '資格・専門', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q010', name: '発酵関連資格', category: '資格・専門', sortOrder: 10, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q011', name: '食育関連資格', category: '資格・専門', sortOrder: 11, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q012', name: '離乳食関連資格', category: '資格・専門', sortOrder: 12, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q013', name: 'スポーツ栄養関連', category: '資格・専門', sortOrder: 13, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q014', name: 'スイーツコンシェルジュ', category: '資格・専門', sortOrder: 14, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q015', name: '製菓衛生師', category: '資格・専門', sortOrder: 15, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q016', name: 'マクロビオティック関連資格', category: '資格・専門', sortOrder: 16, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q017', name: 'キャンプインストラクター', category: '資格・専門', sortOrder: 17, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_q018', name: '調理師', category: '資格・専門', sortOrder: 18, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 実績
    // =============================================
    { id: 'tag_a001', name: '料理教室運営', category: '実績', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a002', name: '料理教室講師', category: '実績', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a003', name: 'パン教室運営', category: '実績', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a004', name: 'お菓子教室運営', category: '実績', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a005', name: '書籍出版', category: '実績', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a006', name: 'テレビ出演', category: '実績', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a007', name: '雑誌掲載', category: '実績', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a008', name: 'Webメディア掲載', category: '実績', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a009', name: 'レシピ連載', category: '実績', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a010', name: '監修実績あり', category: '実績', sortOrder: 10, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a011', name: '商品開発実績あり', category: '実績', sortOrder: 11, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a012', name: '企業タイアップ実績あり', category: '実績', sortOrder: 12, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a013', name: 'イベント登壇実績あり', category: '実績', sortOrder: 13, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a014', name: 'SNSキャンペーン実績あり', category: '実績', sortOrder: 14, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a015', name: 'Instagram案件実績あり', category: '実績', sortOrder: 15, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a016', name: '動画案件実績あり', category: '実績', sortOrder: 16, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_a017', name: '受賞歴あり', category: '実績', sortOrder: 17, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 対応可能業務
    // =============================================
    { id: 'tag_w001', name: 'レシピ開発', category: '対応可能業務', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w002', name: '記事執筆', category: '対応可能業務', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w003', name: '監修', category: '対応可能業務', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w004', name: 'SNS投稿', category: '対応可能業務', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w005', name: '写真撮影', category: '対応可能業務', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w006', name: '動画出演', category: '対応可能業務', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w007', name: '動画企画', category: '対応可能業務', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w008', name: '動画撮影', category: '対応可能業務', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w009', name: '動画制作', category: '対応可能業務', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w010', name: '動画台本作成', category: '対応可能業務', sortOrder: 10, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w011', name: 'ライブ配信', category: '対応可能業務', sortOrder: 11, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w012', name: 'イベント登壇', category: '対応可能業務', sortOrder: 12, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w013', name: 'インタビュー対応', category: '対応可能業務', sortOrder: 13, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w014', name: 'オンライン出演', category: '対応可能業務', sortOrder: 14, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w015', name: '対面出演', category: '対応可能業務', sortOrder: 15, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w016', name: '出張', category: '対応可能業務', sortOrder: 16, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w017', name: '継続案件', category: '対応可能業務', sortOrder: 17, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w018', name: '短納期対応', category: '対応可能業務', sortOrder: 18, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_w019', name: 'フードスタイリング', category: '対応可能業務', sortOrder: 19, active: true, searchVisible: true, createdAt: now, updatedAt: now },

    // =============================================
    // 得意な料理ジャンル
    // =============================================
    { id: 'tag_d001', name: '時短', category: '得意な料理ジャンル', sortOrder: 1, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d002', name: '節約', category: '得意な料理ジャンル', sortOrder: 2, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d003', name: '作り置き', category: '得意な料理ジャンル', sortOrder: 3, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d004', name: '冷凍作り置き', category: '得意な料理ジャンル', sortOrder: 4, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d005', name: 'お弁当', category: '得意な料理ジャンル', sortOrder: 5, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d006', name: '朝ごはん', category: '得意な料理ジャンル', sortOrder: 6, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d007', name: '家族ごはん', category: '得意な料理ジャンル', sortOrder: 7, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d008', name: 'パン', category: '得意な料理ジャンル', sortOrder: 8, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d009', name: 'お菓子', category: '得意な料理ジャンル', sortOrder: 9, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d010', name: '日々の献立', category: 'よく発信しているテーマ', sortOrder: 10, active: false, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d011', name: 'お菓子作り', category: 'よく発信しているテーマ', sortOrder: 11, active: false, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d012', name: 'お酒に合う', category: 'よく発信しているテーマ', sortOrder: 12, active: false, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d013', name: '発酵', category: '得意な料理ジャンル', sortOrder: 13, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d014', name: '米粉', category: '得意な料理ジャンル', sortOrder: 14, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d015', name: '和食', category: '得意な料理ジャンル', sortOrder: 15, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d016', name: '洋食', category: '得意な料理ジャンル', sortOrder: 16, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d017', name: '中華', category: '得意な料理ジャンル', sortOrder: 17, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d018', name: '韓国風', category: '得意な料理ジャンル', sortOrder: 18, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d019', name: 'エスニック', category: '得意な料理ジャンル', sortOrder: 19, active: true, searchVisible: true, createdAt: now, updatedAt: now },
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
    { id: 'tag_d030', name: '電子レンジ', category: '得意な料理ジャンル', sortOrder: 30, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d031', name: 'オーブン対応', category: '得意な料理ジャンル', sortOrder: 31, active: true, searchVisible: true, createdAt: now, updatedAt: now },
    { id: 'tag_d032', name: '無水調理', category: '得意な料理ジャンル', sortOrder: 32, active: true, searchVisible: true, createdAt: now, updatedAt: now },
];

