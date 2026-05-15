import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import DatabaseView from './components/DatabaseView';
import AuthGate from './components/AuthGate';

function App() {
  const [activeMenu, setActiveMenu] = useState('database');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // ウィンドウサイズ変更時にサイドバーの状態を管理
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case 'database':
        return <DatabaseView />;
      default:
        return <DatabaseView />;
    }
  };

  return (
    <AuthGate>
      <div className="app-container">
        <Sidebar 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu} 
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <main className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
          {renderContent()}
        </main>
      </div>
    </AuthGate>
  );
}

export default App;
