'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { Search, UserPlus, UserMinus, UserCheck, Eye } from 'lucide-react';
import styles from './discover.module.css';

export default function DiscoverPage() {
  const { users, currentUser, follows, toggleFollow } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out users based on search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
    );
  });

  const isUserFollowing = (userId: string) => {
    if (!currentUser) return false;
    return follows.some((f) => f.followerId === currentUser.id && f.followingId === userId);
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        <h1 className={styles.title}>Kullanıcıları Keşfet</h1>
        <p className={styles.subtitle}>
          İlginç insanları takip et, profillerini incele ve onlara merak ettiğin soruları sor!
        </p>

        {/* Search Bar */}
        <div className={`${styles.searchBox} glass-panel`}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Kullanıcı adı, isim veya biyografi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* User Grid */}
        <div className={styles.grid}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const isMe = currentUser?.id === user.id;
              const following = isUserFollowing(user.id);

              return (
                <div key={user.id} className={`${styles.card} glass-panel`}>
                  {/* Cover banner background */}
                  <div 
                    className={styles.cardCover} 
                    style={{ backgroundImage: `url(${user.coverUrl})` }}
                  />

                  <div className={styles.cardContent}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={user.avatarUrl} 
                      alt={user.displayName} 
                      className={styles.avatar} 
                    />

                    <div className={styles.userMeta}>
                      <Link href={`/${user.username}`} className={styles.displayName}>
                        {user.displayName}
                      </Link>
                      <span className={styles.username}>@{user.username}</span>
                    </div>

                    <p className={styles.bio}>{user.bio}</p>

                    <div className={styles.stats}>
                      <div className={styles.statItem}>
                        <span className={styles.statVal}>{user.answersCount}</span>
                        <span className={styles.statLabel}>Yanıt</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statVal}>{user.followersCount}</span>
                        <span className={styles.statLabel}>Takipçi</span>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <Link href={`/${user.username}`} className={styles.viewProfileBtn}>
                        <Eye size={16} />
                        <span>Profili Gör</span>
                      </Link>

                      {currentUser && !isMe && (
                        <button
                          onClick={() => toggleFollow(user.id)}
                          className={`${styles.followBtn} ${following ? styles.following : ''}`}
                        >
                          {following ? (
                            <>
                              <UserCheck size={16} />
                              <span>Takip Ediliyor</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={16} />
                              <span>Takip Et</span>
                            </>
                          )}
                        </button>
                      )}

                      {isMe && (
                        <span className={styles.meBadge}>Sizsiniz</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>
              <p>Aramanıza uygun kullanıcı bulunamadı.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
