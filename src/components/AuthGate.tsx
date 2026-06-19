import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './AuthGate.css';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 起動時にSupabaseのセッションを確認する
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkSession();

    // セッションの変化をリッスンする
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setTimeout(() => setError(null), 3000);
    }
    setLoading(false);
  };

  // セッション確認中はローディング表示
  if (isAuthenticated === null) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="auth-gate-container">
      <div className="auth-card">
        <p className="auth-description">
          このツールは社内関係者専用です。<br />
          メールアドレスとパスワードを入力してください。
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="password-input-group">
            <label htmlFor="access-email">Email</label>
            <input
              id="access-email"
              name="email"
              type="email"
              autoComplete="email"
              className={`auth-input ${error ? 'error' : ''}`}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

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
              required
            />
            <div className="error-message">
              {error && error}
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
};
