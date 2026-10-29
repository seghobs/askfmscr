'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  followersCount: number;
  followingCount: number;
  answersCount: number;
  // Phase 2 additions
  coins: number;
  vipStatus: boolean;
  unlockedThemes: string[];
  activeTheme: string | null;
  blockedUserIds: string[];
  lastCheckIn?: string;
  profileMusicUrl?: string;
  profileMusicTitle?: string;
  lastWheelSpin?: string;
}

export interface CommentItem {
  id: string;
  questionId: string;
  senderUsername: string | null; // null if anonymous
  senderId?: string; // hidden author ID for deletion control
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  senderUsername: string | null; // null represents anonymous
  receiverId: string;
  createdAt: string;
  answerText: string | null;
  answeredAt: string | null;
  likesCount: number;
  // Phase 2 additions
  mediaUrl: string | null;
  mediaType?: 'image' | 'video' | 'audio';
  hintUnlocked: boolean;
  isReported?: boolean;
  comments?: CommentItem[];
}

export interface Follow {
  followerId: string;
  followingId: string;
}

export interface Like {
  userId: string;
  questionId: string;
  reactionType?: 'like' | 'love' | 'haha' | 'wow' | 'sad';
}

export interface Gift {
  id: string;
  senderId: string;
  receiverId: string;
  answerId: string;
  giftType: 'coffee' | 'heart' | 'fireworks' | 'crown';
  cost: number;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  text?: string;
  createdAt: string;
}

// Phase 2 Interfaces
export interface Notification {
  id: string;
  userId: string;
  senderId: string;
  type: 'like' | 'follow' | 'question' | 'gift' | 'message';
  details: string;
  createdAt: string;
  read: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  replyToId?: string;
  isReported?: boolean;
  createdAt: string;
}

export interface VersusPoll {
  id: string;
  creatorId: string;
  title: string;
  imgA: string;
  imgB: string;
  votesA: string[]; // userIds
  votesB: string[]; // userIds
  createdAt: string;
}

interface AppContextType {
  users: User[];
  questions: Question[];
  follows: Follow[];
  likes: Like[];
  notifications: Notification[];
  messages: DirectMessage[];
  versusPolls: VersusPoll[];
  currentUser: User | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (username: string) => boolean;
  register: (username: string, displayName: string) => boolean;
  logout: () => void;
  askQuestion: (receiverId: string, text: string, isAnonymous: boolean, mediaUrl?: string | null) => void;
  sendShoutout: (text: string, isAnonymous: boolean) => void;
  answerQuestion: (questionId: string, answerText: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | 'audio') => void;
  deleteQuestion: (questionId: string) => void;
  toggleLike: (questionId: string) => void;
  toggleFollow: (targetUserId: string) => void;
  updateProfile: (username: string, displayName: string, bio: string, avatarUrl: string, coverUrl: string) => { success: boolean; message: string };
  getQuestionSender: (senderUsername: string | null) => User | null;
  getRandomQuestion: () => string;
  
