import { useState, useCallback, useEffect } from 'react';
import type { Foodist, MediaAccount } from '../data/types';
import { calcTotalFollowers } from '../data/types';
import { initialFoodists } from '../data/initialFoodists';
import {
    getAllFoodists,
    countFoodists,
    putFoodist,
    putManyFoodists,
    replaceAllFoodists,
    deleteFoodistById,
} from '../data/db';

// ============================================================
// localStorage 旧キー（移行後は読み取りのみ・書き込みなし）
// ============================================================
const LS_MAIN_KEY = 'foodist_mgmt_data_v2';
const LS_V1_KEY   = 'foodist_management_data';

// ============================================================
// 旧フォーマット（v1）→ 新フォーマット（v2）マイグレーション
// ============================================================
const migrateFromV1 = (raw: Record<string, unknown>): Foodist => {
    const now = new Date().toISOString();
    const accounts: MediaAccount[] = [];
    let sort = 1;

    if (raw.blogUrl || raw.blogTitle) {
        accounts.push({ id: `media_${raw.id}_blog`, mediaType: 'ブログ', accountName: (raw.blogTitle as string) || undefined, url: (raw.blogUrl as string) || undefined, metricType: 'PV', metricValue: (raw.blogPv as number) || undefined, showOnDetail: true, sortOrder: sort++, updatedAt: now });
    }
    if (raw.instagramUrl) {
        accounts.push({ id: `media_${raw.id}_ig`, mediaType: 'Instagram', url: raw.instagramUrl as string, metricType: 'フォロワー数', metricValue: (raw.instagramFollowers as number) || undefined, showOnDetail: true, sortOrder: sort++, updatedAt: now });
    }
    if (raw.xUrl) {
        accounts.push({ id: `media_${raw.id}_x`, mediaType: 'X', url: raw.xUrl as string, metricType: 'フォロワー数', metricValue: (raw.xFollowers as number) || undefined, showOnDetail: true, sortOrder: sort++, updatedAt: now });
    }
    if (raw.youtubeUrl) {
        accounts.push({ id: `media_${raw.id}_yt`, mediaType: 'YouTube', accountName: (raw.youtubeTitle as string) || undefined, url: raw.youtubeUrl as string, metricType: 'チャンネル登録者数', metricValue: (raw.youtubeSubscribers as number) || undefined, showOnDetail: true, sortOrder: sort++, updatedAt: now });
    }
    if (raw.tiktokUrl) {
        accounts.push({ id: `media_${raw.id}_tt`, mediaType: 'TikTok', url: raw.tiktokUrl as string, metricType: 'フォロワー数', metricValue: (raw.tiktokFollowers as number) || undefined, showOnDetail: true, sortOrder: sort++, updatedAt: now });
    }
    if (raw.noteUrl) {
        accounts.push({ id: `media_${raw.id}_note`, mediaType: 'ブログ', accountName: 'note', url: raw.noteUrl as string, metricType: 'なし', showOnDetail: true, sortOrder: sort++, updatedAt: now });
    }

    const notes = raw.internalNotes ? [{ id: `note_${raw.id}_1`, noteType: 'その他' as const, content: raw.internalNotes as string, updatedAt: now }] : [];
    const hasChild = raw.hasChildren;
    let hasChildNorm: Foodist['hasChildren'] = '未確認';
    if (hasChild === true || hasChild === 'あり') hasChildNorm = 'あり';
    else if (hasChild === false || hasChild === 'なし') hasChildNorm = 'なし';
    else if (hasChild === '非公開') hasChildNorm = '非公開';

    return {
        id: raw.id as string,
        displayName: (raw.displayName as string) || (raw.name as string) || '（名前なし）',
        realName: (raw.name as string) || undefined,
        title: (raw.title as string) || undefined,
        membershipStatus: '要確認',
        area: (raw.area as string) || undefined,
        birthplace: (raw.birthplace as string) || undefined,
        birthDate: undefined, age: undefined,
        ageGroup: (raw.ageGroup as Foodist['ageGroup']) || undefined,
        gender: (raw.gender as string) || undefined,
        faceVisibility: (raw.faceVisibility as Foodist['faceVisibility']) || '可',
        hasChildren: hasChildNorm,
        childrenCount: raw.childrenCount != null ? String(raw.childrenCount) : undefined,
        childStage: [],
        listIntro: (raw.internalNotes as string) || undefined,
        profileText: (raw.profileText as string) || undefined,
        avatarUrl: (raw.avatarUrl as string) || undefined,
        totalFollowers: calcTotalFollowers(accounts),
        tagIds: [],
        mediaAccounts: accounts,
        notes,
        createdAt: now,
        updatedAt: now,
    };
};

