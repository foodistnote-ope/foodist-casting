import { useState, useRef } from 'react';
import type { Foodist, Tag, MediaAccount, MediaType, MetricType, TagCategory } from '../data/types';
import { TAG_CATEGORIES, MEDIA_TYPES, METRIC_TYPES, AGE_GROUPS, CHILD_STAGES, FOLLOWER_CONTRIBUTING_MEDIA, calcTotalFollowers } from '../data/types';
import { submitApplication } from '../lib/supabaseDb';
import { supabase } from '../lib/supabaseClient';
import { notifySlack } from '../utils/notifications';
import './PublicRegistrationForm.css';

interface PublicRegistrationFormProps {
    allTags: Tag[];
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

const emptyFormData: Omit<Foodist, 'id'> & { email: string } = {
    email: '',
    displayName: '',
    realName: '',
    title: '',
    membershipStatus: '要確認',
    maritalStatus: undefined,
    area: '',
    birthplace: '',
    birthDate: '1990-01-01',
    age: undefined,
    ageGroup: undefined,
    gender: '',
    faceVisibility: '未設定',
    faceVisibilityMemo: '',
    hasChildren: '未確認',
    childrenCount: undefined,
    childStage: [],
    listIntro: '',
    profileText: '',
    avatarUrl: '',
    totalFollowers: 0,
    tagIds: [],
    mediaAccounts: [],
    aliases: [],
    noteFeaturedPermission: undefined,
    noteFeaturedMemo: '',
    cookingClassStatus: '未確認',
    email: '',
    phoneNumber: '',
    createdAt: '',
    updatedAt: '',
};

export const PublicRegistrationForm = ({ allTags }: PublicRegistrationFormProps) => {
    const [form, setForm] = useState(emptyFormData);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<TagCategory>>(new Set(TAG_CATEGORIES.filter(c => c !== 'NG・留意事項')));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleTag = (id: string) => {
        setForm(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(id) ? prev.tagIds.filter(t => t !== id) : [...prev.tagIds, id],
        }));
    };

    const toggleChildStage = (stage: string) => {
        setForm(prev => ({
            ...prev,
            childStage: prev.childStage.includes(stage)
                ? prev.childStage.filter(s => s !== stage)
                : [...prev.childStage, stage],
        }));
    };

    const handleAlcoholTagChange = (tagId: string) => {
        const alcoholTagIds = ['tag_al01', 'tag_al02', 'tag_al03'];
        setForm(prev => {
            const otherTags = prev.tagIds.filter(id => !alcoholTagIds.includes(id));
            return {
                ...prev,
                tagIds: [...otherTags, tagId]
            };
        });
    };

    const addMedia = () => {
        const newAcc: MediaAccount = {
            id: `media_${Date.now()}`,
            mediaType: 'Instagram',
            metricType: 'フォロワー数',
            showOnDetail: true,
            sortOrder: form.mediaAccounts.length + 1,
            updatedAt: new Date().toISOString(),
        };
        setForm(prev => ({ ...prev, mediaAccounts: [...prev.mediaAccounts, newAcc] }));
    };

    const updateMedia = (id: string, patch: Partial<MediaAccount>) => {
        setForm(prev => {
            const nextMedia = prev.mediaAccounts.map(a => {
                if (a.id !== id) return a;
                const updated = { ...a, ...patch };
                if (patch.mediaType) {
                    if (patch.mediaType === 'YouTube') updated.metricType = 'チャンネル登録者数';
                    else if (patch.mediaType === 'ブログ') updated.metricType = 'PV';
                    else updated.metricType = 'フォロワー数';
                }
                return updated;
            });
            return {
                ...prev,
                mediaAccounts: nextMedia,
                totalFollowers: calcTotalFollowers(nextMedia) || 0
            };
        });
    };

    const removeMedia = (id: string) => {
        setForm(prev => {
            const nextMedia = prev.mediaAccounts.filter(a => a.id !== id);
            return {
                ...prev,
                mediaAccounts: nextMedia,
                totalFollowers: calcTotalFollowers(nextMedia) || 0
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 手元ですぐにプレビューを表示する
        const localPreview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, avatarUrl: localPreview }));

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
            const filePath = `pending/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('foodist-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('foodist-assets')
                .getPublicUrl(filePath);

            // 最終的な公開URLに差し替える
            setForm(prev => ({ ...prev, avatarUrl: publicUrl }));
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('画像のアップロードに失敗しました。');
            setForm(prev => ({ ...prev, avatarUrl: '' })); // 失敗時はリセット
        } finally {
            setUploadingImage(false);
            // 入力値をリセットして、同じファイルを再度選択可能にする
            if (e.target) e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.displayName) return alert('活動名は必須です。');
        if (!form.email) return alert('メールアドレスは必須です。');

        setIsSubmitting(true);
        try {
            const now = new Date().toISOString();
            const applicationData = {
                ...form,
                createdAt: now,
                updatedAt: now,
            };

            await submitApplication(applicationData);
            await notifySlack(form.displayName, applicationData);
            
            setIsSubmitted(true);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Submission failed:', err);
            alert('送信に失敗しました。時間をおいて再度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="registration-container success-view">
                <div className="success-card">
                    <div className="success-icon-wrapper">
                        <svg className="success-icon-svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h1>登録を受け付けました</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="registration-container">
            <header className="registration-header">
                <div className="header-inner">
                    <h1 className="form-title">【ご協力のお願い】料理の活動に関するアンケート</h1>
                    <p className="form-subtitle">
                        本アンケートは、みなさまの活動状況やご希望をお伺いし、今後の企画やお仕事依頼の参考にさせていただくことを目的としております。所要時間は5〜10分程度です。ぜひご協力をお願いいたします。
                    </p>
                </div>
            </header>

            <main className="registration-main">
                <form className="public-form" onSubmit={handleSubmit}>
                    {/* ===== 通知用連絡先 ===== */}
                    <section className="form-section">
                        <h2 className="section-title">ご連絡先</h2>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">メールアドレス</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    className="form-input" 
                                    value={form.email} 
                                    onChange={handleChange} 
                                    placeholder="example@gmail.com" 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">電話番号（任意）</label>
                                <input 
                                    type="tel" 
                                    name="phoneNumber" 
                                    className="form-input" 
                                    value={form.phoneNumber} 
                                    onChange={handleChange} 
                                    placeholder="090-1234-5678" 
                                />
                            </div>
                        </div>
                    </section>

                    {/* ===== 基本情報 ===== */}
                    <section className="form-section">
                        <h2 className="section-title">基本情報</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">活動名（ニックネーム）</label>
                                <input name="displayName" className="form-input" value={form.displayName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">本名（任意）</label>
                                <input name="realName" className="form-input" value={form.realName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">プロフィール画像</label>
                            <div className="image-upload-wrapper">
                                <div className="avatar-upload-box">
                                    <div className={`avatar-preview ${form.avatarUrl ? 'has-image' : ''} ${uploadingImage ? 'is-uploading' : ''}`}>
                                        {form.avatarUrl ? (
                                            <img src={form.avatarUrl} alt="Preview" />
                                        ) : (
                                            <label 
                                                htmlFor="avatar-upload-input" 
                                                className="no-avatar-hint clickable"
                                                style={{ display: 'flex', width: '100%', height: '100%', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
                                            >
                                                <svg className="hint-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                                <span style={{ pointerEvents: 'none' }}>未選択</span>
                                            </label>
                                        )}
                                        {uploadingImage && <div className="upload-spinner-overlay"><div className="spinner"></div></div>}
                                    </div>
                                    {form.avatarUrl && !uploadingImage && (
                                        <button 
                                            type="button"
                                            className="upload-delete-badge" 
                                            onClick={() => {
                                                setForm(prev => ({ ...prev, avatarUrl: '' }));
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            title="画像を削除する"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                                <div className="upload-actions">
                                    <div className="upload-buttons-row">
                                        <input 
                                            id="avatar-upload-input"
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*" 
                                            style={{ display: 'none' }} 
                                            onChange={handleImageUpload} 
                                            disabled={uploadingImage} 
                                        />
                                        <label htmlFor="avatar-upload-input" className="btn-secondary upload-label" style={{ cursor: 'pointer' }}>
                                            {form.avatarUrl ? '画像を差し替える' : '画像を選択'}
                                        </label>
                                    </div>
                                    <p className="form-hint mt-12">高解像度の画像を推奨します（横幅1200px以上推奨、最小640px）。</p>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">肩書き</label>
                            <input name="title" className="form-input" value={form.title} onChange={handleChange} placeholder="例: 料理研究家、料理家、パン講師" />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">性別</label>
                            <div className="radio-group-horizontal">
                                {['女性', '男性', 'その他', '非公開'].map(opt => (
                                    <label key={opt} className={`radio-option ${form.gender === opt ? 'selected' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="gender" 
                                            value={opt} 
                                            checked={form.gender === opt} 
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="radio-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">PR企画でのお顔出しは可能ですか？</label>
                            <div className="radio-group-horizontal">
                                {['可', '条件付き可', '不可'].map(opt => (
                                    <label key={opt} className={`radio-option ${form.faceVisibility === opt ? 'selected' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="faceVisibility" 
                                            value={opt} 
                                            checked={form.faceVisibility === opt} 
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="radio-text">{opt}</span>
                                    </label>
                                ))}
                            </div>

                            {form.faceVisibility === '条件付き可' && (
                                <div className="mt-12 animate-fade-in">
                                    <textarea 
                                        name="faceVisibilityMemo" 
                                        className="form-textarea" 
                                        value={form.faceVisibilityMemo} 
                                        onChange={handleChange} 
                                        rows={2}
                                        placeholder="どのような条件であれば可能か具体的に入力してください（例：お面や被り物をしての出演、目元を隠せば可、料理の手元のみ、など）"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label required">個人で料理教室を運営されていますか？（リアル・オンライン問わず）</label>
                            <div className="radio-group vertical">
                                {[
                                    '現在運営している',
                                    '過去運営していたことがある',
                                    '運営したことがない'
                                ].map(opt => (
                                    <label key={opt} className={`radio-option ${form.cookingClassStatus === opt ? 'selected' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="cookingClassStatus" 
                                            value={opt} 
                                            checked={form.cookingClassStatus === opt} 
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="radio-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">飲酒について</label>
                            <div className="radio-group vertical">
                                {allTags
                                    .filter(t => t.category === '飲酒について' && t.active)
                                    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
                                    .map(t => (
                                        <label key={t.id} className={`radio-option ${form.tagIds.includes(t.id) ? 'selected' : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="alcoholStatus" 
                                                value={t.id} 
                                                checked={form.tagIds.includes(t.id)} 
                                                onChange={() => handleAlcoholTagChange(t.id)}
                                                required
                                            />
                                            <span className="radio-text">{t.name}</span>
                                        </label>
                                    ))
                                }
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">居住地（都道府県）</label>
                                <select 
                                    name="area" 
                                    className="form-select" 
                                    value={form.area || ''} 
                                    onChange={handleChange}
                                    autoComplete="off"
                                >
                                    <option value="">選択してください</option>
                                    {AREA_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">出身地（都道府県）</label>
                                <select 
                                    name="birthplace" 
                                    className="form-select" 
                                    value={form.birthplace || ''} 
                                    onChange={handleChange}
                                    autoComplete="off"
                                >
                                    <option value="">選択してください</option>
                                    {AREA_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">婚姻状況</label>
                            <div className="radio-group-horizontal">
                                {['未婚', '既婚', '非公開'].map(opt => (
                                    <label key={opt} className={`radio-option ${form.maritalStatus === opt ? 'selected' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="maritalStatus" 
                                            value={opt} 
                                            checked={form.maritalStatus === opt} 
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="radio-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">お子さまの有無</label>
                            <div className="radio-group-horizontal">
                                {['あり', 'なし', '非公開'].map(opt => (
                                    <label key={opt} className={`radio-option ${form.hasChildren === opt ? 'selected' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="hasChildren" 
                                            value={opt} 
                                            checked={form.hasChildren === opt} 
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="radio-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {form.hasChildren === 'あり' && (
                            <div className="form-child-details animate-fade-in">
                                <div className="form-group">
                                    <label className="form-label">お子さまの人数</label>
                                    <select name="childrenCount" className="form-select" value={form.childrenCount || ''} onChange={handleChange}>
                                        <option value="">選択してください</option>
                                        <option value="1人">1人</option>
                                        <option value="2人">2人</option>
                                        <option value="3人">3人</option>
                                        <option value="4人以上">4人以上</option>
                                        <option value="非公開">非公開</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">子育てステージ（複数選択可）</label>
                                    <div className="tag-grid">
                                        {CHILD_STAGES.filter(s => s !== '未確認' && s !== '非公開').map(stage => (
                                            <label key={stage} className={`tag-pill ${form.childStage.includes(stage) ? 'active' : ''}`}>
                                                <input type="checkbox" checked={form.childStage.includes(stage)} onChange={() => toggleChildStage(stage)} />
                                                {stage}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">生年月日</label>
                                <input type="date" name="birthDate" className="form-input" value={form.birthDate} onChange={handleChange} />
                            </div>
                        </div>
                    </section>

                    {/* ===== SNS情報 ===== */}
                    <section className="form-section">
                        <h2 className="section-title">SNS・媒体情報</h2>
                        <p className="form-hint mb-16">ご自身が運営するSNSや媒体を登録してください。</p>
                        
                        {form.mediaAccounts.map((acc, idx) => (
                            <div key={acc.id} className="media-acc-card">
                                <div className="card-header">
                                    <span className="card-num">SNS #{idx + 1}</span>
                                    <button type="button" className="btn-text-danger" onClick={() => removeMedia(acc.id)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                        削除
                                    </button>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">媒体種別</label>
                                        <select className="form-select" value={acc.mediaType} onChange={e => updateMedia(acc.id, { mediaType: e.target.value as MediaType })}>
                                            {MEDIA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            {acc.metricType === 'PV' ? '月間PV数' : 'フォロワー数'}
                                        </label>
                                        <input type="number" className="form-input" value={acc.metricValue || ''} onChange={e => updateMedia(acc.id, { metricValue: parseInt(e.target.value) || 0 })} placeholder="0" />
                                    </div>
                                </div>
                                {acc.mediaType === 'Instagram' && (
                                    <div className="form-group">
                                        <label className="form-label">リール動画の投稿頻度</label>
                                        <select className="form-select" value={acc.reelsFrequency || ''} onChange={e => updateMedia(acc.id, { reelsFrequency: e.target.value })}>
                                            <option value="">選択してください</option>
                                            <option value="ほぼ毎日">ほぼ毎日</option>
                                            <option value="週3~5回ほど">週3~5回ほど</option>
                                            <option value="週1~2回ほど">週1~2回ほど</option>
                                            <option value="月1~2回ほど">月1~2回ほど</option>
                                            <option value="月1回以下">月1回以下</option>
                                            <option value="投稿したことがない">投稿したことがない</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">URL</label>
                                    <input className="form-input" value={acc.url} onChange={e => updateMedia(acc.id, { url: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                        ))}

                        <button type="button" className="btn-secondary btn-full" onClick={addMedia}>＋ SNS・媒体を追加</button>
                    </section>

                    {/* ===== スキル・属性 ===== */}
                    <section className="form-section">
                        <h2 className="section-title">活動実績・スキル・資格</h2>
                        <p className="form-hint mb-16">※該当する項目がない場合は、下記の自己紹介欄にご入力ください</p>
                        {TAG_CATEGORIES.filter(cat => cat !== 'NG・留意事項' && cat !== '飲酒について').map(cat => {
                            const tags = allTags
                                .filter(t => t.category === cat && t.active)
                                .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999));
                            return (
                                <div key={cat} className="category-group">
                                    <h3 className="category-title-static">{cat}</h3>
                                    <div className="tag-grid">
                                        {tags.map(t => (
                                            <label key={t.id} className={`tag-pill ${form.tagIds.includes(t.id) ? 'active' : ''}`}>
                                                <input type="checkbox" checked={form.tagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
                                                {t.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    {/* ===== 自己紹介 ===== */}
                    <section className="form-section">
                        <h2 className="section-title">自己紹介</h2>
                        <div className="form-group">
                            <textarea name="profileText" className="form-textarea" value={form.profileText} onChange={handleChange} rows={5} placeholder="経歴、活動内容、活動実績、お仕事の依頼について、得意なこと、アピールポイントなど自由に入力してください。" />
                        </div>
                    </section>

                    {/* ===== フーディストノート掲載について ===== */}
                    <section className="form-section">
                        <h2 className="section-title">フーディストノートでのコンテンツご紹介について</h2>
                        <div className="form-info-box">
                            <p>フーディストノートでは料理レシピやフォトを多くの読者に発信しています。コンテンツのご紹介可否について、ご回答をお願いいたします。</p>
                            <ul className="form-info-list">
                                <li>※PR投稿は対象外となります</li>
                                <li>※SNS公式の埋め込みタグや指定テンプレートを用いて、みなさまのご投稿もしくはブログ記事へリンクする形でご紹介します</li>
                                <li>※ご紹介したレシピは「フーディストノート」公式SNSアカウント、提携メディア（SmartNews、Gunosy等）にてご紹介させていただく可能性がございます</li>
                                <li>※記事公開後は、記事のURLをメールにてお知らせいたします</li>
                            </ul>
                            <div className="form-reference-links">
                                <a href="https://foodistnote.recipe-blog.jp/article/224136/" target="_blank" rel="noreferrer">参考記事1</a>
                                <a href="https://foodistnote.recipe-blog.jp/article/207374/" target="_blank" rel="noreferrer">参考記事2</a>
                                <a href="https://foodistnote.recipe-blog.jp/article/127146/" target="_blank" rel="noreferrer">参考記事3</a>
                                <a href="https://foodistnote.recipe-blog.jp/article/228414/" target="_blank" rel="noreferrer">参考記事4</a>
                            </div>
                        </div>

                        <div className="radio-group vertical">
                                {[
                                    '掲載可（事前確認は不要、掲載後に案内があればOK）',
                                    '掲載可（事前確認が必要）',
                                    '掲載不可',
                                    '回答しない'
                                ].map(option => (
                                    <label key={option} className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="noteFeaturedPermission" 
                                            value={option === '回答しない' ? '未設定' : option} 
                                            checked={(option === '回答しない' ? '未設定' : option) === form.noteFeaturedPermission}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="radio-text">{option}</span>
                                    </label>
                                ))}
                            </div>

                        <div className="form-group mt-20">
                            <label className="form-label">特記事項・理由（任意）</label>
                            <p className="form-hint mb-8">掲載不可の理由や、アカウントによって掲載可否が異なる場合など、補足事項があればご記入ください。</p>
                            <textarea 
                                name="noteFeaturedMemo" 
                                className="form-textarea" 
                                value={form.noteFeaturedMemo} 
                                onChange={handleChange} 
                                rows={3}
                                placeholder="例：Instagramは掲載可能だが、ブログ記事は不可、など"
                            />
                        </div>
                    </section>

                    <div className="form-submit-area">
                        <div className="agreement-wrapper">
                            <label className="agreement-label">
                                <input 
                                    type="checkbox" 
                                    checked={agreed} 
                                    onChange={(e) => setAgreed(e.target.checked)} 
                                    required 
                                />
                                <span className="agreement-text">
                                    <a href="https://www.ai-land.co.jp/privacy/" target="_blank" rel="noreferrer">個人情報の取り扱い</a>に同意する
                                </span>
                            </label>
                        </div>
                        <button type="submit" className="btn-primary btn-xl" disabled={isSubmitting || !agreed}>
                            {isSubmitting ? '送信中...' : 'アンケートを送信する'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};
