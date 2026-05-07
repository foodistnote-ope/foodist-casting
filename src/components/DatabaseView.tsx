import { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import type { Foodist, Tag } from '../data/types';
import { normalizeString } from '../hooks/useFoodists';
import './DatabaseView.css';

interface DatabaseViewProps {
    foodists: Foodist[];
    allTags: Tag[];
    onEdit: (foodist: Foodist) => void;
    onAdd: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete?: (id: string) => void;
    isImporting: boolean;
    onPatchImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isPatchImporting: boolean;
}

type ColumnDef = {
    id: string;
    label: string;
    defaultVisible: boolean;
    render: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => React.ReactNode;
    sortValue?: (f: Foodist, getFollowers: (f: Foodist, type: string) => number | undefined, allTags: Tag[]) => string | number | undefined | null;
};

const getMediaFollowers = (f: Foodist, mediaType: string): number | undefined => {
    return f.mediaAccounts.find(a => a.mediaType === mediaType)?.metricValue;
};

const AVAILABLE_COLUMNS: ColumnDef[] = [
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
        render: (f) => f.hasChildren || '-',
        sortValue: (f) => f.hasChildren || '',
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
        label: 'ブログ',
        defaultVisible: false,
        render: (f) => f.mediaAccounts.some(a => a.mediaType === 'ブログ') ? 'あり' : 'なし',
        sortValue: (f) => f.mediaAccounts.some(a => a.mediaType === 'ブログ') ? 1 : 0,
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
        render: (f) => f.createdAt ? new Date(f.createdAt).toLocaleDateString('ja-JP') : '-',
        sortValue: (f) => f.createdAt || '',
    },
];

