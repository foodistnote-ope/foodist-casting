import { useState } from 'react';
import type { Foodist, Tag } from '../data/types';
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

export const DatabaseView = ({ foodists, allTags, onEdit, onAdd, onImport, onDelete, isImporting, onPatchImport, isPatchImporting }: DatabaseViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoodists = foodists.filter(f => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;

        // タグ名の解決
        const tagNames = f.tagIds.map(id => allTags.find(t => t.id === id)?.name || '').join(' ').toLowerCase();

        return f.displayName.toLowerCase().includes(q) ||
        (f.realName || '').toLowerCase().includes(q) ||
        (f.title || '').toLowerCase().includes(q) ||
        (f.listIntro || '').toLowerCase().includes(q) ||
        (f.aliases ?? []).some(a => a.toLowerCase().includes(q)) ||
        tagNames.includes(q) ||
        f.mediaAccounts.some(acc => 
          (acc.accountName || '').toLowerCase().includes(q) || 
          (acc.url || '').toLowerCase().includes(q)
        ) ||
        f.notes.some(n => n.content.toLowerCase().includes(q));
    });

    // Instagram フォロワー数（mediaAccounts から取得）
    const getInstagramFollowers = (f: Foodist): number | undefined => {
        return f.mediaAccounts.find(a => a.mediaType === 'Instagram')?.metricValue;
    };
    const getXFollowers = (f: Foodist): number | undefined => {
        return f.mediaAccounts.find(a => a.mediaType === 'X')?.metricValue;
    };

    return (
        <div className="database-view">
            <header className="db-header">
                <h2>フーディスト データベース管理</h2>
                <div className="db-actions">
                    <input
                        type="text"
                        placeholder="名前・肩書き・アカウント・メモで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="db-search"
                    />
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
                        download
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                        title="部分更新CSVのテンプレートをダウンロード"
                    >
                        📥 更新テンプレ
                    </a>
                </div>
            </header>

            <div className="table-container">
                <table className="db-table">
                    <thead>
                        <tr>
                            <th>活動名</th>
                            <th>肩書き</th>
                            <th>居住地</th>
                            <th>会員</th>
                            <th>総フォロワー</th>
                            <th>Instagram</th>
                            <th>X</th>
                            <th>年代</th>
                            <th>フーディストノート掲載可否</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFoodists.map(foodist => {
                            if (!foodist || !foodist.id) return null;
                            return (
                                <tr key={foodist.id}>
                                <td>
                                    <div className="td-name">{foodist.displayName}</div>
                                    {foodist.realName && foodist.realName !== foodist.displayName && (
                                        <div className="td-sub">{foodist.realName}</div>
                                    )}
                                </td>
                                <td className="td-sub">{foodist.title || '-'}</td>
                                <td>{foodist.area || '-'}</td>
                                <td>
                                    <span className={`membership-badge membership-${foodist.membershipStatus}`}>
                                        {foodist.membershipStatus}
                                    </span>
                                </td>
                                <td>{foodist.totalFollowers ? foodist.totalFollowers.toLocaleString() : '未設定'}</td>
                                <td>{getInstagramFollowers(foodist)?.toLocaleString() || '-'}</td>
                                <td>{getXFollowers(foodist)?.toLocaleString() || '-'}</td>
                                <td>{foodist.ageGroup || '-'}</td>
                                <td style={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                                    <div style={{ 
                                        color: foodist.noteFeaturedPermission === '掲載不可' ? '#c0392b' : 
                                               foodist.noteFeaturedPermission?.includes('掲載可') ? '#27ae60' : 'inherit',
                                        fontWeight: (foodist.noteFeaturedPermission && foodist.noteFeaturedPermission !== '未設定') ? 'bold' : 'normal'
                                    }}>
                                        {foodist.noteFeaturedPermission || '-'}
                                    </div>
                                    {foodist.noteFeaturedMemo && (
                                        <div className="td-sub" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={foodist.noteFeaturedMemo}>
                                            {foodist.noteFeaturedMemo}
                                        </div>
                                    )}
                                </td>
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
                                <td colSpan={10} className="td-empty">データが見つかりません。</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
