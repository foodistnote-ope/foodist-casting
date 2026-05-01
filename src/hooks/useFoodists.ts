import { useState, useCallback, useEffect } from 'react';
import type { Foodist, MediaAccount } from '../data/types';
import type { FoodistPatch } from '../utils/csvParser';
import { calcTotalFollowers } from '../data/types';
import { initialFoodists } from '../data/initialFoodists';
import {
    getAllFoodists,
    countFoodists,
    putFoodist,
    putManyFoodists,
    replaceAllFoodists,
    deleteFoodistById,
} from '../lib/supabaseDb';

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
                    // Supabase にデータがある → 読み込む
                    const data = await getAllFoodists();
                    console.info(`[useFoodists] Supabase から ${data.length} 件読み込みました`);
                    setFoodistsState(data);
                    return;
                }

                // Supabase が空 → 初期シードを挿入
                const seeded = initialFoodists.map(f => {
                    const note = f.notes.find(n => n.content.includes('お酒'));
                    if (!note) return f;
                    let tid = '';
                    if (note.content.includes('PR企画には対応可能')) tid = 'tag_al03';
                    else if (note.content.includes('お酒を飲む')) tid = 'tag_al01';
                    else if (note.content.includes('お酒を飲まない')) tid = 'tag_al02';

                    if (tid && !f.tagIds.includes(tid)) return { ...f, tagIds: [...f.tagIds, tid] };
                    return f;
                });
                await putManyFoodists(seeded);
                console.info(`[useFoodists] 初期データ ${seeded.length} 件を Supabase に登録しました`);
                setFoodistsState(seeded);

            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error('[useFoodists] 初期化に失敗しました', e);
                setError(msg);
                // フォールバック: 初期データをそのまま表示
                setFoodistsState(initialFoodists);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // ---- 内部ヘルパー: 状態更新 + Supabase 書き込み ----
    /** 渡した配列でメモリ上の状態を即時更新し、Supabaseにも非同期で書き込む */
    const _applyAndSave = useCallback((newList: Foodist[], dbOp: () => Promise<void>) => {
        setFoodistsState(newList);
        dbOp().catch(e => {
            console.error('[useFoodists] Supabase への書き込みに失敗しました', e);
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
        _applyAndSave(recalced, () => putManyFoodists(recalced));
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
        _applyAndSave(updated, () => putManyFoodists(updated));
    }, [foodists, _applyAndSave]);

    /** 複数のタグペアを一括置換する */
    const batchReplaceTags = useCallback((replacements: { source: string; target: string }[]) => {
        const now = new Date().toISOString();
        const updated = foodists.map(f => {
            let currentTagIds = [...f.tagIds];
            let changed = false;

            replacements.forEach(({ source, target }) => {
                if (currentTagIds.includes(source)) {
                    currentTagIds = currentTagIds.filter(id => id !== source);
                    if (!currentTagIds.includes(target)) {
                        currentTagIds.push(target);
                    }
                    changed = true;
                }
            });

            if (!changed) return f;
            return { ...f, tagIds: currentTagIds, updatedAt: now };
        });
        _applyAndSave(updated, () => putManyFoodists(updated));
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
    /**
     * フーディスト配列を現在のデータに統合する（復元・インポートで使用）
     * - ID または 活動名 が一致する場合：既存レコードを新しい内容で上書き（更新）
     * - 一致しない場合：新規追加
     */
    const mergeFoodists = useCallback(async (incoming: Foodist[]): Promise<{ added: number; updated: number }> => {
        const newList = [...foodists];
        const idIndex = new Map(foodists.map((f, i) => [f.id, i]));
        const nameIndex = new Map(foodists.map((f, i) => [f.displayName, i]));

        let added = 0;
        let updated = 0;
        const toSave: Foodist[] = [];

        for (const item of incoming) {
            // マッチングロジック: ID優先、次に活動名
            let idx = idIndex.get(item.id);
            if (idx === undefined) {
                idx = nameIndex.get(item.displayName);
            }

            if (idx !== undefined) {
                // 既存あり → 更新
                // 元のIDを維持しつつ中身を上書き
                const existing = newList[idx];
                const updatedItem = { ...item, id: existing.id };
                newList[idx] = updatedItem;
                updated++;
                toSave.push(updatedItem);
            } else {
                // 新規追加
                newList.push(item);
                added++;
                toSave.push(item);
            }
        }

        if (toSave.length > 0) {
            setFoodistsState(newList);
            await putManyFoodists(toSave);
        }

        return { added, updated };
    }, [foodists]);

    // ---- JSON インポート ----
    const importFromJson = useCallback((file: File, mode: 'merge' | 'overwrite' = 'merge'): Promise<{ added: number; updated: number; skipped: number }> => {
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
                        resolve({ added: incoming.length, updated: 0, skipped: 0 });
                        return;
                    }

                    // 改良版マージを実行
                    const result = await mergeFoodists(incoming);
                    resolve({ ...result, skipped: 0 });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file, 'utf-8');
        });
    }, [mergeFoodists]);

    // ---- CSV 部分更新（パッチ）----
    /**
     * FoodistPatch 配列を受け取り、id または displayName でマッチした既存レコードにだけ差分を適用する。
     * - タグ: 既存タグを保持しつつ、CSVの新しいタグを追加（重複なし）
     * - メモ: 既存メモを保持しつつ追記
     * - SNSフォロワー数: 対象プラットフォームの metricValue / url を上書き
     */
    const patchFoodists = useCallback(async (patches: FoodistPatch[]): Promise<{ updated: number; notFound: string[] }> => {
        const now = new Date().toISOString();
        const nameIndex = new Map(foodists.map(f => [f.displayName, f.id]));
        let updatedCount = 0;
        const notFound: string[] = [];

        const newList = foodists.map(f => ({ ...f }));

        for (const patch of patches) {
            // マッチング: id 優先 → displayName フォールバック
            let targetId = patch._matchId;
            if (!targetId && patch._matchName) {
                targetId = nameIndex.get(patch._matchName);
            }

            if (!targetId) {
                notFound.push(patch._matchName || '（不明）');
                continue;
            }

            const idx = newList.findIndex(f => f.id === targetId);
            if (idx === -1) {
                notFound.push(patch._matchName || patch._matchId || targetId);
                continue;
            }

            const existing = newList[idx];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _matchId, _matchName, tagIds, notes: _notes, mediaAccounts: _ma, ...scalarPatch } = patch as any;

            // スカラーフィールドの上書き
            let updated: Foodist = { ...existing, ...scalarPatch };

            // タグのマージ（既存 ∪ 新規）
            if (tagIds && Array.isArray(tagIds)) {
                const merged = Array.from(new Set([...existing.tagIds, ...tagIds]));
                updated = { ...updated, tagIds: merged };
            }

            // メモの追記
            const patchNotes: any[] = (patch as any)._patchNotes ?? [];
            if (patchNotes.length > 0) {
                updated = { ...updated, notes: [...existing.notes, ...patchNotes] };
            }

            // SNS / 媒体アカウントの部分更新
            const patchMedia: { type: string; metricValue?: number; url?: string }[] = (patch as any)._patchMedia ?? [];
            if (patchMedia.length > 0) {
                const accounts: MediaAccount[] = existing.mediaAccounts.map(acc => {
                    const mp = patchMedia.find(m => m.type === acc.mediaType);
                    if (!mp) return acc;
                    return {
                        ...acc,
                        ...(mp.metricValue !== undefined ? { metricValue: mp.metricValue } : {}),
                        ...(mp.url !== undefined ? { url: mp.url } : {}),
                        updatedAt: now,
                    };
                });

                // CSVにあるが既存アカウントにない媒体は新規追加
                patchMedia.forEach(mp => {
                    if (!accounts.find(a => a.mediaType === mp.type)) {
                        accounts.push({
                            id: `patch_media_${existing.id}_${mp.type}`,
                            mediaType: mp.type as MediaAccount['mediaType'],
                            metricType: mp.type === 'ブログ' ? 'PV' : mp.type === 'YouTube' ? 'チャンネル登録者数' : 'フォロワー数',
                            metricValue: mp.metricValue,
                            url: mp.url,
                            showOnDetail: true,
                            sortOrder: accounts.length + 1,
                            updatedAt: now,
                        });
                    }
                });

                updated = { ...updated, mediaAccounts: accounts };
            }

            // totalFollowers を再計算
            updated = {
                ...updated,
                totalFollowers: calcTotalFollowers(updated.mediaAccounts),
                updatedAt: now,
            };

            newList[idx] = updated;
            updatedCount++;
        }

        if (updatedCount > 0) {
            _applyAndSave(newList, () => putManyFoodists(newList));
        }

        return { updated: updatedCount, notFound };
    }, [foodists, _applyAndSave]);

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
        batchReplaceTags,
        exportToJson,
        importFromJson,
        mergeFoodists,
        patchFoodists,
    };
};