  // Phase 2 Actions
  earnCoins: (amount: number) => void;
  buyTheme: (themeId: string, cost: number) => boolean;
  activateTheme: (themeId: string | null) => void;
  buyVip: (cost: number) => boolean;
  refundVip: (refundAmount: number) => boolean;
  refundTheme: (themeId: string) => boolean;
  unlockHint: (questionId: string, cost: number) => boolean;
  createVersusPoll: (title: string, imgA: string, imgB: string) => void;
  voteVersus: (pollId: string, option: 'A' | 'B') => void;
  sendDM: (receiverId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio', replyToId?: string) => void;
  deleteDM: (messageId: string) => void;
  reportDM: (messageId: string) => void;
  toggleBlock: (targetUserId: string) => void;
  reportQuestion: (questionId: string) => void;
  addComment: (questionId: string, text: string, isAnonymous: boolean, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio') => void;
  deleteComment: (questionId: string, commentId: string) => void;
  markNotificationsAsRead: () => void;
  dailyCheckIn: () => boolean;

  // New Features Bundle
  gifts: Gift[];
  stories: Story[];
  addStory: (mediaUrl: string, mediaType: 'image' | 'video', text?: string) => void;
  sendGift: (receiverId: string, answerId: string, giftType: 'coffee' | 'heart' | 'fireworks' | 'crown') => boolean;
  spinLuckyWheel: () => { success: boolean; reward: string; coinsEarned: number };
  toggleLikeReaction: (questionId: string, reactionType: 'like' | 'love' | 'haha' | 'wow' | 'sad') => void;
  updateProfileMusic: (musicUrl: string | null, musicTitle: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const RANDOM_QUESTIONS = [
  "En son okuduğun kitap seni nasıl etkiledi?",
  "Eğer bir süper gücün olsaydı ne olmasını isterdin?",
  "Gelecekteki kendine tek bir cümlelik tavsiye verecek olsan bu ne olurdu?",
  "En sevdiğin film ve onu özel yapan şey nedir?",
  "Hayatında aldığın en iyi karar neydi?",
  "Hangi dönemde yaşamak isterdin ve neden?",
  "Şu an nerede olmak isterdin?",
  "Sana göre başarının tanımı nedir?",
  "Yeni başlayanlara yazılım konusunda ne tavsiye edersin?",
  "Görünmez olsan ilk yapacağın şey ne olurdu?",
  "Seni en çok güldüren anın nedir?",
  "Seyahat etmek istediğin en sıradışı yer neresi?"
];

const SEED_USERS: User[] = [
  {
    id: 'u1',
    username: 'antigravity',
    displayName: 'Antigravity AI',
    bio: 'Google DeepMind tarafından geliştirilen kodlama asistanı. Sorularınızı bekliyorum! 🤖✨',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    followersCount: 3,
    followingCount: 3,
    answersCount: 3,
    coins: 120,
    vipStatus: false,
    unlockedThemes: [],
    activeTheme: null,
    blockedUserIds: []
  },
  {
    id: 'u2',
    username: 'janedoe',
    displayName: 'Jane Doe',
    bio: 'Full Stack Developer | Coffee Lover | Dreamer ☕💻. Ask me anything about Next.js and CSS!',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    followersCount: 1,
    followingCount: 1,
    answersCount: 2,
    coins: 40,
    vipStatus: true,
    unlockedThemes: ['ocean'],
    activeTheme: 'ocean',
    blockedUserIds: []
  },
  {
    id: 'u3',
    username: 'travel_bug',
    displayName: 'Seyyah Berk',
    bio: 'Dünyayı gezen bir sırt çantalı. 🌍✈️ 40 ülke, binlerce anı. Yollar hakkında sorun!',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    followersCount: 1,
    followingCount: 1,
    answersCount: 2,
    coins: 85,
    vipStatus: false,
    unlockedThemes: [],
    activeTheme: null,
    blockedUserIds: []
  },
  {
    id: 'u4',
    username: 'askfm_official',
    displayName: 'ASK.fm Türkiye',
    bio: 'Resmi ASK.fm Türkiye hesabı. Platformdaki en son gelişmeleri ve eğlenceli soruları takip et! 📣',
    avatarUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80',
    followersCount: 1,
    followingCount: 0,
    answersCount: 1,
    coins: 1000,
    vipStatus: true,
    unlockedThemes: ['gold'],
    activeTheme: 'gold',
    blockedUserIds: []
  }
];

const SEED_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Next.js 15 hakkında ne düşünüyorsun, sence React Server Components kullanımı zorunlu mu olmalı?',
    senderUsername: 'janedoe',
    receiverId: 'u1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    answerText: 'React Server Components (RSC) Next.js geliştirme kültürünü tamamen değiştirdi. Zorunluluktan ziyade, varsayılan olarak sunulması veri çekme (data fetching) performansını inanılmaz artırıyor. Ama client-side etkileşimler için hâlâ "use client" ile istemci tarafına geçiş yapıyoruz. Yani ikisinin dengesi harika!',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    likesCount: 12,
    mediaUrl: null,
    hintUnlocked: false
  },
  {
    id: 'q2',
    text: 'Sence yapay zeka bir gün yazılımcıların yerini tamamen alabilir mi?',
    senderUsername: null, // Anonymous
    receiverId: 'u1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    answerText: 'Yazılımcıların yerini almaktan ziyade, yazılımcıları birer "süper geliştiriciye" dönüştürecek. Kod yazmak işin sadece küçük bir kısmı; asıl iş problem çözmek, mimari tasarlamak ve kullanıcı ihtiyaçlarını anlamak. AI bu süreçte en güçlü yardımcınız olacak.',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    likesCount: 28,
    mediaUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60', // Mock AI photo response
    hintUnlocked: false
  },
  {
    id: 'q3',
    text: 'Bugün kendine sorduğun en anlamlı soru neydi?',
    senderUsername: 'askfm_official',
    receiverId: 'u1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    answerText: '"Bugün bir insanın veya geliştiricinin hayatını nasıl daha kolaylaştırabilirim?" sorusuydu. Ve şimdi buradayım, sizin sorularınızı yanıtlıyorum! 😊',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    likesCount: 15,
    mediaUrl: null,
    hintUnlocked: false
  },
  {
    id: 'q4',
    text: 'Bir sonraki seyahatin nereye olacak? Rota belli mi?',
    senderUsername: null,
    receiverId: 'u3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    answerText: 'Uzun zamandır aklımda Güney Amerika var! Peru ve Bolivya rotasını çiziyorum şu sıralar. Machu Picchu zirvesine tırmanmak en büyük hayalim. İnşallah sonbaharda yoldayım!',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    likesCount: 5,
    mediaUrl: 'https://images.unsplash.com/photo-1500835595337-f740268f43c2?w=500&auto=format&fit=crop&q=60', // traveler banner photo
    hintUnlocked: false
  },
  {
    id: 'q5',
    text: 'Gittiğin ülkelerde en çok zorlandığın an hangisiydi?',
    senderUsername: 'janedoe',
    receiverId: 'u3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    answerText: 'Asya seyahatinde küçük bir köyde treni kaçırmıştım ve kimse İngilizce konuşmuyordu. Telefonumun şarjı da bitmişti! Ama o köydeki yerel halk beni evinde misafir etti, karnımı doyurdu. Zor anlar bazen en güzel dostluklara kapı açıyor.',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
    likesCount: 19,
    mediaUrl: null,
    hintUnlocked: false
  },
  {
    id: 'q6',
    text: 'ASK.fm platformunun en sevdiğin yönü nedir?',
    senderUsername: null,
    receiverId: 'u4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    answerText: 'İnsanların merak ettikleri soruları dürüstçe ve bazen anonimliğin verdiği o tatlı gizemle sorabilmesi. Bu sayede kalıpların dışına çıkan harika sohbetler oluşuyor.',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
    likesCount: 104,
    mediaUrl: null,
    hintUnlocked: false
  },
  {
    id: 'q7',
    text: 'Yazılıma yeni başlayan birine vereceğin en büyük tavsiye ne olurdu?',
    senderUsername: null,
    receiverId: 'u2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    answerText: 'Hata almaktan korkma! Her hata aslında yeni bir şey öğrenme fırsatıdır. Bir de sürekli teorik çalışmak yerine hemen küçük projeler yapmaya başla. Yaparak öğrenmek en kalıcı yoldur.',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likesCount: 8,
    mediaUrl: null,
    hintUnlocked: false
  },
  {
    id: 'q8',
    text: 'Hangi CSS frameworkünü tercih ediyorsun?',
    senderUsername: 'antigravity',
    receiverId: 'u2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    answerText: 'Tailwind CSS hız kazandırıyor ama bazen vanilla CSS ve CSS modules yazmak en temiz hissettireni. Tasarımın kontrolü tamamen bende olsun istediğimde özel CSS yazarım.',
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.8).toISOString(),
    likesCount: 14,
    mediaUrl: null,
    hintUnlocked: false
  },
  // Unanswered questions in Inbox
  {
    id: 'uq1',
    text: 'En sevdiğin yapay zeka araştırma konusu nedir?',
    senderUsername: 'janedoe',
    receiverId: 'u1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    answerText: null,
    answeredAt: null,
    likesCount: 0,
    mediaUrl: null,
    hintUnlocked: false
  },
  {
    id: 'uq2',
    text: 'Yapay zekanın gelecekteki yaratıcılık sınırları hakkında ne düşünüyorsun?',
    senderUsername: null, // Anonymous
    receiverId: 'u1',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    answerText: null,
    answeredAt: null,
    likesCount: 0,
    mediaUrl: null,
    hintUnlocked: false
  }
];

const SEED_FOLLOWS: Follow[] = [
  { followerId: 'u1', followingId: 'u2' },
  { followerId: 'u1', followingId: 'u3' },
  { followerId: 'u1', followingId: 'u4' },
  { followerId: 'u2', followingId: 'u1' },
  { followerId: 'u3', followingId: 'u1' }
];

const SEED_LIKES: Like[] = [
  { userId: 'u2', questionId: 'q1' },
  { userId: 'u3', questionId: 'q1' },
  { userId: 'u2', questionId: 'q2' },
  { userId: 'u3', questionId: 'q2' },
  { userId: 'u4', questionId: 'q2' }
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: 'u1', // for antigravity
    senderId: 'u2', // janedoe
    type: 'like',
    details: 'bir yanıtını beğendi.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
    read: false
  },
  {
    id: 'n2',
    userId: 'u1',
    senderId: 'u3', // travel_bug
    type: 'follow',
    details: 'seni takip etmeye başladı.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
    read: false
  },
  {
    id: 'n3',
    userId: 'u1',
    senderId: 'u2',
    type: 'question',
    details: 'sana yeni bir soru gönderdi.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false
  }
];

