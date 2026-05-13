import Papa from 'papaparse';
import Encoding from 'encoding-japanese';
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
    /** 内部用: 追記型フィールドの保持 */
    _patchNotes?: FoodieNote[];
    _patchMedia?: { type: MediaType; metricValue?: number; url?: string }[];
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
 * ファイルを文字列として読み込み、エンコーディングを自動検知してUNICODEに変換する
 */
const readFileWithEncoding = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const codes = new Uint8Array(e.target?.result as ArrayBuffer);
            
            // 1. まずは自動検知を試みる
            let encoding = Encoding.detect(codes);
            
            // 2. もし検知失敗、あるいは BINARY と判定された場合は、
            //    日本の Windows 環境で最も多い Shift-JIS を優先的に試みる
            if (!encoding || encoding === 'BINARY' || encoding === 'ASCII') {
                encoding = 'SJIS';
            }

            let unicodeString = Encoding.convert(codes, {
                to: 'UNICODE',
                from: encoding,
                type: 'string',
            });

            // 3. 変換後の文字列に「活動名」が含まれているかチェック。
            //    もし含まれていなければ、もう一方の主要な文字コード（UTF-8/SJIS）で再試行する
            if (!unicodeString.includes('活動名')) {
                const fallbackEncoding = encoding === 'SJIS' ? 'UTF8' : 'SJIS';
                unicodeString = Encoding.convert(codes, {
                    to: 'UNICODE',
                    from: fallbackEncoding,
                    type: 'string',
                });
            }

            resolve(unicodeString);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * 部分更新CSVのパース。
 * - ヘッダーに "id" または "活動名" が必要（どちらか一方でも可）。
 */
