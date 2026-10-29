'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { 
  Send, 
  MessageCircle, 
  ArrowLeft, 
  ShieldAlert, 
  Paperclip, 
  Smile, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Video, 
  X,
  Play,
  Square,
  CornerUpLeft,
  Trash2,
  Flag
} from 'lucide-react';
import styles from './messages.module.css';

const POPULAR_EMOJIS = ['😂', '❤️', '👍', '😍', '🔥', '🎉', '😭', '👏', '😮', '🤔', '💬', '🚀'];

export default function MessagesPage() {
  const { currentUser, users, messages, sendDM, deleteDM, reportDM } = useApp();
  const router = useRouter();
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<any>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState('');
  const [showMicModal, setShowMicModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Scroll to bottom when messages or active contact changes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContactId]);

  // Clean up recording timers on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Check query parameter "u" to auto-open target user chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const targetUserId = searchParams.get('u');
      if (targetUserId) {
        const contactExists = users.some((u) => u.id === targetUserId);
        if (contactExists) {
          setActiveContactId(targetUserId);
        }
      }
    }
  }, [users]);

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

  // Filter list of chats - all system users excluding current user
  const contacts = users.filter((u) => u.id !== currentUser.id);

  // Filter messages for active chat
  const activeChatMessages = messages
    .filter(
      (m) =>
        (m.senderId === currentUser.id && m.receiverId === activeContactId) ||
        (m.senderId === activeContactId && m.receiverId === currentUser.id)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim() || !activeContactId) return;

    sendDM(activeContactId, typedText.trim(), undefined, undefined, replyingMessage?.id);
    setTypedText('');
    setReplyingMessage(null);
    setShowEmojiPicker(false);
  };

  const getContactLastMessage = (contactId: string) => {
    const contactMsgs = messages
      .filter(
        (m) =>
          (m.senderId === currentUser.id && m.receiverId === contactId) ||
          (m.senderId === contactId && m.receiverId === currentUser.id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!contactMsgs[0]) return 'Sohbeti başlatın... 💬';
    
    if (contactMsgs[0].mediaType === 'image') return '📷 Fotoğraf';
    if (contactMsgs[0].mediaType === 'video') return '🎥 Video';
    if (contactMsgs[0].mediaType === 'audio') return '🎤 Ses Kaydı';
    
    return contactMsgs[0].text || 'Sohbet...';
  };

  // HTML5 Audio Recording Handlers
  const startRecording = async () => {
    setRecordingError('');
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
        // Stop all track streams
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
        setRecordingError('Mikrofon erişimi reddedildi veya bulunamadı.');
        setTimeout(() => setRecordingError(''), 3000);
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

    // Give media recorder a brief moment to finish stop and flush chunks
    setTimeout(() => {
      if (audioChunksRef.current.length === 0) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        if (activeContactId) {
          sendDM(activeContactId, '', base64Audio, 'audio', replyingMessage?.id);
          setReplyingMessage(null);
        }
      };
      reader.readAsDataURL(audioBlob);
    }, 150);
  };

  // Attachment upload triggers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file && activeContactId) {
      if (file.size > 10 * 1024 * 1024) {
        setRecordingError('Dosya boyutu 10MB dan küçük olmalıdır.');
        setTimeout(() => setRecordingError(''), 3000);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        sendDM(activeContactId, '', base64Data, type, replyingMessage?.id);
        setReplyingMessage(null);
      };
      reader.readAsDataURL(file);
      setShowAttachmentMenu(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setTypedText((prev) => prev + emoji);
  };

  const activeContact = users.find((u) => u.id === activeContactId);
  const isBlockedByMe = currentUser.blockedUserIds?.includes(activeContactId || '') || false;
  const isBlocker = activeContact?.blockedUserIds?.includes(currentUser.id) || false;

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', {
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

      <main className={`${styles.mainContent} main-content animate-fade-in`}>
        <div className={`${styles.chatWrapper} glass-panel`}>
          {/* Contacts Sidebar */}
          <div className={`${styles.sidebar} ${activeContactId ? styles.sidebarHiddenMobile : ''}`}>
            <h2 className={styles.sidebarTitle}>Mesajlar</h2>
            <div className={styles.contactsList}>
              {contacts.map((contact) => {
                const isActive = contact.id === activeContactId;
                const lastMsg = getContactLastMessage(contact.id);
                
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setActiveContactId(contact.id);
                      setShowEmojiPicker(false);
                      setShowAttachmentMenu(false);
                      setReplyingMessage(null);
                    }}
                    className={`${styles.contactItem} ${isActive ? styles.contactActive : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={contact.avatarUrl} alt={contact.displayName} className={styles.avatar} />
                    <div className={styles.contactMeta}>
                      <span className={styles.displayName}>{contact.displayName}</span>
                      <span className={styles.lastMsg}>{lastMsg}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Pane */}
          <div className={`${styles.chatPane} ${!activeContactId ? styles.chatPaneHiddenMobile : ''}`}>
            {activeContact ? (
              <div className={styles.chatPaneContainer}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <button onClick={() => setActiveContactId(null)} className={styles.mobileBackBtn}>
                    <ArrowLeft size={20} />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeContact.avatarUrl} alt={activeContact.displayName} className={styles.activeAvatar} onClick={() => router.push(`/${activeContact.username}`)} />
                  <div className={styles.activeUserMeta}>
                    <span onClick={() => router.push(`/${activeContact.username}`)} className={styles.activeName}>
                      {activeContact.displayName}
                    </span>
                    <span className={styles.activeUname}>@{activeContact.username}</span>
                  </div>
                </div>

                {/* Error Alert */}
                {recordingError && (
                  <div className={styles.recordingErrorAlert}>
                    {recordingError}
                  </div>
                )}

                {/* Messages Pane */}
                <div className={styles.messagesPane}>
                  {activeChatMessages.length > 0 ? (
                    activeChatMessages.map((msg) => {
                      const isOutgoing = msg.senderId === currentUser.id;

                      return (
                        <div
                          key={msg.id}
                          className={`${styles.messageRow} ${isOutgoing ? styles.rowOutgoing : styles.rowIncoming}`}
                        >
                          <div className={styles.bubbleWrapper}>
                            <div className={`${styles.messageBubble} ${isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming}`}>
                              {/* Replying Quote Block */}
                              {msg.replyToId && (() => {
                                const replied = activeChatMessages.find((m) => m.id === msg.replyToId);
                                if (!replied) return null;
                                return (
                                  <div className={`${styles.quotedBox} ${isOutgoing ? styles.quotedOutgoing : styles.quotedIncoming}`}>
                                    <span className={styles.quotedSender}>
                                      {replied.senderId === currentUser.id ? 'Siz' : activeContact.displayName}
                                    </span>
                                    <p className={styles.quotedText}>
                                      {replied.mediaType === 'image' && '📷 Fotoğraf'}
                                      {replied.mediaType === 'video' && '🎥 Video'}
                                      {replied.mediaType === 'audio' && '🎤 Ses Kaydı'}
                                      {replied.text || ''}
                                    </p>
                                  </div>
                                );
                              })()}

                              {msg.isReported ? (
                                <div className={styles.reportedMessageBody}>
                                  <ShieldAlert size={14} />
                                  <span>Bu mesaj şikayet edildi.</span>
                                </div>
                              ) : (
                                <>
                                  {/* Rich Media Renderers */}
                                  {msg.mediaType === 'image' && (
                                    <div className={styles.mediaContainer}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img 
                                        src={msg.mediaUrl} 
                                        alt="Gönderilen fotoğraf" 
                                        className={styles.messageImage}
                                        onClick={() => window.open(msg.mediaUrl)} 
                                      />
                                    </div>
                                  )}

                                  {msg.mediaType === 'video' && (
                                    <div className={styles.mediaContainer}>
                                      <video src={msg.mediaUrl} controls className={styles.messageVideo} />
                                    </div>
                                  )}

                                  {msg.mediaType === 'audio' && (
                                    <div className={styles.mediaContainer}>
                                      <audio src={msg.mediaUrl} controls className={styles.messageAudio} />
                                    </div>
                                  )}

                                  {msg.text && <p className={styles.messageText}>{msg.text}</p>}
                                </>
                              )}
                              
                              <span className={styles.messageTime}>{formatMessageTime(msg.createdAt)}</span>
                            </div>

                            {!msg.isReported && (
                              <div className={`${styles.bubbleActions} ${isOutgoing ? styles.actionsOutgoing : styles.actionsIncoming}`}>
                                <button onClick={() => setReplyingMessage(msg)} title="Yanıtla">
                                  <CornerUpLeft size={14} />
                                </button>
                                {isOutgoing ? (
                                  <button 
                                    onClick={() => deleteDM(msg.id)} 
                                    title="Mesajı Geri Al" 
                                    className={styles.deleteAction}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                ) : (
                                  <button onClick={() => { reportDM(msg.id); }} title="Mesajı Bildir">
                                    <Flag size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyMessages}>
                      <MessageCircle size={32} />
                      <p>Sohbetin ilk mesajını siz gönderin!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Form */}
                <div className={styles.inputArea}>
                  {isBlockedByMe ? (
                    <div className={styles.blockedAlert}>
                      <ShieldAlert size={16} />
                      <span>Bu kullanıcıyı engellediniz. Mesaj göndermek için engelini kaldırın.</span>
                    </div>
                  ) : isBlocker ? (
                    <div className={styles.blockedAlert}>
                      <ShieldAlert size={16} />
                      <span>Bu kullanıcı tarafından engellendiğiniz için mesaj gönderemezsiniz.</span>
                    </div>
                  ) : (
                    <div className={styles.inputControlsWrapper}>
                      
                      {/* Replying Preview Header */}
                      {replyingMessage && (
                        <div className={styles.replyPreviewHeader}>
                          <div className={styles.replyPreviewLeft}>
                            <span className={styles.replyTitle}>
                              {replyingMessage.senderId === currentUser.id ? 'Kendine yanıt veriyorsun' : `${activeContact.displayName} kullanıcısına yanıt veriyorsun`}
                            </span>
                            <p className={styles.replyDesc}>
                              {replyingMessage.mediaType === 'image' && '📷 Fotoğraf'}
                              {replyingMessage.mediaType === 'video' && '🎥 Video'}
                              {replyingMessage.mediaType === 'audio' && '🎤 Ses Kaydı'}
                              {replyingMessage.text || ''}
                            </p>
                          </div>
                          <button onClick={() => setReplyingMessage(null)} className={styles.closeReplyBtn}>
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Emoji Picker Grid */}
                      {showEmojiPicker && (
                        <div className={`${styles.emojiPickerGrid} glass-panel animate-fade-in`}>
                          {POPULAR_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className={styles.emojiCell}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Attachment Menu Popup */}
                      {showAttachmentMenu && (
                        <div className={`${styles.attachmentDropdown} glass-panel animate-fade-in`}>
                          <label htmlFor="image-file-input" className={styles.attachmentItem}>
                            <ImageIcon size={16} />
                            <span>Görsel Yükle</span>
                          </label>
                          <input
                            id="image-file-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'image')}
                            style={{ display: 'none' }}
                          />

                          <label htmlFor="video-file-input" className={styles.attachmentItem}>
                            <Video size={16} />
                            <span>Video Yükle</span>
                          </label>
                          <input
                            id="video-file-input"
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileUpload(e, 'video')}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )}

                      {/* Micro Recorder Panel */}
                      {isRecording ? (
                        <div className={styles.recorderPanel}>
                          <div className={styles.recorderLeft}>
                            <div className={styles.pulseDot} />
                            <span className={styles.recordingText}>Kayıt Yapılıyor...</span>
                            <span className={styles.recordingTimer}>{formatRecordingSeconds(recordingTime)}</span>
                          </div>
                          <div className={styles.recorderRight}>
                            <button
                              type="button"
                              onClick={() => stopRecording(true)}
                              className={styles.cancelRecordBtn}
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              onClick={() => stopRecording(false)}
                              className={styles.sendRecordBtn}
                            >
                              <Send size={14} />
                              <span>Gönder</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSendMessage} className={styles.inputForm}>
                          {/* Emoji Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowEmojiPicker(!showEmojiPicker);
                              setShowAttachmentMenu(false);
                            }}
                            className={styles.iconActionBtn}
                            title="Emoji Ekle"
                          >
                            <Smile size={20} className={showEmojiPicker ? styles.activeInputIcon : ''} />
                          </button>

                          {/* Attachment Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachmentMenu(!showAttachmentMenu);
                              setShowEmojiPicker(false);
                            }}
                            className={styles.iconActionBtn}
                            title="Dosya Ekle"
                          >
                            <Paperclip size={20} className={showAttachmentMenu ? styles.activeInputIcon : ''} />
                          </button>

                          {/* Text input */}
                          <input
                            type="text"
                            placeholder="Mesajınızı yazın..."
                            className="glass-input"
                            value={typedText}
                            onChange={(e) => {
                              setTypedText(e.target.value);
                              setShowEmojiPicker(false);
                            }}
                            style={{ flex: 1, minWidth: 0 }}
                            required
                          />

                          {/* Voice Recorder Mic Toggle */}
                          <button
                            type="button"
                            onClick={startRecording}
                            className={styles.iconActionBtn}
                            title="Ses Kaydet"
                          >
                            <Mic size={20} />
                          </button>

                          {/* Submit */}
                          <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
                            <Send size={18} />
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.chatPlaceholder}>
                <MessageCircle size={56} className={styles.placeholderIcon} />
                <h3>Özel Sohbetler</h3>
                <p>Mesajlaşmaya başlamak için sol taraftaki listeden bir arkadaşını seç.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      {showMicModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`}>
            <MicOff size={48} className={styles.modalIcon} />
            <h3>Mikrofon Bulunamadı</h3>
            <p>Sesli mesaj kaydedebilmek için lütfen bilgisayarınıza bir mikrofon takın ve tekrar deneyin.</p>
            <button onClick={() => setShowMicModal(false)} className="btn-primary" style={{ marginTop: '16px', padding: '10px 24px' }}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
