import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, setActiveMenu, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'database', label: 'フーディストDB', icon: '👥' },
    { id: 'casting', label: 'キャスティング案', icon: '📝' },
    { id: 'projects', label: '案件管理', icon: '💼' },
    { id: 'reviews', label: '登録審査', icon: '🔍', desktopOnly: true },
  ];

  return (
    <>
      {/* モバイル用オーバーレイ */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(false)}
      />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🍳</span>
            <span className="logo-text">Foodist Casting</span>
          </div>
          <button className="sidebar-toggle-mobile" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            // スマホ版では desktopOnly 属性のあるメニューを非表示にする
            (!item.desktopOnly || window.innerWidth > 768) && (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (window.innerWidth <= 768) setIsOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">AD</div>
            <div className="user-details">
              <p className="user-name">Admin User</p>
              <p className="user-role">管理者</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
