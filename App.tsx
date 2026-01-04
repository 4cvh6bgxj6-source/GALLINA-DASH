
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import VoiceGameCanvas from './components/VoiceGameCanvas';
import { UserProfile, Skin, PassTier, UserTier } from './types';
import { getChestRewardFlavor, getLevelFlavorText } from './services/gemini';

const SKINS: Skin[] = [
  { id: 'classic', name: 'Gallina Bianca', color: '#ffffff', price: 0 },
  { id: 'golden', name: 'Gallina Oro', color: '#fbbf24', price: 500 },
  { id: 'neon', name: 'Gallina Neon', color: '#10b981', price: 0, requirement: 'Premium' },
  { id: 'cyber', name: 'Gallina Cyber', color: '#06b6d4', price: 0, requirement: 'Premium' },
  { id: 'royal', name: 'Gallina Reale', color: '#8b5cf6', price: 0, requirement: 'VIP' },
  { id: 'robo', name: 'Robo Gallina', color: '#64748b', price: 0, requirement: 'Pass' },
  { id: 'alien', name: 'Gallina Aliena', color: '#a3e635', price: 0, requirement: 'Premium' },
  { id: 'ninja', name: 'Gallina Ninja', color: '#111827', price: 0, requirement: 'Pass' },
  { id: 'god', name: 'Gallina Divina', color: '#fef08a', price: 0, requirement: 'Pass' },
  { id: 'lava', name: 'Gallina Lavica', color: '#ef4444', price: 0, requirement: 'Pass' },
  { id: 'frost', name: 'Gallina Ghiacciata', color: '#60a5fa', price: 0, requirement: 'Pass' },
  { id: 'emerald', name: 'Gallina Smeraldo', color: '#059669', price: 0, requirement: 'Pass' },
  { id: 'obsidian', name: 'Gallina Ossidiana', color: '#1f2937', price: 0, requirement: 'Pass' },
  { id: 'galaxy', name: 'Gallina Galattica', color: '#4c1d95', price: 0, requirement: 'Pass' },
  { id: 'rainbow', name: 'Gallina Arcobaleno', color: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)', price: 0, requirement: 'Pass' },
  { id: 'diamond', name: 'Gallina Diamante', color: '#e0f2fe', price: 0, requirement: 'Pass' },
];

const NAME_COLORS = [
  { id: 'default', name: 'Bianco', value: '#ffffff', tier: 'Normal' },
  { id: 'red', name: 'Rosso', value: '#ef4444', tier: 'Normal' },
  { id: 'blue', name: 'Azzurro', value: '#3b82f6', tier: 'Normal' },
  { id: 'green', name: 'Verde', value: '#10b981', tier: 'Normal' },
  { id: 'yellow', name: 'Giallo', value: '#fbbf24', tier: 'Normal' },
  { id: 'pink', name: 'Rosa', value: '#f472b6', tier: 'Normal' },
  { id: 'metallic-purple', name: 'Viola Metal', value: 'metallic-purple', tier: 'Premium' },
  { id: 'rainbow', name: 'Arcobaleno', value: 'rainbow', tier: 'VIP' },
];

const generatePassRewards = (): PassTier[] => {
  const tiers: PassTier[] = [];
  const skinRewards = ['robo', 'ninja', 'god', 'lava', 'frost', 'emerald', 'obsidian', 'galaxy', 'rainbow', 'diamond'];
  for (let i = 1; i <= 50; i++) {
    const xpRequired = i * i * 180;
    const isPremium = i % 2 === 0 || i % 5 === 0;
    let rewardType: 'coins' | 'chest' | 'skin' = 'coins';
    let rewardValue: any = i * 120;
    if (i % 10 === 0) {
      rewardType = 'skin';
      rewardValue = skinRewards[(i / 10) - 1] || 'classic';
    } else if (i % 3 === 0) {
      rewardType = 'chest';
      rewardValue = null;
    }
    tiers.push({ level: i, xpRequired, rewardType, rewardValue, isPremium });
  }
  return tiers;
};

const PASS_REWARDS = generatePassRewards();

const Navigation: React.FC<{ view: string; setView: (v: any) => void }> = ({ view, setView }) => (
  <nav className="fixed bottom-0 left-0 right-0 h-24 bg-indigo-950/95 backdrop-blur-xl flex justify-center items-center gap-8 z-50 border-t border-white/10 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
     <button onClick={() => setView('dashboard')} className={`text-2xl p-2 transition-all ${view === 'dashboard' ? 'scale-125 brightness-150' : 'opacity-40 grayscale'}`}>🏠</button>
     <button onClick={() => setView('worlds')} className={`text-2xl p-2 transition-all ${view === 'worlds' ? 'scale-125 brightness-150' : 'opacity-40 grayscale'}`}>🌍</button>
     <button onClick={() => setView('skins')} className={`text-2xl p-2 transition-all ${view === 'skins' ? 'scale-125 brightness-150' : 'opacity-40 grayscale'}`}>🎭</button>
     <button onClick={() => setView('shop')} className={`text-2xl p-2 transition-all ${view === 'shop' ? 'scale-125 brightness-150' : 'opacity-40 grayscale'}`}>👑</button>
     <button onClick={() => setView('pass')} className={`text-2xl p-2 transition-all ${view === 'pass' ? 'scale-125 brightness-150' : 'opacity-40 grayscale'}`}>🎫</button>
  </nav>
);

