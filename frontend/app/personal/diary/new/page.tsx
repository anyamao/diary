'use client';

import { useState } from 'react';

export default function NewEntryPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Отправляем все обязательные поля
    const entryData = {
      title: title,
      content: content,
      mood: "noemotions",  // обязательное поле
      tags: "",            // обязательное поле
      is_favorite: false   // обязательное поле
    };

    console.log('Sending data:', entryData);

    try {
      const res = await fetch('https://api.vibenote.ru/diary/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entryData)
      });
      
      const data = await res.json();
      console.log('Response:', data);
      
      if (res.ok) {
        window.location.href = '/personal/diary';
      } else {
        setError(data.detail?.[0]?.msg || 'Ошибка сохранения');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Ошибка соединения с сервером');
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Новая запись</h1>
      <a href="/personal/diary" style={{ color: '#db2777', textDecoration: 'none' }}>← Назад</a>
      
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.5rem', borderRadius: '4px', marginTop: '1rem' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Заголовок *</label>
          <input
            type="text"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Содержание</label>
          <textarea
            placeholder="Содержание"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            style={{ width: '100%', padding: '8px', border: '1px solid #f9a8d4', borderRadius: '4px' }}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '10px 20px', background: '#db2777', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}
