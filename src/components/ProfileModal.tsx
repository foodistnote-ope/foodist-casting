import type { Foodist, Tag, MediaType } from '../data/types';
import './ProfileModal.css';

interface ProfileModalProps {
    foodist: Foodist | null;
    allTags: Tag[];
    onClose: () => void;
    onTagClick?: (tagId: string) => void;
    onEditClick?: () => void;
}

const MEDIA_ICONS: Record<MediaType, string> = {
    'ブログ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23555'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E",
    'Instagram': 'https://foodistnote.recipe-blog.jp/wp-content/themes/foodist_note/assets/img/common/icon_sns_instagram.png',
    'X': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg',
    'TikTok': '/tiktok-icon.png',
    'YouTube': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    '公式ホームページ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23334155'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='55' fill='white' text-anchor='middle'%3E🌐%3C/text%3E%3C/svg%3E",
    'その他': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23475569'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='55' fill='white' text-anchor='middle'%3E🔗%3C/text%3E%3C/svg%3E",
};

const MEDIA_ICON_FILTER: Partial<Record<MediaType, string>> = {
    'X': 'invert(1)',
};

const val = (v: string | number | undefined | null, fallback = '未設定'): string => {
    if (v === undefined || v === null || v === '') return fallback;
    return String(v);
};

// 固定表示するカテゴリタグの見出しリスト（表示順）
const TAG_CATEGORY_LABELS: { key: string; label: string }[] = [
    { key: '得意な料理ジャンル', label: '得意な料理ジャンル' },
    { key: 'よく発信しているテーマ', label: 'よく発信しているテーマ' },
    { key: '資格・専門', label: '保有資格・専門' },
    { key: '実績', label: '実績' },
    { key: '対応可能業務', label: '対応可能業務' },
    { key: 'ターゲット適性', label: 'ターゲット適性' },
    { key: 'NG・留意事項', label: 'NG・留意事項' },
];