const SEED_MESSAGES: DirectMessage[] = [
  {
    id: 'm1',
    senderId: 'u2',
    receiverId: 'u1',
    text: 'Selam! ask.fm klonu tasarımı harika gidiyor 🚀',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'm2',
    senderId: 'u1',
    receiverId: 'u2',
    text: 'Çok teşekkürler! Şimdi jetonlar, VIP ve DM özelliklerini ekliyorum.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString()
  },
  {
    id: 'm3',
    senderId: 'u2',
    receiverId: 'u1',
    text: 'Süper! Bu sayede çok daha interaktif olacak.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString()
  }
];

const SEED_VERSUS_POLLS: VersusPoll[] = [
  {
    id: 'v1',
    creatorId: 'u1',
    title: 'Kahve mi yoksa Çay mı?',
    imgA: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=60',
    imgB: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60',
    votesA: ['u1', 'u2'],
    votesB: ['u3'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [versusPolls, setVersusPolls] = useState<VersusPoll[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const localUsers = localStorage.getItem('askfm_users');
    const localQuestions = localStorage.getItem('askfm_questions');
    const localFollows = localStorage.getItem('askfm_follows');
    const localLikes = localStorage.getItem('askfm_likes');
    const localNotifications = localStorage.getItem('askfm_notifications');
    const localMessages = localStorage.getItem('askfm_messages');
    const localVersus = localStorage.getItem('askfm_versus');
    const localCurrentUser = localStorage.getItem('askfm_current_user');
    const localTheme = localStorage.getItem('askfm_theme') as 'light' | 'dark' | null;
    const localGifts = localStorage.getItem('askfm_gifts');
    const localStories = localStorage.getItem('askfm_stories');

    if (localUsers) {
      const parsedUsers = JSON.parse(localUsers).map((u: any) => ({
        ...u,
        unlockedThemes: u.unlockedThemes || [],
        blockedUserIds: u.blockedUserIds || [],
        vipStatus: u.vipStatus || false,
        coins: u.coins !== undefined ? u.coins : 50,
        activeTheme: u.activeTheme || null,
        profileMusicUrl: u.profileMusicUrl || undefined,
        profileMusicTitle: u.profileMusicTitle || undefined,
        lastWheelSpin: u.lastWheelSpin || undefined
      }));
      setUsers(parsedUsers);
    } else {
      localStorage.setItem('askfm_users', JSON.stringify(SEED_USERS));
      setUsers(SEED_USERS);
    }

    if (localGifts) {
      setGifts(JSON.parse(localGifts));
    }

    if (localStories) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const activeStories = JSON.parse(localStories).filter((s: Story) => s.createdAt > twentyFourHoursAgo);
      setStories(activeStories);
      localStorage.setItem('askfm_stories', JSON.stringify(activeStories));
    }

    if (localQuestions) {
      let parsed = JSON.parse(localQuestions);
      // Clean up legacy "deneme" comments
      parsed = parsed.map((q: any) => {
        if (q.comments) {
          return {
            ...q,
            comments: q.comments.filter((c: any) => c.text !== 'deneme')
          };
        }
        return q;
      });
      setQuestions(parsed);
    } else {
      localStorage.setItem('askfm_questions', JSON.stringify(SEED_QUESTIONS));
      setQuestions(SEED_QUESTIONS);
    }

    if (localFollows) {
      setFollows(JSON.parse(localFollows));
    } else {
      localStorage.setItem('askfm_follows', JSON.stringify(SEED_FOLLOWS));
      setFollows(SEED_FOLLOWS);
    }

    if (localLikes) {
      setLikes(JSON.parse(localLikes));
    } else {
      localStorage.setItem('askfm_likes', JSON.stringify(SEED_LIKES));
      setLikes(SEED_LIKES);
    }

    if (localNotifications) {
      setNotifications(JSON.parse(localNotifications));
    } else {
      localStorage.setItem('askfm_notifications', JSON.stringify(SEED_NOTIFICATIONS));
      setNotifications(SEED_NOTIFICATIONS);
    }

    if (localMessages) {
      setMessages(JSON.parse(localMessages));
    } else {
      localStorage.setItem('askfm_messages', JSON.stringify(SEED_MESSAGES));
      setMessages(SEED_MESSAGES);
    }

    if (localVersus) {
      setVersusPolls(JSON.parse(localVersus));
    } else {
      localStorage.setItem('askfm_versus', JSON.stringify(SEED_VERSUS_POLLS));
      setVersusPolls(SEED_VERSUS_POLLS);
    }

    if (localCurrentUser) {
      const parsedUser = JSON.parse(localCurrentUser);
      const sanitizedUser = {
        ...parsedUser,
        unlockedThemes: parsedUser.unlockedThemes || [],
        blockedUserIds: parsedUser.blockedUserIds || [],
        vipStatus: parsedUser.vipStatus || false,
        coins: parsedUser.coins !== undefined ? parsedUser.coins : 50,
        activeTheme: parsedUser.activeTheme || null
      };
      setCurrentUser(sanitizedUser);
    } else {
      const defaultUser = SEED_USERS[0];
      setCurrentUser(defaultUser);
      localStorage.setItem('askfm_current_user', JSON.stringify(defaultUser));
    }

    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.setAttribute('data-theme', localTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Run one-time seed migration for testing themes
    const seededThemes = localStorage.getItem('askfm_seeded_themes_v3');
    if (!seededThemes) {
      setUsers((prevUsers) => {
        const updated = prevUsers.map((u) => {
          if (u.username === 'antigravity') {
            return {
              ...u,
              unlockedThemes: Array.from(new Set([...(u.unlockedThemes || []), 'ocean', 'neon']))
            };
          }
          return u;
        });
        localStorage.setItem('askfm_users', JSON.stringify(updated));
        return updated;
      });

      setCurrentUser((prevCur) => {
        if (prevCur && prevCur.username === 'antigravity') {
          const updated = {
            ...prevCur,
            unlockedThemes: Array.from(new Set([...(prevCur.unlockedThemes || []), 'ocean', 'neon']))
          };
          localStorage.setItem('askfm_current_user', JSON.stringify(updated));
          return updated;
        }
        return prevCur;
      });

      localStorage.setItem('askfm_seeded_themes_v3', 'true');
    }

    setInitialized(true);
  }, []);

  // Apply active theme globally to document body
  useEffect(() => {
    if (!initialized) return;

    const activeTheme = currentUser?.activeTheme;
    const body = document.body;

    if (activeTheme === 'ocean') {
      body.style.backgroundImage = 'radial-gradient(circle at top, rgba(0, 198, 255, 0.38) 0%, var(--background) 70%)';
    } else if (activeTheme === 'neon') {
      body.style.backgroundImage = 'radial-gradient(circle at top, rgba(241, 7, 163, 0.38) 0%, var(--background) 70%)';
    } else if (activeTheme === 'forest') {
      body.style.backgroundImage = 'radial-gradient(circle at top, rgba(17, 153, 142, 0.38) 0%, var(--background) 70%)';
    } else if (activeTheme === 'gold') {
      body.style.backgroundImage = 'radial-gradient(circle at top, rgba(245, 158, 11, 0.42) 0%, var(--background) 70%)';
    } else {
      body.style.backgroundImage = '';
    }
  }, [currentUser?.activeTheme, initialized, theme]);

  // Save changes to localstorage
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_users', JSON.stringify(users));
  }, [users, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_questions', JSON.stringify(questions));
  }, [questions, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_follows', JSON.stringify(follows));
  }, [follows, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_likes', JSON.stringify(likes));
  }, [likes, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_notifications', JSON.stringify(notifications));
  }, [notifications, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_messages', JSON.stringify(messages));
  }, [messages, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_gifts', JSON.stringify(gifts));
  }, [gifts, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_stories', JSON.stringify(stories));
  }, [stories, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('askfm_versus', JSON.stringify(versusPolls));
  }, [versusPolls, initialized]);

  useEffect(() => {
    if (!initialized) return;
    if (currentUser) {
      localStorage.setItem('askfm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('askfm_current_user');
    }
  }, [currentUser, initialized]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('askfm_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const login = (username: string): boolean => {
    const formattedUsername = username.trim().toLowerCase();
    const user = users.find((u) => u.username === formattedUsername);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const register = (username: string, displayName: string): boolean => {
    const formattedUsername = username.trim().toLowerCase();
    if (!formattedUsername || !displayName) return false;
    
    if (users.some((u) => u.username === formattedUsername)) {
      return false;
    }

    const newUser: User = {
      id: 'u_' + Date.now(),
      username: formattedUsername,
      displayName: displayName.trim(),
      bio: `Merak ettiğiniz şeyleri sorun! 💭`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      coverUrl: `https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80`,
      followersCount: 0,
      followingCount: 0,
      answersCount: 0,
      coins: 50, // Initial balance gift
      vipStatus: false,
      unlockedThemes: [],
      activeTheme: null,
      blockedUserIds: []
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Helper trigger notifications
  const triggerNotification = (userId: string, type: Notification['type'], details: string) => {
    if (!currentUser || currentUser.id === userId) return;
    
    const newNotif: Notification = {
      id: 'n_' + Date.now() + Math.random().toString(36).substr(2, 5),
      userId,
      senderId: currentUser.id,
      type,
      details,
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };

  const askQuestion = (receiverId: string, text: string, isAnonymous: boolean, mediaUrl: string | null = null) => {
    if (!text.trim()) return;

    // Check blocked status
    const receiver = users.find((u) => u.id === receiverId);
    if (receiver?.blockedUserIds?.includes(currentUser?.id || '')) {
      alert('Bu kullanıcı sizi engellediği için soru soramazsınız.');
      return;
    }

    const newQuestion: Question = {
      id: 'q_' + Date.now() + Math.random().toString(36).substr(2, 5),
      text: text.trim(),
      senderUsername: isAnonymous ? null : (currentUser ? currentUser.username : null),
      receiverId,
      createdAt: new Date().toISOString(),
      answerText: null,
      answeredAt: null,
      likesCount: 0,
      mediaUrl,
      hintUnlocked: false
    };

    setQuestions((prev) => [newQuestion, ...prev]);

    // Add notification
    triggerNotification(receiverId, 'question', isAnonymous ? 'anonim bir soru gönderdi.' : 'sana yeni bir soru gönderdi.');
  };

  const sendShoutout = (text: string, isAnonymous: boolean) => {
    if (!text.trim() || !currentUser) return;

    // Filter out block relations
    const targetUsers = users.filter(
      (u) => u.id !== currentUser.id && !u.blockedUserIds?.includes(currentUser.id)
    );

    const newQuestions: Question[] = targetUsers.map((user) => ({
      id: 'q_' + Date.now() + '_' + user.id + Math.random().toString(36).substr(2, 4),
      text: text.trim() + ' 📢 (Shoutout)',
      senderUsername: isAnonymous ? null : currentUser.username,
      receiverId: user.id,
      createdAt: new Date().toISOString(),
      answerText: null,
      answeredAt: null,
      likesCount: 0,
      mediaUrl: null,
      hintUnlocked: false
    }));

    setQuestions((prev) => [...newQuestions, ...prev]);

    // Send notifications to everyone
    targetUsers.forEach((user) => {
      triggerNotification(user.id, 'question', 'toplu soru (Shoutout) gönderdi.');
    });
  };

  const answerQuestion = (questionId: string, answerText: string, mediaUrl: string | null = null, mediaType?: 'image' | 'video' | 'audio') => {
    if (!answerText.trim() && !mediaUrl) return;
    if (!currentUser) return;

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answerText: answerText.trim(),
              answeredAt: new Date().toISOString(),
              mediaUrl: mediaUrl || q.mediaUrl,
              mediaType: mediaType || q.mediaType
            }
          : q
      )
    );

    // Update users counts & Earn coins (+10 coins per answer)
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              answersCount: u.answersCount + 1,
              coins: u.coins + 10
            }
          : u
      )
    );
    
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answersCount: prev.answersCount + 1,
        coins: prev.coins + 10
      };
    });
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const toggleLikeReaction = (questionId: string, reactionType: 'like' | 'love' | 'haha' | 'wow' | 'sad') => {
    if (!currentUser) return;

    const existingLike = likes.find((l) => l.userId === currentUser.id && l.questionId === questionId);
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (existingLike) {
      if (existingLike.reactionType === reactionType) {
        // If same reaction toggled, remove it entirely
        setLikes((prev) => prev.filter((l) => !(l.userId === currentUser.id && l.questionId === questionId)));
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, likesCount: Math.max(0, q.likesCount - 1) } : q))
        );
      } else {
        // Change reaction type
        setLikes((prev) =>
          prev.map((l) =>
            l.userId === currentUser.id && l.questionId === questionId ? { ...l, reactionType } : l
          )
        );
      }
    } else {
      // Add new reaction
      const newLike: Like = {
        userId: currentUser.id,
        questionId,
        reactionType
      };
      setLikes((prev) => [...prev, newLike]);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, likesCount: q.likesCount + 1 } : q))
      );

      // Earn coins to receiver when liked (+5 coins)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === question.receiverId
            ? { ...u, coins: u.coins + 5 }
            : u
        )
      );

      if (currentUser.id === question.receiverId) {
        setCurrentUser((prev) => prev ? { ...prev, coins: prev.coins + 5 } : null);
      }

      // Add notification with specific emoji message
      const reactionEmojiMap = {
        like: '👍 yanıtını beğendi.',
        love: '❤️ yanıtını sevdi.',
        haha: '😂 yanıtına güldü.',
        wow: '😮 yanıtına şaşırdı.',
        sad: '😢 yanıtına üzüldü.'
      };
      triggerNotification(question.receiverId, 'like', reactionEmojiMap[reactionType] || 'bir yanıtını beğendi.');
    }
  };

  const toggleLike = (questionId: string) => {
    toggleLikeReaction(questionId, 'like');
  };

  const addStory = (mediaUrl: string, mediaType: 'image' | 'video', text?: string) => {
    if (!currentUser) return;
    const newStory: Story = {
      id: 's_' + Date.now() + Math.random().toString(36).substr(2, 5),
      userId: currentUser.id,
      mediaUrl,
      mediaType,
      text,
      createdAt: new Date().toISOString()
    };
    setStories((prev) => [newStory, ...prev]);
    // Reward for sharing a story (+5 coins!)
    earnCoins(5);
  };

  const sendGift = (receiverId: string, answerId: string, giftType: 'coffee' | 'heart' | 'fireworks' | 'crown') => {
    if (!currentUser || currentUser.id === receiverId) return false;

    const giftCosts = {
      coffee: 10,
      heart: 20,
      fireworks: 50,
      crown: 100
    };
    const cost = giftCosts[giftType];

    // Check coins
    if (currentUser.coins < cost) return false;

    // Deduct coins from sender
    const updatedSender = {
      ...currentUser,
      coins: currentUser.coins - cost
    };
    setCurrentUser(updatedSender);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedSender : u)));

    // Add coins to receiver
    setUsers((prev) =>
      prev.map((u) => (u.id === receiverId ? { ...u, coins: u.coins + cost } : u))
    );

    // Create Gift
    const newGift: Gift = {
      id: 'g_' + Date.now() + Math.random().toString(36).substr(2, 5),
      senderId: currentUser.id,
      receiverId,
      answerId,
      giftType,
      cost,
      createdAt: new Date().toISOString()
    };
    setGifts((prev) => [...prev, newGift]);

    // Send notification
    const giftLabels = {
      coffee: '☕ bir fincan Kahve gönderdi.',
      heart: '❤️ kocaman bir Kalp gönderdi.',
      fireworks: '🎆 harika Havai Fişekler patlattı!',
      crown: '👑 seni altın bir Taçla ödüllendirdi!'
    };
    triggerNotification(receiverId, 'gift', giftLabels[giftType]);

    return true;
  };

  const spinLuckyWheel = () => {
    if (!currentUser) return { success: false, reward: 'Giriş Gerekli', coinsEarned: 0 };

    const todayStr = new Date().toDateString();
    if (currentUser.lastWheelSpin === todayStr) {
      return { success: false, reward: 'Bugün zaten çevirdiniz!', coinsEarned: 0 };
    }

    // Spin outcomes
    const outcomes = [
      { reward: '10 Jeton', coinsEarned: 10, isVip: false },
      { reward: '20 Jeton', coinsEarned: 20, isVip: false },
      { reward: '50 Jeton', coinsEarned: 50, isVip: false },
      { reward: '100 Jeton VIP Hediye!', coinsEarned: 100, isVip: false },
      { reward: 'VIP Statüsü (1 Gün)', coinsEarned: 0, isVip: true },
      { reward: 'Pas Geçtin (Tekrar Dene!)', coinsEarned: 0, isVip: false }
    ];

    // Pick random outcome
    const spinIndex = Math.floor(Math.random() * outcomes.length);
    const result = outcomes[spinIndex];

    const updatedUser = {
      ...currentUser,
      coins: currentUser.coins + result.coinsEarned,
      vipStatus: result.isVip ? true : currentUser.vipStatus,
      lastWheelSpin: todayStr
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    return {
      success: true,
      reward: result.reward,
      coinsEarned: result.coinsEarned
    };
  };

  const updateProfileMusic = (musicUrl: string | null, musicTitle: string | null) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      profileMusicUrl: musicUrl || undefined,
      profileMusicTitle: musicTitle || undefined
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const toggleFollow = (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    // Check block
    const target = users.find((u) => u.id === targetUserId);
    if (target?.blockedUserIds?.includes(currentUser.id)) {
      alert('Bu kullanıcıyı takip edemezsiniz.');
      return;
    }

    const isFollowing = follows.some(
      (f) => f.followerId === currentUser.id && f.followingId === targetUserId
    );

    if (isFollowing) {
      setFollows((prev) =>
        prev.filter(
          (f) => !(f.followerId === currentUser.id && f.followingId === targetUserId)
        )
      );
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id) {
            return { ...u, followingCount: Math.max(0, u.followingCount - 1) };
          }
          if (u.id === targetUserId) {
            return { ...u, followersCount: Math.max(0, u.followersCount - 1) };
          }
          return u;
        })
      );
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          followingCount: Math.max(0, prev.followingCount - 1)
        };
      });
    } else {
      setFollows((prev) => [...prev, { followerId: currentUser.id, followingId: targetUserId }]);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id) {
            return { ...u, followingCount: u.followingCount + 1 };
          }
          if (u.id === targetUserId) {
            return { ...u, followersCount: u.followersCount + 1 };
          }
          return u;
        })
      );
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          followingCount: prev.followingCount + 1
        };
      });

      // Add notification
      triggerNotification(targetUserId, 'follow', 'seni takip etmeye başladı.');
    }
  };

  const updateProfile = (
    username: string, 
    displayName: string, 
    bio: string, 
    avatarUrl: string, 
    coverUrl: string
  ): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Lütfen giriş yapın.' };

    const cleanUsername = username.trim().toLowerCase();
    
    // Check validation of username format
    if (!cleanUsername) {
      return { success: false, message: 'Kullanıcı adı boş olamaz.' };
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      return { success: false, message: 'Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir.' };
    }

    // Check if new username is taken
    if (cleanUsername !== currentUser.username) {
      const isTaken = users.some((u) => u.username === cleanUsername);
      if (isTaken) {
        return { success: false, message: 'Bu kullanıcı adı zaten alınmış.' };
      }
    }

    const updatedUser = {
      ...currentUser,
      username: cleanUsername,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || currentUser.avatarUrl,
      coverUrl: coverUrl.trim() || currentUser.coverUrl
    };

    // If username changed, update any comments they posted non-anonymously
    setQuestions((prevQuestions) => 
      prevQuestions.map((q) => {
        if (!q.comments) return q;
        const updatedComments = q.comments.map((c) => {
          if (c.senderId === currentUser.id && c.senderUsername) {
            return { ...c, senderUsername: cleanUsername };
          }
          return c;
        });
        return { ...q, comments: updatedComments };
      })
    );

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    return { success: true, message: 'Profil başarıyla güncellendi!' };
  };

  const getQuestionSender = (senderUsername: string | null): User | null => {
    if (!senderUsername) return null;
    return users.find((u) => u.username === senderUsername) || null;
  };

  const getRandomQuestion = (): string => {
    const idx = Math.floor(Math.random() * RANDOM_QUESTIONS.length);
    return RANDOM_QUESTIONS[idx];
  };

  // Phase 2 State Actions
  const earnCoins = (amount: number) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, coins: u.coins + amount } : u))
    );
    setCurrentUser((prev) => prev ? { ...prev, coins: prev.coins + amount } : null);
  };

  const buyTheme = (themeId: string, cost: number): boolean => {
    if (!currentUser) return false;
    
    const coins = currentUser.coins || 0;
    if (coins < cost) return false;

    const unlockedThemes = currentUser.unlockedThemes || [];
    if (unlockedThemes.includes(themeId)) return true;

    const updatedUser = {
      ...currentUser,
      coins: coins - cost,
      unlockedThemes: [...unlockedThemes, themeId]
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return true;
  };

  const activateTheme = (themeId: string | null) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      activeTheme: themeId
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
  };

  const buyVip = (cost: number): boolean => {
    if (!currentUser) return false;
    
    const coins = currentUser.coins || 0;
    const vipStatus = currentUser.vipStatus || false;
    if (coins < cost || vipStatus) return false;

    const updatedUser = {
      ...currentUser,
      coins: coins - cost,
      vipStatus: true
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return true;
  };

  const refundVip = (refundAmount: number): boolean => {
    if (!currentUser) return false;
    if (!currentUser.vipStatus) return false;

    const coins = currentUser.coins || 0;
    const updatedUser = {
      ...currentUser,
      coins: coins + refundAmount,
      vipStatus: false
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return true;
  };

  const refundTheme = (themeId: string): boolean => {
    if (!currentUser) return false;
    if (!currentUser.unlockedThemes?.includes(themeId)) return false;

    const getThemeCost = (id: string): number => {
      switch (id) {
        case 'ocean': return 50;
        case 'neon': return 70;
        case 'forest': return 50;
        case 'gold': return 100;
        default: return 0;
      }
    };

    const cost = getThemeCost(themeId);
    const newUnlocked = currentUser.unlockedThemes.filter((id) => id !== themeId);
    const newActiveTheme = currentUser.activeTheme === themeId ? null : currentUser.activeTheme;

    const updatedUser = {
      ...currentUser,
      coins: (currentUser.coins || 0) + cost,
      unlockedThemes: newUnlocked,
      activeTheme: newActiveTheme
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return true;
  };

  const unlockHint = (questionId: string, cost: number): boolean => {
    if (!currentUser) return false;

    // VIP gets free hint, others pay cost
    if (!currentUser.vipStatus && currentUser.coins < cost) {
      return false;
    }

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, hintUnlocked: true } : q))
    );

    if (!currentUser.vipStatus) {
      const updatedUser = {
        ...currentUser,
        coins: currentUser.coins - cost
      };
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
    }

    return true;
  };

  const createVersusPoll = (title: string, imgA: string, imgB: string) => {
    if (!currentUser || !title.trim() || !imgA.trim() || !imgB.trim()) return;

    const newPoll: VersusPoll = {
      id: 'v_' + Date.now(),
      creatorId: currentUser.id,
      title: title.trim(),
      imgA: imgA.trim(),
      imgB: imgB.trim(),
      votesA: [],
      votesB: [],
      createdAt: new Date().toISOString()
    };

    setVersusPolls((prev) => [newPoll, ...prev]);
    earnCoins(10); // Reward for poll creation
  };

  const voteVersus = (pollId: string, option: 'A' | 'B') => {
    if (!currentUser) return;

    setVersusPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;

        // Clean previous vote from user
        const newVotesA = p.votesA.filter((id) => id !== currentUser.id);
        const newVotesB = p.votesB.filter((id) => id !== currentUser.id);

        if (option === 'A') {
          newVotesA.push(currentUser.id);
        } else {
          newVotesB.push(currentUser.id);
        }

        return {
          ...p,
          votesA: newVotesA,
          votesB: newVotesB
        };
      })
    );
  };

  const sendDM = (receiverId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio', replyToId?: string) => {
    if (!currentUser) return;
    if (!text.trim() && !mediaUrl) return;

    // Check block
    const receiver = users.find((u) => u.id === receiverId);
    if (receiver?.blockedUserIds?.includes(currentUser.id)) {
      alert('Engellendiğiniz için mesaj gönderemezsiniz.');
      return;
    }

    const newMsg: DirectMessage = {
      id: 'm_' + Date.now() + Math.random().toString(36).substr(2, 5),
      senderId: currentUser.id,
      receiverId,
      text: text.trim(),
      mediaUrl,
      mediaType,
      replyToId,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);

    // Send notification
    triggerNotification(receiverId, 'message', 'sana özel bir mesaj gönderdi.');
  };

  const deleteDM = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const reportDM = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isReported: true } : m))
    );
  };

  const toggleBlock = (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    const isBlocked = currentUser.blockedUserIds?.includes(targetUserId) || false;
    let updatedBlocked = [];

    if (isBlocked) {
      updatedBlocked = (currentUser.blockedUserIds || []).filter((id) => id !== targetUserId);
    } else {
      updatedBlocked = [...(currentUser.blockedUserIds || []), targetUserId];
      // Force unfollow when blocking
      setFollows((prev) =>
        prev.filter(
          (f) =>
            !(
              (f.followerId === currentUser.id && f.followingId === targetUserId) ||
              (f.followerId === targetUserId && f.followingId === currentUser.id)
            )
        )
      );
    }

    const updatedUser = {
      ...currentUser,
      blockedUserIds: updatedBlocked
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
  };

  const reportQuestion = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isReported: true } : q))
    );
  };

  const addComment = (questionId: string, text: string, isAnonymous: boolean, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio') => {
    if (!text.trim() && !mediaUrl) return;

    const newComment: CommentItem = {
      id: 'c_' + Date.now() + Math.random().toString(36).substr(2, 5),
      questionId,
      senderUsername: isAnonymous ? null : (currentUser ? currentUser.username : null),
      senderId: currentUser ? currentUser.id : 'anon_guest',
      text: text.trim(),
      mediaUrl,
      mediaType,
      createdAt: new Date().toISOString()
    };

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            comments: [...(q.comments || []), newComment]
          };
        }
        return q;
      })
    );

    // Notify post owner
    const targetQ = questions.find((q) => q.id === questionId);
    if (targetQ && currentUser && targetQ.receiverId !== currentUser.id) {
      triggerNotification(
        targetQ.receiverId,
        'message',
        isAnonymous ? 'bir yanıtına anonim yorum yazdı.' : `bir yanıtına yorum yazdı: "${text.substring(0, 15)}..."`
      );
    }

    // Check for mentions
    const mentions = text.match(/@[a-zA-Z0-9_]+/g);
    if (mentions) {
      mentions.forEach((mention) => {
        const uname = mention.substring(1).toLowerCase();
        const mentionedUser = users.find((u) => u.username === uname);
        if (mentionedUser && mentionedUser.id !== currentUser?.id) {
          triggerNotification(
            mentionedUser.id,
            'message',
            isAnonymous ? 'bir yorumda senden anonim olarak bahsetti.' : 'bir yorumda senden bahsetti.'
          );
        }
      });
    }
  };

  const deleteComment = (questionId: string, commentId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            comments: (q.comments || []).filter((c) => c.id !== commentId)
          };
        }
        return q;
      })
    );
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
    );
  };

  const dailyCheckIn = (): boolean => {
    if (!currentUser) return false;

    const todayStr = new Date().toDateString();
    if (currentUser.lastCheckIn === todayStr) {
      return false; // Already checked in today
    }

    const updatedUser = {
      ...currentUser,
      coins: currentUser.coins + 20,
      lastCheckIn: todayStr
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        users,
        questions,
        follows,
        likes,
        notifications,
        messages,
        versusPolls,
        currentUser,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        askQuestion,
        sendShoutout,
        answerQuestion,
        deleteQuestion,
        toggleLike,
        toggleFollow,
        updateProfile,
        getQuestionSender,
        getRandomQuestion,
        
        // Phase 2 Exposes
        earnCoins,
        buyTheme,
        activateTheme,
        buyVip,
        refundVip,
        refundTheme,
        unlockHint,
        createVersusPoll,
        voteVersus,
        sendDM,
        deleteDM,
        reportDM,
        toggleBlock,
        reportQuestion,
        addComment,
        deleteComment,
        markNotificationsAsRead,
        dailyCheckIn,

        // New Features Exposes
        gifts,
        stories,
        addStory,
        sendGift,
        spinLuckyWheel,
        toggleLikeReaction,
        updateProfileMusic
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