const Header: React.FC<{ profile: UserProfile; setView: (v: any) => void }> = ({ profile, setView }) => {
  const nextTier = PASS_REWARDS.find(t => t.xpRequired > profile.xp);
  const prevTierXp = PASS_REWARDS.find(t => t.xpRequired <= profile.xp && PASS_REWARDS[PASS_REWARDS.indexOf(t)+1]?.xpRequired > profile.xp)?.xpRequired || 0;
  const progress = nextTier ? ((profile.xp - prevTierXp) / (nextTier.xpRequired - prevTierXp)) * 100 : 100;
  const multiplier = profile.tier === 'VIP' ? 3 : (profile.tier === 'Premium' ? 2 : 1);

  const getNameStyle = () => {
    if (profile.nameColor === 'rainbow') return 'name-rainbow';
    if (profile.nameColor === 'metallic-purple') return 'name-metallic-purple';
    return '';
  };

  return (
    <header className="flex flex-col gap-2 mb-6 max-w-4xl mx-auto w-full px-4 pt-4 shrink-0">
      <div className="flex justify-between items-center">
        <div className="overflow-hidden flex-1">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest truncate">BENTORNATO</p>
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-black italic tracking-tighter truncate max-w-[140px] sm:max-w-full ${getNameStyle()}`} style={!getNameStyle() ? { color: profile.nameColor || '#ffffff' } : {}}>
              {profile.username}
            </h2>
            <button 
              onClick={() => setView('profile')}
              className="bg-yellow-400 text-indigo-950 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter hover:bg-yellow-500 transition-all shadow-[0_2px_0_rgb(180,130,0)] active:translate-y-0.5 active:shadow-none"
            >
              🎨 Personalizza
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-black ${profile.tier === 'VIP' ? 'text-yellow-400' : profile.tier === 'Premium' ? 'text-cyan-400' : 'text-gray-400'}`}>{profile.tier}</span>
            {multiplier > 1 && (
               <p className={`text-[8px] font-bold uppercase tracking-widest ${profile.tier === 'VIP' ? 'text-yellow-500 animate-pulse' : 'text-cyan-500'}`}>
                 • {multiplier}X 🚀
               </p>
            )}
          </div>
        </div>
        <div className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 border-b-2 border-black/30 shrink-0 ml-4">
          <span className="text-yellow-400 text-lg font-bold">🪙</span>
          <span className="text-lg font-black text-white">{profile.coins}</span>
        </div>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
        <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase tracking-tighter mix-blend-difference text-white">
          XP PASS: {profile.xp} / {nextTier?.xpRequired || 'MAX'}
        </span>
      </div>
    </header>
  );
};

