import './Sidebar.css';

interface SidebarProps {
    currentView: 'dashboard' | 'database';
    setCurrentView: (view: 'dashboard' | 'database') => void;
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
                        <span className="nav-icon">👥</span>
                        フーディスト検索
                    </li>
                    <li
                        className={`nav-item ${currentView === 'database' ? 'active' : ''}`}
                        onClick={() => setCurrentView('database')}
                        style={{ cursor: 'pointer', marginTop: '8px' }}
                    >
                        <span className="nav-icon">🗄️</span>
                        データベース管理
                    </li>
                </ul>
            </nav>
        </aside >
    );
};
