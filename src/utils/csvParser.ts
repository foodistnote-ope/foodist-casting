import Papa from 'papaparse';
import type { Foodist, Tag, MediaAccount, FoodieNote, MediaType, MetricType } from '../data/types';
import { calcTotalFollowers } from '../data/types';

// ============================================================
// 部分更新（パッチ）CSV用の型
// ============================================================
/** key は Foodist の id、value は上書きしたいフィールドの部分オブジェクト */
export type FoodistPatch = Partial<Omit<Foodist, 'id' | 'createdAt'>> & {
    /** マッチングキー: id が優先、なければ displayName で照合 */
    _matchId?: string;
    _matchName?: string;
};

/**
 * 部分更新CSVのパース。
 * - ヘッダーに "id" または "活動名" が必要（どちらか一方でも可）。
 * - CSVに存在する列だけをパッチとして返す（存在しない列は undefined のまま）。
 * - タグ列（タグ）が含まれる場合はタグ名→ID変換を行う。
 * - 戻り値は { _matchId, _matchName, ...変更フィールド } の配列。
 */
export const parsePatchCsv = (file: File, allTags: Tag[]): Promise<FoodistPatch[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const headers = results.meta.fields ?? [];
                    const hasHeader = (name: string) => headers.includes(name);

                    const patches: FoodistPatch[] = results.data.map((row, index) => {
                        const patch: FoodistPatch = {
                            _matchId: row['id'] || undefined,
                            _matchName: row['活動名'] || undefined,
                        };

                        // --- スカラーフィールド ---
                        if (hasHeader('本名') && row['本名'] !== '') patch.realName = row['本名'] || undefined;
                        if (hasHeader('肩書き') && row['肩書き'] !== '') patch.title = row['肩書き'] || undefined;
                        if (hasHeader('会員登録状況') && row['会員登録状況'] !== '') {
                            const v = row['会員登録状況'];
                            if (['あり', 'なし', '要確認'].includes(v)) patch.membershipStatus = v as Foodist['membershipStatus'];
                        }
                        if (hasHeader('婚姻状況') && row['婚姻状況'] !== '') {
                            const v = row['婚姻状況'];
                            if (['未婚', '既婚', '非公開', '未確認'].includes(v)) patch.maritalStatus = v as Foodist['maritalStatus'];
                        }
                        if (hasHeader('居住地') && row['居住地'] !== '') patch.area = row['居住地'] || undefined;
                        if (hasHeader('出身地') && row['出身地'] !== '') patch.birthplace = row['出身地'] || undefined;
                        if (hasHeader('生年月日') && row['生年月日'] !== '') patch.birthDate = row['生年月日'] || undefined;
                        if (hasHeader('年齢') && row['年齢'] !== '') {
                            const n = parseInt(row['年齢'], 10);
                            if (!isNaN(n)) patch.age = n;
                        }
                        if (hasHeader('年代') && row['年代'] !== '') patch.ageGroup = row['年代'] as Foodist['ageGroup'] || undefined;
                        if (hasHeader('性別') && row['性別'] !== '') patch.gender = row['性別'] || undefined;
                        if (hasHeader('顔出し可否') && row['顔出し可否'] !== '') {
                            const v = row['顔出し可否'];
                            if (['可', '条件付き可', '不可', '未設定'].includes(v)) patch.faceVisibility = v as Foodist['faceVisibility'];
                        }
                        if (hasHeader('子どもの有無') && row['子どもの有無'] !== '') {
                            const v = row['子どもの有無'].toLowerCase();
                            if (['あり', 'true', '1', 'yes'].includes(v)) patch.hasChildren = 'あり';
                            else if (['なし', 'false', '0', 'no'].includes(v)) patch.hasChildren = 'なし';
                            else if (v === '非公開') patch.hasChildren = '非公開';
                            else if (v === '未確認') patch.hasChildren = '未確認';
                        }
                        if (hasHeader('子どもの数') && row['子どもの数'] !== '') patch.childrenCount = row['子どもの数'] || undefined;
                        if (hasHeader('子育てステージ') && row['子育てステージ'] !== '') {
                            patch.childStage = row['子育てステージ'].split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
                        }
                        if (hasHeader('一覧用紹介文') && row['一覧用紹介文'] !== '') patch.listIntro = row['一覧用紹介文'] || undefined;
                        if (hasHeader('詳細プロフィール') && row['詳細プロフィール'] !== '') patch.profileText = row['詳細プロフィール'] || undefined;
                        if (hasHeader('プロフィール画像URL') && row['プロフィール画像URL'] !== '') patch.avatarUrl = row['プロフィール画像URL'] || undefined;

                        // --- タグ（追加モード: 既存タグは保持し、新しいタグだけ追記） ---
                        if (hasHeader('タグ') && row['タグ'] !== '') {
                            const names = row['タグ'].split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
                            patch.tagIds = names
                                .map(name => allTags.find(t => t.name === name)?.id)
                                .filter((id): id is string => !!id);
                        }

                        // --- メモ（提案時メモ / その他メモ: 既存メモに追記） ---
                        const newNotes: FoodieNote[] = [];
                        const now = new Date().toISOString();
                        if (hasHeader('提案時メモ') && row['提案時メモ'] !== '') {
                            newNotes.push({ id: `patch_note_${index}_prop`, noteType: '提案時メモ', content: row['提案時メモ'], updatedAt: now });
                        }
                        if (hasHeader('その他メモ') && row['その他メモ'] !== '') {
                            newNotes.push({ id: `patch_note_${index}_other`, noteType: 'その他', content: row['その他メモ'], updatedAt: now });
                        }
                        if (newNotes.length > 0) {
                            // _patchNotes は実際には FoodistPatch に存在しないが、patchFoodists 側で処理する
                            (patch as any)._patchNotes = newNotes;
                        }

                        // --- SNSフォロワー数（数値のみ上書き） ---
                        const mediaPatch: { type: MediaType; followerKey: string; urlKey: string }[] = [
                            { type: 'Instagram', followerKey: 'Instagram_フォロワー数', urlKey: 'Instagram_URL' },
                            { type: 'X', followerKey: 'X_フォロワー数', urlKey: 'X_URL' },
                            { type: 'TikTok', followerKey: 'TikTok_フォロワー数', urlKey: 'TikTok_URL' },
                            { type: 'YouTube', followerKey: 'YouTube_登録者数', urlKey: 'YouTube_URL' },
                            { type: 'ブログ', followerKey: 'ブログ_PV', urlKey: 'ブログ_URL' },
                        ];
                        const mediaToPatch: { type: MediaType; metricValue?: number; url?: string }[] = [];
                        mediaPatch.forEach(({ type, followerKey, urlKey }) => {
                            const hasFollower = hasHeader(followerKey) && row[followerKey] !== '';
                            const hasUrl = hasHeader(urlKey) && row[urlKey] !== '';
                            if (hasFollower || hasUrl) {
                                const num = hasFollower ? parseInt(row[followerKey].replace(/,/g, ''), 10) : undefined;
                                mediaToPatch.push({
                                    type,
                                    metricValue: num && !isNaN(num) ? num : undefined,
                                    url: hasUrl ? row[urlKey] : undefined,
                                });
                            }
                        });
                        if (mediaToPatch.length > 0) {
                            (patch as any)._patchMedia = mediaToPatch;
                        }

                        return patch;
                    });

                    resolve(patches);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => reject(error),
        });
    });
};

