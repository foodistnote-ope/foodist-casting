import React from 'react';
import './FilterSidebar.css';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ isOpen, onClose, filters, setFilters }) => {
  const categories = [
    { id: 'genre', label: 'ジャンル', options: ['料理', 'スイーツ', 'パン', 'お弁当', '時短・節約', '健康・美容'] },
    { id: 'platform', label: '主要SNS', options: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Blog'] },
    { id: 'area', label: '活動エリア', options: ['東京', '神奈川', '埼玉', '千葉', '大阪', '愛知', '福岡', '北海道', '海外'] },
  ];

  return (
    <div className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="filter-header">
        <h3>絞り込み条件</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="filter-content">
        <div className="filter-section">
          <label className="section-label">キーワード</label>
          <input 
            type="text" 
            placeholder="名前、タグ、メモから検索..." 
            className="filter-input"
            value={filters.search || ''}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>

        {categories.map(cat => (
          <div key={cat.id} className="filter-section">
            <label className="section-label">{cat.label}</label>
            <div className="filter-options">
              {cat.options.map(opt => (
                <label key={opt} className="option-checkbox">
                  <input 
                    type="checkbox" 
                    checked={filters[cat.id]?.includes(opt)}
                    onChange={(e) => {
                      const current = filters[cat.id] || [];
                      const next = e.target.checked 
                        ? [...current, opt]
                        : current.filter((i: string) => i !== opt);
                      setFilters({...filters, [cat.id]: next});
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="filter-footer">
        <button className="btn btn-secondary" onClick={() => setFilters({})}>クリア</button>
        <button className="btn btn-primary" onClick={onClose}>適用する</button>
      </div>
    </div>
  );
};

export default FilterSidebar;
