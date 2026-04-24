import { useState, useCallback } from 'react';
import type { Tag, TagCategory } from '../data/types';
import { DEFAULT_TAGS } from '../data/tags';

const TAGS_KEY = 'foodist_mgmt_tags_v2';

const getInitialTags = (): Tag[] => {
    const stored = localStorage.getItem(TAGS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as Tag[];
            
            // DEFAULT_TAGS にあって、現在の tags にないものを探して追加する（IDで判定）
            const existingIds = new Set(parsed.map(t => t.id));
            const missingDefaults = DEFAULT_TAGS.filter(dt => !existingIds.has(dt.id));
            
            let finalTags = parsed;
            let needsUpdate = false;
            
            if (missingDefaults.length > 0) {
                finalTags = [...parsed, ...missingDefaults];
                needsUpdate = true;
            }

            // 移行処理: カテゴリ名が古い場合の置換
            let migrated = false;
            const migratedTags = finalTags.map(t => {
                let hasMigratedTag = false;
                let newCat = t.category;
                let newName = t.name;
                if (t.category === '専門領域' as any) {
                    newCat = '得意な料理ジャンル';
                    migrated = true;
                    hasMigratedTag = true;
                } else if (t.category === '発信テーマ' as any) {
                    newCat = 'よく発信しているテーマ';
                    migrated = true;
                    hasMigratedTag = true;
                } else if (t.category === '資格・専門属性' as any) {
                    newCat = '資格・専門';
                    migrated = true;
                    hasMigratedTag = true;
                } else if (t.category === '実績属性' as any) {
                    newCat = '実績';
                    migrated = true;
                    hasMigratedTag = true;
                }
                
                if (newCat === '対応可能業務' && newName.endsWith('可')) {
                    newName = newName.slice(0, -1);
                    migrated = true;
                    hasMigratedTag = true;
                }

                if (hasMigratedTag) return { ...t, category: newCat, name: newName };
                return t;
            });

            if (migrated || needsUpdate) {
                localStorage.setItem(TAGS_KEY, JSON.stringify(migratedTags));
                return migratedTags;
            }
            return parsed;
        } catch {
            /* fall through */
        }
    }
    localStorage.setItem(TAGS_KEY, JSON.stringify(DEFAULT_TAGS));
    return DEFAULT_TAGS;
};

export const useTags = () => {
    const [tags, setTagsState] = useState<Tag[]>(getInitialTags);

    const saveTags = useCallback((newTags: Tag[]) => {
        setTagsState(newTags);
        localStorage.setItem(TAGS_KEY, JSON.stringify(newTags));
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
        saveTags([...tags, newTag]);
    }, [tags, saveTags]);

    // --- 削除（完全削除） ---
    const removeTag = useCallback((id: string) => {
        saveTags(tags.filter(t => t.id !== id));
    }, [tags, saveTags]);

    // --- 有効/無効切り替え（削除より優先） ---
    const toggleTagActive = useCallback((id: string) => {
        saveTags(tags.map(t => t.id === id ? { ...t, active: !t.active, updatedAt: new Date().toISOString() } : t));
    }, [tags, saveTags]);

    // --- 検索表示フラグ切り替え ---
    const toggleSearchVisible = useCallback((id: string) => {
        saveTags(tags.map(t => t.id === id ? { ...t, searchVisible: !t.searchVisible, updatedAt: new Date().toISOString() } : t));
    }, [tags, saveTags]);

    /**
     * タグ統合: sourceId のタグを targetId に統合する。
     * - sourceId タグを active=false に設定
     * - フーディスト側の tagIds の置き換えは useFoodists の mergeTagInFoodists に委ねる
     */
    const deactivateTag = useCallback((id: string) => {
        saveTags(tags.map(t => t.id === id ? { ...t, active: false, updatedAt: new Date().toISOString() } : t));
    }, [tags, saveTags]);

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
