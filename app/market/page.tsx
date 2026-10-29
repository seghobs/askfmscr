'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Navbar from '../components/Navbar';
import { 
  Coins, 
  Crown, 
  Sparkles, 
  Check, 
  Calendar, 
  Palette, 
  Lock,
  ArrowRight
} from 'lucide-react';
import styles from './market.module.css';

interface ThemeItem {
  id: string;
  name: string;
  gradient: string;
  cost: number;
  description: string;
}

const AVAILABLE_THEMES: ThemeItem[] = [
  {
    id: 'ocean',
    name: 'Okyanus Esintisi',
    gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    cost: 50,
    description: 'Profiliniz için ferahlatıcı, derin mavi ve camgöbeği renk geçişi.'
  },
  {
    id: 'neon',
    name: 'Neon Gece',
    gradient: 'linear-gradient(135deg, #f107a3 0%, #7b2ff7 100%)',
    cost: 70,
    description: 'Mor ve pembe tonlarında parıldayan, enerjik ve dikkat çekici bir tasarım.'
  },
  {
    id: 'forest',
    name: 'Zümrüt Orman',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    cost: 50,
    description: 'Doğadan ilham alan, canlandırıcı yeşil ve zümrüt renk geçişi.'
  },
  {
    id: 'gold',
    name: 'Altın Işıltısı',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #e0a96d 50%, #b45309 100%)',
    cost: 100,
    description: 'Profilinize premium bir görünüm kazandıracak, parlayan altın geçişi.'
  }
];