const parseNumber = (value?: string): number | undefined => {
    if (!value) return undefined;
    const num = parseInt(value.replace(/[,]/g, ''), 10);
    return isNaN(num) ? undefined : num;
};

/** カンマ区切りのタグ名をID配列に変換する */
const mapTagNamesToIds = (tagNamesStr: string | undefined, allTags: Tag[]): string[] => {
    if (!tagNamesStr) return [];
    // カンマまたは読点で区切る
    const names = tagNamesStr.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
    const result: string[] = [];
    names.forEach(name => {
        const tag = allTags.find(t => t.name === name);
        if (tag) result.push(tag.id);
    });
    return Array.from(new Set(result)); // 重複除去
};

/**
 * CSV インポート: 最新フォーマットの CSV を読み込み、Foodist 型に変換する。
 * 日本語ヘッダーと英語ヘッダーの両方をサポートする。
 */
export const parseFoodistCsv = (file: File, allTags: Tag[]): Promise<Foodist[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const now = new Date().toISOString();
                    const parsed: Foodist[] = results.data.map((row, index: number) => {
                        const mediaAccounts: MediaAccount[] = [];
                        let sort = 1;

                        // --- 媒体アカウントの抽出系ヘルパー ---
                        const addMedia = (type: MediaType, url?: string, name?: string, pvOrFollowers?: string, metricType: MetricType = 'フォロワー数', reels?: string) => {
                            if (!url && !name && !pvOrFollowers) return;
                            mediaAccounts.push({
                                id: `csv_media_${index}_${sort}`,
                                mediaType: type,
                                accountName: name || undefined,
                                url: url || undefined,
                                metricType,
                                metricValue: parseNumber(pvOrFollowers),
                                reelsFrequency: reels || undefined,
                                showOnDetail: true,
                                sortOrder: sort++,
                                updatedAt: now,
                            });
                        };

                        // ブログ
                        addMedia('ブログ', row['ブログ_URL'] || row['blogUrl'], row['ブログ_名称'] || row['blogTitle'], row['ブログ_PV'] || row['blogPv'], 'PV');
                        // Instagram
                        addMedia('Instagram', row['Instagram_URL'] || row['instagramUrl'], undefined, row['Instagram_フォロワー数'] || row['instagramFollowers'], 'フォロワー数', row['Instagram_リール投稿頻度'] || row['reelsFrequency']);
                        // X
                        addMedia('X', row['X_URL'] || row['xUrl'], undefined, row['X_フォロワー数'] || row['xFollowers'], 'フォロワー数');
                        // TikTok
                        addMedia('TikTok', row['TikTok_URL'] || row['tiktokUrl'], undefined, row['TikTok_フォロワー数'] || row['tiktokFollowers'], 'フォロワー数');
                        // YouTube
                        addMedia('YouTube', row['YouTube_URL'] || row['youtubeUrl'], row['YouTube_名称'] || row['youtubeTitle'], row['YouTube_登録者数'] || row['youtubeSubscribers'], 'チャンネル登録者数');
                        // 公式HP
                        addMedia('公式ホームページ', row['公式HP_URL'], row['公式HP_名称'], row['公式HP_PV'], 'PV');
                        // その他
                        addMedia('その他', row['その他媒体_URL'], row['その他媒体_名称'], undefined, 'なし');

                        // --- メモ ---
                        const notes: FoodieNote[] = [];
                        if (row['提案時メモ']) {
                            notes.push({ id: `csv_note_${index}_prop`, noteType: '提案時メモ', content: row['提案時メモ'], updatedAt: now });
                        }
                        const otherNote = row['その他メモ'] || row['internalNotes'];
                        if (otherNote) {
                            notes.push({ id: `csv_note_${index}_other`, noteType: 'その他', content: otherNote, updatedAt: now });
                        }

                        // --- 属性の正規化 ---
                        const hasChildRaw = (row['子どもの有無'] || row['hasChildren'] || '').toLowerCase();
                        let hasChildren: Foodist['hasChildren'] = '未確認';
                        if (['あり', 'true', '1', 'yes'].includes(hasChildRaw)) hasChildren = 'あり';
                        else if (['なし', 'false', '0', 'no'].includes(hasChildRaw)) hasChildren = 'なし';
                        else if (hasChildRaw === '非公開') hasChildren = '非公開';

                        const faceVisibilityRaw = (row['顔出し可否'] || row['faceVisibility'] || '未設定') as Foodist['faceVisibility'];
                        const membershipRaw = (row['会員登録状況'] || row['membershipStatus'] || '要確認') as Foodist['membershipStatus'];
                        const maritalRaw = (row['婚姻状況'] || row['maritalStatus'] || '未確認') as Foodist['maritalStatus'];

                        const childStageRaw = row['子育てステージ'] || '';
                        const childStage = childStageRaw ? childStageRaw.split(/[,、\n]/).map(s => s.trim()).filter(Boolean) : [];

                        const f: Foodist = {
                            id: row['id'] || `foodist-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`,
                            displayName: row['活動名'] || row['displayName'] || row['name'] || '名称未設定',
                            realName: row['本名'] || row['name'] || undefined,
                            title: row['肩書き'] || row['title'] || undefined,
                            membershipStatus: (['あり', 'なし', '要確認'].includes(membershipRaw as any) ? membershipRaw : '要確認') as any,
                            maritalStatus: (['未婚', '既婚', '非公開', '未確認'].includes(maritalRaw as any) ? maritalRaw : '未確認') as any,
                            area: row['居住地'] || row['area'] || undefined,
                            birthplace: row['出身地'] || row['birthplace'] || undefined,
                            birthDate: row['生年月日'] || row['birthDate'] || undefined,
                            age: parseNumber(row['年齢'] || row['age']),
                            ageGroup: (row['年代'] || row['ageGroup']) as Foodist['ageGroup'] || undefined,
                            gender: row['性別'] || row['gender'] || undefined,
                            faceVisibility: (['可', '条件付き可', '不可', '未設定'].includes(faceVisibilityRaw as any) ? faceVisibilityRaw : '未設定') as any,
                            hasChildren,
                            childrenCount: row['子どもの数'] || row['childrenCount'] || undefined,
                            childStage,
                            listIntro: row['一覧用紹介文'] || row['listIntro'] || undefined,
                            profileText: row['詳細プロフィール'] || row['profileText'] || undefined,
                            avatarUrl: row['プロフィール画像URL'] || row['avatarUrl'] || undefined,
                            totalFollowers: calcTotalFollowers(mediaAccounts),
                            tagIds: mapTagNamesToIds(row['タグ'] || row['tags'], allTags),
                            mediaAccounts,
                            notes,
                            createdAt: now,
                            updatedAt: now,
                        };
                        return f;
                    });
                    resolve(parsed);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
