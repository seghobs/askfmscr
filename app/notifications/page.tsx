'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { 
  Heart, 
  UserPlus, 
  MessageSquare, 
  MessageCircle, 
  Calendar, 
  CheckCheck,
  Bell
} from 'lucide-react';
import styles from './notifications.module.css';

export default function NotificationsPage() {
  const { currentUser, notifications, users, markNotificationsAsRead } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      markNotificationsAsRead();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className={styles.loadingContainer}>
        <p>Lütfen önce giriş yapın.</p>
        <button onClick={() => router.push('/login')} className="btn-primary" style={{ marginTop: '12px' }}>
          Giriş Sayfasına Git
        </button>
      </div>
    );
  }

  // Filter notifications for the current user
  const myNotifications = notifications.filter((n) => n.userId === currentUser.id);

  const getSenderDetails = (senderId: string) => {
    return users.find((u) => u.id === senderId);
  };

  const handleNotificationClick = (type: string, senderUname?: string) => {
    switch (type) {
      case 'like':
        router.push(`/${currentUser.username}`);
        break;
      case 'follow':
        if (senderUname) router.push(`/${senderUname}`);
        break;
      case 'question':
        router.push('/inbox');
        break;
      case 'message':
        router.push('/messages');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className={styles.iconLike} />;
      case 'follow':
        return <UserPlus size={16} className={styles.iconFollow} />;
      case 'question':
        return <MessageSquare size={16} className={styles.iconQuestion} />;
      case 'message':
        return <MessageCircle size={16} className={styles.iconMessage} />;
      default:
        return <Bell size={16} className={styles.iconDefault} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bildirimler</h1>
            <p className={styles.subtitle}>
              Profilinle ilgili tüm son gelişmeler, beğeniler ve takipçiler.
            </p>
          </div>
          {myNotifications.some((n) => !n.read) && (
            <button onClick={markNotificationsAsRead} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
              <CheckCheck size={16} />
              <span>Hepsini Okundu İşaretle</span>
            </button>
          )}
        </div>

        {myNotifications.length > 0 ? (
          <div className={styles.list}>
            {myNotifications.map((notif) => {
              const sender = getSenderDetails(notif.senderId);

              return (
                <div 
                  key={notif.id} 
                  className={`${styles.row} glass-panel ${!notif.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notif.type, sender?.username)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.iconWrapper}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {sender ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={sender.avatarUrl} 
                        alt={sender.displayName} 
                        className={styles.avatar}
                      />
                      <div className={styles.meta}>
                        <p className={styles.text}>
                          <span className={styles.senderLink}>
                            {sender.displayName}
                          </span>{' '}
                          {notif.details}
                        </p>
                        <span className={styles.date}>
                          <Calendar size={12} />
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className={styles.meta}>
                      <p className={styles.text}>Bilinmeyen bir kullanıcı {notif.details}</p>
                      <span className={styles.date}>
                        <Calendar size={12} />
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  )}

                  {!notif.read && <div className={styles.unreadDot} />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${styles.emptyState} glass-panel`}>
            <Bell size={48} className={styles.emptyIcon} />
            <h2>Henüz bildiriminiz yok</h2>
            <p>Profilinizde bir aktivite olduğunda burada görünecektir.</p>
          </div>
        )}
      </main>
    </div>
  );
}