const ViewWrapper: React.FC<{ children: React.ReactNode; view: string; setView: (v: any) => void }> = ({ children, view, setView }) => (
  <div className="fixed inset-0 bg-indigo-950 text-white flex flex-col overflow-y-auto pb-40">
    <div className="max-w-4xl mx-auto w-full px-4 pt-4 shrink-0 flex items-center z-50">
       <button 
         onClick={() => setView('dashboard')} 
         className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-tighter border-b-2 border-black/30 hover:bg-white/20 transition-all flex items-center gap-2"
       >
         ⬅️ Indietro
       </button>
    </div>
    {children}
    <Navigation view={view} setView={setView} />
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard' | 'game' | 'shop' | 'pass' | 'skins' | 'levelUp' | 'worlds' | 'voice-game' | 'profile' | 'chest-opening'>('login');
  const [secretCode, setSecretCode] = useState('');
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    coins: 0,
    xp: 0,
    tier: 'Normal',
    unlockedSkins: ['classic'],
    activeSkinId: 'classic',
    nameColor: '#ffffff'
  });

  const [gameState, setGameState] = useState({ 
    score: 0, 
    level: 1, 
    isGameOver: false, 
    xpGained: 0,
    mode: 'classic' as 'classic' | 'voice'
  });
  
  const [chestOpeningState, setChestOpeningState] = useState<{ 
    phase: 'closed' | 'opening' | 'revealed', 
    data?: any, 
    coins?: number 
  }>({ phase: 'closed' });

  const [levelUpData, setLevelUpData] = useState<{ encouragement: string, joke: string } | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [userExistsInStorage, setUserExistsInStorage] = useState(false);
  const [useVoice, setUseVoice] = useState(false);

  const getAccounts = () => JSON.parse(localStorage.getItem('gallina_accounts') || '{}');
  
  const saveAccount = (p: UserProfile) => {
    if (!p.username) return;
    const accounts = getAccounts();
    accounts[p.username.toLowerCase().trim()] = { 
        ...p, 
        claimedRewards, 
        level: gameState.level 
    };
    localStorage.setItem('gallina_accounts', JSON.stringify(accounts));
  };

  // Monitora se l'utente esiste mentre scrive
  useEffect(() => {
    if (view === 'login') {
      const accounts = getAccounts();
      const exists = !!accounts[profile.username.toLowerCase().trim()];
      setUserExistsInStorage(exists && profile.username.trim().length > 0);
    }
  }, [profile.username, view]);

  const handleLogin = () => {
    const usernameKey = profile.username.toLowerCase().trim();
    if (!usernameKey) return;

    const accounts = getAccounts();
    let userProfile: UserProfile;

    if (accounts[usernameKey]) {
      userProfile = accounts[usernameKey];
      setClaimedRewards(accounts[usernameKey].claimedRewards || []);
      if (accounts[usernameKey].level) {
        setGameState(prev => ({ ...prev, level: accounts[usernameKey].level }));
      }
    } else {
      userProfile = {
        username: profile.username.trim(),
        coins: 0,
        xp: 0,
        tier: 'Normal',
        unlockedSkins: ['classic'],
        activeSkinId: 'classic',
        nameColor: '#ffffff'
      };
    }

    const code = secretCode.toUpperCase().trim();
    if (code === 'VIP') {
      userProfile.tier = 'VIP';
      userProfile.unlockedSkins = SKINS.map(s => s.id);
      userProfile.nameColor = 'rainbow';
    } else if (code === 'PREMIUM') {
      userProfile.tier = 'Premium';
      const premiumSkinIds = SKINS.filter(s => s.requirement === 'Premium' || s.price === 0).map(s => s.id);
      userProfile.unlockedSkins = Array.from(new Set([...userProfile.unlockedSkins, ...premiumSkinIds]));
      userProfile.nameColor = 'metallic-purple';
    } else if (code === 'FULL SKIN') {
      userProfile.unlockedSkins = SKINS.map(s => s.id);
    }

    setProfile(userProfile);
    setView('dashboard');
  };

  useEffect(() => {
    if (profile.username && view !== 'login') saveAccount(profile);
  }, [profile, claimedRewards, gameState.level, view]);

  const getMultiplier = () => (profile.tier === 'VIP' ? 3 : (profile.tier === 'Premium' ? 2 : 1));

  const handleGameOver = (finalScore: number, finalCoins: number) => {
    const m = getMultiplier();
    const gainedXP = Math.floor((finalScore / 2) * m);
    setProfile(p => ({ ...p, coins: p.coins + (finalCoins * m), xp: p.xp + gainedXP }));
    setGameState(prev => ({ ...prev, isGameOver: true, score: finalScore, xpGained: gainedXP }));
  };

  const handleLevelComplete = async (finalScore: number, finalCoins: number) => {
    const m = getMultiplier();
    const currentLevel = gameState.level;
    const gainedXP = Math.floor(((finalScore / 1.2) + (currentLevel * 400)) * m);
    
    setProfile(p => ({ ...p, coins: p.coins + (finalCoins * m), xp: p.xp + gainedXP }));
    setGameState(prev => ({ ...prev, score: finalScore, xpGained: gainedXP, level: prev.level + 1 }));
    
    const flavor = await getLevelFlavorText(currentLevel);
    setLevelUpData(flavor);
    setView('levelUp');
  };

  const equipOrBuySkin = (skin: Skin) => {
    if (profile.tier === 'VIP') {
       setProfile(p => ({ ...p, activeSkinId: skin.id }));
       return;
    }
    if (skin.requirement === 'VIP' && profile.tier !== 'VIP') {
      alert("⚠️ ACCESSO NEGATO: Questa skin è riservata ai VIP!");
      return;
    }
    if (skin.requirement === 'Premium' && profile.tier === 'Normal') {
      alert("⚠️ ACCESSO NEGATO: Questa skin è riservata ai PREMIUM!");
      return;
    }
    if (skin.requirement === 'Pass' && !profile.unlockedSkins.includes(skin.id)) {
      alert("⚠️ BLOCCATA: Questa skin si ottiene avanzando nel Gallina Pass.");
      return;
    }
    if (profile.unlockedSkins.includes(skin.id)) {
      setProfile(p => ({ ...p, activeSkinId: skin.id }));
      return;
    }
    if (profile.coins >= skin.price) {
      if (confirm(`Vuoi comprare ${skin.name} per ${skin.price} 🪙?`)) {
        setProfile(p => ({
          ...p,
          coins: p.coins - skin.price,
          unlockedSkins: [...p.unlockedSkins, skin.id],
          activeSkinId: skin.id
        }));
      }
    } else {
      alert("🪙 Monete insufficienti!");
    }
  };

  const upgradeTier = (tier: UserTier) => {
    const prices = { Normal: 0, Premium: 5000, VIP: 10000 };
    const price = prices[tier];
    if (profile.coins >= price) {
      if (confirm(`Vuoi passare a ${tier} per ${price} 🪙?`)) {
        setProfile(p => {
          let newSkins = [...p.unlockedSkins];
          let newNameColor = p.nameColor;
          if (tier === 'VIP') {
            newSkins = SKINS.map(s => s.id);
            newNameColor = 'rainbow';
          } else if (tier === 'Premium') {
            const premiumSkinIds = SKINS.filter(s => s.requirement === 'Premium').map(s => s.id);
            newSkins = Array.from(new Set([...newSkins, ...premiumSkinIds]));
            newNameColor = 'metallic-purple';
          }
          return { ...p, coins: p.coins - price, tier: tier, unlockedSkins: newSkins, nameColor: newNameColor };
        });
      }
    } else {
      alert("Monete insufficienti!");
    }
  };

  const changeNameColor = (colorVal: string, tierReq: string) => {
    if (tierReq === 'Premium' && profile.tier === 'Normal') {
      alert("⚠️ BLOCCATO: Questo colore è per utenti PREMIUM!");
      return;
    }
    if (tierReq === 'VIP' && profile.tier !== 'VIP') {
      alert("⚠️ BLOCCATO: Questo colore è riservato ai VIP!");
      return;
    }
    setProfile(p => ({ ...p, nameColor: colorVal }));
  };

  const claimReward = (tier: PassTier) => {
    if (claimedRewards.includes(tier.level)) return;
    if (profile.xp < tier.xpRequired) {
      alert("XP insufficienti per questo premio!");
      return;
    }

    setClaimedRewards(prev => [...prev, tier.level]);

    if (tier.rewardType === 'coins') {
      setProfile(p => ({ ...p, coins: p.coins + tier.rewardValue }));
      alert(`Hai ricevuto ${tier.rewardValue} monete! 🪙`);
    } else if (tier.rewardType === 'skin') {
      setProfile(p => ({ ...p, unlockedSkins: Array.from(new Set([...p.unlockedSkins, tier.rewardValue])) }));
      alert("Nuova skin sbloccata nell'armadio! 🎭");
    } else if (tier.rewardType === 'chest') {
      initChestOpening();
    }
  };

  const initChestOpening = async () => {
    setView('chest-opening');
    setChestOpeningState({ phase: 'closed' });
    
    const flavorPromise = getChestRewardFlavor(profile.username);
    const coins = (200 + Math.floor(Math.random() * 500)) * getMultiplier();
    
    setTimeout(async () => {
      const flavor = await flavorPromise;
      setChestOpeningState({ phase: 'opening', data: flavor, coins });
      
      setTimeout(() => {
        setProfile(p => ({ ...p, coins: p.coins + coins }));
        setChestOpeningState({ phase: 'revealed', data: flavor, coins });
      }, 1500);
    }, 800);
  };

  const startNextLevel = () => {
    setGameState(prev => ({ ...prev, score: 0, isGameOver: false, xpGained: 0, mode: 'classic' }));
    setUseVoice(false);
    setView('game');
  };

  const handleStartGameMode = (choice: 'voice' | 'classic') => {
    setShowVoicePrompt(false);
    if (choice === 'voice') {
      setUseVoice(true);
      setGameState(prev => ({ ...prev, mode: 'voice', score: 0, isGameOver: false }));
      setView('voice-game');
    } else {
      setUseVoice(false);
      setGameState(prev => ({ ...prev, mode: 'classic', score: 0, isGameOver: false }));
      setView('game');
    }
  };

  const handleResetToHome = () => {
    setGameState(prev => ({ ...prev, score: 0, isGameOver: false, xpGained: 0 }));
    setView('dashboard');
  };

  if (view === 'login') {
    return (
      <div className="fixed inset-0 bg-indigo-900 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border-b-8 border-indigo-200 my-auto">
          <h1 className="text-3xl font-black text-indigo-900 mb-2 italic uppercase tracking-tighter">GALLINA DASH</h1>
          <div className="text-7xl mb-4 animate-bounce">🐔</div>
          <div className="space-y-4 mb-6 text-left">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 ml-2 mb-1 tracking-widest">USERNAME</p>
              <input 
                type="text" 
                placeholder="Inserisci nome..." 
                className="w-full p-4 border-4 border-indigo-50 rounded-2xl text-xl font-bold focus:border-yellow-400 outline-none transition-all shadow-inner"
                value={profile.username}
                onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))}
              />
              {profile.username.trim().length > 0 && (
                <p className={`text-[10px] font-black uppercase ml-2 mt-2 tracking-tight ${userExistsInStorage ? 'text-green-500' : 'text-indigo-300'}`}>
                  {userExistsInStorage ? '✅ Account trovato: Bentornato!' : '✨ Nuovo account: Benvenuto!'}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-300 ml-2 mb-1 tracking-widest">CODICE SEGRETO (Opzionale)</p>
              <input 
                type="text" 
                placeholder="Inserisci codice speciale..." 
                className="w-full p-4 border-4 border-indigo-50 border-dashed rounded-2xl text-sm font-bold focus:border-indigo-400 outline-none transition-all shadow-inner italic"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
            </div>
          </div>
          <button 
            disabled={!profile.username}
            onClick={handleLogin}
            className="w-full py-4 bg-yellow-400 text-indigo-950 text-2xl font-black rounded-2xl hover:bg-yellow-500 transition-all shadow-[0_6px_0_rgb(202,138,4)] uppercase italic active:translate-y-1 active:shadow-none"
          >
            ENTRA 🚀
          </button>
        </div>
      </div>
    );
  }

  if (view === 'chest-opening') {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center p-6 z-[500] text-center overflow-hidden">
        {chestOpeningState.phase === 'closed' && (
          <div className="animate-pulse space-y-4">
            <div className="text-9xl">🎁</div>
            <h2 className="text-3xl font-black uppercase italic text-yellow-400">ARRIVA LA CASSA...</h2>
          </div>
        )}

        {chestOpeningState.phase === 'opening' && (
          <div className="animate-chest-shake space-y-4">
            <div className="text-[12rem]">🎁</div>
            <h2 className="text-4xl font-black uppercase italic text-white drop-shadow-lg">SI STA APRENDO!</h2>
          </div>
        )}

        {chestOpeningState.phase === 'revealed' && (
          <div className="animate-float-up flex flex-col items-center max-w-sm">
            <div className="text-[10rem] mb-4">✨</div>
            <h2 className="text-2xl font-black uppercase text-yellow-500 italic tracking-tighter mb-2">{chestOpeningState.data?.chestName || 'CASSA DEL POLLAIO'}</h2>
            <div className="bg-white p-8 rounded-[3rem] border-8 border-yellow-400 text-indigo-950 shadow-2xl space-y-4 w-full">
              <p className="text-5xl font-black italic">+{chestOpeningState.coins} 🪙</p>
              <p className="text-sm font-bold text-gray-500 italic leading-tight">"{chestOpeningState.data?.message || 'Incredibile fortuna!'}"</p>
              <button 
                onClick={() => setView('pass')}
                className="w-full py-5 bg-indigo-950 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(30,27,75)] active:translate-y-1 active:shadow-none uppercase italic"
              >
                OTTIMO! 🐔
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="fixed inset-0 bg-indigo-950 text-white flex flex-col overflow-y-auto pb-40">
        <Header profile={profile} setView={setView} />
        <div className="max-w-4xl mx-auto w-full px-4 space-y-6 text-center">
          <div className="bg-red-500 text-white py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-[-1.5rem] z-10 relative inline-block px-6 border-2 border-white animate-pulse">
            LIVELLO {gameState.level}
          </div>
          
          <button 
            onClick={() => {
              setUseVoice(false);
              setGameState(prev => ({ ...prev, mode: 'classic', score: 0, isGameOver: false }));
              setView('game');
            }} 
            className="w-full bg-yellow-400 text-indigo-950 py-10 rounded-[2.5rem] flex flex-col items-center justify-center hover:scale-[1.01] active:scale-95 transition-all shadow-[0_12px_0_rgb(202,138,4)] border-2 border-white/20 group"
          >
            <span className="text-6xl mb-2 group-hover:rotate-12 transition-transform">⚡</span>
            <span className="text-3xl font-black uppercase italic tracking-tighter leading-none">GIOCA LIVELLO</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
             <div onClick={() => setView('worlds')} className="bg-indigo-900 p-5 rounded-[1.5rem] border-b-4 border-indigo-800 flex flex-col items-center gap-1 cursor-pointer active:bg-indigo-800 shadow-lg">
              <span className="text-3xl">🌍</span>
              <span className="font-black uppercase italic text-[10px] tracking-tighter">Mondi</span>
            </div>
            <div onClick={() => setView('skins')} className="bg-indigo-900 p-5 rounded-[1.5rem] border-b-4 border-indigo-800 flex flex-col items-center gap-1 cursor-pointer active:bg-indigo-800 shadow-lg">
              <span className="text-3xl">🎭</span>
              <span className="font-black uppercase italic text-[10px] tracking-tighter">Armadio</span>
            </div>
            <div onClick={() => setView('pass')} className="bg-gradient-to-br from-indigo-800 to-indigo-700 p-5 rounded-[1.5rem] border-b-4 border-yellow-600 flex flex-col items-center gap-1 cursor-pointer active:brightness-110 shadow-lg">
              <span className="text-3xl">🎫</span>
              <span className="font-black uppercase italic text-[10px] tracking-tighter">Pass Premi</span>
            </div>
            <div onClick={() => setView('shop')} className="bg-gradient-to-br from-yellow-600 to-yellow-500 p-5 rounded-[1.5rem] border-b-4 border-yellow-800 flex flex-col items-center gap-1 cursor-pointer active:brightness-110 shadow-lg">
              <span className="text-3xl">👑</span>
              <span className="font-black uppercase italic text-[10px] tracking-tighter text-indigo-950">Negozio VIP</span>
            </div>
          </div>
        </div>
        <Navigation view={view} setView={setView} />
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <ViewWrapper view={view} setView={setView}>
        <Header profile={profile} setView={setView} />
        <div className="max-w-4xl mx-auto w-full px-4 space-y-8">
          <h2 className="text-3xl font-black italic mb-2 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">COLORE NOME</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-10">
            {NAME_COLORS.map(c => {
              const isLocked = (c.tier === 'Premium' && profile.tier === 'Normal') || (c.tier === 'VIP' && profile.tier !== 'VIP');
              return (
                <div 
                  key={c.id} 
                  onClick={() => changeNameColor(c.value, c.tier)}
                  className={`bg-indigo-900 p-6 rounded-[2rem] border-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${profile.nameColor === c.value ? 'border-yellow-400 scale-105' : 'border-transparent'} ${isLocked ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-full border-2 border-white/20 ${c.value === 'rainbow' ? 'name-rainbow' : (c.value === 'metallic-purple' ? 'bg-purple-400 shadow-[0_0_15px_purple]' : '')}`} style={c.value !== 'rainbow' && c.value !== 'metallic-purple' ? { backgroundColor: c.value } : {}} />
                  <p className="font-black text-[9px] uppercase tracking-widest">{c.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </ViewWrapper>
    );
  }

  if (view === 'levelUp') {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex items-center justify-center p-6 z-[300]">
        <div className="bg-white p-8 rounded-[3rem] text-center shadow-2xl border-[12px] border-yellow-400 w-full max-w-lg animate-in zoom-in">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-5xl font-black text-indigo-950 mb-2 italic uppercase tracking-tighter leading-none">MAPPA FINITA!</h2>
          <div className="bg-yellow-50 p-4 rounded-3xl mb-6 space-y-2 border-2 border-yellow-100">
             <p className="text-2xl font-black text-yellow-600">+{gameState.xpGained} XP</p>
             <p className="text-sm font-bold text-gray-500 italic">"{levelUpData?.encouragement || 'Vola alto!'}"</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-3xl mb-4">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">BATTUTA DELLA GALLINA</p>
             <p className="text-lg font-black text-indigo-900 italic leading-tight">"{levelUpData?.joke || 'Gallina vecchia fa buon brodo...!'}"</p>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={startNextLevel} className="w-full py-6 bg-yellow-400 text-indigo-950 text-2xl font-black rounded-3xl shadow-[0_10px_0_rgb(202,138,4)] active:translate-y-2 uppercase italic">PROSSIMO LIVELLO {gameState.level} 🚀</button>
            <button onClick={handleResetToHome} className="w-full py-4 bg-indigo-950 text-white text-lg font-black rounded-3xl shadow-[0_6px_0_rgb(30,27,75)] uppercase italic opacity-80">TORNA AL POLLAIO 🏠</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'worlds' || view === 'skins' || view === 'shop' || view === 'pass') {
    const ComponentMap: any = {
      worlds: (
        <div className="max-w-4xl mx-auto w-full px-4 space-y-6">
          <h2 className="text-3xl font-black italic mb-2 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">MONDI DISPONIBILI</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-10">
            <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 rounded-[2.5rem] border-4 border-yellow-400 shadow-xl relative overflow-hidden group">
               <div className="relative z-10 flex flex-col items-start gap-2">
                 <span className="text-5xl group-hover:scale-110 transition-transform">🎙️</span>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight">PARLA CON LA VOCE!</h3>
                 <p className="text-[10px] font-bold text-green-100 uppercase tracking-widest">MAPPA SPECIALE • LIVELLO {gameState.level}</p>
                 <button onClick={() => setShowVoicePrompt(true)} className="mt-4 px-6 py-2 bg-yellow-400 text-indigo-950 rounded-xl font-black uppercase italic text-sm">GIOCA ORA</button>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10 text-[10rem] rotate-12">🐔</div>
            </div>

            <div className="bg-indigo-900/50 p-8 rounded-[2.5rem] border-4 border-red-900/30 shadow-xl relative overflow-hidden grayscale opacity-70">
               <div className="relative z-10 flex flex-col items-start gap-2">
                 <span className="text-5xl">🌋</span>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter text-red-400">VULCANO TERRESTRE</h3>
                 <p className="text-[10px] font-black bg-red-600 px-3 py-1 rounded-full text-white uppercase tracking-widest animate-pulse">COMING SOON</p>
               </div>
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-4xl">🔒</span>
               </div>
            </div>
          </div>
          
          {showVoicePrompt && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-[10px] border-yellow-400 text-center max-w-sm animate-in zoom-in duration-200">
                <h2 className="text-3xl font-black text-indigo-950 uppercase italic mb-6 leading-tight">VUOI PARLARE SALTANDO?</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">SALTA URLANDO AL MICROFONO O GIOCA NORMALMENTE!</p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => handleStartGameMode('voice')}
                    className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-2xl shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none uppercase italic"
                  >
                    SÌ! 🎙️
                  </button>
                  <button 
                    onClick={() => handleStartGameMode('classic')}
                    className="w-full py-4 bg-indigo-100 text-indigo-900 rounded-2xl font-black text-xl shadow-[0_4px_0_rgb(199,210,254)] active:translate-y-1 active:shadow-none uppercase italic"
                  >
                    NO, TOCCO 👆
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      skins: (
        <div className="max-w-4xl mx-auto w-full px-4">
          <h2 className="text-3xl font-black italic mb-6 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">ARMADIO SKIN</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-10">
            {SKINS.map(skin => (
              <div key={skin.id} onClick={() => equipOrBuySkin(skin)} className={`bg-indigo-900 p-4 rounded-[1.5rem] text-center border-4 transition-all cursor-pointer relative ${profile.activeSkinId === skin.id ? 'border-yellow-400 scale-105' : 'border-transparent'}`}>
                <div className="w-16 h-16 mx-auto rounded-xl mb-2 flex items-center justify-center overflow-hidden" style={{ background: skin.color }}>
                   <span className="text-3xl">🐔</span>
                </div>
                <p className="font-black text-[9px] uppercase tracking-widest text-gray-200 truncate">{skin.name}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      shop: (
        <div className="max-w-4xl mx-auto w-full px-4 space-y-8">
          <h2 className="text-3xl font-black italic mb-2 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">NEGOZIO VIP</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {/* CARD PREMIUM */}
            <div className={`p-6 rounded-[3rem] border-4 shadow-xl flex flex-col items-center transition-all ${profile.tier === 'Premium' || profile.tier === 'VIP' ? 'bg-indigo-950/50 border-gray-700 opacity-50 grayscale' : 'bg-indigo-900 border-cyan-600'}`}>
              <span className="text-6xl mb-4">🎫</span>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-cyan-400">STATUS PREMIUM</h3>
              <ul className="text-[10px] font-bold text-gray-300 space-y-2 mb-6 uppercase tracking-widest text-center">
                <li className="flex items-center gap-2 justify-center">🚀 GUADAGNI 2X MONETE & XP</li>
                <li className="flex items-center gap-2 justify-center">🎭 SBLOCCA SKIN PREMIUM</li>
                <li className="flex items-center gap-2 justify-center">✨ NOME VIOLA METAL</li>
              </ul>
              <button 
                onClick={() => upgradeTier('Premium')} 
                disabled={profile.tier !== 'Normal'} 
                className="w-full py-5 bg-yellow-400 text-indigo-950 rounded-2xl font-black text-2xl uppercase italic shadow-[0_6px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all"
              >
                5000 🪙
              </button>
            </div>

            {/* CARD VIP */}
            <div className={`p-6 rounded-[3rem] border-4 shadow-2xl flex flex-col items-center transition-all ${profile.tier === 'VIP' ? 'bg-indigo-950/50 border-gray-700 opacity-50 grayscale' : 'bg-gradient-to-br from-indigo-800 to-indigo-700 border-yellow-500'}`}>
              <div className="absolute top-0 right-0 bg-yellow-500 text-indigo-950 font-black text-[8px] px-4 py-1 rounded-bl-2xl rounded-tr-[2.8rem] uppercase tracking-widest">BEST VALUE</div>
              <span className="text-6xl mb-4">👑</span>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-yellow-400">STATUS VIP</h3>
              <ul className="text-[10px] font-bold text-yellow-100/70 space-y-2 mb-6 uppercase tracking-widest text-center">
                <li className="flex items-center gap-2 justify-center">🔥 GUADAGNI 3X MONETE & XP</li>
                <li className="flex items-center gap-2 justify-center">🌟 TUTTE LE SKIN SBLOCCATE!</li>
                <li className="flex items-center gap-2 justify-center">🌈 NOME ARCOBALENO ANIMATO</li>
              </ul>
              <button 
                onClick={() => upgradeTier('VIP')} 
                disabled={profile.tier === 'VIP'} 
                className="w-full py-5 bg-yellow-400 text-indigo-950 rounded-2xl font-black text-2xl uppercase italic shadow-[0_6px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all"
              >
                10000 🪙
              </button>
            </div>
          </div>
        </div>
      ),
      pass: (
        <div className="max-w-3xl mx-auto w-full px-4">
          <h2 className="text-3xl font-black italic mb-6 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">PASS PREMI</h2>
          <div className="space-y-3 pb-10">
            {PASS_REWARDS.map(tier => {
              const isUnlocked = profile.xp >= tier.xpRequired;
              const isClaimed = claimedRewards.includes(tier.level);
              return (
                <div key={tier.level} className={`p-4 rounded-[1.5rem] flex items-center gap-4 border-l-4 transition-all ${isUnlocked ? 'bg-indigo-800 border-yellow-400 shadow-md' : 'bg-indigo-900 border-gray-800 opacity-40 grayscale'}`}>
                  <div className="text-xl font-black italic w-10 text-center">{tier.level}</div>
                  <div className="flex-1">
                    <p className="font-black uppercase text-xs tracking-tight">Premio Livello {tier.level}</p>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{tier.rewardType === 'coins' ? `+${tier.rewardValue} Monete` : (tier.rewardType === 'skin' ? `Skin Speciale` : 'Cassa Misteriosa')}</p>
                  </div>
                  <button 
                    disabled={!isUnlocked || isClaimed}
                    onClick={() => claimReward(tier)} 
                    className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-[0_2px_0_rgb(202,138,4)] transition-all ${isClaimed ? 'bg-green-600 text-white shadow-none' : 'bg-yellow-400 text-indigo-900 hover:brightness-110 active:scale-95'}`}
                  >
                    {isClaimed ? 'RITIRATO' : (isUnlocked ? 'RITIRA' : 'BLOCCATO')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )
    };
    return <ViewWrapper view={view} setView={setView}><Header profile={profile} setView={setView} />{ComponentMap[view]}</ViewWrapper>;
  }

  return (
    <div className="fixed inset-0 bg-indigo-900 overflow-hidden font-sans">
      {view === 'game' && (
        <GameCanvas 
          level={gameState.level} 
          activeSkinColor={SKINS.find(s => s.id === profile.activeSkinId)?.color || '#ffffff'}
          onScoreUpdate={(s, c) => setGameState(prev => ({ ...prev, score: s }))}
          onGameOver={handleGameOver}
          onLevelComplete={handleLevelComplete}
          isGameOver={gameState.isGameOver}
          multiplier={getMultiplier()}
        />
      )}

      {view === 'voice-game' && (
        <VoiceGameCanvas 
          level={gameState.level}
          activeSkinColor={SKINS.find(s => s.id === profile.activeSkinId)?.color || '#ffffff'}
          onScoreUpdate={(s, c) => setGameState(prev => ({ ...prev, score: s }))}
          onGameOver={handleGameOver}
          onLevelComplete={handleLevelComplete}
          isGameOver={gameState.isGameOver}
          useVoice={useVoice}
          multiplier={getMultiplier()}
        />
      )}

      {(view === 'game' || view === 'voice-game') && !gameState.isGameOver && (
        <div className="absolute top-6 left-6 z-10 text-white drop-shadow-lg pointer-events-none select-none">
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1 leading-none">SCORE</p>
          <span className="text-4xl font-black italic tracking-tighter leading-none">{gameState.score}</span>
        </div>
      )}

      {gameState.isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/95 backdrop-blur-xl p-6">
          <div className="bg-white p-8 rounded-[3rem] text-center shadow-2xl border-[8px] border-red-500 w-full max-w-sm">
            <h2 className="text-6xl font-black text-red-600 mb-2 italic uppercase tracking-tighter leading-none">KO!</h2>
            <div className="bg-red-50 p-4 rounded-2xl mb-6">
              <p className="text-xl font-bold text-indigo-950 italic uppercase tracking-tighter">SCORE: {gameState.score}</p>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">XP OTTENUTI: +{gameState.xpGained}</p>
            </div>
            <button 
              onClick={handleResetToHome} 
              className="w-full py-5 bg-red-500 text-white text-2xl font-black rounded-[2rem] shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-2 active:shadow-none transition-all uppercase italic"
            >
              HOME 🏠
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
