import { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import type { Foodist, Tag } from '../data/types';
import { normalizeString } from '../hooks/useFoodists';
import { downloadCsvAsShiftJis } from '../utils/csvExport';
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

import { AVAILABLE_COLUMNS, getMediaFollowers } from '../utils/exportColumns';

export const DatabaseView = ({ foodists, allTags, onEdit, onAdd, onImport, onDelete, isImporting, onPatchImport, isPatchImporting }: DatabaseViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    
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

    return (
        <div className="database-view">
            <header className="db-header">
                <div className="db-actions">
                    <div className="db-search-wrapper">
                        <input
                            type="text"
                            placeholder="活動名・肩書き・詳細プロフィール・メモなどで検索..."
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
                                        <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setVisibleColumnIds(AVAILABLE_COLUMNS.map(c => c.id))}>すべて表示</button>
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

                    <button className="btn-secondary" onClick={handleExportCsv} title="表示中のデータをCSV形式でダウンロード">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        CSV出力
                    </button>

                    <button className="btn-primary" onClick={onAdd}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        新規登録
                    </button>
                    <label className={`btn-secondary ${isImporting ? 'loading' : ''}`} style={{ cursor: 'pointer' }} title="新規フーディストを一括追加するCSV">
                        {isImporting ? (
                            '読込中...'
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                新規追加CSV
                            </>
                        )}
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onImport} disabled={isImporting} />
                    </label>
                    <label
                        className={`btn-secondary ${isPatchImporting ? 'loading' : ''}`}
                        style={{ cursor: 'pointer', borderColor: '#d4844a', color: '#d4844a' }}
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
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onPatchImport} disabled={isPatchImporting} />
                    </label>
                    <a
                        href="/foodist_patch_template.csv"
                        download="foodist_patch_template.csv"
                        className="btn-secondary"
                        title="部分更新CSVのテンプレートをダウンロード"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
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
                                            <span className="sort-icon sort-icon-idle">▼</span>
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
        </div>
    );
};