/** ============================================================
 * localStorage の既存データを読み取るユーティリティ
 * ============================================================ */
const readFromLocalStorage = (): Foodist[] | null => {
    // v2 形式を優先
    try {
        const raw = localStorage.getItem(LS_MAIN_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed as Foodist[];
        }
    } catch { /* fall through */ }

    // v1 形式をマイグレーション
    try {
        const raw = localStorage.getItem(LS_V1_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return (parsed as Record<string, unknown>[]).map(migrateFromV1);
            }
        }
    } catch { /* fall through */ }

    return null;
};

/** localStorage の旧データを削除して移行完了を記録 */
const clearLocalStorage = () => {
    try { localStorage.removeItem(LS_MAIN_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(LS_V1_KEY); } catch { /* ignore */ }
    // 移行済みフラグを立てる（再度初期化されないようにするための保険）
    try { localStorage.setItem('foodist_migrated_to_idb', '1'); } catch { /* ignore */ }
};

/** ============================================================
 * フック本体
 * ============================================================ */
export const useFoodists = () => {
    const [foodists, setFoodistsState] = useState<Foodist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ---- 初期化（マウント時に1回だけ実行） ----
    useEffect(() => {
        const init = async () => {
            try {
                const count = await countFoodists();

                if (count > 0) {
                    // IndexedDB にデータがある → そのまま読み込む
                    const data = await getAllFoodists();
                    console.info(`[useFoodists] IndexedDB から ${data.length} 件読み込みました`);
                    setFoodistsState(data);
                    return;
                }

                // IndexedDB が空 → localStorage からの移行を試みる
                const lsData = readFromLocalStorage();
                if (lsData && lsData.length > 0) {
                    await putManyFoodists(lsData);
                    clearLocalStorage();
                    console.info(`[useFoodists] localStorage から ${lsData.length} 件を IndexedDB へ移行しました`);
                    setFoodistsState(lsData);
                    return;
                }

                // どこにもデータがない → 初期シードを挿入
                await putManyFoodists(initialFoodists);
                console.info(`[useFoodists] 初期データ ${initialFoodists.length} 件を IndexedDB に登録しました`);
                setFoodistsState(initialFoodists);

            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error('[useFoodists] 初期化に失敗しました', e);
                setError(msg);
                // フォールバック: localStorage から直接読む（最終手段）
                const fallback = readFromLocalStorage() ?? initialFoodists;
                setFoodistsState(fallback);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // ---- 内部ヘルパー: 状態更新 + IndexedDB 書き込み ----
    /** 渡した配列でメモリ上の状態を即時更新し、DBにも非同期で書き込む */
    const _applyAndSave = useCallback((newList: Foodist[], dbOp: () => Promise<void>) => {
        setFoodistsState(newList);
        dbOp().catch(e => {
            console.error('[useFoodists] IndexedDB への書き込みに失敗しました', e);
        });
    }, []);

    // ---- 公開 API ----

    const addFoodist = useCallback((data: Omit<Foodist, 'id'>) => {
        const now = new Date().toISOString();
        const f: Foodist = {
            ...data,
            id: `foodist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            totalFollowers: calcTotalFollowers(data.mediaAccounts),
            createdAt: now,
            updatedAt: now,
        };
        _applyAndSave(
            [...foodists, f],
            () => putFoodist(f),
        );
        return f;
    }, [foodists, _applyAndSave]);

    const updateFoodist = useCallback((updated: Foodist) => {
        const f: Foodist = {
            ...updated,
            totalFollowers: calcTotalFollowers(updated.mediaAccounts),
            updatedAt: new Date().toISOString(),
        };
        _applyAndSave(
            foodists.map(x => x.id === f.id ? f : x),
            () => putFoodist(f),
        );
    }, [foodists, _applyAndSave]);

    const deleteFoodist = useCallback((id: string) => {
        _applyAndSave(
            foodists.filter(f => f.id !== id),
            () => deleteFoodistById(id),
        );
    }, [foodists, _applyAndSave]);

    /** インポート等で全件を差し替える */
    const setAllFoodists = useCallback((list: Foodist[]) => {
        _applyAndSave(list, () => replaceAllFoodists(list));
    }, [_applyAndSave]);

    /** 全件の totalFollowers を mediaAccounts から一括再計算して保存する */
    const recalcAllFollowers = useCallback(() => {
        const now = new Date().toISOString();
        const recalced = foodists.map(f => ({
            ...f,
            totalFollowers: calcTotalFollowers(f.mediaAccounts),
            updatedAt: now,
        }));
        _applyAndSave(recalced, () => replaceAllFoodists(recalced));
    }, [foodists, _applyAndSave]);

    /** タグ統合後に全フーディストの tagIds を置換する */
    const replaceTagInAll = useCallback((sourceTagId: string, targetTagId: string) => {
        const updated = foodists.map(f => {
            if (!f.tagIds.includes(sourceTagId)) return f;
            const newTagIds = f.tagIds
                .filter(id => id !== sourceTagId)
                .concat(f.tagIds.includes(targetTagId) ? [] : [targetTagId]);
            return { ...f, tagIds: newTagIds, updatedAt: new Date().toISOString() };
        });
        _applyAndSave(updated, () => replaceAllFoodists(updated));
    }, [foodists, _applyAndSave]);

    // ---- JSON エクスポート ----
    const exportToJson = useCallback(() => {
        const payload = {
            version: 2,
            exportedAt: new Date().toISOString(),
            count: foodists.length,
            data: foodists,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.href = url;
        a.download = `foodist_backup_${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [foodists]);

    // ---- インポート / マージ ----
    const mergeFoodists = useCallback(async (incoming: Foodist[]): Promise<{ added: number; skipped: number }> => {
        const existingIds = new Set(foodists.map(f => f.id));
        const toAdd = incoming.filter(f => !existingIds.has(f.id));
        const skipped = incoming.length - toAdd.length;

        if (toAdd.length > 0) {
            const merged = [...foodists, ...toAdd];
            setFoodistsState(merged);
            await putManyFoodists(toAdd);
        }

        return { added: toAdd.length, skipped };
    }, [foodists]);

    // ---- JSON インポート ----
    const importFromJson = useCallback((file: File, mode: 'merge' | 'overwrite' = 'merge'): Promise<{ added: number; skipped: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    const parsed = JSON.parse(text);
                    const incoming: Foodist[] = Array.isArray(parsed) ? parsed : (parsed.data ?? []);

                    if (mode === 'overwrite') {
                        await replaceAllFoodists(incoming);
                        setFoodistsState(incoming);
                        resolve({ added: incoming.length, skipped: 0 });
                        return;
                    }

                    // merge: 既存 ID はスキップ
                    const existingIds = new Set(foodists.map(f => f.id));
                    const toAdd = incoming.filter(f => !existingIds.has(f.id));
                    const merged = [...foodists, ...toAdd];
                    await putManyFoodists(toAdd);
                    setFoodistsState(merged);
                    resolve({ added: toAdd.length, skipped: incoming.length - toAdd.length });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file, 'utf-8');
        });
    }, [foodists]);

    return {
        foodists,
        loading,
        error,
        addFoodist,
        updateFoodist,
        deleteFoodist,
        setAllFoodists,
        recalcAllFollowers,
        replaceTagInAll,
        exportToJson,
        importFromJson,
        mergeFoodists,
    };
};
