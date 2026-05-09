import { useState, useCallback, useEffect } from 'react';
import type { Tag, TagCategory } from '../data/types';
import { DEFAULT_TAGS } from '../data/tags';
import { supabase } from '../lib/supabaseClient';

// ============================================================
// Supabase ヘルパー（fire and forget）
// ============================================================

/** タグを Supabase に upsert（非同期、エラーはログのみ） */
const _upsertTagsToSupabase = (tags: Tag[]) => {
    if (tags.length === 0) return;
    const rows = tags.map(t => ({
        id: t.id,
        data: t,
        updated_at: t.updatedAt,
    }));
    supabase.from('tags').upsert(rows).then(({ error }) => {
        if (error) console.error('[useTags] upsert error:', error);
    });
};

/** タグを Supabase から削除（非同期、エラーはログのみ） */
const _deleteTagFromSupabase = (id: string) => {
    supabase.from('tags').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('[useTags] delete error:', error);
    });
};

// ============================================================
// フック本体
// ============================================================
export const useTags = () => {
    const [tags, setTagsState] = useState<Tag[]>([]);
    const [tagsLoading, setTagsLoading] = useState(true);

    // ---- 初期化（Supabase から読み込み） ----
    useEffect(() => {
        const init = async () => {
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .select('data');
                if (error) throw error;

                if (data && data.length > 0) {
                    const loaded = data.map(row => row.data as Tag).filter(t => t != null);

                    // DEFAULT_TAGS にあって未登録のものを追加（新タグ追加時の自動補完）
                    const loadedIds = new Set(loaded.map(t => t.id));
                    const missing = DEFAULT_TAGS.filter(t => !loadedIds.has(t.id));
                    
                    // 登録済みタグの metadata (sortOrder 等) が DEFAULT_TAGS と乖離している場合は更新
                    const updated = loaded.map(t => {
                        const def = DEFAULT_TAGS.find(dt => dt.id === t.id);
                        if (def && (def.sortOrder !== t.sortOrder || def.name !== t.name)) {
                            return { ...t, sortOrder: def.sortOrder, name: def.name, updatedAt: new Date().toISOString() };
                        }
                        return t;
                    });

                    const changedTags = updated.filter((t, i) => t !== loaded[i]);
                    const finalTags = [...updated, ...missing];

                    if (missing.length > 0 || changedTags.length > 0) {
                        console.info(`[useTags] ${missing.length} 件の新タグ追加と ${changedTags.length} 件のタグ更新を同期します`);
                        _upsertTagsToSupabase([...missing, ...changedTags]);
                    }

                    setTagsState(finalTags);
                } else {
                    // Supabase が空 → デフォルトタグをシード
                    console.info('[useTags] タグが未登録のため、デフォルトタグをシードします');
                    setTagsState(DEFAULT_TAGS);
                    _upsertTagsToSupabase(DEFAULT_TAGS);
                }
            } catch (e) {
                console.error('[useTags] 初期化に失敗しました', e);
                // フォールバック: デフォルトタグで起動
                setTagsState(DEFAULT_TAGS);
            } finally {
                setTagsLoading(false);
            }
        };

        init();
    }, []);

    // --- 新規追加 ---
    const addTag = useCallback((name: string, category: TagCategory) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const already = tags.find(t => t.name === trimmed && t.category === category);
        if (already) return;

        const newTag: Tag = {
            id: `tag_custom_${Date.now()}`,
            name: trimmed,
            category,
            sortOrder: tags.filter(t => t.category === category).length + 1,
            active: true,
            searchVisible: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setTagsState(prev => [...prev, newTag]);
        _upsertTagsToSupabase([newTag]);
    }, [tags]);

    // --- 削除（完全削除） ---
    const removeTag = useCallback((id: string) => {
        setTagsState(prev => prev.filter(t => t.id !== id));
        _deleteTagFromSupabase(id);
    }, []);

    // --- 有効/無効切り替え ---
    const toggleTagActive = useCallback((id: string) => {
        setTagsState(prev => {
            const newTags = prev.map(t =>
                t.id === id ? { ...t, active: !t.active, updatedAt: new Date().toISOString() } : t
            );
            const updated = newTags.find(t => t.id === id);
            if (updated) _upsertTagsToSupabase([updated]);
            return newTags;
        });
    }, []);

    // --- 検索表示フラグ切り替え ---
    const toggleSearchVisible = useCallback((id: string) => {
        setTagsState(prev => {
            const newTags = prev.map(t =>
                t.id === id ? { ...t, searchVisible: !t.searchVisible, updatedAt: new Date().toISOString() } : t
            );
            const updated = newTags.find(t => t.id === id);
            if (updated) _upsertTagsToSupabase([updated]);
            return newTags;
        });
    }, []);

    /**
     * タグ統合: sourceId のタグを無効化する。
     * フーディスト側の tagIds 置き換えは useFoodists の replaceTagInAll に委ねる。
     */
    const deactivateTag = useCallback((id: string) => {
        setTagsState(prev => {
            const newTags = prev.map(t =>
                t.id === id ? { ...t, active: false, updatedAt: new Date().toISOString() } : t
            );
            const updated = newTags.find(t => t.id === id);
            if (updated) _upsertTagsToSupabase([updated]);
            return newTags;
        });
    }, []);

    // --- カテゴリ別取得ヘルパー ---
    /** 検索サイドバー用: active=true かつ searchVisible=true のタグをカテゴリで絞り込む */
    const getSearchableTags = useCallback((category: TagCategory): Tag[] => {
        return tags
            .filter(t => t.category === category && t.active && t.searchVisible)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [tags]);

    /** 編集画面用: active にかかわらず全タグをカテゴリで返す */
    const getAllTagsByCategory = useCallback((category: TagCategory): Tag[] => {
        return tags
            .filter(t => t.category === category)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [tags]);

    /** IDからタグ情報を返す */
    const getTagById = useCallback((id: string): Tag | undefined => {
        return tags.find(t => t.id === id);
    }, [tags]);

    return {
        tags,
        tagsLoading,
        addTag,
        removeTag,
        toggleTagActive,
        toggleSearchVisible,
        deactivateTag,
        getSearchableTags,
        getAllTagsByCategory,
        getTagById,
    };
};
