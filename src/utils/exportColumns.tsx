import type { Foodist, Tag } from '../data/types';

export type ColumnDef = {
    id: string;
    label: string;
    defaultVisible: boolean;
    excludeFromExport?: boolean;
    render: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => React.ReactNode;
    sortValue?: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => string | number | undefined | null;
};

export const getMediaFollowers = (f: Foodist, mediaType: string): number | undefined => {
    return f.mediaAccounts.find(a => a.mediaType === mediaType)?.metricValue;
};

export const AVAILABLE_COLUMNS: ColumnDef[] = [
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
        defaultVisible: true,
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
        defaultVisible: false,
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
        id: 'membership',
        label: '会員',
        defaultVisible: true,
        render: (f) => (
            <span className={`membership-badge membership-${f.membershipStatus}`}>
                {f.membershipStatus}
            </span>
        ),
        sortValue: (f) => f.membershipStatus,
    },
    {
        id: 'hasChildren',
        label: '子ども',
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
        id: 'childrenCount',
        label: '子どもの数',
        defaultVisible: false,
        render: (f) => f.childrenCount || '-',
        sortValue: (f) => f.childrenCount || '',
    },
    {
        id: 'maritalStatus',
        label: '婚姻状況',
        defaultVisible: false,
        render: (f) => f.maritalStatus || '-',
        sortValue: (f) => f.maritalStatus || '',
    },
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
        defaultVisible: true,
        render: (f, getFollowers) => getFollowers(f, 'Instagram')?.toLocaleString() || '-',
        sortValue: (f, getFollowers) => getFollowers(f, 'Instagram') || 0,
    },
    {
        id: 'x',
        label: 'X',
        defaultVisible: true,
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
    {
        id: 'notePermission',
        label: 'ノート掲載',
        defaultVisible: true,
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
                        {perm || '-'}
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
    },
    {
        id: 'createdAt',
        label: '登録日',
        defaultVisible: true,
        excludeFromExport: true,
        render: (f) => f.createdAt ? new Date(f.createdAt).toLocaleDateString('ja-JP') : '-',
        sortValue: (f) => f.createdAt || '',
    },
    {
        id: 'faceVisibilityMemo',
        label: '顔出し詳細',
        defaultVisible: false,
        render: (f) => f.faceVisibilityMemo || '-',
        sortValue: (f) => f.faceVisibilityMemo || '',
    },
];
