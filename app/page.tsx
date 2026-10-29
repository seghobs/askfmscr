'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, Story } from './context';
import Navbar from './components/Navbar';
import { 
  Heart, 
  Share2, 
  Calendar, 
  UserCheck, 
  UserPlus, 
  MessageSquare, 
  Check, 
  RefreshCw,
  Sparkles,
  HelpCircle,
  LogIn,
  Megaphone,
  BarChart2,
  Gift,
  Crown,
  Image as ImageIcon,
  Send,
  CornerUpLeft,
  Trash2,
  Mic,
  MicOff,
  Video,
  X,
  Camera,
  Plus,
  Play,
  Volume2,
  VolumeX
} from 'lucide-react';
import styles from './home.module.css';

const VERSUS_PRESETS = [
  {
    name: 'Kedi mi Köpek mi?',
    imgA: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=450&auto=format&fit=crop&q=80',
    imgB: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=450&auto=format&fit=crop&q=80'
  },
  {
    name: 'Yaz mı Kış mı?',
    imgA: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=450&auto=format&fit=crop&q=80',
    imgB: 'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?w=450&auto=format&fit=crop&q=80'
  },
  {
    name: 'Kahve mi Çay mı?',
    imgA: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=450&auto=format&fit=crop&q=80',
    imgB: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=450&auto=format&fit=crop&q=80'
  }
];

