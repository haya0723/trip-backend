import React, { useState } from 'react';
// import './LoginScreen.css'; // 必要に応じて作成

function LoginScreen({ onLogin, onNavigateToSignup, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // rememberMe はUI上残すが、APIには送らない
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'メールアドレスを入力してください。';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '有効なメールアドレスを入力してください。';
    if (!password) newErrors.password = 'パスワードを入力してください。';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[LoginScreen] handleSubmit called'); // デバッグログ追加
    const isValid = validateForm();
    console.log('[LoginScreen] Validation result:', isValid); // デバッグログ追加
    if (!isValid) {
      return;
    }
    // 実際のログイン処理を呼び出す
    console.log('ログイン試行 (handleSubmit in LoginScreen.jsx):', { email, password });
    onLogin({ email, password }); // email と password のみ渡す
  };

  return (
    <div className="login-screen auth-screen"> 
      <header className="app-header">
        <h1>ログイン</h1>
      </header>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* フォーム全体のエラーメッセージ表示は削除 (各フィールドで表示するため、または onLogin の結果で表示) */}
        {/* {errors.form && <p className="error-message">{errors.form}</p>} */}
        <div className="form-section">
          <label htmlFor="email">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-describedby="emailError"
          />
          {errors.email && <p id="emailError" className="error-message field-error">{errors.email}</p>}
        </div>
        <div className="form-section">
          <label htmlFor="password">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-describedby="passwordError"
          />
          {errors.password && <p id="passwordError" className="error-message field-error">{errors.password}</p>}
        </div>
        <div className="form-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <label htmlFor="rememberMe" style={{ display: 'flex', alignItems: 'center', marginBottom: 0, fontWeight: 'normal', fontSize: '0.9em' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '8px', width: 'auto' }}
            />
            次回から自動的にログインする
          </label>
        </div>
        <button type="submit" className="auth-button">ログイン</button>
      </form>

      <div className="social-login-section" style={{ textAlign: 'center', marginTop: '20px', marginBottom: '10px' }}>
        <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '10px' }}>または</p>
        <button className="social-login-button google" style={{marginRight: '10px', padding: '10px 15px', background: '#db4437', color: 'white', border: 'none', borderRadius: '4px'}}>Googleでログイン</button>
        <button className="social-login-button apple" style={{padding: '10px 15px', background: '#000000', color: 'white', border: 'none', borderRadius: '4px'}}>Appleでログイン</button>
        {/* TODO: 各ソーシャルログインの処理を実装 */}
      </div>

      <div className="auth-links">
        <button onClick={onForgotPassword} className="link-button">パスワードをお忘れですか？</button>
        <button onClick={onNavigateToSignup} className="link-button">アカウントをお持ちでないですか？ 新規登録</button>
      </div>
    </div>
  );
}

export default LoginScreen;
