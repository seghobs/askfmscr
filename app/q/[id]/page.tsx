'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, CommentItem } from '../../context';
import Navbar from '../../components/Navbar';
import { 
  Heart, 
  Share2, 
  Calendar, 
  ArrowLeft, 
  Crown, 
  MessageSquare, 
  Gift, 
  X, 
  Check, 
  Image as ImageIcon
} from 'lucide-react';
import styles from '../../home.module.css';

interface QuestionPageProps {
  params: Promise<{ id: string }>;
}

export default function QuestionDetailPage({ params }: QuestionPageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  
  const { 
    currentUser, 
    questions, 
    users, 
    likes, 
    gifts,
    toggleLike, 
    toggleLikeReaction,
    sendGift,
    addComment,
    deleteComment
  } = useApp();

  const [question, setQuestion] = useState<any | null>(null);
  const [receiver, setReceiver] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [hoveredLike, setHoveredLike] = useState(false);
  const [activeGiftTarget, setActiveGiftTarget] = useState<boolean>(false);
  
  // Comment States
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentAnon, setNewCommentAnon] = useState(true);

  useEffect(() => {
    const q = questions.find((item) => item.id === id);
    if (q) {
      setQuestion(q);
      const r = users.find((u) => u.id === q.receiverId);
      setReceiver(r || null);
    }
  }, [id, questions, users]);

  if (!question || !receiver) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>Soru Bulunamadı</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Aradığınız soru mevcut değil veya silinmiş olabilir.</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Ana Sayfaya Git
          </button>
        </main>
      </div>
    );
  }

  const liked = currentUser && likes.some((l) => l.userId === currentUser.id && l.questionId === question.id);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/q/${question.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(question.id, newCommentText, newCommentAnon);
    setNewCommentText('');
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        {/* Back Button and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button 
            onClick={() => router.back()} 
            style={{ 
              background: 'var(--input-bg)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--border-color)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
            aria-label="Geri"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Soru Detayı</h1>
        </div>

        {/* Detailed Question Card */}
        <div className={`${styles.feedCard} glass-panel ${receiver.vipStatus ? 'vip-card-glow' : ''}`} style={{ marginBottom: '24px' }}>
          {/* Receiver User Details */}
          <div className={styles.receiverHeader}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={receiver.avatarUrl} 
              alt={receiver.displayName} 
              className={styles.receiverAvatar}
              onClick={() => router.push(`/${receiver.username}`)}
              style={{ cursor: 'pointer' }}
            />
            <div className={styles.receiverMeta}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link 
                  href={`/${receiver.username}`} 
                  className={`${styles.receiverName} ${receiver.vipStatus ? 'vip-username-shimmer' : ''}`}
                >
                  {receiver.displayName}
                </Link>
                {receiver.vipStatus && (
                  <span title="VIP Üye" style={{ display: 'inline-flex' }}>
                    <Crown size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                  </span>
                )}
              </div>
              <span className={styles.receiverUname}>@{receiver.username}</span>
            </div>
            <span className={styles.date}>
              <Calendar size={12} />
              {question.answeredAt && formatDate(question.answeredAt)}
            </span>
          </div>

          {/* Question and Answer text */}
          <div className={styles.qaBody} style={{ marginTop: '16px' }}>
            <p className={styles.questionText} style={{ fontSize: '1.25rem' }}>{question.text}</p>
            
            {question.mediaUrl && (
              <div className={styles.mediaWrapper} style={{ marginTop: '12px' }}>
                {(!question.mediaType || question.mediaType === 'image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={question.mediaUrl} alt="Ekli Görsel" className={styles.mediaContent} />
                ) : (
                  <video src={question.mediaUrl} controls className={styles.mediaContent} />
                )}
              </div>
            )}

            <div className={styles.answerSection} style={{ marginTop: '16px', padding: '16px' }}>
              <p className={styles.answerText} style={{ fontSize: '1.05rem' }}>{question.answerText}</p>
              
              {/* Received Gifts List */}
              {(() => {
                const answerGifts = gifts.filter((g) => g.answerId === question.id);
                if (answerGifts.length === 0) return null;

                const counts = answerGifts.reduce((acc, curr) => {
                  acc[curr.giftType] = (acc[curr.giftType] || 0) + 1;
                  return acc;
                }, {} as { [key: string]: number });

                const emojis = {
                  coffee: '☕',
                  heart: '❤️',
                  fireworks: '🎆',
                  crown: '👑'
                };

                return (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    {Object.entries(counts).map(([type, count]) => (
                      <span 
                        key={type} 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          background: 'var(--card-bg)', 
                          border: '1px solid var(--border-color)', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <span>{emojis[type as 'coffee']}</span>
                        <span style={{ fontWeight: 700 }}>x{count}</span>
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.cardActions} style={{ marginTop: '16px' }}>
            <div 
              onMouseEnter={() => setHoveredLike(true)}
              onMouseLeave={() => setHoveredLike(false)}
              style={{ position: 'relative' }}
            >
              <button 
                onClick={() => toggleLike(question.id)} 
                className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
              >
                {(() => {
                  const userLike = likes.find((l) => l.userId === currentUser?.id && l.questionId === question.id);
                  if (!userLike) return <Heart size={16} />;
                  switch (userLike.reactionType) {
                    case 'like': return <span style={{ fontSize: '1rem', marginRight: '2px' }}>👍</span>;
                    case 'love': return <span style={{ fontSize: '1rem', marginRight: '2px' }}>❤️</span>;
                    case 'haha': return <span style={{ fontSize: '1rem', marginRight: '2px' }}>😂</span>;
                    case 'wow': return <span style={{ fontSize: '1rem', marginRight: '2px' }}>😮</span>;
                    case 'sad': return <span style={{ fontSize: '1rem', marginRight: '2px' }}>😢</span>;
                    default: return <Heart size={16} className={styles.heartFilled} />;
                  }
                })()}
                <span>{question.likesCount}</span>
              </button>

              {/* Emoji Reactions Popover */}
              {hoveredLike && (
                <div className="reaction-popover" onMouseEnter={() => setHoveredLike(true)}>
                  <button type="button" onClick={() => { toggleLikeReaction(question.id, 'like'); setHoveredLike(false); }} className="reaction-emoji-btn">👍</button>
                  <button type="button" onClick={() => { toggleLikeReaction(question.id, 'love'); setHoveredLike(false); }} className="reaction-emoji-btn">❤️</button>
                  <button type="button" onClick={() => { toggleLikeReaction(question.id, 'haha'); setHoveredLike(false); }} className="reaction-emoji-btn">😂</button>
                  <button type="button" onClick={() => { toggleLikeReaction(question.id, 'wow'); setHoveredLike(false); }} className="reaction-emoji-btn">😮</button>
                  <button type="button" onClick={() => { toggleLikeReaction(question.id, 'sad'); setHoveredLike(false); }} className="reaction-emoji-btn">😢</button>
                </div>
              )}
            </div>

            {currentUser && currentUser.id !== question.receiverId && (
              <button 
                onClick={() => setActiveGiftTarget(true)}
                className={styles.shareBtn}
              >
                <Gift size={16} />
                <span>Hediye Gönder</span>
              </button>
            )}

            <button 
              onClick={handleCopyLink} 
              className={styles.shareBtn}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? 'Kopyalandı' : 'Paylaş'}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Yorumlar ({question.comments?.length || 0})</h3>

          {/* Comment Form */}
          {currentUser ? (
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <textarea 
                className="glass-input" 
                placeholder="Yorumunuzu yazın..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                style={{ width: '100%', resize: 'none' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={newCommentAnon} 
                    onChange={(e) => setNewCommentAnon(e.target.checked)} 
                  />
                  <span>Anonim Yorum Yap</span>
                </label>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  Gönder
                </button>
              </div>
            </form>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Yorum yapabilmek için lütfen giriş yapın.</p>
          )}

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {question.comments && question.comments.length > 0 ? (
              question.comments.map((comment: CommentItem) => {
                const isCommentAuthorMe = currentUser && comment.senderId === currentUser.id;
                const isPostOwnerMe = currentUser && question.receiverId === currentUser.id;

                return (
                  <div 
                    key={comment.id} 
                    style={{ 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border-color)', 
                      padding: '14px', 
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {comment.senderUsername ? `@${comment.senderUsername}` : 'Anonim'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(comment.createdAt)}</span>
                        {(isCommentAuthorMe || isPostOwnerMe) && (
                          <button 
                            onClick={() => deleteComment(question.id, comment.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{comment.text}</p>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Henüz yorum yapılmamış. İlk yorumu sen yaz!</p>
            )}
          </div>
        </div>
      </main>

      {/* Gift Selector Modal */}
      {activeGiftTarget && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`} style={{ maxWidth: '360px', padding: '24px', display: 'block', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Hediye Gönder</h3>
              <button onClick={() => setActiveGiftTarget(false)} className={styles.storyCloseBtn} style={{ color: 'var(--text-primary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Cüzdanınız: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{currentUser?.coins} Jeton</span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { type: 'coffee', name: 'Bir Fincan Kahve', cost: 10, emoji: '☕' },
                { type: 'heart', name: 'Kocaman Bir Kalp', cost: 20, emoji: '❤️' },
                { type: 'fireworks', name: 'Havai Fişek Gösterisi', cost: 50, emoji: '🎆' },
                { type: 'crown', name: 'Altın Taç', cost: 100, emoji: '👑' }
              ].map((gift) => {
                const canAfford = currentUser && currentUser.coins >= gift.cost;
                return (
                  <div 
                    key={gift.type} 
                    onClick={() => {
                      if (canAfford) {
                        const success = sendGift(question.receiverId, question.id, gift.type as any);
                        if (success) {
                          alert(`${gift.name} başarıyla gönderildi!`);
                          setActiveGiftTarget(false);
                        } else {
                          alert('Hediye gönderilemedi.');
                        }
                      } else {
                        alert('Yetersiz jeton bakiyesi!');
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      borderRadius: '10px', 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border-color)',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      opacity: canAfford ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{gift.emoji}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{gift.name}</span>
                    </div>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>{gift.cost} Jeton</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