export default function MarketPage() {
  const { currentUser, buyVip, refundVip, buyTheme, refundTheme, activateTheme, dailyCheckIn, earnCoins, spinLuckyWheel } = useApp();
  const router = useRouter();
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [spinning, setSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [showSpinModal, setShowSpinModal] = useState(false);

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

  const showMessage = (text: string, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg({ text: '', isError: false }), 4000);
  };

  const handleSpin = () => {
    if (spinning) return;
    
    const todayStr = new Date().toDateString();
    if (currentUser.lastWheelSpin === todayStr) {
      showMessage('Bugün zaten çarkı çevirdiniz! Yarın tekrar gelin.', true);
      return;
    }

    const res = spinLuckyWheel();
    if (!res.success) {
      showMessage(res.reward, true);
      return;
    }

    const outcomes = [
      '10 Jeton',
      '20 Jeton',
      '50 Jeton',
      '100 Jeton VIP Hediye!',
      'VIP Statüsü (1 Gün)',
      'Pas Geçtin (Tekrar Dene!)'
    ];
    const index = outcomes.indexOf(res.reward);
    if (index === -1) return;

    setSpinning(true);
    // 5 full rotations (1800deg) + alignment correction based on outcome index
    const newDegrees = 1800 + (360 - (index * 60) - 30);
    setRotationDegrees(newDegrees);

    setTimeout(() => {
      setSpinning(false);
      setSpinResult(res.reward);
      setShowSpinModal(true);
    }, 4000);
  };

  const handleDailyClaim = () => {
    const success = dailyCheckIn();
    if (success) {
      showMessage('Günlük hediye jetonunuz (20 Jeton) cüzdanınıza eklendi! 🎉');
    } else {
      showMessage('Bugün zaten hediye aldınız. Yarın tekrar gelin! ⏰', true);
    }
  };

  const handleBuyVip = () => {
    if (currentUser.vipStatus) {
      showMessage('Zaten VIP üyesiniz!', true);
      return;
    }
    const success = buyVip(150);
    if (success) {
      showMessage('Tebrikler! VIP Statüsü başarıyla satın alındı. 👑');
    } else {
      showMessage('Yetersiz Jeton! Lütfen daha fazla soru yanıtlayarak jeton kazanın.', true);
    }
  };

  const handleRefundVip = () => {
    if (!currentUser.vipStatus) {
      showMessage('Zaten VIP üye değilsiniz!', true);
      return;
    }
    const success = refundVip(150);
    if (success) {
      showMessage('VIP Üyeliğiniz iade edildi. 150 Jeton cüzdanınıza geri yüklendi! 🪙');
    } else {
      showMessage('İade işlemi gerçekleştirilemedi.', true);
    }
  };

  const handleRefundTheme = (themeId: string) => {
    const success = refundTheme(themeId);
    if (success) {
      showMessage('Tema başarıyla iade edildi ve jetonlarınız cüzdanınıza geri yüklendi! 🎨🪙');
    } else {
      showMessage('Tema iade edilemedi.', true);
    }
  };

  const handleThemePurchase = (theme: ThemeItem) => {
    const isUnlocked = currentUser.unlockedThemes?.includes(theme.id) || false;
    
    if (isUnlocked) {
      // Just activate
      activateTheme(theme.id);
      showMessage(`"${theme.name}" teması başarıyla aktif edildi. 🎨`);
    } else {
      // Purchase and activate
      const success = buyTheme(theme.id, theme.cost);
      if (success) {
        activateTheme(theme.id);
        showMessage(`Tebrikler! "${theme.name}" teması satın alındı ve aktif edildi. 🎨`);
      } else {
        showMessage('Yetersiz Jeton! Lütfen daha fazla jeton biriktirin.', true);
      }
    }
  };

  const handleRestoreDefaultTheme = () => {
    activateTheme(null);
    showMessage('Varsayılan tema geri yüklendi.');
  };

  const handleEarnTestCoins = () => {
    earnCoins(100);
    showMessage('Test amaçlı 100 Jeton eklendi! 🪙');
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content animate-fade-in">
        {/* Market Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>ASK.fm Mağaza</h1>
            <p className={styles.subtitle}>
              Soruları yanıtlayarak kazandığın jetonları burada harca! Profilini özelleştir, VIP ayrıcalıklarını yakala.
            </p>
          </div>

          <div className={`${styles.walletCard} glass-panel`}>
            <Coins className={styles.walletIcon} size={28} />
            <div className={styles.walletMeta}>
              <span className={styles.walletLabel}>Cüzdanınız</span>
              <span className={styles.walletBalance}>{currentUser.coins} Jeton</span>
            </div>
            <button onClick={handleEarnTestCoins} className={styles.testBtn} title="Test Jetonu Ekle">
              +100
            </button>
          </div>
        </div>

        {msg.text && (
          <div className={`${styles.alert} ${msg.isError ? styles.alertError : styles.alertSuccess}`}>
            {msg.text}
          </div>
        )}

        {/* Market Sections Grid */}
        <div className={styles.grid}>
          {/* Daily Gift & VIP Status */}
          <div className={styles.column}>
            {/* Daily Gift Card */}
            <div className={`${styles.card} glass-panel`}>
              <div className={styles.cardHeader}>
                <Calendar size={20} className={styles.iconAccent} />
                <h3 className={styles.cardTitle}>Günlük Hediye</h3>
              </div>
              <p className={styles.cardDesc}>
                Her gün giriş yaparak ücretsiz hediye jetonunuzu talep edin!
              </p>
              <div className={styles.giftValue}>
                <Coins size={16} />
                <span>+20 Jeton</span>
              </div>
              <button onClick={handleDailyClaim} className="btn-secondary" style={{ width: '100%' }}>
                Hediyeyi Al
              </button>
            </div>

            {/* VIP Card */}
            <div className={`${styles.card} glass-panel ${currentUser.vipStatus ? styles.vipCardActive : ''}`}>
              <div className={styles.cardHeader}>
                <Crown size={24} className={styles.vipIcon} />
                <h3 className={styles.cardTitle}>VIP Statüsü</h3>
                {currentUser.vipStatus && <span className={styles.vipTag}>AKTİF</span>}
              </div>
              <p className={styles.cardDesc}>
                VIP üye olun, benzersiz avantajlardan yararlanın!
              </p>
              
              <ul className={styles.benefitsList}>
                <li><Check size={14} /> <span>Anonim sorular için ücretsiz ipuçları</span></li>
                <li><Check size={14} /> <span>Profilinizde altın renkli taç simgesi</span></li>
                <li><Check size={14} /> <span>Özel VIP temalarına erişim imkanı</span></li>
              </ul>

              <div className={styles.costRow}>
                <span className={styles.costLabel}>VIP Üyelik Bedeli</span>
                <div className={styles.costVal}>
                  <Coins size={16} />
                  <span>150 Jeton</span>
                </div>
              </div>

              {currentUser.vipStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className={`${styles.boughtBtn}`} style={{ width: '100%', justifyContent: 'center' }} disabled>
                    <Check size={18} />
                    <span>VIP Üyesiniz</span>
                  </button>
                  <button 
                    onClick={handleRefundVip} 
                    className="btn-secondary" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      borderColor: 'rgba(239, 68, 68, 0.3)', 
                      color: '#ef4444' 
                    }}
                  >
                    💸 Üyeliği İade Et (150 Jeton)
                  </button>
                </div>
              ) : (
                <button onClick={handleBuyVip} className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  👑 VIP Satın Al
                </button>
              )}
            </div>

            {/* Lucky Wheel Card */}
            <div className={`${styles.card} glass-panel`} style={{ marginTop: '16px' }}>
              <div className={styles.cardHeader}>
                <Sparkles size={20} className={styles.iconAccent} />
                <h3 className={styles.cardTitle}>Günün Şans Çarkı</h3>
              </div>
              <p className={styles.cardDesc}>
                Her gün 1 ücretsiz çevirme hakkı kazan! Harika jeton ödülleri veya 1 günlük VIP üyelik seni bekliyor.
              </p>

              {/* Wheel Graphic Container */}
              <div className={styles.wheelWrapper}>
                <div className={styles.wheelPointer} />
                <div className={styles.wheelOuter}>
                  <div 
                    className={styles.wheel}
                    style={{ 
                      transform: `rotate(${rotationDegrees}deg)`,
                      background: 'conic-gradient(#ff453a 0deg 60deg, #ff9f0a 60deg 120deg, #ffd60a 120deg 180deg, #30d158 180deg 240deg, #0a84ff 240deg 300deg, #bf5af2 300deg 360deg)'
                    }}
                  >
                    <div className={styles.wheelSectorText} style={{ transform: 'rotate(30deg) translateY(-70px)' }}>🪙 10</div>
                    <div className={styles.wheelSectorText} style={{ transform: 'rotate(90deg) translateY(-70px)' }}>🪙 20</div>
                    <div className={styles.wheelSectorText} style={{ transform: 'rotate(150deg) translateY(-70px)' }}>🪙 50</div>
                    <div className={styles.wheelSectorText} style={{ transform: 'rotate(210deg) translateY(-70px)' }}>🎁 100</div>
                    <div className={styles.wheelSectorText} style={{ transform: 'rotate(270deg) translateY(-70px)' }}>👑 VIP</div>
                    <div className={styles.wheelSectorText} style={{ transform: 'rotate(330deg) translateY(-70px)' }}>❌ Pas</div>
                  </div>
                </div>
              </div>

              {/* Spin Action Button */}
              {(() => {
                const todayStr = new Date().toDateString();
                const alreadySpun = currentUser.lastWheelSpin === todayStr;

                return (
                  <button 
                    onClick={handleSpin}
                    disabled={alreadySpun || spinning}
                    className="btn-primary" 
                    style={{ 
                      width: '100%', 
                      marginTop: '16px',
                      background: alreadySpun ? 'var(--border-color)' : 'var(--brand-gradient)',
                      cursor: alreadySpun ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {spinning ? 'Çark Dönüyor...' : alreadySpun ? 'Bugün Çevirdin' : 'Şansını Dene!'}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Profil Temaları Market */}
          <div className={styles.column}>
            <div className={`${styles.card} glass-panel`}>
              <div className={styles.cardHeader} style={{ marginBottom: '8px' }}>
                <Palette size={20} className={styles.iconAccent} />
                <h3 className={styles.cardTitle}>Profil Temaları</h3>
              </div>
              <p className={styles.cardDesc} style={{ marginBottom: '20px' }}>
                Profil arka planınızı parıltılı renk geçişleri (gradient) ile süsleyin. Satın aldığınız temalar profilinizde sergilenir.
              </p>

              {/* Default Theme Option */}
              <div className={styles.themeRow}>
                <div className={styles.themePreview} style={{ background: 'var(--border-color)' }} />
                <div className={styles.themeInfo}>
                  <h4 className={styles.themeName}>Varsayılan Tema</h4>
                  <span className={styles.themeDesc}>Klasik ask.fm koyu/açık tasarımı.</span>
                </div>
                {currentUser.activeTheme === null ? (
                  <span className={styles.activeLabel}>Aktif</span>
                ) : (
                  <button onClick={handleRestoreDefaultTheme} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Seç
                  </button>
                )}
              </div>

              {/* Available Custom Themes */}
              <div className={styles.themesList}>
                {AVAILABLE_THEMES.map((theme) => {
                  const isUnlocked = currentUser.unlockedThemes?.includes(theme.id) || false;
                  const isActive = currentUser.activeTheme === theme.id;

                  return (
                    <div key={theme.id} className={styles.themeRow}>
                      <div className={styles.themePreview} style={{ background: theme.gradient }} />
                      <div className={styles.themeInfo}>
                        <div className={styles.themeTitleRow}>
                          <h4 className={styles.themeName}>{theme.name}</h4>
                          {!isUnlocked && (
                            <div className={styles.themeCost}>
                              <Coins size={12} />
                              <span>{theme.cost}</span>
                            </div>
                          )}
                        </div>
                        <span className={styles.themeDesc}>{theme.description}</span>
                      </div>
                      
                      <div className={styles.themeAction} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        {isActive ? (
                          <span className={styles.activeLabel}>Aktif</span>
                        ) : isUnlocked ? (
                          <button 
                            onClick={() => handleThemePurchase(theme)} 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%' }}
                          >
                            Seç
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleThemePurchase(theme)} 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px', width: '100%' }}
                          >
                            <Lock size={12} />
                            <span>Al</span>
                          </button>
                        )}

                        {isUnlocked && (
                          <button 
                            onClick={() => handleRefundTheme(theme.id)} 
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: '#ef4444', 
                              fontSize: '0.72rem', 
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: '2px 6px',
                              marginTop: '2px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            İade Et ({theme.cost}🪙)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Spin Result Modal */}
      {showSpinModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel animate-fade-in`} style={{ maxWidth: '360px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Sparkles size={48} style={{ color: '#fbbf24', marginBottom: '16px', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Tebrikler!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Şans çarkından şunu kazandınız:<br/>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-color)' }}>{spinResult}</span>
            </p>
            <button 
              onClick={() => setShowSpinModal(false)} 
              className="btn-primary" 
              style={{ width: '100%', padding: '10px' }}
            >
              Harika!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