export const ProfileModal = ({ foodist, allTags, onClose, onTagClick, onEditClick }: ProfileModalProps) => {
    if (!foodist) return null;

    const tagMap = new Map(allTags.map(t => [t.id, t]));

    // カテゴリ別タググループ
    const tagsByCategory: Record<string, Tag[]> = {};
    foodist.tagIds.forEach(id => {
        const tag = tagMap.get(id);
        if (!tag) return;
        const cat = tag.category;
        if (!tagsByCategory[cat]) tagsByCategory[cat] = [];
        tagsByCategory[cat].push(tag);
    });

    // 詳細表示対象の媒体アカウント
    const visibleMedia = foodist.mediaAccounts
        .filter(a => a.showOnDetail)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // フォロワー数表示行
    const metricRows = foodist.mediaAccounts
        .filter(a => a.metricValue != null && a.metricType !== 'なし')
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // メモ種別ごとにまとめる
    const NOTE_ORDER = ['提案時メモ', 'その他'];
    const notesByType: Record<string, { id: string; content: string }[]> = {};
    foodist.notes.forEach(n => {
        if (!notesByType[n.noteType]) notesByType[n.noteType] = [];
        notesByType[n.noteType].push({ id: n.id, content: n.content });
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="閉じる">×</button>

                {/* ヘッダー */}
                <div className="modal-header">
                    <img src={foodist.avatarUrl || '/no-image.png'} alt={foodist.displayName} className="modal-avatar" />
                    <div className="modal-header-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 className="modal-name">{foodist.displayName}</h2>
                                <span className="modal-title">{val(foodist.title)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {onEditClick && (
                                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', flexShrink: 0 }} onClick={onEditClick}>
                                        情報を編集する
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 総フォロワー数 */}
                        <div className="modal-stats" style={{ marginTop: 12 }}>
                            <span className="stat-label">総フォロワー:</span>
                            <span className="stat-value">{foodist.totalFollowers ? foodist.totalFollowers.toLocaleString() : '未設定'}</span>
                        </div>

                        {/* 媒体リンク */}
                        {visibleMedia.length > 0 && (
                            <div className="modal-sns-links">
                                {visibleMedia.map(acc => (
                                    <a key={acc.id} href={acc.url || '#'} target="_blank" rel="noreferrer" className="modal-sns-link">
                                        <img
                                            src={MEDIA_ICONS[acc.mediaType] || MEDIA_ICONS['その他']}
                                            alt={acc.mediaType}
                                            className="sns-icon-img"
                                            style={MEDIA_ICON_FILTER[acc.mediaType] ? { filter: MEDIA_ICON_FILTER[acc.mediaType] } : undefined}
                                        />
                                        {acc.accountName || acc.url?.replace(/https?:\/\//, '').replace(/\/$/, '') || acc.mediaType}
                                        {acc.mediaType === 'Instagram' && acc.reelsFrequency && (
                                            <span style={{ fontSize: '0.75em', opacity: 0.7, marginLeft: '4px', fontWeight: 'normal' }}>
                                                （リール: {acc.reelsFrequency}）
                                            </span>
                                        )}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-body">

                    {/* ===== 基本マスタ 全項目固定表示 ===== */}
                    <div className="modal-section">
                        <h3 className="section-title">基本情報</h3>
                        <div className="demo-grid">
                            <div className="demo-item"><span className="demo-label">活動名</span><span className="demo-value">{val(foodist.displayName)}</span></div>
                            <div className="demo-item"><span className="demo-label">本名</span><span className="demo-value">{val(foodist.realName)}</span></div>
                            <div className="demo-item"><span className="demo-label">肩書き</span><span className="demo-value">{val(foodist.title)}</span></div>
                            <div className="demo-item"><span className="demo-label">会員登録状況</span><span className="demo-value">{val(foodist.membershipStatus)}</span></div>
                            <div className="demo-item"><span className="demo-label">婚姻状況</span><span className="demo-value">{val(foodist.maritalStatus)}</span></div>
                            <div className="demo-item"><span className="demo-label">居住地</span><span className="demo-value">{val(foodist.area)}</span></div>
                            <div className="demo-item"><span className="demo-label">出身地</span><span className="demo-value">{val(foodist.birthplace)}</span></div>
                            <div className="demo-item"><span className="demo-label">生年月日</span><span className="demo-value">{val(foodist.birthDate)}</span></div>
                            <div className="demo-item"><span className="demo-label">年齢</span><span className="demo-value">{foodist.age != null ? `${foodist.age}歳` : '未設定'}</span></div>
                            <div className="demo-item"><span className="demo-label">年代</span><span className="demo-value">{val(foodist.ageGroup)}</span></div>
                            <div className="demo-item"><span className="demo-label">性別</span><span className="demo-value">{val(foodist.gender)}</span></div>
                            <div className="demo-item"><span className="demo-label">顔出し可否</span><span className="demo-value">{val(foodist.faceVisibility)}</span></div>
                            <div className="demo-item"><span className="demo-label">子どもの有無</span><span className="demo-value">{val(foodist.hasChildren)}</span></div>
                            <div className="demo-item"><span className="demo-label">子どもの数</span><span className="demo-value">{foodist.childrenCount ? `${foodist.childrenCount}人` : '未設定'}</span></div>
                            <div className="demo-item"><span className="demo-label">料理教室の運営</span><span className="demo-value">{val(foodist.cookingClassStatus)}</span></div>
                            <div className="demo-item demo-item-full">
                                <span className="demo-label">子育てステージ</span>
                                <span className="demo-value">
                                    {foodist.childStage.length > 0 ? foodist.childStage.join('・') : '未設定'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* プロフィール文 */}
                    <div className="modal-section">
                        <h3 className="section-title">詳細プロフィール</h3>
                        <p className="profile-text">{foodist.profileText || '未設定'}</p>
                    </div>

                    {/* アカウント情報（数値） */}
                    {metricRows.length > 0 && (
                        <div className="modal-section">
                            <h3 className="section-title">アカウント情報</h3>
                            <div className="demo-grid">
                                {metricRows.map(acc => (
                                    <div key={acc.id} className="demo-item">
                                        <span className="demo-label">{acc.mediaType} {acc.metricType === 'PV' ? '月間PV' : acc.metricType}</span>
                                        <span className="demo-value">{acc.metricValue!.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* タグ一覧（カテゴリ別） */}
                    {foodist.tagIds.length > 0 && (
                        <div className="modal-section">
                            <h3 className="section-title">属性タグ</h3>
                            {TAG_CATEGORY_LABELS.filter(c => c.label && tagsByCategory[c.key]?.length > 0).map(({ key, label }) => (
                                <div key={key} style={{ marginBottom: 12 }}>
                                    <p className="demo-label" style={{ marginBottom: 6 }}>{label}</p>
                                    <div className="modal-tags">
                                        {tagsByCategory[key]?.map(tag => (
                                            <span
                                                key={tag.id}
                                                className={`tag ${!tag.active ? 'tag-inactive' : ''}`}
                                                onClick={() => onTagClick && tag.active && onTagClick(tag.id)}
                                                style={{ cursor: onTagClick && tag.active ? 'pointer' : 'default' }}
                                                title={!tag.active ? '（無効化済みタグ）' : undefined}
                                            >
                                                {tag.name}
                                                {!tag.active && <span style={{ fontSize: '0.7em', opacity: 0.6, marginLeft: 4 }}>※無効</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 評価・メモ */}
                    {foodist.notes.length > 0 && (
                        <div className="modal-section">
                            <h3 className="section-title">評価・メモ</h3>
                            {NOTE_ORDER.filter(type => notesByType[type]?.length > 0).map(type => (
                                <div key={type} className="note-group">
                                    <p className="note-type-label">{type}</p>
                                    {notesByType[type].map(n => (
                                        <p key={n.id} className="note-content">{n.content}</p>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* フーディストノート掲載可否 */}
                    <div className="modal-section" style={{ backgroundColor: '#fff9f5', borderRadius: '8px', padding: '16px', marginTop: '24px' }}>
                        <h3 className="section-title" style={{ color: '#d4844a' }}>フーディストノート掲載可否</h3>
                        <div className="demo-grid">
                            <div className="demo-item demo-item-full">
                                <span className="demo-label">掲載可否状況</span>
                                {(() => {
                                    const perm = foodist.noteFeaturedPermission;
                                    const hasMemo = !!foodist.noteFeaturedMemo;
                                    const isOk = perm === '掲載可（事前確認は不要、掲載後に案内があればOK）';
                                    const isOkWithConfirm = perm === '掲載可（事前確認が必要）';
                                    const isNg = perm === '掲載不可';
                                    const permColor = isNg ? '#c0392b'
                                        : isOkWithConfirm ? '#b7791f'
                                        : isOk && !hasMemo ? '#27ae60'
                                        : isOk && hasMemo ? '#b7791f'
                                        : 'inherit';
                                    return (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className="demo-value" style={{ fontWeight: 'bold', color: permColor }}>
                                                {val(perm)}
                                            </span>
                                            {hasMemo && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    background: '#fef3c7',
                                                    color: '#92400e',
                                                    border: '1px solid #fbbf24',
                                                    borderRadius: '4px',
                                                    padding: '2px 8px',
                                                    fontWeight: 'bold',
                                                }}>
                                                    特記事項あり
                                                </span>
                                            )}
                                        </span>
                                    );
                                })()}
                            </div>
                            {foodist.noteFeaturedMemo && (
                                <div className="demo-item demo-item-full" style={{ marginTop: 8 }}>
                                    <span className="demo-label">特記事項・理由</span>
                                    <span className="demo-value" style={{ whiteSpace: 'pre-wrap', display: 'block', padding: '8px', background: '#fffbeb', borderRadius: '4px', border: '1px solid #fbbf24' }}>
                                        {foodist.noteFeaturedMemo}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {onEditClick && (
                        <button className="btn-secondary" onClick={onEditClick}>
                            情報を編集する
                        </button>
                    )}
                    <button className="btn-secondary" onClick={onClose}>閉じる</button>
                </div>
            </div>
        </div>
    );
};
