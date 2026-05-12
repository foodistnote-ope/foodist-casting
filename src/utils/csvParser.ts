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
    /** 有効な更新項目（ID/活動名以外）が1つも認識できなかった場合に true */
    _noUpdateFields?: boolean;
};

/** 掲載可否の文字列を正規化してEnum値に変換する */
const parseNoteFeaturedPermission = (v: string | undefined): Foodist['noteFeaturedPermission'] | undefined => {
    if (!v) return undefined;
    const s = v.trim();
    if (['掲載可（事前確認が必要）', '掲載可（事前確認は不要、掲載後に案内があればOK）', '掲載不可', '未設定'].includes(s)) {
        return s as Foodist['noteFeaturedPermission'];
    }
    // 短縮形やキーワードでのマッチング
    if (s.includes('事前確認が必要') || s === '掲載可') return '掲載可（事前確認が必要）';
    if (s.includes('事前確認は不要') || s.includes('掲載後に案内')) return '掲載可（事前確認は不要、掲載後に案内があればOK）';
    if (s === '掲載不可' || s === '不可') return '掲載不可';
    if (s === '可') return '掲載可（事前確認が必要）'; // デフォルトは慎重な方
    if (s === '未設定') return '未設定';
    return undefined;
};

/** ヘッダーの正規化（照合用） */
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[_＿\s-]/g, '');

