import { useState, useEffect, useRef, useCallback } from 'react';
import type { Foodist, Tag, MediaAccount, FoodieNote, TagCategory, MediaType, MetricType } from '../data/types';
import { TAG_CATEGORIES, MEDIA_TYPES, METRIC_TYPES, NOTE_TYPES, AGE_GROUPS, CHILD_STAGES, FOLLOWER_CONTRIBUTING_MEDIA, calcTotalFollowers } from '../data/types';
import './FoodistEditModal.css';

interface FoodistEditModalProps {
    foodist?: Foodist | null;
    allTags: Tag[];
    onSave: (foodist: Foodist | Omit<Foodist, 'id'>) => void;
    onClose: () => void;
}

const AREA_LIST = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
    '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
    '海外', 'その他',
];

const emptyFoodist: Omit<Foodist, 'id'> = {
    displayName: '',
    realName: '',
    title: '',
    membershipStatus: '要確認',
    maritalStatus: undefined,
    area: '',
    birthplace: '',
    birthDate: '',
    age: undefined,
    ageGroup: undefined,
    gender: '',
    faceVisibility: '未設定',
    hasChildren: '未確認',
    childrenCount: undefined,
    childStage: [],
    listIntro: '',
    profileText: '',
    avatarUrl: '',
    totalFollowers: undefined,
    tagIds: [],
    mediaAccounts: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/** フォームが初期値から変更されているかを判定する簡易ハッシュ（全フィールド対象） */
const formHash = (f: Omit<Foodist, 'id'>) => {
    const { createdAt, updatedAt, ...rest } = f;
    return JSON.stringify(rest);
};

export const FoodistEditModal = ({ foodist, allTags, onSave, onClose }: FoodistEditModalProps) => {
    const [form, setForm] = useState<Omit<Foodist, 'id'>>(emptyFoodist);
    const [expandedTagCategories, setExpandedTagCategories] = useState<Set<TagCategory>>(new Set(TAG_CATEGORIES));
    const initialHashRef = useRef<string>('');

    // フォームを初期化する際に「変更前ハッシュ」を記録
    useEffect(() => {
        if (foodist) {
            const { id: _id, ...rest } = foodist;
            setForm({ ...rest });
            initialHashRef.current = formHash(rest);
        } else {
            const init = { ...emptyFoodist, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            setForm(init);
            initialHashRef.current = formHash(init);
        }
    }, [foodist]);

    // ESC キーで確認ダイアログ経由で閉じる
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    /** 未保存の変更があるか判定して、あれば確認ダイアログを出して閉じる */
    const handleClose = useCallback(() => {
        const isDirty = formHash(form) !== initialHashRef.current || form.displayName.trim() !== (foodist?.displayName || '');
        if (isDirty) {
            const confirmed = window.confirm('入力中の内容が保存されていません。\n破棄して閉じますか？');
            if (!confirmed) return;
        }
        onClose();
    }, [form, foodist, onClose]);

    const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // --- タグID ---
    const toggleTagId = (id: string) => {
        setForm(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(id) ? prev.tagIds.filter(t => t !== id) : [...prev.tagIds, id],
        }));
    };

    const toggleTagCategory = (cat: TagCategory) => {
        setExpandedTagCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    };

    // --- 子育てステージ ---
    const toggleChildStage = (stage: string) => {
        setForm(prev => ({
            ...prev,
            childStage: prev.childStage.includes(stage)
                ? prev.childStage.filter(s => s !== stage)
                : [...prev.childStage, stage],
        }));
    };

    // --- 媒体アカウント ---
    const addMedia = () => {
        const newAcc: MediaAccount = {
            id: generateId('media'),
            mediaType: 'Instagram',
            metricType: 'フォロワー数',
            showOnDetail: true,
            sortOrder: form.mediaAccounts.length + 1,
            updatedAt: new Date().toISOString(),
        };
        setForm(prev => ({ ...prev, mediaAccounts: [...prev.mediaAccounts, newAcc] }));
    };

    const updateMedia = (id: string, patch: Partial<MediaAccount>) => {
        setForm(prev => ({
            ...prev,
            mediaAccounts: prev.mediaAccounts.map(a => {
                if (a.id !== id) return a;
                const next = { ...a, ...patch };

                // 媒体種別の変更に合わせて数値種別のデフォルトを切り替える
                if (patch.mediaType) {
                    if (patch.mediaType === 'YouTube') {
                        next.metricType = 'チャンネル登録者数';
                    } else if (patch.mediaType === 'ブログ' || patch.mediaType === '公式ホームページ') {
                        next.metricType = 'PV';
                    } else if (['Instagram', 'X', 'TikTok'].includes(patch.mediaType)) {
                        next.metricType = 'フォロワー数';
                    }
                }

                return next;
            }),
        }));
    };

    const removeMedia = (id: string) => {
        setForm(prev => ({ ...prev, mediaAccounts: prev.mediaAccounts.filter(a => a.id !== id) }));
    };

    // --- メモ ---
    const addNote = () => {
        const n: FoodieNote = {
            id: generateId('note'),
            noteType: 'その他',
            content: '',
            updatedAt: new Date().toISOString(),
        };
        setForm(prev => ({ ...prev, notes: [...prev.notes, n] }));
    };

    const updateNote = (id: string, patch: Partial<FoodieNote>) => {
        setForm(prev => ({
            ...prev,
            notes: prev.notes.map(n => n.id === id ? { ...n, ...patch } : n),
        }));
    };

    const removeNote = (id: string) => {
        setForm(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
    };

    const previewTotal = calcTotalFollowers(form.mediaAccounts);

    const handleSave = () => {
        if (!form.displayName.trim()) {
            alert('活動名は必須です。');
            return;
        }
        const now = new Date().toISOString();
        const data = { ...form, totalFollowers: previewTotal, updatedAt: now };
        // 保存後はハッシュをリセットして「未保存」状態を解除
        initialHashRef.current = formHash(data);
        if (foodist) {
            onSave({ ...data, id: foodist.id } as Foodist);
        } else {
            onSave(data);
        }
    };

    // タグをカテゴリ別に整理（全タグ = active問わず）
    const tagsByCategory: Record<TagCategory, Tag[]> = {} as Record<TagCategory, Tag[]>;
    TAG_CATEGORIES.forEach(cat => { tagsByCategory[cat] = []; });
    allTags.forEach(tag => { tagsByCategory[tag.category]?.push(tag); });

    return (
        <div
            className="modal-overlay edit-modal-overlay"
            /* オーバーレイクリックでは閉じない */
            onClick={(e) => e.stopPropagation()}
        >
            <div className="modal-content edit-modal-content" onClick={e => e.stopPropagation()}>
                {/* 閉じるボタンは確認ダイアログ経由 */}
                <button className="modal-close" onClick={handleClose} aria-label="閉じる">×</button>

                <div className="modal-header">
                    <h2 className="modal-name">{foodist ? 'フーディスト情報の編集' : '新規フーディスト登録'}</h2>
                    <p className="modal-unsaved-hint">※ 「保存する」を押すまで内容は保存されません</p>
                </div>

                <div className="modal-body edit-body">
                    <form className="edit-form" onSubmit={e => e.preventDefault()}>

                        {/* ===== 基本情報 ===== */}
                        <h3 className="form-section-title">基本情報</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">活動名</label>
                                <input className="form-input" name="displayName" value={form.displayName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">本名</label>
                                <input className="form-input" name="realName" value={form.realName || ''} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">肩書き</label>
                                <input className="form-input" name="title" value={form.title || ''} onChange={handleChange} placeholder="例: 料理研究家・栄養士" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">フーディスト会員登録状況</label>
                                <select className="form-select" name="membershipStatus" value={form.membershipStatus} onChange={handleChange}>
                                    <option value="あり">あり</option>
                                    <option value="なし">なし</option>
                                    <option value="要確認">要確認</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">プロフィール画像URL</label>
                            <input className="form-input" name="avatarUrl" value={form.avatarUrl || ''} onChange={handleChange} placeholder="https://..." />
                        </div>

                        {/* ===== 属性・デモグラフィ ===== */}
                        <h3 className="form-section-title">属性情報</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">居住地（都道府県）</label>
                                <select className="form-select" name="area" value={form.area || ''} onChange={handleChange}>
                                    <option value="">-- 未設定 --</option>
                                    {AREA_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">出身地（都道府県）</label>
                                <select className="form-select" name="birthplace" value={form.birthplace || ''} onChange={handleChange}>
                                    <option value="">-- 未設定 --</option>
                                    {AREA_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">生年月日</label>
                                <input type="date" className="form-input" name="birthDate" value={form.birthDate || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">年齢</label>
                                <input type="number" className="form-input" name="age" value={form.age ?? ''} min={0} max={120}
                                    onChange={e => set('age', e.target.value ? parseInt(e.target.value) : undefined)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">年代</label>
                                <select className="form-select" name="ageGroup" value={form.ageGroup || ''} onChange={handleChange}>
                                    <option value="">-- 未設定 --</option>
                                    {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">性別</label>
                                <select className="form-select" name="gender" value={form.gender || ''} onChange={handleChange}>
                                    <option value="">-- 未設定 --</option>
                                    <option value="女性">女性</option>
                                    <option value="男性">男性</option>
                                    <option value="その他">その他</option>
                                    <option value="非公開">非公開</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">婚姻状況</label>
                                <select className="form-select" name="maritalStatus" value={form.maritalStatus || ''} onChange={handleChange}>
                                    <option value="">-- 未設定 --</option>
                                    <option value="未婚">未婚</option>
                                    <option value="既婚">既婚</option>
                                    <option value="非公開">非公開</option>
                                    <option value="未確認">未確認</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">顔出し可否</label>
                                <select className="form-select" name="faceVisibility" value={form.faceVisibility} onChange={handleChange}>
                                    <option value="未設定">-- 未設定 --</option>
                                    <option value="可">可</option>
                                    <option value="条件付き可">条件付き可</option>
                                    <option value="不可">不可</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">子どもの有無</label>
                                <select className="form-select" name="hasChildren" value={form.hasChildren} onChange={handleChange}>
                                    <option value="あり">あり</option>
                                    <option value="なし">なし</option>
                                    <option value="非公開">非公開</option>
                                    <option value="未確認">未確認</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">子どもの数</label>
                                <select className="form-select" name="childrenCount" value={form.childrenCount || ''} onChange={handleChange}>
                                    <option value="">-- 未設定 --</option>
                                    <option value="0">0人</option>
                                    <option value="1">1人</option>
                                    <option value="2">2人</option>
                                    <option value="3">3人</option>
                                    <option value="4人以上">4人以上</option>
                                    <option value="非公開">非公開</option>
                                    <option value="未確認">未確認</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">子育てステージ（複数選択可）</label>
                            <div className="tags-checkbox-group">
                                {CHILD_STAGES.map(stage => (
                                    <label key={stage} className={`tag-checkbox-label ${form.childStage.includes(stage) ? 'selected' : ''}`}>
                                        <input type="checkbox" style={{ display: 'none' }} checked={form.childStage.includes(stage)} onChange={() => toggleChildStage(stage)} />
                                        {stage}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ===== プロフィール文 ===== */}
                        <h3 className="form-section-title">プロフィール文</h3>

                        <div className="form-group">
                            <label className="form-label">一覧用紹介文 <span className="form-hint">（カード表示用の短文）</span></label>
                            <textarea className="form-textarea" name="listIntro" value={form.listIntro || ''} onChange={handleChange} rows={2} placeholder="一覧カードに表示される短い紹介文" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">詳細プロフィール <span className="form-hint">（詳細画面用の長文）</span></label>
                            <textarea className="form-textarea" name="profileText" value={form.profileText || ''} onChange={handleChange} rows={5} />
                        </div>

                        {/* ===== SNS・媒体情報 ===== */}
                        <h3 className="form-section-title">SNS・媒体情報
                            <span className="form-hint" style={{ marginLeft: 8 }}>総フォロワー数（自動）: {previewTotal != null ? previewTotal.toLocaleString() : '未設定'}</span>
                        </h3>

                        {form.mediaAccounts.map((acc, idx) => (
                            <div key={acc.id} className="media-account-row">
                                <div className="media-account-header">
                                    <span className="media-account-num">#{idx + 1}</span>
                                    <button type="button" className="btn-icon-danger" onClick={() => removeMedia(acc.id)}>削除</button>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">媒体種別</label>
                                        <select className="form-select" value={acc.mediaType} onChange={e => updateMedia(acc.id, { mediaType: e.target.value as MediaType })}>
                                            {MEDIA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">アカウント名・媒体名</label>
                                        <input className="form-input" value={acc.accountName || ''} onChange={e => updateMedia(acc.id, { accountName: e.target.value })} placeholder="例: mizuki_31cafe" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">URL</label>
                                        <input className="form-input" value={acc.url || ''} onChange={e => updateMedia(acc.id, { url: e.target.value })} placeholder="https://..." />
                                    </div>
                                    {acc.mediaType === 'Instagram' && (
                                        <div className="form-group" style={{ flex: 0.5 }}>
                                            <label className="form-label">リール投稿頻度</label>
                                            <input className="form-input" value={acc.reelsFrequency || ''} onChange={e => updateMedia(acc.id, { reelsFrequency: e.target.value })} placeholder="例: 週3回" />
                                        </div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">数値種別</label>
                                        <select className="form-select" value={acc.metricType} onChange={e => updateMedia(acc.id, { metricType: e.target.value as MetricType })}>
                                            {METRIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    {acc.metricType !== 'なし' && (
                                        <div className="form-group">
                                            <label className="form-label">数値</label>
                                            <input type="number" className="form-input" value={acc.metricValue ?? ''} min={0}
                                                onChange={e => updateMedia(acc.id, { metricValue: e.target.value ? parseInt(e.target.value) : undefined })} />
                                        </div>
                                    )}
                                    <div className="form-group" style={{ minWidth: 80 }}>
                                        <label className="form-label">詳細表示</label>
                                        <label className="checkbox-label" style={{ marginTop: 8 }}>
                                            <input type="checkbox" checked={acc.showOnDetail} onChange={e => updateMedia(acc.id, { showOnDetail: e.target.checked })} />
                                            <span className="checkbox-text">表示する</span>
                                        </label>
                                    </div>
                                </div>
                                {FOLLOWER_CONTRIBUTING_MEDIA.includes(acc.mediaType) && acc.metricValue != null && (
                                    <p className="form-hint" style={{ marginTop: 4 }}>※ 総フォロワー数に加算されます</p>
                                )}
                            </div>
                        ))}

                        <button type="button" className="btn-secondary btn-add-media" onClick={addMedia}>
                            ＋ 媒体を追加する
                        </button>

                        {/* ===== 属性タグ ===== */}
                        <h3 className="form-section-title">属性タグ</h3>

                        {TAG_CATEGORIES.map(cat => {
                            const catTags = tagsByCategory[cat];
                            const visibleTags = catTags.filter(t => t.active !== false); // hide inactive tags
                            const selected = catTags.filter(t => form.tagIds.includes(t.id));
                            const isOpen = expandedTagCategories.has(cat);
                            return (
                                <div key={cat} className="tag-category-section">
                                    <button type="button" className="tag-category-header" onClick={() => toggleTagCategory(cat)}>
                                        <span>{cat} {selected.length > 0 && <span className="filter-badge">{selected.length}</span>}</span>
                                        <span>{isOpen ? '▲' : '▼'}</span>
                                    </button>
                                    {isOpen && (
                                        <div className="tags-checkbox-group">
                                            {visibleTags.map(tag => (
                                                <label key={tag.id} className={`tag-checkbox-label ${form.tagIds.includes(tag.id) ? 'selected' : ''}`}>
                                                    <input type="checkbox" style={{ display: 'none' }} checked={form.tagIds.includes(tag.id)} onChange={() => toggleTagId(tag.id)} />
                                                    {tag.name}
                                                </label>
                                            ))}
                                            {visibleTags.length === 0 && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>タグがありません</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}


                        {/* ===== 評価・メモ ===== */}
                        <h3 className="form-section-title">評価・メモ</h3>

                        {form.notes.map((note, idx) => (
                            <div key={note.id} className="note-edit-row">
                                <div className="media-account-header">
                                    <select className="form-select" style={{ flex: 1 }} value={note.noteType} onChange={e => updateNote(note.id, { noteType: e.target.value as FoodieNote['noteType'] })}>
                                        {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <button type="button" className="btn-icon-danger" onClick={() => removeNote(note.id)}>削除</button>
                                    <span className="media-account-num">#{idx + 1}</span>
                                </div>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={note.content}
                                    onChange={e => updateNote(note.id, { content: e.target.value })}
                                    placeholder="メモを入力..."
                                />
                            </div>
                        ))}

                        <button type="button" className="btn-secondary btn-add-media" onClick={addNote}>
                            ＋ メモを追加する
                        </button>

                    </form>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleClose}>キャンセル</button>
                    <button className="btn-primary" onClick={handleSave}>保存する</button>
                </div>
            </div>
        </div>
    );
};
