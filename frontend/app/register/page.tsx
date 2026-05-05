'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('https://api.vibenote.ru/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, full_name: username })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('✅ Регистрация успешна! Перенаправление...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage('❌ Ошибка: ' + (data.detail || 'Что-то пошло не так'));
      }
    } catch (err) {
      setMessage('❌ Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fce7f3', padding: '1rem' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem', color: '#831843' }}>Регистрация</h1>
        <p style={{ textAlign: 'center', color: '#9d174d', marginBottom: '1.5rem' }}>Создайте новый аккаунт</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
          />
          <input
            type="password"
            placeholder="Пароль (минимум 8 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
          />
          
          {message && (
            <div style={{ padding: '8px', backgroundColor: message.includes('✅') ? '#dcfce7' : '#fee2e2', color: message.includes('✅') ? '#166534' : '#991b1b', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', backgroundColor: '#db2777', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px' }}>
          Уже есть аккаунт?{' '}
          <a href="/login" style={{ color: '#db2777' }}>Войти</a>
        </p>
      </div>
    </div>
  );
}
