import React, { useState } from 'react';
import './DatabaseView.css';
import FilterSidebar from './FilterSidebar';

const DatabaseView: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});
  
  // 仮データ
  const foodists = [
    { id: 1, name: '山田 はなこ', title: '時短料理研究家', genre: '時短・節約', area: '東京', sns: { instagram: '1.2万', youtube: '5000' }, tags: ['主婦', 'テレビ出演'] },
    { id: 2, name: '佐藤 ケン', title: 'パティシエ', genre: 'スイーツ', area: '大阪', sns: { instagram: '8.5万', twitter: '12万' }, tags: ['プロ', '出版経験'] },
    { id: 3, name: '田中 美咲', title: 'お弁当アドバイザー', genre: 'お弁当', area: '福岡', sns: { instagram: '4.2万' }, tags: ['キャラ弁', '丁寧な暮らし'] },
  ];

  return (
    <div className="database-view">
      <header className="dashboard-header">
        <div className="header-actions">
          <div className="header-search-group">
            <div className="header-search-wrapper">
              <input type="text" placeholder="キーワード検索" className="header-search-input" />
            </div>
            <button className="btn btn-secondary btn-header-filter" onClick={() => setIsFilterOpen(true)}>
              <span>🔍</span>
              {Object.keys(filters).length > 0 && <span className="filter-badge">{Object.keys(filters).length}</span>}
            </button>
          </div>
          <button className="btn btn-primary">新規登録</button>
        </div>
      </header>

      <div className="content-pad">
        <div className="search-overview">
          <p>該当者: <span className="stat-value">{foodists.length}</span> 名</p>
        </div>

        <div className="foodist-grid">
          {foodists.map(foodist => (
            <div key={foodist.id} className="foodist-card">
              <div className="card-top-decoration"></div>
              <div className="card-content">
                <div className="card-main-info">
                  <div className="card-avatar">{foodist.name[0]}</div>
                  <div className="card-header">
                    <span className="foodist-name">{foodist.name}</span>
                    <span className="foodist-title">{foodist.title}</span>
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="card-stats">
                    <span className="stat-label">ジャンル:</span>
                    <span className="stat-value">{foodist.genre}</span>
                  </div>
                  <div className="card-stats">
                    <span className="stat-label">エリア:</span>
                    <span className="stat-value">{foodist.area}</span>
                  </div>
                </div>

                <div className="card-tags">
                  {foodist.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};

export default DatabaseView;
