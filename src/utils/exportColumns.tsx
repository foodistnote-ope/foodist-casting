import type { Foodist, Tag } from '../data/types';
import { calculateAge, getEffectiveAgeGroup } from './dateUtils';
import { MEDIA_ICONS, MEDIA_ICON_FILTER } from './mediaIcons';
import type { MediaType } from '../data/types';

export type ColumnDef = {
    id: string;
    label: string;
    defaultVisible: boolean;
    excludeFromExport?: boolean;
    render: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => React.ReactNode;
    sortValue?: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => string | number | undefined | null;
    csvValue?: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => string;
};

export const getMediaFollowers = (f: Foodist, mediaType: string): number | undefined => {
    return f.mediaAccounts.find(a => a.mediaType === mediaType)?.metricValue;
};

export const AVAILABLE_COLUMNS: ColumnDef[] = [
    // ── 基本情報 ──────────────────────────────────
    {
        id: 'name',
        label: '活動名',
        defaultVisible: true,
        render: (f) => <div className="td-name">{f.displayName}</div>,
        sortValue: (f) => f.displayName,
    },
    {
        id: 'realName',
        label: '本名',
        defaultVisible: false,
        render: (f) => f.realName || '-',
        sortValue: (f) => f.realName || '',
    },
    {
        id: 'title',
        label: '肩書き',
        defaultVisible: true,
        render: (f) => <span className="td-sub">{f.title || '-'}</span>,
        sortValue: (f) => f.title || '',
    },
    {
        id: 'profileText',
        label: 'プロフィール',
        defaultVisible: false,
        render: (f) => f.profileText ? <span title={f.profileText}>{f.profileText.length > 20 ? f.profileText.slice(0, 20) + '...' : f.profileText}</span> : '-',
        sortValue: (f) => f.profileText || '',
        csvValue: (f) => f.profileText || '',
    },
    {
        id: 'gender',
        label: '性別',
        defaultVisible: true,
        render: (f) => f.gender || '-',
        sortValue: (f) => f.gender || '',
    },
    {
        id: 'age',
        label: '年齢',
        defaultVisible: false,
        render: (f) => {
            const age = f.birthDate ? calculateAge(f.birthDate) : f.age;
            return age != null ? `${age}歳` : '-';
        },
        sortValue: (f) => f.birthDate ? calculateAge(f.birthDate) : f.age,
    },
    {
        id: 'birthDate',
        label: '生年月日',
        defaultVisible: false,
        render: (f) => f.birthDate || '-',
        sortValue: (f) => f.birthDate || '',
    },
    {
        id: 'ageGroup',
        label: '年代',
        defaultVisible: true,
        render: (f) => getEffectiveAgeGroup(f) || '-',
        sortValue: (f) => getEffectiveAgeGroup(f) || '',
    },
    {
        id: 'area',
        label: '居住地',
        defaultVisible: true,
        render: (f) => f.area || '-',
        sortValue: (f) => f.area || '',
    },
    {
        id: 'birthplace',
        label: '出身地',
        defaultVisible: false,
        render: (f) => f.birthplace || '-',
        sortValue: (f) => f.birthplace || '',
    },
    {
        id: 'maritalStatus',
        label: '婚姻状況',
        defaultVisible: false,
        render: (f) => f.maritalStatus || '-',
        sortValue: (f) => f.maritalStatus || '',
    },
    {
        id: 'hasChildren',
        label: '子どもの有無',
        defaultVisible: false,
        render: (f) => {
            if (f.hasChildren === 'あり' && f.childrenCount) {
                const countStr = f.childrenCount === '4人以上' || f.childrenCount === '回答しない' ? f.childrenCount : `${f.childrenCount}人`;
                return `あり (${countStr})`;
            }
            return f.hasChildren || '-';
        },
        sortValue: (f) => f.hasChildren || '',
    },
    {
        id: 'childStage',
        label: 'お子さまの成長時期',
        defaultVisible: false,
        render: (f) => f.childStage && f.childStage.length > 0 ? f.childStage.join(', ') : '-',
        sortValue: (f) => f.childStage?.join(', ') || '',
    },
    {
        id: 'membership',
        label: '会員登録状況',
        defaultVisible: true,
        render: (f) => (
            <span className={`membership-badge membership-${f.membershipStatus}`}>
                {f.membershipStatus}
            </span>
        ),
        sortValue: (f) => f.membershipStatus,
    },
    // ── SNS・媒体情報 ─────────────────────────────
    {
        id: 'totalFollowers',
        label: '総フォロワー',
        defaultVisible: true,
        render: (f) => f.totalFollowers ? f.totalFollowers.toLocaleString() : '未設定',
        sortValue: (f) => f.totalFollowers || 0,
    },
    ...(['Instagram', 'X', 'TikTok', 'YouTube', 'Lemon8', 'note', 'ブログ'] as MediaType[]).flatMap(mediaType => {
        const baseId = mediaType === 'ブログ' ? 'blog' : mediaType.toLowerCase();
        
        // 基本のラベル（フォロワー数など）
        const metricLabel = mediaType === 'ブログ' ? 'ブログ 月間PV' : 
                          mediaType === 'YouTube' ? 'YouTube チャンネル登録者数' : 
                          `${mediaType} フォロワー数`;
        
        const cols: ColumnDef[] = [
            {
                id: `${baseId}_url`,
                label: `${mediaType} URL`,
                defaultVisible: false,
                render: (f) => f.mediaAccounts.find(a => a.mediaType === mediaType)?.url || '-',
                sortValue: (f) => f.mediaAccounts.find(a => a.mediaType === mediaType)?.url || '',
            },
            {
                id: baseId,
                label: metricLabel,
                defaultVisible: false,
                render: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined) => {
                    const count = getFollowers(f, mediaType);
                    if (count == null) return '-';
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img 
                                src={MEDIA_ICONS[mediaType]} 
                                alt={mediaType} 
                                style={{ 
                                    width: '16px', 
                                    height: '16px', 
                                    objectFit: 'contain', 
                                    filter: MEDIA_ICON_FILTER[mediaType],
                                    borderRadius: mediaType === 'ブログ' ? '3px' : '0'
                                }} 
                            />
                            {count.toLocaleString()}
                        </div>
                    );
                },
                sortValue: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined) => getFollowers(f, mediaType) || 0,
            }
        ];

        if (mediaType === 'Instagram') {
            cols.push({
                id: `${baseId}_reels`,
                label: `Instagram リール投稿頻度`,
                defaultVisible: false,
                render: (f) => f.mediaAccounts.find(a => a.mediaType === mediaType)?.reelsFrequency || '-',
                sortValue: (f) => f.mediaAccounts.find(a => a.mediaType === mediaType)?.reelsFrequency || '',
            });
        }

        cols.push({
            id: `${baseId}_updatedAt`,
            label: `${mediaType} 更新日時`,
            defaultVisible: false,
            render: (f) => f.mediaAccounts.find(a => a.mediaType === mediaType)?.updatedAt?.slice(0, 10) || '-',
            sortValue: (f) => f.mediaAccounts.find(a => a.mediaType === mediaType)?.updatedAt || '',
        });

        return cols;
    }),
    // ── スキル・タグ ──────────────────────────────
    {
        id: 'tags',
        label: 'スキル・タグ',
        defaultVisible: false,
        render: (f, _getFollowers, allTags) => {
            if (!f.tagIds || f.tagIds.length === 0) return '-';
            const names = f.tagIds
                .map(id => allTags.find(t => t.id === id))
                .filter((t): t is Tag => !!t && t.category !== 'リレーション')
                .map(t => t.name);
            if (names.length === 0) return '-';
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '200px' }}>
                    {names.map((name, i) => (
                        <span key={i} style={{ fontSize: '0.65rem', background: '#f0f0f0', borderRadius: '3px', padding: '1px 4px' }}>
                            {name}
                        </span>
                    ))}
                </div>
            );
        },
        sortValue: (f) => f.tagIds?.length || 0,
        csvValue: (f, _getFollowers, allTags) => {
            if (!f.tagIds || f.tagIds.length === 0) return '';
            return f.tagIds
                .map(id => allTags.find(t => t.id === id))
                .filter((t): t is Tag => !!t && t.category !== 'リレーション')
                .map(t => t.name)
                .join(', ');
        },
    },
    // ── PR・掲載に関する情報 ──────────────────────
    {
        id: 'faceVisibility',
        label: '顔出し可否',
        defaultVisible: false,
        render: (f) => f.faceVisibility || '-',
        sortValue: (f) => f.faceVisibility || '',
    },
    {
        id: 'faceVisibilityMemo',
        label: '顔出し詳細',
        defaultVisible: false,
        render: (f) => f.faceVisibilityMemo || '-',
        sortValue: (f) => f.faceVisibilityMemo || '',
    },
    {
        id: 'cookingClassStatus',
        label: '料理教室の運営状況',
        defaultVisible: false,
        render: (f) => f.cookingClassStatus || '-',
        sortValue: (f) => f.cookingClassStatus || '',
    },
    {
        id: 'notePermission',
        label: 'フーディスト掲載可否',
        defaultVisible: false,
        render: (f) => {
            const perm = f.noteFeaturedPermission;
            const hasMemo = !!f.noteFeaturedMemo;
            const isOk = perm === '掲載可（事前確認は不要、掲載後に案内があればOK）';
            const isOkWithConfirm = perm === '掲載可（事前確認が必要）';
            const isNg = perm === '掲載不可';
            const permColor = isNg ? '#c0392b'
                : isOkWithConfirm ? '#b7791f'
                : isOk && !hasMemo ? '#27ae60'
                : isOk && hasMemo ? '#b7791f'
                : 'inherit';
            const shortLabel = isOk ? '掲載可（確認不要）'
                : isOkWithConfirm ? '掲載可（要確認）'
                : isNg ? '掲載不可'
                : perm || '-';
            return (
                <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                    <div style={{
                        color: permColor,
                        fontWeight: (perm && perm !== '未設定') ? 'bold' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexWrap: 'wrap',
                    }}>
                        {shortLabel}
                        {hasMemo && (
                            <span style={{
                                fontSize: '0.65rem',
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fbbf24',
                                borderRadius: '3px',
                                padding: '0 4px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                            }} title={f.noteFeaturedMemo}>
                                特記事項あり
                            </span>
                        )}
                    </div>
                </div>
            );
        },
        sortValue: (f) => f.noteFeaturedPermission || '',
        csvValue: (f) => {
            const perm = f.noteFeaturedPermission || '';
            const memo = f.noteFeaturedMemo ? `（備考: ${f.noteFeaturedMemo}）` : '';
            return perm + memo;
        },
    },
    {
        id: 'proposalMemo',
        label: '提案時メモ',
        defaultVisible: false,
        render: (f) => {
            const memo = f.notes?.filter(n => n.noteType === '提案時メモ').map(n => n.content).join('\n');
            if (!memo) return '-';
            return <span title={memo}>{memo.length > 20 ? memo.slice(0, 20) + '...' : memo}</span>;
        },
        sortValue: (f) => f.notes?.filter(n => n.noteType === '提案時メモ').map(n => n.content).join('\n') || '',
        csvValue: (f) => f.notes?.filter(n => n.noteType === '提案時メモ').map(n => n.content).join('\n') || '',
    },
    {
        id: 'otherMemo',
        label: 'その他メモ',
        defaultVisible: false,
        render: (f) => {
            const memo = f.notes?.filter(n => n.noteType === 'その他').map(n => n.content).join('\n');
            if (!memo) return '-';
            return <span title={memo}>{memo.length > 20 ? memo.slice(0, 20) + '...' : memo}</span>;
        },
        sortValue: (f) => f.notes?.filter(n => n.noteType === 'その他').map(n => n.content).join('\n') || '',
        csvValue: (f) => f.notes?.filter(n => n.noteType === 'その他').map(n => n.content).join('\n') || '',
    },
    // ── 連絡先（デフォルト非表示） ─────────────────
    {
        id: 'email',
        label: 'メールアドレス',
        defaultVisible: false,
        render: (f) => f.email || '-',
        sortValue: (f) => f.email || '',
    },
    {
        id: 'phoneNumber',
        label: '電話番号',
        defaultVisible: false,
        render: (f) => f.phoneNumber || '-',
        sortValue: (f) => f.phoneNumber || '',
    },
    // ── システム管理用 ────────────────────────────
    {
        id: 'aliases',
        label: '活動名（別名）',
        defaultVisible: false,
        render: (f) => f.aliases && f.aliases.length > 0 ? f.aliases.join(', ') : '-',
        sortValue: (f) => f.aliases?.join(', ') || '',
    },
    {
        id: 'lastSurveyDate',
        label: '最新アンケート回答日',
        defaultVisible: false,
        render: (f, _getFollowers, allTags) => {
            const hasTag = f.tagIds?.some(id => allTags.find(t => t.id === id)?.name === 'アンケート回答あり');
            if (!hasTag) return '-';
            return f.lastSurveyDate ? f.lastSurveyDate.slice(0, 10) : '不明';
        },
        sortValue: (f, _getFollowers, allTags) => {
            const hasTag = f.tagIds?.some(id => allTags.find(t => t.id === id)?.name === 'アンケート回答あり');
            return hasTag ? (f.lastSurveyDate || '') : '';
        },
        csvValue: (f, _getFollowers, allTags) => {
            const hasTag = f.tagIds?.some(id => allTags.find(t => t.id === id)?.name === 'アンケート回答あり');
            if (!hasTag) return '';
            return f.lastSurveyDate ? f.lastSurveyDate.slice(0, 10) : '不明';
        },
    },
    {
        id: 'createdAt',
        label: '登録日',
        defaultVisible: false,
        render: (f) => f.createdAt ? f.createdAt.slice(0, 10) : '-',
        sortValue: (f) => f.createdAt,
    },
    {
        id: 'sysUpdatedAt',
        label: '最終更新日時',
        defaultVisible: false,
        render: (f) => f.updatedAt ? f.updatedAt.slice(0, 10) : '-',
        sortValue: (f) => f.updatedAt || '',
    },
];
