import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import type { Foodist, Tag } from '../data/types';
import { normalizeString } from '../hooks/useFoodists';
import { downloadCsvAsShiftJis } from '../utils/csvExport';
import './DatabaseView.css';

interface DatabaseViewProps {
    foodists: Foodist[];
    allTags: Tag[];
    onView?: (foodist: Foodist) => void;
    onEdit: (foodist: Foodist) => void;
    onAdd: () => void;
    onImport: (file: File, matchKey: '活動名' | 'ニックネーム' | 'メールアドレス') => void;
    onDelete?: (id: string) => void;
    isImporting: boolean;
    onPatchImport: (file: File, matchKey: '活動名' | 'ニックネーム' | 'メールアドレス') => void;
    isPatchImporting: boolean;
}

import { AVAILABLE_COLUMNS, getMediaFollowers } from '../utils/exportColumns';
import { CsvImportSettingsModal } from './CsvImportSettingsModal';

export const DatabaseView = ({ 
    foodists, 
    allTags, 
    onView,
    onEdit, 
    onAdd, 
    onImport, 
    onDelete, 
    isImporting, 
    onPatchImport, 
    isPatchImporting
}: DatabaseViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    // 絞り込み中のタグIDの一覧（複数選択AND絞り込み）
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [importSettingsModal, setImportSettingsModal] = useState<{ isOpen: boolean, type: 'full' | 'patch' }>({ isOpen: false, type: 'full' });
    
    // Column visibility state
    const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('db_visible_columns');
        if (saved) {
            try {
                const savedIds: string[] = JSON.parse(saved);
                // 保存済みリストにない新しい列は defaultVisible に従って補完する
                const newDefaultIds = AVAILABLE_COLUMNS
                    .filter(c => !savedIds.includes(c.id) && c.defaultVisible)
                    .map(c => c.id);
                return [...savedIds.filter(id => AVAILABLE_COLUMNS.some(c => c.id === id)), ...newDefaultIds];
            } catch (e) {
                // ignore
            }
        }
        return AVAILABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.id);
    });
    
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
    const columnDropdownRef = useRef<HTMLDivElement>(null);

    // Column Filters state
    const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const filterPopupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
                setActiveFilterColumn(null);
            }
        };
        if (activeFilterColumn) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeFilterColumn]);

    const getUniqueValuesForColumn = useCallback((colId: string) => {
        const col = AVAILABLE_COLUMNS.find(c => c.id === colId);
        if (!col) return [];
        const values = new Set<string>();
        foodists.forEach(f => {
            let val = '';
            if (col.csvValue) {
                val = String(col.csvValue(f, getMediaFollowers, allTags) ?? '');
            } else if (col.sortValue) {
                const sv = col.sortValue(f, getMediaFollowers, allTags);
                val = sv == null ? '' : String(sv);
            }
            if (val) {
                if (val.includes(',') && (colId.includes('tag') || colId === 'platforms' || colId === 'childStage' || colId === 'relation' || colId === 'alcohol')) {
                    val.split(',').forEach(v => {
                        const trimmed = v.trim();
                        if (trimmed) values.add(trimmed);
                    });
                } else {
                    values.add(val.trim());
                }
            }
        });
        let arr = Array.from(values).sort();

        const AREA_LIST = [
            '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
            '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
            '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
            '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
            '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県',
            '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
            '海外', 'その他', '未確認'
        ];

        const customOrders: Record<string, string[]> = {
            gender: ['女性', '男性', 'その他', '回答しない'],
            membership: ['あり', 'なし', '要確認'],
            maritalStatus: ['未婚', '既婚', '回答しない', '未確認'],
            hasChildren: ['あり', 'なし', '回答しない', '未確認'],
            childrenCount: ['0人', '1人', '2人', '3人', '4人以上', '回答しない', '未確認'],
            childStage: ['乳幼児', '未就学児', '小学生', '中高生', '成人'],
            faceVisibility: ['可', '条件付き可', '不可', '未設定'],
            alcohol: ['お酒を飲む', 'お酒を飲まない', 'お酒は飲まないがPR可'],
            cookingClassStatus: ['現在運営している', '過去運営していたことがある', '運営したことがない', '未確認'],
            notePermission: ['掲載可（事前確認は不要、掲載後に案内があればOK）', '掲載可（事前確認が必要）', '掲載不可', '未設定'],
            instagram_reels: ['ほぼ毎日', '週3~5回ほど', '週1~2回ほど', '月1~2回ほど', '月1回以下', '投稿したことがない'],
            area: AREA_LIST,
            birthplace: AREA_LIST
        };

        if (customOrders[colId]) {
            const order = customOrders[colId];
            // データに存在しない標準の選択肢もフィルターに表示させるため追加
            order.forEach(o => {
                if (!arr.includes(o)) {
                    arr.push(o);
                }
            });

            arr.sort((a, b) => {
                const ia = order.indexOf(a);
                const ib = order.indexOf(b);
                if (ia !== -1 && ib !== -1) return ia - ib;
                if (ia !== -1) return -1;
                if (ib !== -1) return 1;
                return a.localeCompare(b, 'ja');
            });
        } else if (colId.includes('tag')) {
            const CATEGORY_ORDER = [
                '得意な料理ジャンル',
                '資格・専門',
                '実績',
                '対応可能業務',
                'ステータス',
                'アンバサダー・パートナー'
            ];

            arr.sort((a, b) => {
                const tagA = allTags.find(t => t.name === a);
                const tagB = allTags.find(t => t.name === b);
                if (tagA && tagB) {
                    if (tagA.category !== tagB.category) {
                        const idxA = CATEGORY_ORDER.indexOf(tagA.category);
                        const idxB = CATEGORY_ORDER.indexOf(tagB.category);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return tagA.category.localeCompare(tagB.category, 'ja');
                    }
                    return tagA.sortOrder - tagB.sortOrder;
                }
                return a.localeCompare(b, 'ja');
            });
        }

        return arr;
    }, [foodists, allTags]);

    const toggleFilterValue = (colId: string, value: string) => {
        setColumnFilters(prev => {
            const current = prev[colId] || [];
            const next = current.includes(value) 
                ? current.filter(v => v !== value) 
                : [...current, value];
            return { ...prev, [colId]: next };
        });
    };

    const clearFilter = (colId: string) => {
        setColumnFilters(prev => {
            const copy = { ...prev };
            delete copy[colId];
            return copy;
        });
        setActiveFilterColumn(null);
    };

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(() => {
        const saved = localStorage.getItem('db_sort_config');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        return { key: 'createdAt', direction: 'desc' };
    });

    // Save visible columns
    useEffect(() => {
        localStorage.setItem('db_visible_columns', JSON.stringify(visibleColumnIds));
    }, [visibleColumnIds]);

    // Save sort config
    useEffect(() => {
        localStorage.setItem('db_sort_config', JSON.stringify(sortConfig));
    }, [sortConfig]);

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

    // タグをクリックしたとき：選択㢧のトグル（既に選択済みなら解除、未選択なら追加）
    const handleTagClick = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    // 選択中タグを解除する（バッジの ✕ ボタン用）
    const removeTagFilter = (tagId: string) => {
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
    };

    // キーワードとタグ絞り込みをまとめてリセットする
    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedTagIds([]);
    };

    const filteredFoodists = useMemo(() => {
        let result = foodists.filter(f => {
            // Apply column filters
            for (const [colId, selectedValues] of Object.entries(columnFilters)) {
                if (!selectedValues || selectedValues.length === 0) continue;
                const col = AVAILABLE_COLUMNS.find(c => c.id === colId);
                if (!col) continue;
                
                let val = '';
                if (col.csvValue) {
                    val = String(col.csvValue(f, getMediaFollowers, allTags) ?? '');
                } else if (col.sortValue) {
                    const sv = col.sortValue(f, getMediaFollowers, allTags);
                    val = sv == null ? '' : String(sv);
                }
                
                if (val.includes(',') && (colId.includes('tag') || colId === 'platforms' || colId === 'childStage' || colId === 'relation' || colId === 'alcohol')) {
                    const valArray = val.split(',').map(v => v.trim());
                    if (!selectedValues.some(sv => valArray.includes(sv))) {
                        return false;
                    }
                } else {
                    if (!selectedValues.includes(val.trim())) {
                        return false;
                    }
                }
            }

            const q = searchQuery.toLowerCase();

            // キーワードフィルタ（空欄なら通過）
            if (q) {
                const nq = normalizeString(searchQuery);
                const tagNames = f.tagIds.map(id => allTags.find(t => t.id === id)?.name || '').join(' ').toLowerCase();
                const nTagNames = normalizeString(tagNames);

                const keywordMatch =
                    f.displayName.toLowerCase().includes(q) ||
                    normalizeString(f.displayName).includes(nq) ||
                    (f.realName || '').toLowerCase().includes(q) ||
                    normalizeString(f.realName).includes(nq) ||
                    (f.title || '').toLowerCase().includes(q) ||
                    normalizeString(f.title).includes(nq) ||
                    (f.listIntro || '').toLowerCase().includes(q) ||
                    normalizeString(f.listIntro || '').includes(nq) ||
                    (f.profileText || '').toLowerCase().includes(q) ||
                    normalizeString(f.profileText || '').includes(nq) ||
                    (f.aliases ?? []).some(a => a.toLowerCase().includes(q) || normalizeString(a).includes(nq)) ||
                    tagNames.includes(q) || nTagNames.includes(nq) ||
                    f.mediaAccounts.some(acc =>
                      (acc.accountName || '').toLowerCase().includes(q) ||
                      (acc.url || '').toLowerCase().includes(q)
                    ) ||
                    (f.faceVisibilityMemo || '').toLowerCase().includes(q) ||
                    normalizeString(f.faceVisibilityMemo || '').includes(nq) ||
                    f.notes.some(n => n.content.toLowerCase().includes(q) || normalizeString(n.content).includes(nq));

                if (!keywordMatch) return false;
            }

            // タグANDフィルタ：選択中のタグをすべて持つ人だけ通過
            if (selectedTagIds.length > 0) {
                if (!selectedTagIds.every(tid => f.tagIds.includes(tid))) return false;
            }

            return true;
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
    }, [foodists, searchQuery, allTags, sortConfig, columnFilters, selectedTagIds]);

    const visibleColumns = AVAILABLE_COLUMNS.filter(c => visibleColumnIds.includes(c.id));

    const handleExportCsv = () => {
        if (filteredFoodists.length === 0) {
            alert('出力するデータがありません。');
            return;
        }

        const exportColumns = visibleColumns.filter(c => !c.excludeFromExport);
        const headers = exportColumns.map(col => col.label);
        const data = filteredFoodists.map(f => {
            return exportColumns.map(col => {
                if (col.csvValue) {
                    return col.csvValue(f, getMediaFollowers, allTags);
                }
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
        }, {
            newline: '\r\n'
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        downloadCsvAsShiftJis(csv, `foodist_export_${timestamp}.csv`);
    };

    const isFiltered = searchQuery.length > 0 || Object.values(columnFilters).some(arr => arr.length > 0) || selectedTagIds.length > 0;

    return (
        <div className="database-view">
            <header className="db-header">
                <div className="db-actions">
                    <div className="db-search-wrapper">
                        <input
                            type="text"
                            placeholder="活動名・肩書き・プロフィール・メモなどで検索..."
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
                    {/* 検索件数バッジ */}
                    {isFiltered && (
                        <div style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: '600',
                            color: 'var(--color-brand-primary)', 
                            backgroundColor: 'var(--color-bg-hover)',
                            border: '1px solid #ffcc80',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(230, 81, 0, 0.1)'
                        }}>
                            {filteredFoodists.length}件ヒット
                        </div>
                    )}
                    
                    {/* Column Toggler & Export Group */}
                    <div className="csv-export-group">
                        <div className="column-dropdown-container" ref={columnDropdownRef}>
                            <button 
                                className="btn-text-export-settings" 
                                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                                title="表示項目の設定"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                表示項目 <span className="export-count-badge">{visibleColumnIds.length}</span>
                            </button>
                            {isColumnDropdownOpen && (
                                <div className="column-dropdown-menu">
                                    <div className="column-dropdown-header">
                                        <span>表示項目の設定</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setVisibleColumnIds(AVAILABLE_COLUMNS.map(c => c.id))}>すべて表示</button>
                                            <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setVisibleColumnIds(['name'])}>クリア</button>
                                            <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => {
                                                setVisibleColumnIds(AVAILABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.id));
                                                setSortConfig({ key: 'createdAt', direction: 'desc' });
                                            }}>初期設定に戻す</button>
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
                        <div className="export-divider"></div>
                        <button className="btn-dashboard-export" onClick={handleExportCsv} title="表示中のデータをCSV形式でダウンロード">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            CSV出力
                        </button>
                    </div>

                    <button className="btn-primary" onClick={onAdd}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        新規登録
                    </button>
                    <button className={`btn-secondary db-btn-csv-new ${isImporting ? 'loading' : ''}`} onClick={() => setImportSettingsModal({ isOpen: true, type: 'full' })} disabled={isImporting} title="新規フーディストを一括追加するCSV">
                        {isImporting ? (
                            '読込中...'
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                新規追加CSV
                            </>
                        )}
                    </button>
                    <button
                        className={`btn-secondary db-btn-csv-patch ${isPatchImporting ? 'loading' : ''}`}
                        style={{ borderColor: '#d4844a', color: '#d4844a' }}
                        onClick={() => setImportSettingsModal({ isOpen: true, type: 'patch' })}
                        disabled={isPatchImporting}
                        title="既存フーディストの特定項目を一括更新するCSV（新規追加はされません）"
                    >
                        {isPatchImporting ? (
                            '更新中...'
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                部分更新CSV
                            </>
                        )}
                    </button>

                    <a
                        href="/foodist_patch_template.csv"
                        download="foodist_patch_template.csv"
                        className="btn-secondary db-btn-template"
                        title="部分更新CSVのテンプレートをダウンロード"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        更新テンプレ
                    </a>
                </div>
            </header>

            {/* タグ絞り込みバッジエリア：選択中のタグを表示し ✕ で解除できる */}
            {selectedTagIds.length > 0 && (
                <div className="db-tag-filter-bar">
                    <span className="db-tag-filter-label">タグ絞り込み中：</span>
                    {selectedTagIds.map(tagId => {
                        const tag = allTags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                            <span key={tagId} className="db-tag-filter-badge">
                                {tag.name}
                                <button
                                    className="db-tag-filter-remove"
                                    onClick={() => removeTagFilter(tagId)}
                                    aria-label={`「${tag.name}」の絞り込みを解除`}
                                    type="button"
                                >
                                    ✕
                                </button>
                            </span>
                        );
                    })}
                    <button
                        className="db-tag-filter-clear-all"
                        onClick={clearAllFilters}
                        type="button"
                    >
                        すべてクリア
                    </button>
                </div>
            )}

            <div className="table-container">
                <table className="db-table">
                    <thead>
                        <tr>
                            {visibleColumns.map(col => (
                                <th 
                                    key={col.id} 
                                    className={col.sortValue ? 'sortable-header' : ''}
                                    style={{ position: 'relative' }}
                                >
                                    <div className="th-content" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between', width: '100%' }}>
                                        <div onClick={() => handleSort(col.id)} style={{ cursor: col.sortValue ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                            {col.label}
                                            {sortConfig?.key === col.id && (
                                                <span className="sort-icon">
                                                    {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                                </span>
                                            )}
                                            {sortConfig?.key !== col.id && col.sortValue && (
                                                <span className="sort-icon sort-icon-idle">▼</span>
                                            )}
                                        </div>
                                        {(() => {
                                            const NO_FILTER_COLUMNS = [
                                                'name', 'realName', 'title', 'avatarUrl', 'birthDate', 'age', 
                                                'profileText', 'faceVisibilityMemo', 'noteFeaturedMemo', 
                                                'email', 'phoneNumber', 'proposalMemo', 'otherMemo', 
                                                'totalFollowers', 'aliases', 'createdAt', 'sysUpdatedAt', 'lastSurveyDate'
                                            ];
                                            const isFilterable = !NO_FILTER_COLUMNS.includes(col.id) && 
                                                !col.id.endsWith('_url') && 
                                                !col.id.endsWith('_updatedAt') && 
                                                !['instagram', 'x', 'tiktok', 'youtube', 'lemon8', 'note', 'blog'].includes(col.id);
                                            
                                            if (!isFilterable) return null;

                                            return (
                                                <button 
                                                    className="btn-text" 
                                                    style={{ 
                                                        padding: '4px',
                                                        marginLeft: '2px',
                                                        color: columnFilters[col.id]?.length ? 'var(--primary-color)' : (activeFilterColumn === col.id ? '#475569' : '#94a3b8'),
                                                        backgroundColor: 'transparent',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: 'none',
                                                        transition: 'color 0.2s',
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveFilterColumn(prev => prev === col.id ? null : col.id);
                                                    }}
                                                    title={`${col.label}で絞り込む`}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                                    </svg>
                                                </button>
                                            );
                                        })()}
                                    </div>

                                    {activeFilterColumn === col.id && (
                                        <div 
                                            ref={filterPopupRef}
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                minWidth: '220px',
                                                maxHeight: '300px',
                                                overflowY: 'auto',
                                                background: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                zIndex: 100,
                                                padding: '8px',
                                                fontWeight: 'normal',
                                                fontSize: '0.85rem',
                                                color: '#333',
                                                textAlign: 'left',
                                                whiteSpace: 'normal',
                                                cursor: 'default'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div style={{ paddingBottom: '8px', borderBottom: '1px solid #eee', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '0.8rem' }}>{col.label} の絞り込み</strong>
                                                {(columnFilters[col.id]?.length ?? 0) > 0 && (
                                                    <button className="btn-text" style={{ fontSize: '0.75rem', color: '#d9534f', padding: '2px 4px' }} onClick={() => clearFilter(col.id)}>クリア</button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {getUniqueValuesForColumn(col.id).map(val => (
                                                    <label key={val} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }} className="hover-bg-gray">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={(columnFilters[col.id] || []).includes(val)}
                                                            onChange={() => toggleFilterValue(col.id, val)}
                                                            style={{ marginTop: '2px', cursor: 'pointer' }}
                                                        />
                                                        <span style={{ wordBreak: 'break-word', lineHeight: '1.2' }}>{val || '(空白)'}</span>
                                                    </label>
                                                ))}
                                                {getUniqueValuesForColumn(col.id).length === 0 && (
                                                    <div style={{ color: '#888', fontStyle: 'italic', padding: '4px' }}>値がありません</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                                            {/* タグ・リレーション列は onTagClick を渡して、クリックで絞り込めるようにする */}
                                            {col.render(foodist, getMediaFollowers, allTags, (col.id === 'tags' || col.id === 'relation') ? handleTagClick : undefined)}
                                        </td>
                                    ))}
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {onView && (
                                                <button className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => onView(foodist)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    詳細
                                                </button>
                                            )}
                                            <button className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => onEdit(foodist)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                編集
                                            </button>
                                            {onDelete && (
                                                <button className="btn-icon-danger" style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => onDelete(foodist.id)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    削除
                                                </button>
                                            )}
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
            
            {importSettingsModal.isOpen && (
                <CsvImportSettingsModal
                    title={importSettingsModal.type === 'full' ? '新規追加CSVのインポート' : '部分更新CSVのインポート'}
                    onClose={() => setImportSettingsModal({ isOpen: false, type: 'full' })}
                    onConfirm={(file, matchKey) => {
                        setImportSettingsModal({ isOpen: false, type: 'full' });
                        if (importSettingsModal.type === 'full') {
                            onImport(file, matchKey);
                        } else {
                            onPatchImport(file, matchKey);
                        }
                    }}
                />
            )}
        </div>
    );
};
