'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import { HelpCircle, LogIn, UserPlus } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const { login, register, users, currentUser } = useApp();
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // If user is already logged in, redirect them or allow switching
  const handleQuickLogin = (uname: string) => {
    const success = login(uname);
    if (success) {
      router.push('/');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Kullanıcı adı boş bırakılamaz.');
      return;
    }

    if (isLoginView) {
      const success = login(username);
      if (success) {
        router.push('/');
      } else {
        setError('Kullanıcı bulunamadı. Lütfen kayıt olun veya başka bir kullanıcı adı deneyin.');
      }
    } else {
      if (!displayName.trim()) {
        setError('Görüntülenen ad boş bırakılamaz.');
        return;
      }
      const success = register(username, displayName);
      if (success) {
        router.push('/');
      } else {
        setError('Bu kullanıcı adı zaten alınmış.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.logoContainer}>
          <HelpCircle size={48} className={styles.logoIcon} />
          <span className={styles.logoText}>ask<span>.fm</span></span>
        </div>

        <h1 className={styles.title}>
          {isLoginView ? 'Tekrar Hoş Geldin' : 'Yeni Hesap Oluştur'}
        </h1>
        <p className={styles.subtitle}>
          {isLoginView 
            ? 'Merak ettiğin soruları sor, yanıtları gör.' 
            : 'Topluluğa katıl ve ilk sorunu al!'
          }
        </p>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              className="glass-input"
              placeholder="kullanici_adi"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            />
          </div>

          {!isLoginView && (
            <div className={styles.inputGroup}>
              <label htmlFor="displayName">Görüntülenen Ad</label>
              <input
                id="displayName"
                type="text"
                className="glass-input"
                placeholder="Görünen Adınız"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            {isLoginView ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{isLoginView ? 'Giriş Yap' : 'Kayıt Ol'}</span>
          </button>
        </form>

        <div className={styles.toggleView}>
          <span>
            {isLoginView ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
          </span>
          <button 
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError('');
            }}
            className={styles.toggleBtn}
          >
            {isLoginView ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </div>

        {/* Demo Quick Logins Section */}
        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Hızlı Test Hesapları</p>
          <div className={styles.demoGrid}>
            {users.map((u) => (
              <button
                key={u.username}
                onClick={() => handleQuickLogin(u.username)}
                className={`${styles.demoBtn} ${currentUser?.username === u.username ? styles.activeDemo : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.avatarUrl} alt={u.displayName} className={styles.demoAvatar} />
                <div className={styles.demoMeta}>
                  <span className={styles.demoName}>{u.displayName}</span>
                  <span className={styles.demoUname}>@{u.username}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
