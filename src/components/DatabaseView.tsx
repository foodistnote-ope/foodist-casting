import { useState } from 'react';
import type { Foodist } from '../data/types';
import './DatabaseView.css';

interface DatabaseViewProps {
    foodists: Foodist[];
    onEdit: (foodist: Foodist) => void;
    onAdd: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete?: (id: string) => void;
    isImporting: boolean;
}

export const DatabaseView = ({ foodists, onEdit, onAdd, onImport, onDelete, isImporting }: DatabaseViewProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoodists = foodists.filter(f =>
        f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.realName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        placeholder="名前・肩書きで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="db-search"
                    />
                    <button className="btn-primary" onClick={onAdd}>+ 新規登録</button>
                    <label className={`btn-secondary ${isImporting ? 'loading' : ''}`} style={{ cursor: 'pointer' }}>
                        {isImporting ? '読込中...' : 'CSVインポート'}
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onImport} disabled={isImporting} />
                    </label>
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
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFoodists.map(foodist => (
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
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn-text" onClick={() => onEdit(foodist)}>編集</button>
                                        {onDelete && <button className="btn-icon-danger" style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }} onClick={() => onDelete(foodist.id)}>削除</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredFoodists.length === 0 && (
                            <tr>
                                <td colSpan={9} className="td-empty">データが見つかりません。</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
