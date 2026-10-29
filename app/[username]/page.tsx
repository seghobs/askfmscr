'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { 
  Heart, 
  Send, 
  UserPlus, 
  UserCheck, 
  Calendar, 
  Copy, 
  Check, 
  Share2,
  Lock,
  MessageSquare,
  Crown,
  ShieldAlert,
  Flag,
  X,
  Camera,
  CornerUpLeft,
  Trash2,
  Mic,
  MicOff,
  Video,
  HelpCircle,
  Music,
  Volume2,
  VolumeX,
  Gift
} from 'lucide-react';
import styles from './profile.module.css';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = React.use(params);
  const { 
    users, 
    questions, 
    likes, 
    follows, 
    currentUser, 
    askQuestion, 
    toggleLike, 
    toggleFollow,
    getQuestionSender,
    toggleBlock,
    reportQuestion,
    addComment,
    deleteComment,
    gifts,
    toggleLikeReaction
  } = useApp();
  
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [questionText, setQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [askError, setAskError] = useState('');
  const [askSuccess, setAskSuccess] = useState('');
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'answers' | 'followers' | 'following' | 'gifts'>('answers');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Pause audio on navigating to other profiles
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsMusicPlaying(false);
    }
  }, [username]);

  const toggleMusic = () => {
    if (!profileUser?.profileMusicUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(profileUser.profileMusicUrl);
      audioRef.current.loop = true;
    }

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.log('Audio playback failed', err));
      setIsMusicPlaying(true);
    }
  };

  // Comment States
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentAnon, setNewCommentAnon] = useState(true);
  const [attachedCommentMediaUrl, setAttachedCommentMediaUrl] = useState<string | null>(null);
  const [attachedCommentMediaType, setAttachedCommentMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isCommentRecording, setIsCommentRecording] = useState(false);
  const [commentRecordingTime, setCommentRecordingTime] = useState(0);
  const [showCommentMicModal, setShowCommentMicModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const commentRecordingIntervalRef = useRef<any>(null);

  useEffect(() => {
    const user = users.find((u) => u.username === username.toLowerCase());
    setProfileUser(user || null);
    setActiveTab('answers');
  }, [username, users]);

  useEffect(() => {
    return () => {
      if (commentRecordingIntervalRef.current) {
        clearInterval(commentRecordingIntervalRef.current);
      }
    };
  }, []);

  if (!profileUser) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content animate-fade-in">
          <div className={styles.notFound}>
            <h2>Kullanıcı Bulunamadı</h2>
            <p>Aradığınız @{username} kullanıcı adına sahip bir profil bulunamadı.</p>
            <button onClick={() => router.push('/discover')} className="btn-primary" style={{ marginTop: '16px' }}>
              Keşfet Sayfasına Git
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isMe = currentUser?.id === profileUser.id;
  const isBlockedByMe = currentUser?.blockedUserIds?.includes(profileUser.id) || false;
  const isBlockedByOwner = profileUser.blockedUserIds?.includes(currentUser?.id || '') || false;

  const isFollowing = follows.some(
    (f) => f.followerId === currentUser?.id && f.followingId === profileUser.id
  );

  // Get followers list
  const followerIds = follows.filter((f) => f.followingId === profileUser.id).map((f) => f.followerId);
  const followersList = users.filter((u) => followerIds.includes(u.id));

  // Get following list
  const followingIds = follows.filter((f) => f.followerId === profileUser.id).map((f) => f.followingId);
  const followingList = users.filter((u) => followingIds.includes(u.id));

  // Filter answered questions received by this profile user (excluding reported ones unless it's own profile)
  const answeredQuestions = questions.filter(
    (q) => q.receiverId === profileUser.id && q.answerText !== null && (isMe || !q.isReported)
  ).sort((a, b) => new Date(b.answeredAt!).getTime() - new Date(a.answeredAt!).getTime());

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setAskError('');
    setAskSuccess('');

    if (isBlockedByOwner) {
      setAskError('Bu kullanıcı sizi engellediği için soru soramazsınız.');
      return;
    }

    if (isBlockedByMe) {
      setAskError('Engellediğiniz bir kullanıcıya soru soramazsınız. Önce engeli kaldırın.');
      return;
    }

    if (!questionText.trim()) {
      setAskError('Lütfen bir soru yazın.');
      return;
    }

    askQuestion(profileUser.id, questionText.trim(), isAnonymous, attachedImage);
    setQuestionText('');
    setAttachedImage(null);
    setAskSuccess('Sorunuz gönderildi! Yanıtlandığında bu profilde görünecektir.');
    setTimeout(() => setAskSuccess(''), 4000);
  };

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB dan küçük olmalıdır.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedCommentMediaUrl(reader.result as string);
        setAttachedCommentMediaType(type);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCommentRecording = async () => {
    setNewCommentText('');
    setAttachedCommentMediaUrl(null);
    setAttachedCommentMediaType(null);
    const localAudioChunks: Blob[] = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          localAudioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsCommentRecording(true);
      setCommentRecordingTime(0);

      commentRecordingIntervalRef.current = setInterval(() => {
        setCommentRecordingTime((prev) => prev + 1);
      }, 1000);

      mediaRecorder.addEventListener('stop', () => {
        setTimeout(() => {
          if (localAudioChunks.length === 0) return;
          const audioBlob = new Blob(localAudioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachedCommentMediaUrl(reader.result as string);
            setAttachedCommentMediaType('audio');
          };
          reader.readAsDataURL(audioBlob);
        }, 150);
      });

    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes('Requested device not found') || err.message?.includes('device not found')) {
        setShowCommentMicModal(true);
      } else {
        alert('Mikrofon bulunamadı veya izin reddedildi.');
      }
    }
  };

  const stopCommentRecording = (cancel: boolean) => {
    if (commentRecordingIntervalRef.current) {
      clearInterval(commentRecordingIntervalRef.current);
    }
    
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    setIsCommentRecording(false);
  };

  const handleCommentSubmit = (e: React.FormEvent, qId: string) => {
    e.preventDefault();
    if (!newCommentText.trim() && !attachedCommentMediaUrl) return;

    addComment(qId, newCommentText.trim(), newCommentAnon, attachedCommentMediaUrl || undefined, attachedCommentMediaType || undefined);
    setNewCommentText('');
    setAttachedCommentMediaUrl(null);
    setAttachedCommentMediaType(null);
  };

  const formatRecordingSeconds = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const renderCommentText = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const username = part.substring(1).toLowerCase();
        const exists = users.some((u) => u.username === username);
        if (exists) {
          return (
            <Link key={idx} href={`/${username}`} className={styles.mentionLink}>
              {part}
            </Link>
          );
        }
      }
      return part;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAskError('Görsel boyutu 2MB dan küçük olmalıdır.');
        setTimeout(() => setAskError(''), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLike = (qId: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    toggleLike(qId);
  };

  const isLiked = (qId: string) => {
    if (!currentUser) return false;
    return likes.some((l) => l.userId === currentUser.id && l.questionId === qId);
  };

  const handleShareAnswer = (qId: string) => {
    const answerUrl = `${window.location.origin}/${profileUser.username}?question=${qId}`;
    navigator.clipboard.writeText(answerUrl);
    setCopiedQuestionId(qId);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isUserFollowing = (userId: string) => {
    if (!currentUser) return false;
    return follows.some((f) => f.followerId === currentUser.id && f.followingId === userId);
  };

  const getThemeStyle = (themeName: string | null) => {
    switch (themeName) {
      case 'ocean':
        return { backgroundImage: 'radial-gradient(circle at top, rgba(0, 198, 255, 0.38) 0%, var(--background) 70%)' };
      case 'neon':
        return { backgroundImage: 'radial-gradient(circle at top, rgba(241, 7, 163, 0.38) 0%, var(--background) 70%)' };
      case 'forest':
        return { backgroundImage: 'radial-gradient(circle at top, rgba(17, 153, 142, 0.38) 0%, var(--background) 70%)' };
      case 'gold':
        return { backgroundImage: 'radial-gradient(circle at top, rgba(245, 158, 11, 0.42) 0%, var(--background) 70%)' };
      default:
        return {};
    }
  };

  return (
    <div className="app-container" style={getThemeStyle(profileUser.activeTheme)}>
      <Navbar />

      <main className="main-content animate-fade-in">
        {isBlockedByOwner ? (
          <div className={styles.notFound}>
            <Lock size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2>Erişim Engellendi</h2>
            <p>Bu kullanıcının profilini görme yetkiniz yok.</p>
            <button onClick={() => router.push('/')} className="btn-secondary" style={{ marginTop: '16px' }}>
              Ana Sayfaya Dön
            </button>
          </div>
        ) : (
          <>
            {/* Cover Image Banner */}
            <div 
              className={styles.coverImage} 
              style={{ backgroundImage: `url(${profileUser.coverUrl})` }}
            >
              {isMe && (
                <button onClick={() => router.push('/settings')} className={styles.editCoverBtn}>
                  Ayarlardan Değiştir
                </button>
              )}
            </div>

            {/* Profile Card Header */}
            <div className={`${styles.profileCard} glass-panel ${profileUser.vipStatus ? 'vip-card-glow' : ''}`}>
              <div className={styles.profileHeader}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={profileUser.avatarUrl} 
                  alt={profileUser.displayName} 
                  className={styles.avatar} 
                />
                
                <div className={styles.headerInfo}>
                  <div className={styles.nameSection}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h1 className={`${styles.displayName} ${profileUser.vipStatus ? 'vip-username-shimmer' : ''}`}>{profileUser.displayName}</h1>
                      {profileUser.vipStatus && (
                        <span title="VIP Üye" style={{ display: 'inline-flex' }}>
                          <Crown size={18} className={styles.vipBadgeIcon} style={{ fill: '#fbbf24', stroke: '#d97706' }} />
                        </span>
                      )}

                      {/* Music Player Button */}
                      {profileUser.profileMusicUrl && (
                        <button 
                          onClick={toggleMusic} 
                          className={styles.musicPlayerBtn}
                          title={profileUser.profileMusicTitle || 'Profil Müziği'}
                        >
                          {isMusicPlaying ? <Volume2 size={13} className={styles.musicIconPlay} /> : <VolumeX size={13} />}
                          <span className={styles.musicTitleText}>{profileUser.profileMusicTitle || 'Müzik'}</span>
                          
                          {isMusicPlaying && (
                            <div className={styles.waveContainer}>
                              <div className={styles.waveBar} />
                              <div className={styles.waveBar} />
                              <div className={styles.waveBar} />
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                    <span className={styles.username}>@{profileUser.username}</span>
                  </div>
                  <p className={styles.bio}>{profileUser.bio}</p>
                </div>

                <div className={styles.headerActions}>
                  {currentUser && !isMe && (
                    <>
                      <button 
                        onClick={() => toggleFollow(profileUser.id)} 
                        className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
                        disabled={isBlockedByMe}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck size={18} />
                            <span>Takip Ediliyor</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} />
                            <span>Takip Et</span>
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => router.push(`/messages?u=${profileUser.id}`)}
                        className={styles.messageBtn}
                        disabled={isBlockedByMe}
                      >
                        <MessageSquare size={18} />
                        <span>Mesaj Gönder</span>
                      </button>

                      <button 
                        onClick={() => toggleBlock(profileUser.id)} 
                        className={`${styles.blockBtn} ${isBlockedByMe ? styles.blockedActive : ''}`}
                        title={isBlockedByMe ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
                      >
                        <ShieldAlert size={18} />
                        <span>{isBlockedByMe ? 'Engelli' : 'Engelle'}</span>
                      </button>
                    </>
                  )}

                  {isMe && (
                    <button onClick={() => router.push('/settings')} className="btn-secondary">
                      Profili Düzenle
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className={styles.statsBar}>
                <div 
                  onClick={() => setActiveTab('answers')} 
                  className={`${styles.statBox} ${activeTab === 'answers' ? styles.activeStat : ''}`}
                >
                  <span className={styles.statVal}>{profileUser.answersCount}</span>
                  <span className={styles.statLabel}>Yanıtlar</span>
                </div>
                <div 
                  onClick={() => setActiveTab('followers')} 
                  className={`${styles.statBox} ${activeTab === 'followers' ? styles.activeStat : ''}`}
                >
                  <span className={styles.statVal}>{followersList.length}</span>
                  <span className={styles.statLabel}>Takipçiler</span>
                </div>
                <div 
                  onClick={() => setActiveTab('following')} 
                  className={`${styles.statBox} ${activeTab === 'following' ? styles.activeStat : ''}`}
                >
                  <span className={styles.statVal}>{followingList.length}</span>
                  <span className={styles.statLabel}>Takip Edilenler</span>
                </div>
                <div 
                  onClick={() => setActiveTab('gifts')} 
                  className={`${styles.statBox} ${activeTab === 'gifts' ? styles.activeStat : ''}`}
                >
                  <span className={styles.statVal}>{gifts.filter((g) => g.receiverId === profileUser.id).length}</span>
                  <span className={styles.statLabel}>Hediyeler</span>
                </div>
              </div>
            </div>

            {/* Ask Question Form */}
            {!isMe && (
              <div className={`${styles.askCard} glass-panel`}>
                <h2 className={styles.askTitle}>{profileUser.displayName} kullanıcısına sor</h2>
                
                {askError && <div className={styles.askError}>{askError}</div>}
                {askSuccess && <div className={styles.askSuccess}>{askSuccess}</div>}

                <form onSubmit={handleAskQuestion}>
                  <textarea
                    placeholder="Ne merak ediyorsun? Sorunu yaz..."
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    maxLength={300}
                    className="glass-input"
                    style={{ width: '100%', resize: 'none' }}
                  />

                  {/* Attached Image Preview */}
                  {attachedImage && (
                    <div className={styles.attachedPreviewWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={attachedImage} alt="Ekteki Görsel" className={styles.attachedPreview} />
                      <button type="button" onClick={() => setAttachedImage(null)} className={styles.removeAttachedBtn}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.askFormBottom}>
                    <div className={styles.askFormLeft}>
                      <div className={styles.anonToggle}>
                        <input
                          type="checkbox"
                          id="anonCheckbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        <label htmlFor="anonCheckbox">Anonim olarak sor</label>
                      </div>

                      <div className={styles.photoAttachWrapper}>
                        <label htmlFor="ask-file-input" className={styles.photoAttachLabel} title="Görsel Ekle">
                          <Camera size={18} />
                        </label>
                        <input
                          id="ask-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isBlockedByMe}>
                      <Send size={16} />
                      <span>Sor</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab contents */}
            {activeTab === 'answers' && (
              <div className={styles.feedSection}>
                <h2 className={styles.feedTitle}>Yanıtlar</h2>

                {answeredQuestions.length > 0 ? (
                  <div className={styles.feedList}>
                    {answeredQuestions.map((q) => {
                      const asker = getQuestionSender(q.senderUsername);
                      const liked = isLiked(q.id);

                      return (
                        <div key={q.id} className={`${styles.answerCard} glass-panel animate-fade-in`}>
                          <div className={styles.cardHeader}>
                            <span className={styles.askedBy}>
                              {asker ? (
                                <span 
                                  onClick={() => router.push(`/${asker.username}`)} 
                                  className={styles.askerLink}
                                >
                                  @{asker.username}
                                </span>
                              ) : (
                                <span className={styles.anonLabel}>Anonim</span>
                              )}
                              <span> sordu:</span>
                            </span>
                            <Link href={`/q/${q.id}`} className={styles.date} style={{ textDecoration: 'none', cursor: 'pointer' }}>
                              <Calendar size={12} />
                              {formatDate(q.answeredAt!)}
                            </Link>
                          </div>

                          <p className={styles.questionText}>{q.text}</p>
                          
                          {q.mediaUrl && (
                            <div className={styles.mediaWrapper}>
                              {(!q.mediaType || q.mediaType === 'image') && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={q.mediaUrl} alt="Ekteki görsel" className={styles.mediaContent} />
                              )}
                              {q.mediaType === 'video' && (
                                <video src={q.mediaUrl} controls className={styles.mediaContent} />
                              )}
                              {q.mediaType === 'audio' && (
                                <audio src={q.mediaUrl} controls style={{ width: '100%', marginTop: '6px' }} />
                              )}
                            </div>
                          )}

                          <div className={styles.answerSection}>
                            <p className={styles.answerText}>{q.answerText}</p>
                          </div>

                          <div className={styles.cardActions}>
                            <button 
                              onClick={() => handleLike(q.id)} 
                              className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
                            >
                              <Heart size={16} className={liked ? styles.heartFilled : ''} />
                              <span>{q.likesCount}</span>
                            </button>

                            <button 
                              onClick={() => {
                                if (expandedCommentsId === q.id) {
                                  setExpandedCommentsId(null);
                                } else {
                                  setExpandedCommentsId(q.id);
                                  setNewCommentText('');
                                  setNewCommentAnon(true);
                                }
                              }} 
                              className={styles.shareBtn}
                              title="Yorumlar"
                            >
                              <MessageSquare size={16} />
                              <span>Yorumlar ({q.comments?.length || 0})</span>
                            </button>

                            <button 
                              onClick={() => handleShareAnswer(q.id)} 
                              className={styles.shareBtn}
                              title="Yanıt Linkini Kopyala"
                            >
                              {copiedQuestionId === q.id ? <Check size={16} /> : <Share2 size={16} />}
                              <span>{copiedQuestionId === q.id ? 'Kopyalandı' : 'Paylaş'}</span>
                            </button>

                            {!isMe && (
                              <button 
                                onClick={() => {
                                  reportQuestion(q.id);
                                  alert('Bu yanıt başarıyla rapor edildi.');
                                }} 
                                className={styles.reportBtn}
                                title="Bu yanıtı rapor et"
                              >
                                <Flag size={14} />
                                <span>Şikayet Et</span>
                              </button>
                            )}

                            {isMe && q.isReported && (
                              <span className={styles.reportedBadge} title="Bu yanıt şikayet edildi.">
                                Şikayet Edildi
                              </span>
                            )}
                          </div>

                          {/* Comments Panel */}
                          {expandedCommentsId === q.id && (
                            <div className={styles.commentsPanel}>
                              <div className={styles.commentsList}>
                                {q.comments && q.comments.length > 0 ? (
                                  q.comments.map((comment) => {
                                    const commenter = users.find((u) => u.username === comment.senderUsername);
                                    return (
                                      <div key={comment.id} className={styles.commentItem}>
                                        <div className={styles.commentHeader}>
                                          <span className={styles.commenterName}>
                                            {commenter ? commenter.displayName : 'Anonim'}
                                          </span>
                                          <span className={styles.commentDate}>
                                            {formatDate(comment.createdAt)}
                                          </span>
                                        </div>
                                        <p className={styles.commentText}>{renderCommentText(comment.text)}</p>
                                        
                                        {comment.mediaUrl && (
                                          <div className={styles.commentMediaWrapper}>
                                            {(!comment.mediaType || comment.mediaType === 'image') && (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={comment.mediaUrl} alt="Yorum Görseli" className={styles.commentMediaImage} onClick={() => window.open(comment.mediaUrl)} />
                                            )}
                                            {comment.mediaType === 'video' && (
                                              <video src={comment.mediaUrl} controls className={styles.commentMediaVideo} />
                                            )}
                                            {comment.mediaType === 'audio' && (
                                              <audio src={comment.mediaUrl} controls className={styles.commentMediaAudio} />
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Comment Reply & Delete Actions */}
                                        <div className={styles.commentActions}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const mentionPrefix = commenter ? `@${commenter.username} ` : '@anonim ';
                                              setNewCommentText((prev) => mentionPrefix + prev);
                                            }}
                                            className={styles.commentActionBtn}
                                            title="Yanıtla"
                                          >
                                            <CornerUpLeft size={12} />
                                            <span>Yanıtla</span>
                                          </button>

                                          {currentUser && (comment.senderId === currentUser.id || (comment.senderUsername && comment.senderUsername === currentUser.username) || q.receiverId === currentUser.id) && (
                                            <button
                                              type="button"
                                              onClick={() => deleteComment(q.id, comment.id)}
                                              className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                                              title="Sil"
                                            >
                                              <Trash2 size={12} />
                                              <span>Sil</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className={styles.noComments}>Henüz yorum yapılmamış. İlk yorumu siz yazın!</p>
                                )}
                              </div>

                              <form onSubmit={(e) => handleCommentSubmit(e, q.id)} className={styles.commentForm}>
                                {isCommentRecording ? (
                                  <div className={styles.commentRecorderPanel}>
                                    <div className={styles.commentRecorderLeft}>
                                      <div className={styles.commentPulseDot} />
                                      <span className={styles.commentRecordingText}>Ses Kaydediliyor...</span>
                                      <span className={styles.commentRecordingTimer}>{formatRecordingSeconds(commentRecordingTime)}</span>
                                    </div>
                                    <div className={styles.commentRecorderRight}>
                                      <button
                                        type="button"
                                        onClick={() => stopCommentRecording(true)}
                                        className="btn-secondary"
                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                      >
                                        İptal
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => stopCommentRecording(false)}
                                        className="btn-primary"
                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                      >
                                        Bitir
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Yorumunuzu yazın..."
                                    className="glass-input"
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    required={!attachedCommentMediaUrl}
                                  />
                                )}

                                {/* Preview attached media */}
                                {attachedCommentMediaUrl && (
                                  <div className={styles.commentMediaPreviewWrapper}>
                                    {attachedCommentMediaType === 'image' && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={attachedCommentMediaUrl} alt="Ekteki Görsel" className={styles.commentMediaPreview} />
                                    )}
                                    {attachedCommentMediaType === 'video' && (
                                      <video src={attachedCommentMediaUrl} controls className={styles.commentMediaPreview} />
                                    )}
                                    {attachedCommentMediaType === 'audio' && (
                                      <audio src={attachedCommentMediaUrl} controls className={styles.commentAudioPreview} />
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAttachedCommentMediaUrl(null);
                                        setAttachedCommentMediaType(null);
                                      }}
                                      className={styles.commentRemoveMediaBtn}
                                      title="Eki Kaldır"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}

                                <div className={styles.commentFormBottom}>
                                  <div className={styles.commentAttachmentActions}>
                                    {!newCommentAnon && (
                                      <>
                                        {/* Photo upload */}
                                        <label htmlFor={`comment-photo-input-${q.id}`} className={styles.commentAttachBtn} title="Fotoğraf Ekle">
                                          <Camera size={14} />
                                        </label>
                                        <input
                                          id={`comment-photo-input-${q.id}`}
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleCommentFileChange(e, 'image')}
                                          style={{ display: 'none' }}
                                        />

                                        {/* Video upload */}
                                        <label htmlFor={`comment-video-input-${q.id}`} className={styles.commentAttachBtn} title="Video Ekle">
                                          <Video size={14} />
                                        </label>
                                        <input
                                          id={`comment-video-input-${q.id}`}
                                          type="file"
                                          accept="video/*"
                                          onChange={(e) => handleCommentFileChange(e, 'video')}
                                          style={{ display: 'none' }}
                                        />

                                        {/* Voice recorder trigger */}
                                        {!isCommentRecording && (
                                          <button
                                            type="button"
                                            onClick={startCommentRecording}
                                            className={styles.commentAttachBtn}
                                            title="Ses Kaydet"
                                          >
                                            <Mic size={14} />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  <div className={styles.commentFormRight}>
                                    <div className={styles.anonToggle}>
                                      <input
                                        type="checkbox"
                                        id={`comment-anon-${q.id}`}
                                        checked={newCommentAnon}
                                        onChange={(e) => {
                                          const val = e.target.checked;
                                          setNewCommentAnon(val);
                                          if (val) {
                                            setAttachedCommentMediaUrl(null);
                                            setAttachedCommentMediaType(null);
                                            if (isCommentRecording) {
                                              stopCommentRecording(true);
                                            }
                                          }
                                        }}
                                      />
                                      <label htmlFor={`comment-anon-${q.id}`}>Anonim</label>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                      Gönder
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`${styles.emptyFeed} glass-panel`}>
                    <MessageSquare size={40} className={styles.emptyFeedIcon} />
                    <p>Henüz yanıtlanmış bir soru bulunmuyor.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'followers' && (
              <div className={styles.feedSection}>
                <h2 className={styles.feedTitle}>Takipçiler</h2>
                {followersList.length > 0 ? (
                  <div className={styles.userList}>
                    {followersList.map((user) => {
                      const following = isUserFollowing(user.id);
                      const isUserMe = currentUser?.id === user.id;

                      return (
                        <div key={user.id} className={`${styles.userRow} glass-panel animate-fade-in`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={user.avatarUrl} alt={user.displayName} className={styles.rowAvatar} onClick={() => router.push(`/${user.username}`)} />
                          <div className={styles.rowMeta}>
                            <span onClick={() => router.push(`/${user.username}`)} className={styles.rowName}>
                              {user.displayName}
                            </span>
                            <span className={styles.rowUname}>@{user.username}</span>
                            <p className={styles.rowBio}>{user.bio}</p>
                          </div>
                          <div className={styles.rowActions}>
                            {currentUser && !isUserMe && (
                              <>
                                {following && (
                                  <>
                                    <button
                                      onClick={() => router.push(`/messages?u=${user.id}`)}
                                      className={styles.rowIconBtn}
                                      title="Mesaj Gönder"
                                    >
                                      <MessageSquare size={14} />
                                      <span>Mesaj Gönder</span>
                                    </button>
                                    <button
                                      onClick={() => router.push(`/${user.username}`)}
                                      className={styles.rowIconBtn}
                                      title="Soru Sor"
                                    >
                                      <HelpCircle size={14} />
                                      <span>Soru Sor</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => toggleFollow(user.id)}
                                  className={`${styles.rowFollowBtn} ${following ? styles.rowFollowing : ''}`}
                                >
                                  <span>{following ? 'Takip Ediliyor' : 'Takip Et'}</span>
                                </button>
                              </>
                            )}
                            {isUserMe && <span className={styles.meBadge}>Siz</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`${styles.emptyFeed} glass-panel`}>
                    <p>Bu kullanıcıyı takip eden kimse bulunmuyor.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className={styles.feedSection}>
                <h2 className={styles.feedTitle}>Takip Edilenler</h2>
                {followingList.length > 0 ? (
                  <div className={styles.userList}>
                    {followingList.map((user) => {
                      const following = isUserFollowing(user.id);
                      const isUserMe = currentUser?.id === user.id;

                      return (
                        <div key={user.id} className={`${styles.userRow} glass-panel animate-fade-in`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={user.avatarUrl} alt={user.displayName} className={styles.rowAvatar} onClick={() => router.push(`/${user.username}`)} />
                          <div className={styles.rowMeta}>
                            <span onClick={() => router.push(`/${user.username}`)} className={styles.rowName}>
                              {user.displayName}
                            </span>
                            <span className={styles.rowUname}>@{user.username}</span>
                            <p className={styles.rowBio}>{user.bio}</p>
                          </div>
                          <div className={styles.rowActions}>
                            {currentUser && !isUserMe && (
                              <>
                                {following && (
                                  <>
                                    <button
                                      onClick={() => router.push(`/messages?u=${user.id}`)}
                                      className={styles.rowIconBtn}
                                      title="Mesaj Gönder"
                                    >
                                      <MessageSquare size={14} />
                                      <span>Mesaj Gönder</span>
                                    </button>
                                    <button
                                      onClick={() => router.push(`/${user.username}`)}
                                      className={styles.rowIconBtn}
                                      title="Soru Sor"
                                    >
                                      <HelpCircle size={14} />
                                      <span>Soru Sor</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => toggleFollow(user.id)}
                                  className={`${styles.rowFollowBtn} ${following ? styles.rowFollowing : ''}`}
                                >
                                  <span>{following ? 'Takip Ediliyor' : 'Takip Et'}</span>
                                </button>
                              </>
                            )}
                            {isUserMe && <span className={styles.meBadge}>Siz</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`${styles.emptyFeed} glass-panel`}>
                    <p>Bu kullanıcının takip ettiği kimse bulunmuyor.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gifts' && (
              <div className={styles.feedSection}>
                <h2 className={styles.feedTitle}>Alınan Hediyeler</h2>
                {(() => {
                  const userGifts = gifts.filter((g) => g.receiverId === profileUser.id);
                  if (userGifts.length > 0) {
                    const giftIcons = {
                      coffee: '☕',
                      heart: '❤️',
                      fireworks: '🎆',
                      crown: '👑'
                    };
                    const giftLabels = {
                      coffee: 'Kahve',
                      heart: 'Kalp',
                      fireworks: 'Havai Fişek',
                      crown: 'Taç'
                    };

                    return (
                      <div className={styles.giftsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                        {userGifts.map((g) => (
                          <div 
                            key={g.id} 
                            className="glass-panel" 
                            style={{ 
                              padding: '16px', 
                              borderRadius: '12px', 
                              textAlign: 'center', 
                              border: '1px solid var(--border-color)',
                              background: 'var(--card-bg)'
                            }}
                          >
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>
                              {giftIcons[g.giftType] || '🎁'}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                              {giftLabels[g.giftType] || 'Hediye'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {(() => {
                                const sender = users.find((u) => u.id === g.senderId);
                                return sender ? `@${sender.username}` : 'Bilinmeyen';
                              })()}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className={`${styles.emptyFeed} glass-panel`}>
                        <p>Henüz hediye alınmamış.</p>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </>
        )}
      </main>

      {/* Comment Mic missing modal */}
      {showCommentMicModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`}>
            <MicOff size={48} className={styles.modalIcon} />
            <h3>Mikrofon Bulunamadı</h3>
            <p>Yorum için ses kaydı alabilmek için lütfen bir mikrofon takın ve tekrar deneyin.</p>
            <button onClick={() => setShowCommentMicModal(false)} className="btn-primary" style={{ marginTop: '16px', padding: '10px 24px' }}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