export const parsePatchCsv = async (file: File, allTags: Tag[]): Promise<FoodistPatch[]> => {
    const csvString = await readFileWithEncoding(file);
    return new Promise((resolve, reject) => {
        // ヘッダー判定を確実にするため、一旦 header: false で読み込む
        Papa.parse<string[]>(csvString, {
            header: false,
            skipEmptyLines: 'greedy',
            complete: (results) => {
                try {
                    const data = results.data;
                    if (data.length < 1) {
                        resolve([]);
                        return;
                    }

                    // 1行目をヘッダーとして取得（前後の不要な文字やBOMを除去）
                    const rawHeaders = data[0].map(h => (h || '').replace(/[\ufeff\u200b\u200c\u200d\u200e\u200f]/g, '').trim());
                    const headerMap = getHeaderMap(rawHeaders);
                    
                    const getIdx = (name: string) => {
                        const originalHeader = headerMap.get(normalizeHeader(name));
                        if (!originalHeader) return -1;
                        return rawHeaders.indexOf(originalHeader);
                    };

                    const idIdx = getIdx('id');
                    const nameIdx = getIdx('活動名');

                    if (idIdx === -1 && nameIdx === -1) {
                        const detected = rawHeaders.filter(h => h).join(', ');
                        throw new Error(`「活動名」または「id」の列が見つかりません。(検出された項目名: ${detected || 'なし'})`);
                    }

                    const patches: FoodistPatch[] = data.slice(1) // 2行目以降がデータ
                        .filter(row => row && row.some(v => v !== ''))
                        .map((row, index) => {
                        const patch: FoodistPatch = {
                            _matchId: idIdx !== -1 ? row[idIdx] : undefined,
                            _matchName: nameIdx !== -1 ? row[nameIdx] : undefined,
                        };

                        const getVal = (target: string) => {
                            const idx = getIdx(target);
                            return idx !== -1 ? row[idx] : undefined;
                        };

                        // --- フィールド設定 ---
                        const realName = getVal('本名');
                        if (realName !== undefined && realName !== '') patch.realName = realName;
                        
                        const title = getVal('肩書き');
                        if (title !== undefined && title !== '') patch.title = title;

                        const membership = getVal('会員登録状況');
                        if (membership && ['あり', 'なし', '要確認'].includes(membership)) patch.membershipStatus = membership as any;

                        const marital = getVal('婚姻状況');
                        if (marital && ['未婚', '既婚', '非公開', '未確認'].includes(marital)) patch.maritalStatus = marital as any;

                        const area = getVal('居住地');
                        if (area !== undefined && area !== '') patch.area = area;

                        const birthplace = getVal('出身地');
                        if (birthplace !== undefined && birthplace !== '') patch.birthplace = birthplace;

                        const birthDate = getVal('生年月日');
                        if (birthDate !== undefined && birthDate !== '') patch.birthDate = birthDate;

                        const age = getVal('年齢');
                        if (age !== undefined && age !== '') {
                            const n = parseInt(age, 10);
                            if (!isNaN(n)) patch.age = n;
                        }

                        const ageGroup = getVal('年代');
                        if (ageGroup !== undefined && ageGroup !== '') patch.ageGroup = ageGroup as any;

                        const gender = getVal('性別');
                        if (gender !== undefined && gender !== '') patch.gender = gender;

                        const faceVis = getVal('顔出し可否');
                        if (faceVis && ['可', '条件付き可', '不可', '未設定'].includes(faceVis)) patch.faceVisibility = faceVis as any;

                        const hasChild = getVal('子どもの有無');
                        if (hasChild) {
                            const v = hasChild.toLowerCase();
                            if (['あり', 'true', '1', 'yes'].includes(v)) patch.hasChildren = 'あり';
                            else if (['なし', 'false', '0', 'no'].includes(v)) patch.hasChildren = 'なし';
                            else if (v === '非公開') patch.hasChildren = '非公開';
                        }

                        const childCount = getVal('子どもの数');
                        if (childCount !== undefined && childCount !== '') patch.childrenCount = childCount;

                        const childStage = getVal('子育てステージ');
                        if (childStage !== undefined && childStage !== '') {
                            patch.childStage = childStage.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
                        }

                        const listIntro = getVal('一覧用紹介文');
                        if (listIntro !== undefined && listIntro !== '') patch.listIntro = listIntro;

                        const profile = getVal('詳細プロフィール');
                        if (profile !== undefined && profile !== '') patch.profileText = profile;

                        const avatar = getVal('プロフィール画像URL');
                        if (avatar !== undefined && avatar !== '') patch.avatarUrl = avatar;

                        const email = getVal('メールアドレス');
                        if (email !== undefined && email !== '') patch.email = email;

                        const phone = getVal('電話番号');
                        if (phone !== undefined && phone !== '') patch.phoneNumber = phone;

                        const fvMemo = getVal('顔出し詳細') || getVal('顔出しメモ');
                        if (fvMemo !== undefined && fvMemo !== '') patch.faceVisibilityMemo = fvMemo;

                        const cookingStatus = getVal('料理教室の運営状況');
                        if (cookingStatus && ['現在運営している', '過去運営していたことがある', '運営したことがない', '未確認'].includes(cookingStatus)) {
                            patch.cookingClassStatus = cookingStatus as any;
                        }

                        const notePerm = getVal('掲載可否') || getVal('フーディストノート掲載可否');
                        if (notePerm) {
                            const val = parseNoteFeaturedPermission(notePerm);
                            if (val) patch.noteFeaturedPermission = val;
                        }

                        const noteMemo = getVal('掲載メモ') || getVal('掲載不可の理由');
                        if (noteMemo !== undefined && noteMemo !== '') patch.noteFeaturedMemo = noteMemo;

                        // --- タグ ---
                        const tag = getVal('タグ');
                        const alcoholVal = getVal('飲酒について');
                        let tagNames: string[] = [];
                        if (tag !== undefined && tag !== '') {
                            tagNames = tag.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
                        }
                        if (alcoholVal !== undefined && alcoholVal !== '') {
                            tagNames.push(alcoholVal.trim());
                        }
                        if (tagNames.length > 0) {
                            patch.tagIds = tagNames
                                .map(name => allTags.find(t => t.name === name)?.id)
                                .filter((id): id is string => !!id);
                        }

                        // --- メモ（追記） ---
                        const newNotes: FoodieNote[] = [];
                        const now = new Date().toISOString();
                        const propNote = getVal('提案時メモ');
                        if (propNote !== undefined && propNote !== '') {
                            newNotes.push({ id: `patch_note_${index}_prop`, noteType: '提案時メモ', content: propNote, updatedAt: now });
                        }
                        const otherNote = getVal('その他メモ');
                        if (otherNote !== undefined && otherNote !== '') {
                            newNotes.push({ id: `patch_note_${index}_other`, noteType: 'その他', content: otherNote, updatedAt: now });
                        }
                        if (newNotes.length > 0) patch._patchNotes = newNotes;

                        // --- SNS（数値のみ更新） ---
                        const mediaPatchConfigs: { type: MediaType; followerKey: string; urlKey: string }[] = [
                            { type: 'Instagram', followerKey: 'Instagram_フォロワー数', urlKey: 'Instagram_URL' },
                            { type: 'X', followerKey: 'X_フォロワー数', urlKey: 'X_URL' },
                            { type: 'TikTok', followerKey: 'TikTok_フォロワー数', urlKey: 'TikTok_URL' },
                            { type: 'YouTube', followerKey: 'YouTube_登録者数', urlKey: 'YouTube_URL' },
                            { type: 'ブログ', followerKey: 'ブログ_PV', urlKey: 'ブログ_URL' },
                        ];
                        const mediaToPatch: { type: MediaType; metricValue?: number; url?: string }[] = [];
                        mediaPatchConfigs.forEach(({ type, followerKey, urlKey }) => {
                            const fVal = getVal(followerKey);
                            const uVal = getVal(urlKey);
                            if ((fVal !== undefined && fVal !== '') || (uVal !== undefined && uVal !== '')) {
                                const num = fVal ? parseInt(fVal.replace(/,/g, ''), 10) : undefined;
                                mediaToPatch.push({
                                    type,
                                    metricValue: num && !isNaN(num) ? num : undefined,
                                    url: uVal ? uVal.trim() : undefined,
                                });
                            }
                        });
                        if (mediaToPatch.length > 0) patch._patchMedia = mediaToPatch;
                        
                        // 更新項目があるかチェック
                        const excluded = ['_matchId', '_matchName', '_patchNotes', '_patchMedia'];
                        const hasUpdate = Object.keys(patch).some(k => !excluded.includes(k)) || (patch._patchNotes && patch._patchNotes.length > 0) || (patch._patchMedia && patch._patchMedia.length > 0);
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
            error: reject
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
    const names = tagNamesStr.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
    const result: string[] = [];
    names.forEach(name => {
        const tag = allTags.find(t => t.name === name);
        if (tag) result.push(tag.id);
    });
    return Array.from(new Set(result));
};

/**
 * CSV インポート
 */
export const parseFoodistCsv = async (file: File, allTags: Tag[]): Promise<Foodist[]> => {
    const csvString = await readFileWithEncoding(file);
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(csvString, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: (header) => header.replace(/[\ufeff\u200b\u200c\u200d\u200e\u200f]/g, '').trim(),
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
                            if (url) validateUrl(url, displayName, urlKey);
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

                        addMedia('ブログ', 'ブログ_URL', 'ブログ_名称', 'ブログ_PV', 'PV');
                        addMedia('Instagram', 'Instagram_URL', 'Instagram_名称', 'Instagram_フォロワー数', 'フォロワー数', 'Instagram_リール投稿頻度');
                        addMedia('X', 'X_URL', 'X_名称', 'X_フォロワー数', 'フォロワー数');
                        addMedia('TikTok', 'TikTok_URL', 'TikTok_名称', 'TikTok_フォロワー数', 'フォロワー数');
                        addMedia('YouTube', 'YouTube_URL', 'YouTube_名称', 'YouTube_登録者数', 'チャンネル登録者数');
                        addMedia('公式ホームページ', '公式HP_URL', '公式HP_名称', '公式HP_PV', 'PV');
                        addMedia('その他', 'その他媒体_URL', 'その他媒体_名称', 'その他媒体_PV', 'なし');

                        const notes: FoodieNote[] = [];
                        const propNoteKey = getRealHeader('提案時メモ');
                        if (propNoteKey && row[propNoteKey]) {
                            notes.push({ id: `csv_note_${index}_prop`, noteType: '提案時メモ', content: row[propNoteKey], updatedAt: now });
                        }
                        const otherNoteKey = getRealHeader('その他メモ') || getRealHeader('internalNotes');
                        if (otherNoteKey && row[otherNoteKey]) {
                            notes.push({ id: `csv_note_${index}_other`, noteType: 'その他', content: row[otherNoteKey], updatedAt: now });
                        }

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
                            membershipStatus: (['あり', 'なし', '要確認'].includes(membershipRaw as any) ? membershipRaw : '要確認') as any,
                            maritalStatus: (['未婚', '既婚', '非公開', '未確認'].includes(maritalRaw as any) ? maritalRaw : '未確認') as any,
                            area: areaKey ? row[areaKey] : undefined,
                            birthplace: birthplaceKey ? row[birthplaceKey] : undefined,
                            birthDate: birthDateKey ? row[birthDateKey] : undefined,
                            age: ageKey ? parseNumber(row[ageKey]) : undefined,
                            ageGroup: (ageGroupKey ? row[ageGroupKey] : undefined) as Foodist['ageGroup'] || undefined,
                            gender: genderKey ? row[genderKey] : undefined,
                            faceVisibility: (['可', '条件付き可', '不可', '未設定'].includes(faceVisibilityRaw as any) ? faceVisibilityRaw : '未設定') as any,
                            hasChildren,
                            childrenCount: (getRealHeader('子どもの数') || getRealHeader('childrenCount')) ? row[(getRealHeader('子どもの数') || getRealHeader('childrenCount'))!] : undefined,
                            childStage,
                            listIntro: listIntroKey ? row[listIntroKey] : undefined,
                            profileText: profileTextKey ? row[profileTextKey] : undefined,
                            avatarUrl: avatarUrlKey ? row[avatarUrlKey] : undefined,
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
            error: (error) => reject(error)
        });
    });
};
