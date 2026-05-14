import { useState, useEffect } from 'react';
import { getPendingApplications, updateApplicationStatus, putFoodist } from '../lib/supabaseDb';
import type { RegistrationApplication, Tag, Foodist } from '../data/types';
import './ApplicationReviewView.css';

interface ApplicationReviewViewProps {
    allTags: Tag[];
    onEdit: (app: RegistrationApplication) => void;
}

export const ApplicationReviewView = ({ allTags, onEdit }: ApplicationReviewViewProps) => {
    const [applications, setApplications] = useState<RegistrationApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await getPendingApplications();
            setApplications(data);
        } catch (err) {
            console.error('Failed to load applications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const handleApprove = async (app: RegistrationApplication, editedData?: Foodist | Omit<Foodist, 'id'>) => {
        if (!window.confirm(`${app.data.displayName} さんの登録を承認しますか？`)) return;

        try {
            const now = new Date().toISOString();
            // 編集されたデータがあればそれを使用、なければ申請データをそのまま使用
            const baseData = editedData || app.data;
            
            const foodist: Foodist = {
                ...baseData,
                id: `foodist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                createdAt: now,
                updatedAt: now,
            } as Foodist;

            await putFoodist(foodist);
            await updateApplicationStatus(app.id, 'approved');
            
            loadApplications();
            alert('承認・登録が完了しました。');
        } catch (err) {
            console.error('Approval failed:', err);
            alert('承認処理に失敗しました。');
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('この申請を削除しますか？')) return;

        try {
            await updateApplicationStatus(id, 'rejected');
            loadApplications();
        } catch (err) {
            console.error('Deletion failed:', err);
            alert('削除処理に失敗しました。');
        }
    };

    if (loading) return <div className="review-loading">申請データを読み込んでいます...</div>;

    return (
        <div className="application-review-container">
            <header className="view-header">
                <div className="header-left">
                    <h2 className="view-title">登録審査</h2>
                    <p className="view-subtitle">フーディストからの新規登録申請を確認し、登録または削除を行います。</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <a 
                        href="/apply" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-text" 
                        style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'background 0.2s' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        申請フォームを開く
                    </a>
                    <button className="btn-secondary" onClick={loadApplications}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        更新
                    </button>
                </div>
            </header>

            {applications.length === 0 ? (
                <div className="empty-review">
                    <p>現在、未審査の申請はありません。</p>
                </div>
            ) : (
                <div className="application-list">
                    {applications.map(app => (
                        <div key={app.id} className="app-card">
                            <div className="app-card-main">
                                <img src={app.data.avatarUrl || '/no-image.png'} alt="" className="app-avatar" />
                                <div className="app-info">
                                    <div className="app-name-row">
                                        <h3 className="app-display-name">{app.data.displayName}</h3>
                                        <span className="app-date">{new Date(app.createdAt).toLocaleDateString()} 申請</span>
                                    </div>
                                    <p className="app-title">{app.data.title || '（肩書きなし）'}</p>
                                    <div className="app-meta">
                                        <span>📍 {app.data.area || '地域未設定'}</span>
                                        <span>📧 {app.data.email}</span>
                                        {app.data.phoneNumber && <span>📞 {app.data.phoneNumber}</span>}
                                        <span>📊 フォロワー: {app.data.totalFollowers?.toLocaleString() ?? 0}</span>
                                        {app.data.hasChildren === 'あり' && (
                                            <span>👶 子: {app.data.childrenCount === '4人以上' || app.data.childrenCount === '回答しない' ? app.data.childrenCount : `${app.data.childrenCount}人`}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="app-actions">
                                <button className="btn-primary" onClick={() => onEdit(app)}>内容を確認・編集</button>
                                <button className="btn-text-danger" onClick={() => handleReject(app.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    削除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
