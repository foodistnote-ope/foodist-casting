import { useState } from 'react';
import type { Tag, TagCategory } from '../data/types';
import { TAG_CATEGORIES } from '../data/types';
import './TagSettingsModal.css';

interface TagSettingsModalProps {
    tags: Tag[];
    addTag: (name: string, category: TagCategory) => void;
    removeTag: (id: string) => void;
    toggleTagActive: (id: string) => void;
    deactivateTag: (id: string) => void;
    onMerge: (sourceId: string, targetId: string) => void;
    onClose: () => void;
}

export const TagSettingsModal = ({
    tags, addTag, removeTag, toggleTagActive, onMerge, onClose
}: TagSettingsModalProps) => {
    const [newTagName, setNewTagName] = useState('');
    const [newTagCategory, setNewTagCategory] = useState<TagCategory>('得意な料理ジャンル');
    const [mergeSource, setMergeSource] = useState('');
    const [mergeTarget, setMergeTarget] = useState('');
    const [activeCategory, setActiveCategory] = useState<TagCategory | 'all'>('all');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleAddTag = () => {
        if (newTagName.trim()) {
            addTag(newTagName.trim(), newTagCategory);
            setNewTagName('');
        }
    };

    const handleMerge = () => {
        if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
        if (!confirm(`「${tags.find(t => t.id === mergeSource)?.name}」を「${tags.find(t => t.id === mergeTarget)?.name}」に統合します。よろしいですか？`)) return;
        onMerge(mergeSource, mergeTarget);
        setMergeSource('');
        setMergeTarget('');
    };

    const displayedTags = activeCategory === 'all'
        ? [...tags].sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder)
        : tags.filter(t => t.category === activeCategory).sort((a, b) => a.sortOrder - b.sortOrder);

    const activeTags = tags.filter(t => t.active);

    return (
        <div className="modal-overlay tag-settings-modal-overlay" onClick={onClose}>
            <div className="modal-content tag-settings-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="閉じる">×</button>

                <div className="modal-header">
                    <h2 className="modal-name">タグの管理</h2>
                </div>

                <div className="modal-body">

                    {/* ===== タグ追加 ===== */}
                    <div className="settings-section">
                        <h3>新規タグを追加</h3>
                        <div className="settings-input tag-add-input">
                            <select
                                value={newTagCategory}
                                onChange={e => setNewTagCategory(e.target.value as TagCategory)}
                                className="rule-select"
                            >
                                {TAG_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                placeholder="新しいタグ名を入力..."
                                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                            />
                            <button className="btn-secondary" onClick={handleAddTag} disabled={!newTagName.trim()}>追加</button>
                        </div>
                    </div>

                    {/* ===== タグ統合 ===== */}
                    <div className="settings-section">
                        <h3>タグを統合する</h3>
                        <p className="settings-desc">統合元タグを無効化し、フーディストの紐づきを統合先タグに置き換えます。</p>
                        <div className="settings-input rule-input">
                            <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className="rule-select">
                                <option value="">統合元タグを選択...</option>
                                {activeTags.map(t => <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>)}
                            </select>
                            <span className="rule-arrow">→</span>
                            <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="rule-select">
                                <option value="">統合先タグを選択...</option>
                                {activeTags.filter(t => t.id !== mergeSource).map(t => <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>)}
                            </select>
                            <button
                                className="btn-secondary"
                                onClick={handleMerge}
                                disabled={!mergeSource || !mergeTarget || mergeSource === mergeTarget}
                            >統合実行</button>
                        </div>
                    </div>

                    {/* ===== タグ一覧 ===== */}
                    <div className="settings-section">
                        <h3>タグ一覧</h3>
                        <p className="settings-desc">
                            <span className="tag-count-active">有効: {tags.filter(t => t.active).length}件</span>
                            <span className="tag-count-inactive">無効: {tags.filter(t => !t.active).length}件</span>
                            計 {tags.length}件
                        </p>

                        {/* カテゴリタブ */}
                        <div className="tag-category-tabs">
                            <button
                                className={`tag-cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveCategory('all')}
                            >すべて</button>
                            {TAG_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`tag-cat-tab ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                    <span className="tag-cat-count">{tags.filter(t => t.category === cat && t.active).length}</span>
                                </button>
                            ))}
                        </div>

                        <div className="settings-chip-list">
                            {displayedTags.map(tag => (
                                <div key={tag.id} className={`settings-chip-row ${!tag.active ? 'inactive' : ''}`}>
                                    <div className="chip-info">
                                        <span className="chip-category">{tag.category}</span>
                                        <span className="chip-name">{tag.name}</span>
                                        {!tag.active && <span className="chip-inactive-badge">無効</span>}
                                    </div>
                                    <div className="chip-actions">
                                        <button
                                            className={`btn-chip-toggle ${tag.active ? '' : 'btn-chip-activate'}`}
                                            onClick={() => toggleTagActive(tag.id)}
                                            title={tag.active ? '無効化する' : '有効化する'}
                                        >
                                            {tag.active ? '無効化' : '有効化'}
                                        </button>
                                        {confirmDeleteId === tag.id ? (
                                            <>
                                                <button className="btn-chip-delete-confirm" onClick={() => { removeTag(tag.id); setConfirmDeleteId(null); }}>削除確定</button>
                                                <button className="btn-chip-cancel" onClick={() => setConfirmDeleteId(null)}>キャンセル</button>
                                            </>
                                        ) : (
                                            <button className="chip-delete" onClick={() => setConfirmDeleteId(tag.id)} title="完全削除">×</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {displayedTags.length === 0 && (
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>タグがありません</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>閉じる</button>
                </div>
            </div>
        </div>
    );
};