/** ヘッダーのマップを作成して正規化キーで引きやすくする */
const getHeaderMap = (headers: string[]) => {
    const map = new Map<string, string>();
    headers.forEach(h => {
        const normalized = normalizeHeader(h);
        if (!map.has(normalized)) map.set(normalized, h);
    });
    return map;
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
            skipEmptyLines: 'greedy',
            transformHeader: (header) => header.replace(/^\ufeff/, '').trim(),
            delimiter: '',
            complete: (results) => {
                try {
                    const headers = results.meta.fields ?? [];
                    console.info('[csvParser] Parsed headers:', headers);
                    
                    const headerMap = getHeaderMap(headers);
                    const getRealHeader = (target: string) => headerMap.get(normalizeHeader(target));
                    const hasHeader = (name: string) => headerMap.has(normalizeHeader(name));

                    const patches: FoodistPatch[] = results.data
                        .filter(row => row && Object.values(row).some(v => v !== ''))
                        .map((row, index) => {
                        const idKey = getRealHeader('id');
                        const nameKey = getRealHeader('活動名');
                        const patch: FoodistPatch = {
                            _matchId: idKey ? row[idKey] : undefined,
                            _matchName: nameKey ? row[nameKey] : undefined,
                        };

                        // --- スカラーフィールド ---
                        if (hasHeader('本名') && row[getRealHeader('本名')!] !== '') patch.realName = row[getRealHeader('本名')!] || undefined;
                        if (hasHeader('肩書き') && row[getRealHeader('肩書き')!] !== '') patch.title = row[getRealHeader('肩書き')!] || undefined;
                        if (hasHeader('会員登録状況') && row[getRealHeader('会員登録状況')!] !== '') {
                            const v = row[getRealHeader('会員登録状況')!];
                            if (['あり', 'なし', '要確認'].includes(v)) patch.membershipStatus = v as Foodist['membershipStatus'];
                        }
                        if (hasHeader('婚姻状況') && row[getRealHeader('婚姻状況')!] !== '') {
                            const v = row[getRealHeader('婚姻状況')!];
                            if (['未婚', '既婚', '非公開', '未確認'].includes(v)) patch.maritalStatus = v as Foodist['maritalStatus'];
                        }
                        if (hasHeader('居住地') && row[getRealHeader('居住地')!] !== '') patch.area = row[getRealHeader('居住地')!] || undefined;
                        if (hasHeader('出身地') && row[getRealHeader('出身地')!] !== '') patch.birthplace = row[getRealHeader('出身地')!] || undefined;
                        if (hasHeader('生年月日') && row[getRealHeader('生年月日')!] !== '') patch.birthDate = row[getRealHeader('生年月日')!] || undefined;
                        if (hasHeader('年齢') && row[getRealHeader('年齢')!] !== '') {
                            const n = parseInt(row[getRealHeader('年齢')!], 10);
                            if (!isNaN(n)) patch.age = n;
                        }
                        if (hasHeader('年代') && row[getRealHeader('年代')!] !== '') patch.ageGroup = row[getRealHeader('年代')!] as Foodist['ageGroup'] || undefined;
                        if (hasHeader('性別') && row[getRealHeader('性別')!] !== '') patch.gender = row[getRealHeader('性別')!] || undefined;
                        if (hasHeader('顔出し可否') && row[getRealHeader('顔出し可否')!] !== '') {
                            const v = row[getRealHeader('顔出し可否')!];
                            if (['可', '条件付き可', '不可', '未設定'].includes(v)) patch.faceVisibility = v as Foodist['faceVisibility'];
                        }
                        if (hasHeader('子どもの有無') && row[getRealHeader('子どもの有無')!] !== '') {
                            const v = row[getRealHeader('子どもの有無')!].toLowerCase();
                            if (['あり', 'true', '1', 'yes'].includes(v)) patch.hasChildren = 'あり';
                            else if (['なし', 'false', '0', 'no'].includes(v)) patch.hasChildren = 'なし';
                            else if (v === '非公開') patch.hasChildren = '非公開';
                            else if (v === '未確認') patch.hasChildren = '未確認';
                        }
                        if (hasHeader('子どもの数') && row[getRealHeader('子どもの数')!] !== '') patch.childrenCount = row[getRealHeader('子どもの数')!] || undefined;
                        if (hasHeader('子育てステージ') && row[getRealHeader('子育てステージ')!] !== '') {
                            patch.childStage = row[getRealHeader('子育てステージ')!].split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
                        }
                        if (hasHeader('一覧用紹介文') && row[getRealHeader('一覧用紹介文')!] !== '') patch.listIntro = row[getRealHeader('一覧用紹介文')!] || undefined;
                        if (hasHeader('詳細プロフィール') && row[getRealHeader('詳細プロフィール')!] !== '') patch.profileText = row[getRealHeader('詳細プロフィール')!] || undefined;
                        if (hasHeader('プロフィール画像URL') && row[getRealHeader('プロフィール画像URL')!] !== '') patch.avatarUrl = row[getRealHeader('プロフィール画像URL')!] || undefined;
                        
                        if (hasHeader('メールアドレス') && row[getRealHeader('メールアドレス')!] !== '') patch.email = row[getRealHeader('メールアドレス')!] || undefined;
                        if (hasHeader('電話番号') && row[getRealHeader('電話番号')!] !== '') patch.phoneNumber = row[getRealHeader('電話番号')!] || undefined;
                        
                        const fvMemoKey = getRealHeader('顔出し詳細') || getRealHeader('顔出しメモ');
                        if (fvMemoKey && row[fvMemoKey] !== '') patch.faceVisibilityMemo = row[fvMemoKey] || undefined;

                        if (hasHeader('料理教室の運営状況') && row[getRealHeader('料理教室の運営状況')!] !== '') {
                            const v = row[getRealHeader('料理教室の運営状況')!];
                            if (['現在運営している', '過去運営していたことがある', '運営したことがない', '未確認'].includes(v)) {
                                patch.cookingClassStatus = v as any;
                            }
                        }
                        
                        // --- フーディストノート掲載可否 ---
                        const notePermKey = getRealHeader('掲載可否') || getRealHeader('フーディストノート掲載可否');
                        if (notePermKey && row[notePermKey] !== '') {
                            const val = parseNoteFeaturedPermission(row[notePermKey]);
                            if (val) patch.noteFeaturedPermission = val;
                        }
                        const noteMemoKey = getRealHeader('掲載メモ') || getRealHeader('掲載不可の理由');
                        if (noteMemoKey && row[noteMemoKey] !== '') {
                            patch.noteFeaturedMemo = row[noteMemoKey];
                        }

                        // --- タグ（追加モード: 既存タグは保持し、新しいタグだけ追記） ---
                        const tagKey = getRealHeader('タグ');
                        if (tagKey && row[tagKey] !== '') {
                            const names = row[tagKey].split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
                            patch.tagIds = names
                                .map(name => allTags.find(t => t.name === name)?.id)
                                .filter((id): id is string => !!id);
                        }

                        // --- メモ（提案時メモ / その他メモ: 既存メモに追記） ---
                        const newNotes: FoodieNote[] = [];
                        const now = new Date().toISOString();
                        const propNoteKey = getRealHeader('提案時メモ');
                        if (propNoteKey && row[propNoteKey] !== '') {
                            newNotes.push({ id: `patch_note_${index}_prop`, noteType: '提案時メモ', content: row[propNoteKey], updatedAt: now });
                        }
                        const otherNoteKey = getRealHeader('その他メモ');
                        if (otherNoteKey && row[otherNoteKey] !== '') {
                            newNotes.push({ id: `patch_note_${index}_other`, noteType: 'その他', content: row[otherNoteKey], updatedAt: now });
                        }
                        if (newNotes.length > 0) {
                            (patch as any)._patchNotes = newNotes;
                        }

                        // --- SNSフォロワー数（数値のみ上書き） ---
                        const mediaPatchConfigs: { type: MediaType; followerKey: string; urlKey: string }[] = [
                            { type: 'Instagram', followerKey: 'Instagram_フォロワー数', urlKey: 'Instagram_URL' },
                            { type: 'X', followerKey: 'X_フォロワー数', urlKey: 'X_URL' },
                            { type: 'TikTok', followerKey: 'TikTok_フォロワー数', urlKey: 'TikTok_URL' },
                            { type: 'YouTube', followerKey: 'YouTube_登録者数', urlKey: 'YouTube_URL' },
                            { type: 'ブログ', followerKey: 'ブログ_PV', urlKey: 'ブログ_URL' },
                        ];
                        const mediaToPatch: { type: MediaType; metricValue?: number; url?: string }[] = [];
                        mediaPatchConfigs.forEach(({ type, followerKey, urlKey }) => {
                            const fKey = getRealHeader(followerKey);
                            const uKey = getRealHeader(urlKey);
                            const hasFollower = fKey && row[fKey] !== '';
                            const hasUrl = uKey && row[uKey] !== '';
                            
                            if (hasUrl) {
                                validateUrl(row[uKey!], patch._matchName || patch._matchId || '対象ユーザー', urlKey);
                            }
                            if (hasFollower || hasUrl) {
                                const num = hasFollower ? parseInt(row[fKey!].replace(/,/g, ''), 10) : undefined;
                                mediaToPatch.push({
                                    type,
                                    metricValue: num && !isNaN(num) ? num : undefined,
                                    url: hasUrl ? row[uKey!].trim() : undefined,
                                });
                            }
                        });
                        if (mediaToPatch.length > 0) {
                            (patch as any)._patchMedia = mediaToPatch;
                        }

                        // --- 有効な更新項目のチェック ---
                        // id, 活動名, _noUpdateFields 以外のキーが1つでもあれば有効
                        const excluded = ['_matchId', '_matchName'];
                        const hasUpdate = Object.keys(patch).some(k => !excluded.includes(k));
                        if (!hasUpdate) {
                            patch._noUpdateFields = true;
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

/** URLの形式をバリデーションする */
const validateUrl = (url: string | undefined, rowName: string, fieldName: string) => {
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        throw new Error(`【${rowName}】の「${fieldName}」には正しいURL（http:// または https:// から始まる文字列）を入力してください。\n入力値: ${url}`);
    }
    try {
        new URL(trimmed);
    } catch {
        throw new Error(`【${rowName}】の「${fieldName}」のURL形式が不正です。\n入力値: ${url}`);
    }
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
            skipEmptyLines: 'greedy',
            transformHeader: (header) => header.replace(/^\ufeff/, '').trim(),
            delimiter: '',
            complete: (results) => {
                try {
                    const now = new Date().toISOString();
                    const parsed: Foodist[] = results.data
                        .filter(row => row && Object.values(row).some(v => v !== ''))
                        .map((row, index: number) => {
                        const headers = results.meta.fields ?? [];
                        const headerMap = getHeaderMap(headers);
                        const getRealHeader = (target: string) => headerMap.get(normalizeHeader(target));

                        const displayName = row[getRealHeader('活動名')!] || row[getRealHeader('displayName')!] || row[getRealHeader('name')!] || '名称未設定';
                        const mediaAccounts: MediaAccount[] = [];
                        let sort = 1;

                        // --- 媒体アカウントの抽出系ヘルパー ---
                        const addMedia = (type: MediaType, urlKey: string, nameKey: string, pvOrFollowerKey: string, metricType: MetricType = 'フォロワー数', reelsKey?: string) => {
                            const uH = getRealHeader(urlKey);
                            const nH = getRealHeader(nameKey);
                            const pH = getRealHeader(pvOrFollowerKey);
                            const rH = reelsKey ? getRealHeader(reelsKey) : undefined;

                            const url = uH ? row[uH] : undefined;
                            const name = nH ? row[nH] : undefined;
                            const pvOrFollowers = pH ? row[pH] : undefined;
                            const reels = rH ? row[rH] : undefined;

                            if (!url && !name && !pvOrFollowers) return;
                            if (url) {
                                validateUrl(url, displayName, urlKey);
                            }
                            mediaAccounts.push({
                                id: `csv_media_${index}_${sort}`,
                                mediaType: type,
                                accountName: name || undefined,
                                url: url ? url.trim() : undefined,
                                metricType,
                                metricValue: parseNumber(pvOrFollowers),
                                reelsFrequency: reels || undefined,
                                showOnDetail: true,
                                sortOrder: sort++,
                                updatedAt: now,
                            });
                        };

                        // ブログ
                        addMedia('ブログ', 'ブログ_URL', 'ブログ_名称', 'ブログ_PV', 'PV');
                        // Instagram
                        addMedia('Instagram', 'Instagram_URL', 'Instagram_名称', 'Instagram_フォロワー数', 'フォロワー数', 'Instagram_リール投稿頻度');
                        // X
                        addMedia('X', 'X_URL', 'X_名称', 'X_フォロワー数', 'フォロワー数');
                        // TikTok
                        addMedia('TikTok', 'TikTok_URL', 'TikTok_名称', 'TikTok_フォロワー数', 'フォロワー数');
                        // YouTube
                        addMedia('YouTube', 'YouTube_URL', 'YouTube_名称', 'YouTube_登録者数', 'チャンネル登録者数');
                        // 公式HP
                        addMedia('公式ホームページ', '公式HP_URL', '公式HP_名称', '公式HP_PV', 'PV');
                        // その他
                        addMedia('その他', 'その他媒体_URL', 'その他媒体_名称', 'その他媒体_PV', 'なし');

                        // --- メモ ---
                        const notes: FoodieNote[] = [];
                        const propNoteKey = getRealHeader('提案時メモ');
                        if (propNoteKey && row[propNoteKey]) {
                            notes.push({ id: `csv_note_${index}_prop`, noteType: '提案時メモ', content: row[propNoteKey], updatedAt: now });
                        }
                        const otherNoteKey = getRealHeader('その他メモ') || getRealHeader('internalNotes');
                        if (otherNoteKey && row[otherNoteKey]) {
                            notes.push({ id: `csv_note_${index}_other`, noteType: 'その他', content: row[otherNoteKey], updatedAt: now });
                        }

                        // --- 属性の正規化 ---
                        const hasChildKey = getRealHeader('子どもの有無') || getRealHeader('hasChildren');
                        const hasChildRaw = (hasChildKey ? row[hasChildKey] : '').toLowerCase();
                        let hasChildren: Foodist['hasChildren'] = '未確認';
                        if (['あり', 'true', '1', 'yes'].includes(hasChildRaw)) hasChildren = 'あり';
                        else if (['なし', 'false', '0', 'no'].includes(hasChildRaw)) hasChildren = 'なし';
                        else if (hasChildRaw === '非公開') hasChildren = '非公開';

                        const faceVisibilityKey = getRealHeader('顔出し可否') || getRealHeader('faceVisibility');
                        const faceVisibilityRaw = (faceVisibilityKey ? row[faceVisibilityKey] : '未設定') as Foodist['faceVisibility'];
                        
                        const membershipKey = getRealHeader('会員登録状況') || getRealHeader('membershipStatus');
                        const membershipRaw = (membershipKey ? row[membershipKey] : '要確認') as Foodist['membershipStatus'];
                        
                        const maritalKey = getRealHeader('婚姻状況') || getRealHeader('maritalStatus');
                        const maritalRaw = (maritalKey ? row[maritalKey] : '未確認') as Foodist['maritalStatus'];

                        const childStageKey = getRealHeader('子育てステージ');
                        const childStageRaw = childStageKey ? row[childStageKey] : '';
                        const childStage = childStageRaw ? childStageRaw.split(/[,、\n]/).map(s => s.trim()).filter(Boolean) : [];

                        const realNameKey = getRealHeader('本名') || getRealHeader('name');
                        const titleKey = getRealHeader('肩書き') || getRealHeader('title');
                        const areaKey = getRealHeader('居住地') || getRealHeader('area');
                        const birthplaceKey = getRealHeader('出身地') || getRealHeader('birthplace');
                        const birthDateKey = getRealHeader('生年月日') || getRealHeader('birthDate');
                        const ageKey = getRealHeader('年齢') || getRealHeader('age');
                        const ageGroupKey = getRealHeader('年代') || getRealHeader('ageGroup');
                        const genderKey = getRealHeader('性別') || getRealHeader('gender');
                        const listIntroKey = getRealHeader('一覧用紹介文') || getRealHeader('listIntro');
                        const profileTextKey = getRealHeader('詳細プロフィール') || getRealHeader('profileText');
                        const avatarUrlKey = getRealHeader('プロフィール画像URL') || getRealHeader('avatarUrl');
                        const tagsKey = getRealHeader('タグ') || getRealHeader('tags');

                        const f: Foodist = {
                            id: row[getRealHeader('id')!] || `foodist-${Date.now()}-${index}-${Math.floor(Math.random() * 1000000)}`,
                            displayName,
                            realName: realNameKey ? row[realNameKey] : undefined,
                            title: titleKey ? row[titleKey] : undefined,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            membershipStatus: (['あり', 'なし', '要確認'].includes(membershipRaw as any) ? membershipRaw : '要確認') as any,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            maritalStatus: (['未婚', '既婚', '非公開', '未確認'].includes(maritalRaw as any) ? maritalRaw : '未確認') as any,
                            area: areaKey ? row[areaKey] : undefined,
                            birthplace: birthplaceKey ? row[birthplaceKey] : undefined,
                            birthDate: birthDateKey ? row[birthDateKey] : undefined,
                            age: ageKey ? parseNumber(row[ageKey]) : undefined,
                            ageGroup: (ageGroupKey ? row[ageGroupKey] : undefined) as Foodist['ageGroup'] || undefined,
                            gender: genderKey ? row[genderKey] : undefined,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            faceVisibility: (['可', '条件付き可', '不可', '未設定'].includes(faceVisibilityRaw as any) ? faceVisibilityRaw : '未設定') as any,
                            hasChildren,
                            childrenCount: (getRealHeader('子どもの数') || getRealHeader('childrenCount')) ? row[(getRealHeader('子どもの数') || getRealHeader('childrenCount'))!] : undefined,
                            childStage,
                            listIntro: listIntroKey ? row[listIntroKey] : undefined,
                            profileText: profileTextKey ? row[profileTextKey] : undefined,
                            avatarUrl: avatarUrlKey ? row[avatarUrlKey] : undefined,
                            
                            // フーディストノート掲載可否
                            noteFeaturedPermission: (() => {
                                const key = getRealHeader('掲載可否') || getRealHeader('フーディストノート掲載可否');
                                return (key ? parseNoteFeaturedPermission(row[key]) : undefined) || '未設定';
                            })(),
                            noteFeaturedMemo: (() => {
                                const key = getRealHeader('掲載メモ') || getRealHeader('掲載不可の理由');
                                return key ? row[key] : undefined;
                            })(),

                            totalFollowers: calcTotalFollowers(mediaAccounts),
                            tagIds: mapTagNamesToIds(tagsKey ? row[tagsKey] : undefined, allTags),
                            mediaAccounts,
                            notes,
                            email: (getRealHeader('メールアドレス') || getRealHeader('email')) ? row[(getRealHeader('メールアドレス') || getRealHeader('email'))!] : undefined,
                            phoneNumber: (getRealHeader('電話番号') || getRealHeader('phoneNumber')) ? row[(getRealHeader('電話番号') || getRealHeader('phoneNumber'))!] : undefined,
                            faceVisibilityMemo: (getRealHeader('顔出し詳細') || getRealHeader('faceVisibilityMemo')) ? row[(getRealHeader('顔出し詳細') || getRealHeader('faceVisibilityMemo'))!] : undefined,
                            cookingClassStatus: (getRealHeader('料理教室の運営状況') || getRealHeader('cookingClassStatus')) ? row[(getRealHeader('料理教室の運営状況') || getRealHeader('cookingClassStatus'))!] as any : '未確認',
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