export default function HomePage() {
  const { 
    currentUser, 
    questions, 
    users, 
    follows, 
    likes, 
    versusPolls,
    toggleLike, 
    toggleFollow, 
    getQuestionSender, 
    getRandomQuestion,
    askQuestion,
    answerQuestion,
    sendShoutout,
    createVersusPoll,
    voteVersus,
    addComment,
    deleteComment,
    stories,
    gifts,
    addStory,
    sendGift,
    toggleLikeReaction
  } = useApp();

  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'followed' | 'global'>('global');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Right sidebar state
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [isAnsweringDaily, setIsAnsweringDaily] = useState(false);
  const [dailySuccess, setDailySuccess] = useState('');

  // Creator Panel State
  const [creatorTab, setCreatorTab] = useState<'shoutout' | 'versus'>('shoutout');
  const [shoutoutText, setShoutoutText] = useState('');
  const [shoutoutAnon, setShoutoutAnon] = useState(true);
  const [versusTitle, setVersusTitle] = useState('');
  const [versusImgA, setVersusImgA] = useState('');
  const [versusImgB, setVersusImgB] = useState('');
  const [creatorMsg, setCreatorMsg] = useState({ text: '', isError: false });

  // Comment States
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentAnon, setNewCommentAnon] = useState(true);
  const [attachedCommentMediaUrl, setAttachedCommentMediaUrl] = useState<string | null>(null);
  const [attachedCommentMediaType, setAttachedCommentMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isCommentRecording, setIsCommentRecording] = useState(false);
  const [commentRecordingTime, setCommentRecordingTime] = useState(0);
  const [showCommentMicModal, setShowCommentMicModal] = useState(false);

  // New Features Bundle States
  const [activeStoryUser, setActiveStoryUser] = useState<any | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showStoryCreateModal, setShowStoryCreateModal] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState<string | null>(null);
  const [newStoryMediaType, setNewStoryMediaType] = useState<'image' | 'video' | null>(null);
  const [newStoryText, setNewStoryText] = useState('');
  const [storyCameraActive, setStoryCameraActive] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [hoveredLikeQuestionId, setHoveredLikeQuestionId] = useState<string | null>(null);
  const [activeGiftTarget, setActiveGiftTarget] = useState<any | null>(null); // For gift selection modal

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const commentRecordingIntervalRef = useRef<any>(null);
  const storyProgressIntervalRef = useRef<any>(null);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);
  const storyStreamRef = useRef<MediaStream | null>(null);

  // Stories Auto-Advance Effect
  useEffect(() => {
    if (!activeStoryUser) {
      setStoryProgress(0);
      return;
    }

    const userStories = stories.filter((s) => s.userId === activeStoryUser.id);
    if (userStories.length === 0) return;

    setStoryProgress(0);

    storyProgressIntervalRef.current = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < userStories.length - 1) {
            setActiveStoryIndex((idx) => idx + 1);
            return 0;
          } else {
            setActiveStoryUser(null);
            setActiveStoryIndex(0);
            return 0;
          }
        }
        return prev + 2; // 5 seconds
      });
    }, 100);

    return () => {
      if (storyProgressIntervalRef.current) {
        clearInterval(storyProgressIntervalRef.current);
      }
    };
  }, [activeStoryUser, activeStoryIndex, stories]);

  // Story camera utilities
  const startStoryCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      storyStreamRef.current = stream;
      if (storyVideoRef.current) {
        storyVideoRef.current.srcObject = stream;
        storyVideoRef.current.play();
      }
      setStoryCameraActive(true);
    } catch (err) {
      alert('Kameraya erişilemedi.');
    }
  };

  const stopStoryCamera = () => {
    if (storyStreamRef.current) {
      storyStreamRef.current.getTracks().forEach((track) => track.stop());
      storyStreamRef.current = null;
    }
    setStoryCameraActive(false);
  };

  const captureStoryPhoto = () => {
    if (storyVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(storyVideoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setNewStoryMedia(dataUrl);
        setNewStoryMediaType('image');
        stopStoryCamera();
      }
    }
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStoryMedia(reader.result as string);
        setNewStoryMediaType(type);
        stopStoryCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setDailyQuestion(getRandomQuestion());
  }, []);

  useEffect(() => {
    if (currentUser) {
      setActiveTab('followed');
    } else {
      setActiveTab('global');
    }
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (commentRecordingIntervalRef.current) {
        clearInterval(commentRecordingIntervalRef.current);
      }
    };
  }, []);

  // Get followed user IDs
  const followedUserIds = follows
    .filter((f) => f.followerId === currentUser?.id)
    .map((f) => f.followingId);

  // Get answered questions
  const allAnswered = questions
    .filter((q) => q.answerText !== null && !q.isReported)
    .sort((a, b) => new Date(b.answeredAt!).getTime() - new Date(a.answeredAt!).getTime());

  // Filter followed questions
  const followedAnswered = allAnswered.filter((q) => followedUserIds.includes(q.receiverId));

  // Get versus polls
  const filteredPolls = activeTab === 'followed'
    ? versusPolls.filter((p) => followedUserIds.includes(p.creatorId) || p.creatorId === currentUser?.id)
    : versusPolls;

  // Mix feed items chronologically
  const mixFeedItems = () => {
    const questionsMapped = (activeTab === 'followed' ? followedAnswered : allAnswered).map((q) => ({
      type: 'qa' as const,
      id: q.id,
      date: q.answeredAt!,
      data: q
    }));

    const pollsMapped = filteredPolls.map((p) => ({
      type: 'versus' as const,
      id: p.id,
      date: p.createdAt,
      data: p
    }));

    return [...questionsMapped, ...pollsMapped].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const feedItems = mixFeedItems();

  // Suggested users
  const suggestedUsers = users
    .filter((u) => u.id !== currentUser?.id && !followedUserIds.includes(u.id))
    .slice(0, 3);

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

  const handleCopyLink = (username: string, qId: string) => {
    const shareUrl = `${window.location.origin}/${username}?question=${qId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(qId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getReceiverUser = (receiverId: string) => {
    return users.find((u) => u.id === receiverId);
  };

  const getPollCreator = (creatorId: string) => {
    return users.find((u) => u.id === creatorId);
  };

  const handleRefreshDaily = () => {
    setDailyQuestion(getRandomQuestion());
    setDailyAnswer('');
    setIsAnsweringDaily(false);
  };

  const handleAnswerDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyAnswer.trim() || !currentUser) return;

    askQuestion(currentUser.id, dailyQuestion, true);
    
    setTimeout(() => {
      const unanswered = questions.find(
        (q) => q.receiverId === currentUser.id && q.answerText === null && q.text.includes(dailyQuestion)
      );
      if (unanswered) {
        answerQuestion(unanswered.id, dailyAnswer.trim());
      } else {
        const latest = questions[0];
        if (latest && latest.receiverId === currentUser.id) {
          answerQuestion(latest.id, dailyAnswer.trim());
        }
      }
    }, 100);

    setDailySuccess('Günün sorusu yanıtlandı! (+10 Jeton) 🪙');
    setDailyAnswer('');
    setIsAnsweringDaily(false);
    setTimeout(() => {
      setDailySuccess('');
      setDailyQuestion(getRandomQuestion());
    }, 3000);
  };

  // Shoutout Submission
  const handleShoutoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoutoutText.trim()) return;

    sendShoutout(shoutoutText.trim(), shoutoutAnon);
    setShoutoutText('');
    setCreatorMsg({ text: 'Toplu sorunuz (Shoutout) tüm kullanıcılara ulaştırıldı! 📢', isError: false });
    setTimeout(() => setCreatorMsg({ text: '', isError: false }), 4000);
  };

  // Versus Submission
  const handleVersusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versusTitle.trim() || !versusImgA.trim() || !versusImgB.trim()) {
      setCreatorMsg({ text: 'Lütfen tüm alanları doldurun.', isError: true });
      return;
    }

    createVersusPoll(versusTitle.trim(), versusImgA.trim(), versusImgB.trim());
    setVersusTitle('');
    setVersusImgA('');
    setVersusImgB('');
    setCreatorMsg({ text: 'Versus anketi başarıyla yayınlandı! (+10 Jeton) 📊', isError: false });
    setTimeout(() => setCreatorMsg({ text: '', isError: false }), 4000);
  };

  const handleApplyPreset = (preset: typeof VERSUS_PRESETS[0]) => {
    setVersusTitle(preset.name);
    setVersusImgA(preset.imgA);
    setVersusImgB(preset.imgB);
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
    // Reuse message chunks
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
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

    if (cancel) {
      audioChunksRef.current = [];
      return;
    }

    setTimeout(() => {
      if (audioChunksRef.current.length === 0) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedCommentMediaUrl(reader.result as string);
        setAttachedCommentMediaType('audio');
      };
      reader.readAsDataURL(audioBlob);
    }, 150);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeStoriesByUser = React.useMemo(() => {
    const grouped: { [userId: string]: Story[] } = {};
    stories.forEach((story) => {
      if (!grouped[story.userId]) {
        grouped[story.userId] = [];
      }
      grouped[story.userId].push(story);
    });
    return grouped;
  }, [stories]);

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        {/* Stories Row */}
        {currentUser && (
          <div className={styles.storiesContainer}>
            {/* Add Story Button */}
            <div className={styles.storyRing} onClick={() => {
              setShowStoryCreateModal(true);
              setNewStoryMedia(null);
              setNewStoryMediaType(null);
              setNewStoryText('');
            }}>
              <div className={styles.addStoryBtn}>
                <Plus size={20} />
              </div>
              <span className={styles.addStoryText}>Hikaye Ekle</span>
            </div>

            {/* List of active stories */}
            {Object.keys(activeStoriesByUser).map((storyUserId) => {
              const u = users.find((user) => user.id === storyUserId);
              if (!u) return null;
              
              const userStories = activeStoriesByUser[storyUserId];
              if (userStories.length === 0) return null;

              return (
                <div key={storyUserId} className={styles.storyRing} onClick={() => {
                  setActiveStoryUser(u);
                  setActiveStoryIndex(0);
                }}>
                  <div className={styles.storyAvatarWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.avatarUrl} alt={u.displayName} className={styles.storyAvatar} />
                  </div>
                  <span className={styles.storyUsername}>{u.displayName}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Creator Panel (Only for logged in users) */}
        {currentUser && (
          <div className={`${styles.creatorPanel} glass-panel`}>
            <div className={styles.creatorTabs}>
              <button
                onClick={() => setCreatorTab('shoutout')}
                className={`${styles.creatorTabBtn} ${creatorTab === 'shoutout' ? styles.creatorTabActive : ''}`}
              >
                <Megaphone size={16} />
                <span>Toplu Soru (Shoutout)</span>
              </button>
              <button
                onClick={() => setCreatorTab('versus')}
                className={`${styles.creatorTabBtn} ${creatorTab === 'versus' ? styles.creatorTabActive : ''}`}
              >
                <BarChart2 size={16} />
                <span>Versus Anketi</span>
              </button>
            </div>

            {creatorMsg.text && (
              <div className={`${styles.creatorAlert} ${creatorMsg.isError ? styles.alertError : styles.alertSuccess}`}>
                {creatorMsg.text}
              </div>
            )}

            {creatorTab === 'shoutout' ? (
              <form onSubmit={handleShoutoutSubmit} className={styles.creatorForm}>
                <textarea
                  placeholder="Çevrendeki herkese sormak istediğin soruyu yaz..."
                  className="glass-input"
                  rows={2}
                  value={shoutoutText}
                  onChange={(e) => setShoutoutText(e.target.value)}
                  required
                />
                <div className={styles.creatorBottom}>
                  <div className={styles.anonToggle}>
                    <input
                      type="checkbox"
                      id="shoutoutAnon"
                      checked={shoutoutAnon}
                      onChange={(e) => setShoutoutAnon(e.target.checked)}
                    />
                    <label htmlFor="shoutoutAnon">Anonim gönder</label>
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    <Megaphone size={14} />
                    <span>Herkese Gönder</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVersusSubmit} className={styles.creatorForm}>
                <input
                  type="text"
                  placeholder="Versus Başlığı (örn: Hangisi daha lezzetli?)"
                  className="glass-input"
                  value={versusTitle}
                  onChange={(e) => setVersusTitle(e.target.value)}
                  required
                />
                <div className={styles.versusUrls}>
                  <div className={styles.versusUrlInput}>
                    <ImageIcon size={14} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Seçenek A Görsel URL"
                      className="glass-input"
                      value={versusImgA}
                      onChange={(e) => setVersusImgA(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.versusUrlInput}>
                    <ImageIcon size={14} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Seçenek B Görsel URL"
                      className="glass-input"
                      value={versusImgB}
                      onChange={(e) => setVersusImgB(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Presets Row */}
                <div className={styles.presetsRow}>
                  <span className={styles.presetLabel}>Hazır Şablonlar:</span>
                  {VERSUS_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={styles.presetBtn}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className={styles.creatorBottom} style={{ justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    <BarChart2 size={14} />
                    <span>Versus Oluştur</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Feed Tab Navigation */}
        <div className={styles.feedTabs}>
          {currentUser && (
            <button
              onClick={() => setActiveTab('followed')}
              className={`${styles.tabBtn} ${activeTab === 'followed' ? styles.activeTab : ''}`}
            >
              Takip Ettiklerin
            </button>
          )}
          <button
            onClick={() => setActiveTab('global')}
            className={`${styles.tabBtn} ${activeTab === 'global' ? styles.activeTab : ''}`}
          >
            Öne Çıkanlar
          </button>
        </div>

        {/* Feed List */}
        <div className={styles.feedList}>
          {feedItems.length > 0 ? (
            feedItems.map((item) => {
              if (item.type === 'qa') {
                const q = item.data;
                const receiver = getReceiverUser(q.receiverId);
                const asker = getQuestionSender(q.senderUsername);
                const liked = isLiked(q.id);

                if (!receiver) return null;

                return (
                  <div key={q.id} className={`${styles.feedCard} glass-panel animate-fade-in ${receiver.vipStatus ? 'vip-card-glow' : ''}`}>
                    {/* Receiver User Details */}
                    <div className={styles.receiverHeader}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={receiver.avatarUrl} 
                        alt={receiver.displayName} 
                        className={styles.receiverAvatar}
                        onClick={() => router.push(`/${receiver.username}`)}
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
                      <Link href={`/q/${q.id}`} className={styles.date} style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        <Calendar size={12} />
                        {formatDate(q.answeredAt!)}
                      </Link>
                    </div>

                    {/* Question and Answer Text */}
                    <div className={styles.qaBody}>
                      <p className={styles.questionText}>
                        <span className={styles.askerTag}>
                          {asker ? `@${asker.username}` : 'Anonim'}
                        </span>
                        : {q.text}
                      </p>
                      
                      {q.mediaUrl && (
                        <div className={styles.postMediaWrapper}>
                          {(!q.mediaType || q.mediaType === 'image') && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={q.mediaUrl} alt="Ekteki Görsel" className={styles.postMedia} />
                          )}
                          {q.mediaType === 'video' && (
                            <video src={q.mediaUrl} controls className={styles.postMedia} />
                          )}
                          {q.mediaType === 'audio' && (
                            <audio src={q.mediaUrl} controls className={styles.postAudio} style={{ width: '100%', marginTop: '6px' }} />
                          )}
                        </div>
                      )}

                      <div className={styles.answerSection}>
                        <p className={styles.answerText}>{q.answerText}</p>
                        
                        {/* Received Gifts List */}
                        {(() => {
                          const answerGifts = gifts.filter((g) => g.answerId === q.id);
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
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                              {Object.entries(counts).map(([type, count]) => (
                                <span 
                                  key={type} 
                                  style={{ 
                                    fontSize: '0.72rem', 
                                    padding: '4px 8px', 
                                    borderRadius: '12px', 
                                    background: 'var(--input-bg)', 
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
                    <div className={styles.cardActions}>
                      <div 
                        onMouseEnter={() => setHoveredLikeQuestionId(q.id)}
                        onMouseLeave={() => setHoveredLikeQuestionId(null)}
                        style={{ position: 'relative' }}
                      >
                        <button 
                          onClick={() => handleLike(q.id)} 
                          className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
                        >
                          {(() => {
                            const userLike = likes.find((l) => l.userId === currentUser?.id && l.questionId === q.id);
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
                          <span>{q.likesCount}</span>
                        </button>

                        {/* Emoji Reactions Popover */}
                        {hoveredLikeQuestionId === q.id && (
                          <div className="reaction-popover" onMouseEnter={() => setHoveredLikeQuestionId(q.id)}>
                            <button type="button" onClick={() => { toggleLikeReaction(q.id, 'like'); setHoveredLikeQuestionId(null); }} className="reaction-emoji-btn" title="Beğen">👍</button>
                            <button type="button" onClick={() => { toggleLikeReaction(q.id, 'love'); setHoveredLikeQuestionId(null); }} className="reaction-emoji-btn" title="Sev">❤️</button>
                            <button type="button" onClick={() => { toggleLikeReaction(q.id, 'haha'); setHoveredLikeQuestionId(null); }} className="reaction-emoji-btn" title="Kahkaha">😂</button>
                            <button type="button" onClick={() => { toggleLikeReaction(q.id, 'wow'); setHoveredLikeQuestionId(null); }} className="reaction-emoji-btn" title="Şaşır">😮</button>
                            <button type="button" onClick={() => { toggleLikeReaction(q.id, 'sad'); setHoveredLikeQuestionId(null); }} className="reaction-emoji-btn" title="Üzül">😢</button>
                          </div>
                        )}
                      </div>

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
                      >
                        <MessageSquare size={16} />
                        <span>Yorumlar ({q.comments?.length || 0})</span>
                      </button>

                      {currentUser && currentUser.id !== q.receiverId && (
                        <button 
                          onClick={() => setActiveGiftTarget({ questionId: q.id, receiverId: q.receiverId })}
                          className={styles.shareBtn}
                          title="Hediye Gönder"
                        >
                          <Gift size={16} />
                          <span>Hediye Gönder</span>
                        </button>
                      )}

                      <button 
                        onClick={() => handleCopyLink(receiver.username, q.id)} 
                        className={styles.shareBtn}
                      >
                        {copiedId === q.id ? <Check size={16} /> : <Share2 size={16} />}
                        <span>{copiedId === q.id ? 'Kopyalandı' : 'Paylaş'}</span>
                      </button>
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
              } else {
                // Versus Poll renderer
                const p = item.data;
                const creator = getPollCreator(p.creatorId);

                if (!creator) return null;

                const votesA = p.votesA.length;
                const votesB = p.votesB.length;
                const totalVotes = votesA + votesB;
                const percentA = totalVotes === 0 ? 50 : Math.round((votesA / totalVotes) * 100);
                const percentB = totalVotes === 0 ? 50 : Math.round((votesB / totalVotes) * 100);
                
                const hasVoted = currentUser ? (p.votesA.includes(currentUser.id) || p.votesB.includes(currentUser.id)) : false;
                const votedA = currentUser ? p.votesA.includes(currentUser.id) : false;
                const votedB = currentUser ? p.votesB.includes(currentUser.id) : false;

                return (
                  <div key={p.id} className={`${styles.feedCard} glass-panel animate-fade-in`}>
                    {/* Creator Info */}
                    <div className={styles.receiverHeader}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={creator.avatarUrl} 
                        alt={creator.displayName} 
                        className={styles.receiverAvatar}
                        onClick={() => router.push(`/${creator.username}`)}
                      />
                      <div className={styles.receiverMeta}>
                        <Link href={`/${creator.username}`} className={styles.receiverName}>
                          {creator.displayName}
                        </Link>
                        <span className={styles.receiverUname}>@{creator.username} anketi</span>
                      </div>
                      <span className={styles.date}>
                        <Calendar size={12} />
                        {formatDate(p.createdAt)}
                      </span>
                    </div>

                    {/* Poll Body */}
                    <div className={styles.pollBody}>
                      <h4 className={styles.pollTitle}>{p.title}</h4>
                      
                      <div className={styles.versusGrid}>
                        {/* Option A */}
                        <div 
                          className={`${styles.versusOption} ${votedA ? styles.votedOutline : ''}`}
                          onClick={() => voteVersus(p.id, 'A')}
                        >
                          <div className={styles.versusImageContainer}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.imgA} alt="Option A" className={styles.versusImg} />
                            {votedA && <span className={styles.votedBadge}><Check size={12} /></span>}
                          </div>
                          
                          {hasVoted || p.creatorId === currentUser?.id ? (
                            <div className={styles.progressSection}>
                              <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${percentA}%` }} />
                              </div>
                              <span className={styles.percentText}>{percentA}% ({votesA} oy)</span>
                            </div>
                          ) : (
                            <button className={styles.voteBtn}>Oy Ver</button>
                          )}
                        </div>

                        <div className={styles.versusDivider}>VS</div>

                        {/* Option B */}
                        <div 
                          className={`${styles.versusOption} ${votedB ? styles.votedOutline : ''}`}
                          onClick={() => voteVersus(p.id, 'B')}
                        >
                          <div className={styles.versusImageContainer}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.imgB} alt="Option B" className={styles.versusImg} />
                            {votedB && <span className={styles.votedBadge}><Check size={12} /></span>}
                          </div>
                          
                          {hasVoted || p.creatorId === currentUser?.id ? (
                            <div className={styles.progressSection}>
                              <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${percentB}%` }} />
                              </div>
                              <span className={styles.percentText}>{percentB}% ({votesB} oy)</span>
                            </div>
                          ) : (
                            <button className={styles.voteBtn}>Oy Ver</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          ) : (
            <div className={`${styles.emptyFeed} glass-panel`}>
              <HelpCircle size={48} className={styles.emptyIcon} />
              <h3>Gösterilecek içerik bulunmuyor</h3>
              <p>
                {activeTab === 'followed' 
                  ? 'Takip ettiğin kullanıcılar henüz bir paylaşım yapmadı.' 
                  : 'Platformda henüz hiç paylaşım bulunmuyor.'
                }
              </p>
              {activeTab === 'followed' && (
                <button onClick={() => setActiveTab('global')} className="btn-primary" style={{ marginTop: '16px' }}>
                  Öne Çıkanları Keşfet
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Desktop Right Sidebar */}
      <aside className="right-sidebar">
        {/* User Card */}
        {currentUser ? (
          <div className={`${styles.rightCard} glass-panel`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUser.avatarUrl} alt={currentUser.displayName} className={styles.userCardAvatar} />
            <Link href={`/${currentUser.username}`} className={styles.userCardName}>
              {currentUser.displayName}
            </Link>
            <span className={styles.userCardUname}>@{currentUser.username}</span>
            
            <div className={styles.userCardStats}>
              <div className={styles.userCardStatItem}>
                <span className={styles.statVal}>{currentUser.answersCount}</span>
                <span className={styles.statLabel}>Yanıt</span>
              </div>
              <div className={styles.userCardStatItem}>
                <span className={styles.statVal}>{currentUser.followersCount}</span>
                <span className={styles.statLabel}>Takipçi</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${styles.rightCard} glass-panel ${styles.loginPromo}`}>
            <HelpCircle size={32} className={styles.promoIcon} />
            <h3>Bir Soru Sor!</h3>
            <p>Arkadaşlarına anonim veya açık sorular sormak ve kendi profilini oluşturmak için giriş yap.</p>
            <Link href="/login" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <LogIn size={16} />
              <span>Giriş Yap / Kayıt Ol</span>
            </Link>
          </div>
        )}

        {/* Question of the Day */}
        <div className={`${styles.rightCard} glass-panel`}>
          <div className={styles.cardHeaderWithIcon}>
            <Sparkles size={16} className={styles.sparkleIcon} />
            <h4 className={styles.cardTitle}>Günün Sorusu</h4>
          </div>
          
          {dailySuccess && <div className={styles.dailySuccess}>{dailySuccess}</div>}

          <p className={styles.dailyQuestionText}>&quot;{dailyQuestion}&quot;</p>
          
          {currentUser ? (
            isAnsweringDaily ? (
              <form onSubmit={handleAnswerDaily} className={styles.dailyAnswerForm}>
                <textarea
                  className="glass-input"
                  placeholder="Soruyu yanıtla..."
                  rows={3}
                  value={dailyAnswer}
                  onChange={(e) => setDailyAnswer(e.target.value)}
                  autoFocus
                />
                <div className={styles.dailyFormActions}>
                  <button 
                    type="button" 
                    onClick={() => setIsAnsweringDaily(false)} 
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Yanıtla
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.dailyQuestionActions}>
                <button onClick={() => setIsAnsweringDaily(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Yayınla
                </button>
                <button onClick={handleRefreshDaily} className={styles.iconBtn} title="Başka Soru Getir">
                  <RefreshCw size={16} />
                </button>
              </div>
            )
          ) : (
            <p className={styles.loginToAnswerText}>
              Günün sorusunu yanıtlamak için lütfen giriş yapın.
            </p>
          )}
        </div>

        {/* Suggested users to follow */}
        {suggestedUsers.length > 0 && (
          <div className={`${styles.rightCard} glass-panel`}>
            <h4 className={styles.cardTitle} style={{ marginBottom: '12px' }}>Kimi Takip Etmeli?</h4>
            <div className={styles.suggestedList}>
              {suggestedUsers.map((user) => (
                <div key={user.id} className={styles.suggestedUserItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatarUrl} alt={user.displayName} className={styles.suggestedAvatar} />
                  <div className={styles.suggestedMeta}>
                    <Link href={`/${user.username}`} className={styles.suggestedName}>
                      {user.displayName}
                    </Link>
                    <span className={styles.suggestedUname}>@{user.username}</span>
                  </div>
                  {currentUser && (
                    <button 
                      onClick={() => toggleFollow(user.id)} 
                      className={styles.suggestedFollowBtn}
                      title="Takip Et"
                    >
                      <UserPlus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

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

      {/* Story Viewer Modal */}
      {activeStoryUser && (() => {
        const userStories = stories.filter((s) => s.userId === activeStoryUser.id);
        const currentStory = userStories[activeStoryIndex];
        if (!currentStory) return null;

        return (
          <div className={styles.storyViewerOverlay}>
            <div className={styles.storyViewerContent}>
              {/* Progress Bars */}
              <div className={styles.storyProgressBarContainer}>
                {userStories.map((s, idx) => (
                  <div key={s.id} className={styles.storyProgressBar}>
                    <div 
                      className={styles.storyProgressBarActive}
                      style={{ 
                        width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? `${storyProgress}%` : '0%'
                      }} 
                    />
                  </div>
                ))}
              </div>

              {/* Story Header */}
              <div className={styles.storyHeader}>
                <div className={styles.storyUserInfo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeStoryUser.avatarUrl} alt={activeStoryUser.displayName} className={styles.storyUserAvatar} />
                  <div className={styles.storyUserMeta}>
                    <span className={styles.storyUserDisplayName}>{activeStoryUser.displayName}</span>
                    <span className={styles.storyTime}>Bugün</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveStoryUser(null);
                    setActiveStoryIndex(0);
                  }} 
                  className={styles.storyCloseBtn}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Story Navigation areas */}
              <div 
                className={`${styles.storyNavigation} ${styles.storyNavLeft}`} 
                onClick={() => {
                  if (activeStoryIndex > 0) {
                    setActiveStoryIndex((idx) => idx - 1);
                  }
                }} 
              />
              <div 
                className={`${styles.storyNavigation} ${styles.storyNavRight}`} 
                onClick={() => {
                  if (activeStoryIndex < userStories.length - 1) {
                    setActiveStoryIndex((idx) => idx + 1);
                  } else {
                    setActiveStoryUser(null);
                    setActiveStoryIndex(0);
                  }
                }} 
              />

              {/* Story Content Wrapper */}
              <div className={styles.storyMediaWrapper}>
                {currentStory.mediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentStory.mediaUrl} alt="" className={styles.storyImage} />
                ) : (
                  <video src={currentStory.mediaUrl} className={styles.storyVideo} autoPlay playsInline muted />
                )}
                {currentStory.text && (
                  <div className={styles.storyCaption}>
                    {currentStory.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Story Creator Modal */}
      {showStoryCreateModal && (
        <div className={styles.storyViewerOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`} style={{ maxWidth: '440px', padding: '24px', display: 'block', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Hikaye Ekle</h3>
              <button 
                onClick={() => {
                  setShowStoryCreateModal(false);
                  stopStoryCamera();
                }} 
                className={styles.storyCloseBtn}
                style={{ color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Camera Preview or Selected Media */}
            <div style={{ width: '100%', height: '260px', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              {storyCameraActive && (
                <video ref={storyVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
              )}

              {!storyCameraActive && newStoryMedia && (
                newStoryMediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newStoryMedia} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <video src={newStoryMedia} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls playsInline />
                )
              )}

              {!storyCameraActive && !newStoryMedia && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ImageIcon size={40} style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Görsel veya video seçin</p>
                </div>
              )}
            </div>

            {/* Media selection / Camera capture action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {storyCameraActive ? (
                <>
                  <button type="button" onClick={captureStoryPhoto} className="btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}>
                    Fotoğraf Çek
                  </button>
                  <button type="button" onClick={stopStoryCamera} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                    Kapat
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={startStoryCamera} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem' }}>
                    <Camera size={16} /> Kamera
                  </button>
                  <label className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
                    <ImageIcon size={16} /> Fotoğraf Seç
                    <input type="file" accept="image/*" onChange={(e) => handleStoryUpload(e, 'image')} style={{ display: 'none' }} />
                  </label>
                  <label className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
                    <Video size={16} /> Video Seç
                    <input type="file" accept="video/*" onChange={(e) => handleStoryUpload(e, 'video')} style={{ display: 'none' }} />
                  </label>
                </>
              )}
            </div>

            {/* Caption Input */}
            <input 
              type="text" 
              placeholder="Hikayene bir açıklama yaz..." 
              className="glass-input" 
              value={newStoryText} 
              onChange={(e) => setNewStoryText(e.target.value)} 
              style={{ width: '100%', marginBottom: '16px', fontSize: '0.85rem' }}
            />

            {/* Share Button */}
            <button 
              type="button" 
              onClick={() => {
                if (newStoryMedia) {
                  addStory(newStoryMedia, newStoryMediaType!, newStoryText);
                  setShowStoryCreateModal(false);
                } else {
                  alert('Lütfen bir fotoğraf veya video ekleyin.');
                }
              }} 
              className="btn-primary" 
              style={{ width: '100%', padding: '12px' }}
            >
              Hikayeyi Paylaş
            </button>
          </div>
        </div>
      )}
      {/* Gift Selector Modal */}
      {activeGiftTarget && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`} style={{ maxWidth: '360px', padding: '24px', display: 'block', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Hediye Gönder</h3>
              <button onClick={() => setActiveGiftTarget(null)} className={styles.storyCloseBtn} style={{ color: 'var(--text-primary)' }}>
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
                        const success = sendGift(activeGiftTarget.receiverId, activeGiftTarget.questionId, gift.type as any);
                        if (success) {
                          alert(`${gift.name} başarıyla gönderildi!`);
                          setActiveGiftTarget(null);
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
