'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context';
import { 
  Home, 
  Inbox, 
  Search, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  LogIn, 
  Sun, 
  Moon,
  HelpCircle,
  MessageCircle,
  Bell,
  ShoppingBag,
  Coins
} from 'lucide-react';
import styles from './navbar.module.css';

export default function Navbar() {
  const { currentUser, logout, theme, toggleTheme, questions, notifications } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  // Count unanswered questions for the current user
  const unansweredCount = questions.filter(
    (q) => q.receiverId === currentUser?.id && q.answerText === null
  ).length;

  // Count unread notifications
  const unreadNotifCount = notifications.filter(
    (n) => n.userId === currentUser?.id && !n.read
  ).length;

  const navItems = [
    { label: 'Anasayfa', icon: Home, path: '/' },
    { label: 'Gelen Kutusu', icon: Inbox, path: '/inbox', badge: unansweredCount > 0 ? unansweredCount : undefined },
    { label: 'Keşfet', icon: Search, path: '/discover' },
    { label: 'Mesajlar', icon: MessageCircle, path: '/messages', authRequired: true },
    { label: 'Bildirimler', icon: Bell, path: '/notifications', badge: unreadNotifCount > 0 ? unreadNotifCount : undefined, authRequired: true },
    { label: 'Market', icon: ShoppingBag, path: '/market', authRequired: true },
    { 
      label: 'Profilim', 
      icon: UserIcon, 
      path: currentUser ? `/${currentUser.username}` : '/login' 
    },
    { label: 'Ayarlar', icon: Settings, path: '/settings', authRequired: true }
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className={`${styles.mobileHeader} glass-panel`}>
        <Link href="/" className={styles.logoContainer}>
          <HelpCircle size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>ask<span>.fm</span></span>
        </Link>
        <div className={styles.headerActions}>
          {currentUser && (
            <div className={styles.mobileCoins} onClick={() => router.push('/market')}>
              <Coins size={16} className={styles.coinIcon} />
              <span>{currentUser.coins}</span>
              {currentUser.vipStatus && <span className={styles.vipDot} title="VIP Üye" />}
            </div>
          )}
          <button onClick={toggleTheme} className={styles.iconButton} aria-label="Temayı Değiştir">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside className={`${styles.sidebar} glass-panel`}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logoContainer}>
            <HelpCircle size={32} className={styles.logoIcon} />
            <span className={styles.logoText}>ask<span>.fm</span></span>
          </Link>

          <nav className={styles.navMenu}>
            {navItems.map((item) => {
              if (item.authRequired && !currentUser) return null;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              
              return (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <item.icon size={22} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={styles.badge}>{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          {currentUser && (
            <div className={styles.coinsDisplay} onClick={() => router.push('/market')}>
              <div className={styles.coinsLeft}>
                <Coins size={18} className={styles.coinIcon} />
                <span>{currentUser.coins} Jeton</span>
              </div>
              {currentUser.vipStatus && <span className={styles.vipBadge}>VIP</span>}
            </div>
          )}

          <button onClick={toggleTheme} className={styles.themeToggleBtn}>
            {theme === 'dark' ? (
              <>
                <Sun size={20} />
                <span>Açık Tema</span>
              </>
            ) : (
              <>
                <Moon size={20} />
                <span>Koyu Tema</span>
              </>
            )}
          </button>

          {currentUser ? (
            <div className={styles.profileSection}>
              <Link href={`/${currentUser.username}`} className={styles.profileInfo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.displayName} 
                  className={styles.avatar} 
                />
                <div className={styles.profileMeta}>
                  <span className={styles.displayName}>{currentUser.displayName}</span>
                  <span className={styles.username}>@{currentUser.username}</span>
                </div>
              </Link>
              <button 
                onClick={handleLogout} 
                className={styles.logoutBtn} 
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary" style={{ width: '100%' }}>
              <LogIn size={20} />
              <span>Giriş Yap</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className={`${styles.mobileNav} glass-panel`}>
        {navItems.map((item) => {
          if (item.authRequired && !currentUser) return null;
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`${styles.mobileNavItem} ${isActive ? styles.mobileActive : ''}`}
            >
              <div className={styles.mobileIconWrapper}>
                <item.icon size={22} />
                {item.badge !== undefined && (
                  <span className={styles.mobileBadge}>{item.badge}</span>
                )}
              </div>
              <span className={styles.mobileLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
