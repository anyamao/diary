'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://api.vibenote.ru/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Сохраняем токены
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        
        // Просто переходим на страницу дневника
        window.location.href = '/personal/diary';
      } else {
        setError(data.detail || 'Неверный email или пароль');
        setLoading(false);
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fce7f3' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '350px' }}>
        <h1 style={{ textAlign: 'center', color: '#831843' }}>Входlllll</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#db2777', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/register" style={{ color: '#db2777' }}>Регистрацияgggggggg</a>
        </p>
      </div>
    </div>
  );
}
