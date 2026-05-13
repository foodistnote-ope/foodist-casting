import type { Foodist, Tag } from '../data/types';

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
        id: 'gender',
        label: '性別',
        defaultVisible: true,
        render: (f) => f.gender || '-',
        sortValue: (f) => f.gender || '',
    },
    {
        id: 'ageGroup',
        label: '年代',
        defaultVisible: true,
        render: (f) => f.ageGroup || '-',
        sortValue: (f) => f.ageGroup || '',
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
                const countStr = f.childrenCount === '4人以上' || f.childrenCount === '非公開' ? f.childrenCount : `${f.childrenCount}人`;
                return `あり (${countStr})`;
            }
            return f.hasChildren || '-';
        },
        sortValue: (f) => f.hasChildren || '',
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
    {
        id: 'instagram',
        label: 'Instagram',
        defaultVisible: false,
        render: (f, getFollowers) => getFollowers(f, 'Instagram')?.toLocaleString() || '-',
        sortValue: (f, getFollowers) => getFollowers(f, 'Instagram') || 0,
    },
    {
        id: 'x',
        label: 'X',
        defaultVisible: false,
        render: (f, getFollowers) => getFollowers(f, 'X')?.toLocaleString() || '-',
        sortValue: (f, getFollowers) => getFollowers(f, 'X') || 0,
    },
    {
        id: 'tiktok',
        label: 'TikTok',
        defaultVisible: false,
        render: (f, getFollowers) => getFollowers(f, 'TikTok')?.toLocaleString() || '-',
        sortValue: (f, getFollowers) => getFollowers(f, 'TikTok') || 0,
    },
    {
        id: 'youtube',
        label: 'YouTube',
        defaultVisible: false,
        render: (f, getFollowers) => getFollowers(f, 'YouTube')?.toLocaleString() || '-',
        sortValue: (f, getFollowers) => getFollowers(f, 'YouTube') || 0,
    },
    {
        id: 'blog',
        label: 'ブログ (月間PV)',
        defaultVisible: false,
        render: (f, getFollowers) => getFollowers(f, 'ブログ')?.toLocaleString() || '-',
        sortValue: (f, getFollowers) => getFollowers(f, 'ブログ') || 0,
    },
    // ── スキル・タグ ──────────────────────────────
    {
        id: 'tags',
        label: 'スキル・タグ',
        defaultVisible: false,
        render: (f, _getFollowers, allTags) => {
            if (!f.tagIds || f.tagIds.length === 0) return '-';
            const names = f.tagIds
                .map(id => allTags.find(t => t.id === id)?.name)
                .filter(Boolean);
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
                .map(id => allTags.find(t => t.id === id)?.name)
                .filter(Boolean)
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
    {
        id: 'createdAt',
        label: '登録日',
        defaultVisible: false,
        render: (f) => f.createdAt ? f.createdAt.slice(0, 10) : '-',
        sortValue: (f) => f.createdAt,
    },
];
