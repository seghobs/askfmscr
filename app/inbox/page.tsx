'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { 
  Trash2, 
  MessageSquare, 
  Send, 
  Calendar, 
  RefreshCw, 
  Copy, 
  Check, 
  Sparkles, 
  Coins, 
  Image as ImageIcon,
  Camera,
  Video,
  Mic,
  MicOff,
  X
} from 'lucide-react';
import styles from './inbox.module.css';

export default function InboxPage() {
  const { 
    currentUser, 
    questions, 
    users,
    answerQuestion, 
    deleteQuestion, 
    askQuestion, 
    getRandomQuestion, 
    getQuestionSender,
    unlockHint 
  } = useApp();
  
  const router = useRouter();
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  
  // Media Attachments States
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMicModal, setShowMicModal] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Clean up recording timers on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

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

  // Filter unanswered questions for the current user
  const inboxQuestions = questions.filter(
    (q) => q.receiverId === currentUser.id && q.answerText === null && !q.isReported
  );

  const handleAnswerSubmit = (qId: string) => {
    if (!answerText.trim() && !attachedMediaUrl) return;
    
    answerQuestion(qId, answerText.trim(), attachedMediaUrl, attachedMediaType || undefined);
    setAnswerText('');
    setAttachedMediaUrl(null);
    setAttachedMediaType(null);
    setActiveAnswerId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Dosya boyutu 10MB dan küçük olmalıdır.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedMediaUrl(reader.result as string);
        setAttachedMediaType(type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    setErrorMsg('');
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
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes('Requested device not found') || err.message?.includes('device not found')) {
        setShowMicModal(true);
      } else {
        setErrorMsg('Mikrofon erişimi reddedildi veya bulunamadı.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    }
  };

  const stopRecording = (cancel: boolean) => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    setIsRecording(false);

    if (cancel) {
      audioChunksRef.current = [];
      return;
    }

    setTimeout(() => {
      if (audioChunksRef.current.length === 0) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedMediaUrl(reader.result as string);
        setAttachedMediaType('audio');
      };
      reader.readAsDataURL(audioBlob);
    }, 150);
  };

  const handleGetRandomQuestion = () => {
    const randomQ = getRandomQuestion();
    askQuestion(currentUser.id, randomQ, true);
  };

  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/${currentUser.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Deterministically fetch sender user details for anonymous questions hint
  const getAnonHintSender = (qId: string) => {
    const otherUsers = users.filter((u) => u.id !== currentUser.id);
    if (otherUsers.length === 0) return null;
    const charSum = qId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = charSum % otherUsers.length;
    return otherUsers[index];
  };

  const handleUnlockHintClick = (qId: string) => {
    const cost = currentUser.vipStatus ? 0 : 30;
    const success = unlockHint(qId, cost);
    
    if (!success) {
      setErrorMsg('Yetersiz Jeton! İpucu açmak için 30 Jeton gerekir.');
      setTimeout(() => setErrorMsg(''), 3000);
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

  const formatRecordingSeconds = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gelen Kutusu</h1>
            <p className={styles.subtitle}>
              Gelen soruları yanıtla ve profilinde yayınla!
            </p>
          </div>
          <button 
            onClick={handleGetRandomQuestion} 
            className="btn-secondary" 
            style={{ fontSize: '0.85rem', padding: '10px 16px' }}
          >
            <RefreshCw size={16} />
            <span>Rastgele Soru Al</span>
          </button>
        </div>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        {inboxQuestions.length > 0 ? (
          <div className={styles.list}>
            {inboxQuestions.map((q) => {
              const sender = getQuestionSender(q.senderUsername);
              const isEditing = activeAnswerId === q.id;
              const hintSender = !sender ? getAnonHintSender(q.id) : null;

              return (
                <div key={q.id} className={`${styles.card} glass-panel`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.sender}>
                       {sender ? (
                        <span onClick={() => router.push(`/${sender.username}`)} className={styles.senderLink}>
                          {sender.displayName} (@{sender.username})
                        </span>
                      ) : (
                        <span className={styles.anonymous}>Anonim</span>
                      )}
                    </span>
                    <span className={styles.date}>
                      <Calendar size={12} />
                      {formatDate(q.createdAt)}
                    </span>
                  </div>

                  <p className={styles.questionText}>{q.text}</p>

                  {/* Anonymous Hint Section */}
                  {!sender && hintSender && (
                    <div className={styles.hintSection}>
                      {q.hintUnlocked ? (
                        <div className={styles.hintUnlockedBox}>
                          <Sparkles size={14} className={styles.sparkleIcon} />
                          <span>
                            İpucu: Gönderenin adı <strong>&quot;{hintSender.displayName[0]}&quot;</strong> harfiyle başlıyor ve kullanıcı adı <strong>@{hintSender.username[0]}...</strong>!
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUnlockHintClick(q.id)} 
                          className={styles.hintBtn}
                        >
                          <Coins size={14} />
                          <span>
                            {currentUser.vipStatus 
                              ? 'Kim sordu? İpucu Al (VIP - Ücretsiz)' 
                              : 'Kim sordu? İpucu Al (30 Jeton)'
                            }
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {isEditing ? (
                    <div className={styles.answerBox}>
                      
                      {/* Recording status panel or standard input */}
                      {isRecording ? (
                        <div className={styles.recorderPanel}>
                          <div className={styles.recorderLeft}>
                            <div className={styles.pulseDot} />
                            <span className={styles.recordingText}>Ses Kaydediliyor...</span>
                            <span className={styles.recordingTimer}>{formatRecordingSeconds(recordingTime)}</span>
                          </div>
                          <div className={styles.recorderRight}>
                            <button
                              type="button"
                              onClick={() => stopRecording(true)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              onClick={() => stopRecording(false)}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Bitir ve Ekle
                            </button>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          className="glass-input"
                          placeholder="Yanıtınızı yazın..."
                          rows={3}
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          autoFocus
                        />
                      )}

                      {/* Attached Media Preview Widget */}
                      {attachedMediaUrl && (
                        <div className={styles.mediaPreviewWrapper}>
                          {attachedMediaType === 'image' && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={attachedMediaUrl} alt="Ekteki Görsel" className={styles.mediaPreview} />
                          )}
                          {attachedMediaType === 'video' && (
                            <video src={attachedMediaUrl} controls className={styles.mediaPreview} />
                          )}
                          {attachedMediaType === 'audio' && (
                            <audio src={attachedMediaUrl} controls className={styles.audioPreview} />
                          )}
                          <button 
                            onClick={() => {
                              setAttachedMediaUrl(null);
                              setAttachedMediaType(null);
                            }} 
                            className={styles.removeMediaBtn}
                            title="Eki Kaldır"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {!isRecording && (
                        <div className={styles.answerActions}>
                          <div className={styles.attachmentOptions}>
                            {/* Photo upload */}
                            <label htmlFor={`file-input-${q.id}`} className={styles.attachBtn} title="Fotoğraf Ekle">
                              <Camera size={16} />
                              <span>Fotoğraf</span>
                            </label>
                            <input
                              id={`file-input-${q.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'image')}
                              style={{ display: 'none' }}
                            />

                            {/* Video upload */}
                            <label htmlFor={`video-input-${q.id}`} className={styles.attachBtn} title="Video Ekle">
                              <Video size={16} />
                              <span>Video</span>
                            </label>
                            <input
                              id={`video-input-${q.id}`}
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleFileChange(e, 'video')}
                              style={{ display: 'none' }}
                            />

                            {/* Voice recorder trigger */}
                            <button
                              type="button"
                              onClick={startRecording}
                              className={styles.attachBtn}
                              title="Ses Kaydet"
                            >
                              <Mic size={16} />
                              <span>Ses Kaydet</span>
                            </button>
                          </div>

                          <div className={styles.mainAnswerActions}>
                            <button
                              onClick={() => {
                                setActiveAnswerId(null);
                                setAnswerText('');
                                setAttachedMediaUrl(null);
                                setAttachedMediaType(null);
                              }}
                              className="btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => handleAnswerSubmit(q.id)}
                              className="btn-primary"
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              <Send size={14} />
                              <span>Yayınla</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => {
                          setActiveAnswerId(q.id);
                          setAnswerText('');
                          setAttachedMediaUrl(null);
                          setAttachedMediaType(null);
                        }}
                        className={styles.actionBtn}
                      >
                        <MessageSquare size={16} />
                        <span>Yanıtla</span>
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        aria-label="Soruyu Sil"
                      >
                        <Trash2 size={16} />
                        <span>Sil</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${styles.emptyState} glass-panel`}>
            <div className={styles.emptyIconWrapper}>
              <MessageSquare size={48} className={styles.emptyIcon} />
            </div>
            <h2>Gelen kutun boş görünüyor!</h2>
            <p>
              Sorular almak için profil linkini arkadaşlarınla paylaş ya da platformdan rastgele bir soru al.
            </p>
            <div className={styles.emptyActions}>
              <button onClick={handleCopyLink} className="btn-secondary">
                {copied ? <Check size={18} style={{ color: '#10b981' }} /> : <Copy size={18} />}
                <span>{copied ? 'Kopyalandı!' : 'Profil Linkini Kopyala'}</span>
              </button>
              <button onClick={handleGetRandomQuestion} className="btn-primary">
                <RefreshCw size={18} />
                <span>Rastgele Soru Al</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mic missing alert modal */}
      {showMicModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`}>
            <MicOff size={48} className={styles.modalIcon} />
            <h3>Mikrofon Bulunamadı</h3>
            <p>Sesli yanıt kaydedebilmek için lütfen cihazınıza bir mikrofon takın ve tekrar deneyin.</p>
            <button onClick={() => setShowMicModal(false)} className="btn-primary" style={{ marginTop: '16px', padding: '10px 24px' }}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
