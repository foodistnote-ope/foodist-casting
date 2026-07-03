import './Sidebar.css';

interface SidebarProps {
    currentView: 'dashboard' | 'database' | 'review' | 'guide';
    setCurrentView: (view: 'dashboard' | 'database' | 'review' | 'guide') => void;
}

export const Sidebar = ({ currentView, setCurrentView }: SidebarProps) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="brand-text" style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.2 }}>フーディストデータベース</span>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li
                        className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setCurrentView('dashboard')}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </span>
                        フーディスト検索
                    </li>
                    <li
                        className={`nav-item ${currentView === 'database' ? 'active' : ''}`}
                        onClick={() => setCurrentView('database')}
                        style={{ cursor: 'pointer', marginTop: '8px' }}
                    >
                        <span className="nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                        </span>
                        データベース管理
                    </li>
                    <li
                        className={`nav-item nav-review ${currentView === 'review' ? 'active' : ''}`}
                        onClick={() => setCurrentView('review')}
                        style={{ cursor: 'pointer', marginTop: '8px' }}
                    >
                        <span className="nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </span>
                        登録審査
                    </li>
                    <li
                        className={`nav-item ${currentView === 'guide' ? 'active' : ''}`}
                        onClick={() => setCurrentView('guide')}
                        style={{ cursor: 'pointer', marginTop: '8px' }}
                    >
                        <span className="nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </span>
                        使い方・注意事項
                    </li>
                </ul>
            </nav>
        </aside >
    );
};