export const DatabaseView = ({ foodists, allTags, onEdit, onAdd, onImport, onDelete, isImporting, onPatchImport, isPatchImporting }: DatabaseViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Column visibility state
    const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('db_visible_columns');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        return AVAILABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.id);
    });
    
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
    const columnDropdownRef = useRef<HTMLDivElement>(null);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

    // Save visible columns
    useEffect(() => {
        localStorage.setItem('db_visible_columns', JSON.stringify(visibleColumnIds));
    }, [visibleColumnIds]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
                setIsColumnDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (id: string) => {
        setVisibleColumnIds(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                if (prev.direction === 'asc') return { key, direction: 'desc' };
                return null; // toggle off
            }
            return { key, direction: 'asc' };
        });
    };

    const filteredFoodists = useMemo(() => {
        let result = foodists.filter(f => {
            const q = searchQuery.toLowerCase();
            if (!q) return true;

            const nq = normalizeString(searchQuery);
            const tagNames = f.tagIds.map(id => allTags.find(t => t.id === id)?.name || '').join(' ').toLowerCase();
            const nTagNames = normalizeString(tagNames);

            return f.displayName.toLowerCase().includes(q) ||
            normalizeString(f.displayName).includes(nq) ||
            (f.realName || '').toLowerCase().includes(q) ||
            normalizeString(f.realName).includes(nq) ||
            (f.title || '').toLowerCase().includes(q) ||
            normalizeString(f.title).includes(nq) ||
            (f.listIntro || '').toLowerCase().includes(q) ||
            (f.aliases ?? []).some(a => a.toLowerCase().includes(q) || normalizeString(a).includes(nq)) ||
            tagNames.includes(q) || nTagNames.includes(nq) ||
            f.mediaAccounts.some(acc => 
              (acc.accountName || '').toLowerCase().includes(q) || 
              (acc.url || '').toLowerCase().includes(q)
            ) ||
            f.notes.some(n => n.content.toLowerCase().includes(q) || normalizeString(n.content).includes(nq));
        });

        if (sortConfig) {
            const column = AVAILABLE_COLUMNS.find(c => c.id === sortConfig.key);
            if (column && column.sortValue) {
                result = [...result].sort((a, b) => {
                    const valA = column.sortValue!(a, getMediaFollowers, allTags);
                    const valB = column.sortValue!(b, getMediaFollowers, allTags);
                    
                    if (valA == null && valB == null) return 0;
                    if (valA == null) return sortConfig.direction === 'asc' ? 1 : -1;
                    if (valB == null) return sortConfig.direction === 'asc' ? -1 : 1;
                    
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        }

        return result;
    }, [foodists, searchQuery, allTags, sortConfig]);

    const visibleColumns = AVAILABLE_COLUMNS.filter(c => visibleColumnIds.includes(c.id));

    const handleExportCsv = () => {
        if (filteredFoodists.length === 0) {
            alert('出力するデータがありません。');
            return;
        }

        const headers = visibleColumns.map(col => col.label);
        const data = filteredFoodists.map(f => {
            return visibleColumns.map(col => {
                if (col.sortValue) {
                    const val = col.sortValue(f, getMediaFollowers, allTags);
                    return val == null ? '' : String(val);
                }
                return '';
            });
        });

        const csv = Papa.unparse({
            fields: headers,
            data: data
        });

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.setAttribute('download', `foodist_export_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="database-view">
            <header className="db-header">
                <div className="db-actions">
                    <div className="db-search-wrapper">
                        <input
                            type="text"
                            placeholder="名前・肩書き・アカウント・メモで検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="db-search"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                                aria-label="検索をクリア"
                                type="button"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {/* Column Toggler */}
                    <div className="column-dropdown-container" ref={columnDropdownRef}>
                        <button 
                            className="btn-secondary" 
                            onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                            title="表示項目の設定"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            表示項目
                        </button>
                        {isColumnDropdownOpen && (
                            <div className="column-dropdown-menu">
                                <div className="column-dropdown-header">
                                    <span>表示項目</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setVisibleColumnIds(AVAILABLE_COLUMNS.map(c => c.id))}>すべて</button>
                                        <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setVisibleColumnIds(['name'])}>クリア</button>
                                    </div>
                                </div>
                                <div className="column-dropdown-list">
                                    {AVAILABLE_COLUMNS.map(col => (
                                        <label key={col.id} className="column-dropdown-item">
                                            <input 
                                                type="checkbox" 
                                                checked={visibleColumnIds.includes(col.id)}
                                                onChange={() => toggleColumn(col.id)}
                                            />
                                            {col.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="btn-secondary" onClick={handleExportCsv} title="表示中のデータをCSV形式でダウンロード">
                        ⬇️ CSV出力
                    </button>

                    <button className="btn-primary" onClick={onAdd}>+ 新規登録</button>
                    <label className={`btn-secondary ${isImporting ? 'loading' : ''}`} style={{ cursor: 'pointer' }} title="新規フーディストを一括追加するCSV">
                        {isImporting ? '読込中...' : '新規追加CSV'}
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onImport} disabled={isImporting} />
                    </label>
                    <label
                        className={`btn-secondary ${isPatchImporting ? 'loading' : ''}`}
                        style={{ cursor: 'pointer', borderColor: '#d4844a', color: '#d4844a' }}
                        title="既存フーディストの特定項目を一括更新するCSV（新規追加はされません）"
                    >
                        {isPatchImporting ? '更新中...' : '🔄 部分更新CSV'}
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onPatchImport} disabled={isPatchImporting} />
                    </label>
                    <a
                        href="/foodist_patch_template.csv"
                        download="foodist_patch_template.csv"
                        className="btn-secondary"
                        title="部分更新CSVのテンプレートをダウンロード"
                    >
                        更新テンプレ
                    </a>
                </div>
            </header>

            <div className="table-container">
                <table className="db-table">
                    <thead>
                        <tr>
                            {visibleColumns.map(col => (
                                <th 
                                    key={col.id} 
                                    onClick={() => handleSort(col.id)}
                                    className={col.sortValue ? 'sortable-header' : ''}
                                >
                                    <div className="th-content">
                                        {col.label}
                                        {sortConfig?.key === col.id && (
                                            <span className="sort-icon">
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                        {sortConfig?.key !== col.id && col.sortValue && (
                                            <span className="sort-icon sort-icon-idle">▲</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFoodists.map(foodist => {
                            if (!foodist || !foodist.id) return null;
                            return (
                                <tr key={foodist.id}>
                                    {visibleColumns.map(col => (
                                        <td key={col.id}>
                                            {col.render(foodist, getMediaFollowers, allTags)}
                                        </td>
                                    ))}
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn-text" onClick={() => onEdit(foodist)}>編集</button>
                                            {onDelete && <button className="btn-icon-danger" style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }} onClick={() => onDelete(foodist.id)}>削除</button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredFoodists.length === 0 && (
                            <tr>
                                <td colSpan={visibleColumns.length + 1} className="td-empty">データが見つかりません。</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
