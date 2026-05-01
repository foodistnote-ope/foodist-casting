import { supabase } from './supabaseClient';
import type { Foodist } from '../data/types';

// ============================================================
// Supabase DB ユーティリティ（db.ts の置き換え）
//   テーブル: foodists  (id TEXT PRIMARY KEY, data JSONB)
// ============================================================

/** 全件取得 */
export const getAllFoodists = async (): Promise<Foodist[]> => {
    const { data, error } = await supabase
        .from('foodists')
        .select('data');
    if (error) throw error;
    return (data ?? []).map(row => row.data as Foodist);
};

/** 登録件数を取得 */
export const countFoodists = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('foodists')
        .select('id', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
};

/** 1件追加 or 更新（upsert） */
export const putFoodist = async (foodist: Foodist): Promise<void> => {
    const { error } = await supabase
        .from('foodists')
        .upsert({
            id: foodist.id,
            data: foodist,
            updated_at: new Date().toISOString(),
        });
    if (error) throw error;
};

/** 複数件を一括 upsert */
export const putManyFoodists = async (list: Foodist[]): Promise<void> => {
    if (list.length === 0) return;
    const rows = list.map(f => ({
        id: f.id,
        data: f,
        updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('foodists').upsert(rows);
    if (error) throw error;
};

/** 全件削除してから全件 upsert（バックアップ復元・全件入れ替えに使用） */
export const replaceAllFoodists = async (list: Foodist[]): Promise<void> => {
    // 全件削除（id が null でない = 全行）
    const { error: delErr } = await supabase
        .from('foodists')
        .delete()
        .not('id', 'is', null);
    if (delErr) throw delErr;

    if (list.length === 0) return;

    const rows = list.map(f => ({
        id: f.id,
        data: f,
        updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('foodists').upsert(rows);
    if (error) throw error;
};

/** 1件削除 */
export const deleteFoodistById = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('foodists')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
