import React, { useState, useEffect } from 'react';
import './AuthGate.css';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState(false);

  // 正解のパスワード
  const CORRECT_PASSWORD = import.meta.env.VITE_APP_ACCESS_PASSWORD || 'foodist-casting-2026';

  useEffect(() => {
    const authStatus = localStorage.getItem('foodist_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('foodist_auth', 'true');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  if (isAuthenticated === null) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="auth-gate-container">
      <div className="auth-card">
        <p className="auth-description">
          このツールは社内関係者専用です。<br />
          アクセスするにはパスワードを入力してください。
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="password-input-group">
            <label htmlFor="access-password">Password</label>
            <input
              id="access-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`auth-input ${error ? 'error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <div className="error-message">
              {error && 'パスワードが正しくありません'}
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
};
