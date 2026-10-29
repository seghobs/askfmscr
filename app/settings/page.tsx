'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { Save, User, FileText, Image as ImageIcon, ArrowLeft, Camera, Music } from 'lucide-react';
import styles from './settings.module.css';

const MUSIC_PRESETS = [
  { title: 'Klasik Akustik Loop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { title: 'Chill Lofi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { title: 'Modern Synthwave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { title: 'Sakin Piyano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

export default function SettingsPage() {
  const { currentUser, updateProfile, updateProfileMusic } = useApp();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [profileMusicUrl, setProfileMusicUrl] = useState('');
  const [profileMusicTitle, setProfileMusicTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [musicSourceType, setMusicSourceType] = useState<'none' | 'preset' | 'spotify' | 'custom'>('none');

  const handleTogglePreview = (url: string) => {
    if (playingPreviewUrl === url) {
      if (previewAudio) {
        previewAudio.pause();
      }
      setPlayingPreviewUrl(null);
    } else {
      if (previewAudio) {
        previewAudio.pause();
      }
      const audio = new Audio(url);
      audio.play();
      setPreviewAudio(audio);
      setPlayingPreviewUrl(url);
      audio.onended = () => {
        setPlayingPreviewUrl(null);
      };
    }
  };

  const handleSearchTracks = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery.trim())}&entity=song&limit=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Arama sonuçları getirilemedi.');
      const data = await res.json();
      setSearchResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        setErrorMsg('Eşleşen şarkı bulunamadı.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Arama sırasında hata oluştu.');
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
      }
    };
  }, [previewAudio]);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setDisplayName(currentUser.displayName);
      setBio(currentUser.bio);
      setAvatarUrl(currentUser.avatarUrl);
      setCoverUrl(currentUser.coverUrl);
      const mUrl = currentUser.profileMusicUrl || '';
      setProfileMusicUrl(mUrl);
      setProfileMusicTitle(currentUser.profileMusicTitle || '');
      
      if (mUrl === '') {
        setMusicSourceType('none');
      } else if (MUSIC_PRESETS.some((p) => p.url === mUrl)) {
        setMusicSourceType('preset');
      } else if (mUrl.includes('apple.com') || mUrl.includes('spotify.com')) {
        setMusicSourceType('spotify');
      } else {
        setMusicSourceType('custom');
      }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Görsel boyutu 2MB dan küçük olmalıdır.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        if (type === 'avatar') {
          setAvatarUrl(base64Str);
        } else {
          setCoverUrl(base64Str);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = updateProfile(username, displayName, bio, avatarUrl, coverUrl);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    updateProfileMusic(profileMusicUrl || null, profileMusicTitle || null);
    setSuccessMsg(res.message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backBtn} aria-label="Geri">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Profil Ayarları</h1>
        </div>

        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        <div className={`${styles.card} glass-panel`}>
          {/* Cover & Avatar Preview with Cam Overlay triggers */}
          <div 
            className={styles.coverPreview} 
            style={{ backgroundImage: `url(${coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80'})` }}
          >
            {/* Cover File Upload Input */}
            <label htmlFor="cover-file-upload" className={styles.coverCamOverlay} title="Kapak Resmi Yükle">
              <Camera size={18} />
              <span>Kapak Değiştir</span>
            </label>
            <input
              id="cover-file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'cover')}
              style={{ display: 'none' }}
            />

            {/* Avatar Circle */}
            <div className={styles.avatarWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                alt="Avatar Önizleme" 
                className={styles.avatarPreview} 
              />
              <label htmlFor="avatar-file-upload" className={styles.avatarCamOverlay} title="Profil Resmi Yükle">
                <Camera size={16} />
              </label>
              <input
                id="avatar-file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">
                <User size={16} />
                <span>Kullanıcı Adı (@)</span>
              </label>
              <input
                id="username"
                type="text"
                className="glass-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="displayName">
                <User size={16} />
                <span>Görüntülenen Ad</span>
              </label>
              <input
                id="displayName"
                type="text"
                className="glass-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Görüntülenen Adınız"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="bio">
                <FileText size={16} />
                <span>Biyografi</span>
              </label>
              <textarea
                id="bio"
                className="glass-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kendinizden bahsedin..."
                rows={3}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>
                <Music size={16} />
                <span>Arka Plan Profil Müziği</span>
              </label>
              <select
                className="glass-input"
                value={musicSourceType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setMusicSourceType(val);
                  if (val === 'none') {
                    setProfileMusicUrl('');
                    setProfileMusicTitle('');
                  } else if (val === 'preset') {
                    setProfileMusicUrl(MUSIC_PRESETS[0].url);
                    setProfileMusicTitle(MUSIC_PRESETS[0].title);
                  } else {
                    setProfileMusicUrl('');
                    setProfileMusicTitle('');
                  }
                }}
                style={{ width: '100%', marginBottom: '8px' }}
              >
                <option value="none">Müzik Yok</option>
                <option value="preset">Hazır Müzik Listesi...</option>
                <option value="spotify">Şarkı Ara (Spotify/iTunes)...</option>
                <option value="custom">Özel Müzik Linki (Direct MP3 URL)...</option>
              </select>

              {musicSourceType === 'preset' && (
                <select
                  className="glass-input"
                  value={profileMusicUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfileMusicUrl(val);
                    const preset = MUSIC_PRESETS.find((p) => p.url === val);
                    setProfileMusicTitle(preset ? preset.title : '');
                  }}
                  style={{ width: '100%', marginBottom: '8px' }}
                >
                  {MUSIC_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}

              {musicSourceType === 'spotify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Şarkı veya sanatçı adı yazın..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchTracks();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      onClick={handleSearchTracks}
                      className="btn-primary"
                      disabled={searchLoading}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      {searchLoading ? 'Aranıyor...' : 'Ara'}
                    </button>
                  </div>

                  {/* Search Results List */}
                  {searchResults.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '10px', 
                      padding: '10px',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {searchResults.map((track) => (
                        <div 
                          key={track.trackId || track.previewUrl}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '8px', 
                            background: 'var(--input-bg)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={track.artworkUrl60 || '/placeholder.png'} 
                              alt="Albüm Görseli" 
                              style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} 
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {track.trackName}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {track.artistName}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleTogglePreview(track.previewUrl)}
                              style={{
                                background: playingPreviewUrl === track.previewUrl ? 'var(--brand-color)' : 'rgba(255,255,255,0.08)',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '0.7rem'
                              }}
                            >
                              {playingPreviewUrl === track.previewUrl ? '⏸️' : '▶️'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileMusicUrl(track.previewUrl);
                                setProfileMusicTitle(`${track.trackName} - ${track.artistName}`);
                                setSearchResults([]);
                                if (previewAudio) previewAudio.pause();
                                setPlayingPreviewUrl(null);
                                setSuccessMsg('Şarkı başarıyla seçildi! Kaydetmeyi unutmayın.');
                              }}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            >
                              Seç
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {profileMusicTitle && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      🎵 Seçilen: <strong>{profileMusicTitle}</strong> (30 saniyelik Spotify/iTunes demosu)
                    </div>
                  )}
                </div>
              )}

              {musicSourceType === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Müzik Başlığı (örn. Chill Beats)"
                    value={profileMusicTitle}
                    onChange={(e) => setProfileMusicTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Müzik MP3/Ses URL'si"
                    value={profileMusicUrl}
                    onChange={(e) => setProfileMusicUrl(e.target.value)}
                  />
                </div>
              )}
            </div>



            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              <Save size={18} />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
