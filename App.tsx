
import React, { useState, useEffect, useCallback } from 'react';
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

const Navigation: React.FC<{ view: string; setView: (v: any) => void }> = ({ view, setView }) => {
  const handleNav = (target: any, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setView(target);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-28 bg-indigo-950/95 backdrop-blur-2xl flex justify-center items-center gap-6 z-[9999] border-t-2 border-white/5 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)] px-4">
       <button onPointerDown={(e) => handleNav('dashboard', e)} className={`text-3xl p-3 transition-all active:scale-90 ${view === 'dashboard' ? 'scale-125 brightness-150' : 'opacity-30 grayscale'}`}>🏠</button>
       <button onPointerDown={(e) => handleNav('worlds', e)} className={`text-3xl p-3 transition-all active:scale-90 ${view === 'worlds' ? 'scale-125 brightness-150' : 'opacity-30 grayscale'}`}>🌍</button>
       <button onPointerDown={(e) => handleNav('skins', e)} className={`text-3xl p-3 transition-all active:scale-90 ${view === 'skins' ? 'scale-125 brightness-150' : 'opacity-30 grayscale'}`}>🎭</button>
       <button onPointerDown={(e) => handleNav('shop', e)} className={`text-3xl p-3 transition-all active:scale-90 ${view === 'shop' ? 'scale-125 brightness-150' : 'opacity-30 grayscale'}`}>👑</button>
       <button onPointerDown={(e) => handleNav('pass', e)} className={`text-3xl p-3 transition-all active:scale-90 ${view === 'pass' ? 'scale-125 brightness-150' : 'opacity-30 grayscale'}`}>🎫</button>
    </nav>
  );
};

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
    <header className="flex flex-col gap-2 mb-6 max-w-4xl mx-auto w-full px-4 pt-4 shrink-0 pointer-events-auto">
      <div className="flex justify-between items-center">
        <div className="overflow-hidden flex-1">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest truncate">GALLINA MASTER</p>
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-black italic tracking-tighter truncate max-w-[140px] sm:max-w-full ${getNameStyle()}`} style={!getNameStyle() ? { color: profile.nameColor || '#ffffff' } : {}}>
              {profile.username}
            </h2>
            <button 
              onPointerDown={(e) => { e.stopPropagation(); setView('profile'); }}
              className="bg-yellow-400 text-indigo-950 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-yellow-500 transition-all shadow-[0_3px_0_rgb(180,130,0)] active:translate-y-0.5 active:shadow-none"
            >
              🎨 EDIT
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${profile.tier === 'VIP' ? 'text-yellow-400' : profile.tier === 'Premium' ? 'text-cyan-400' : 'text-gray-400'}`}>{profile.tier}</span>
            {multiplier > 1 && (
               <p className={`text-[9px] font-bold uppercase tracking-widest ${profile.tier === 'VIP' ? 'text-yellow-500 animate-pulse' : 'text-cyan-500'}`}>
                 • {multiplier}X 🚀
               </p>
            )}
          </div>
        </div>
        <div className="bg-indigo-900/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shrink-0 ml-4 shadow-lg">
          <span className="text-yellow-400 text-xl font-bold">🪙</span>
          <span className="text-xl font-black text-white">{profile.coins}</span>
        </div>
      </div>
      <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
        <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-tighter mix-blend-difference text-white">
          PASS LVL: {PASS_REWARDS.filter(t => t.xpRequired <= profile.xp).length} • {profile.xp} XP
        </span>
      </div>
    </header>
  );
};

const ViewWrapper: React.FC<{ children: React.ReactNode; view: string; setView: (v: any) => void }> = ({ children, view, setView }) => (
  <div className="fixed inset-0 bg-indigo-950 text-white flex flex-col overflow-y-auto pb-44 z-[9000]">
    <div className="max-w-4xl mx-auto w-full px-4 pt-6 shrink-0 flex items-center">
       <button 
         onPointerDown={(e) => { e.preventDefault(); setView('dashboard'); }} 
         className="bg-white/10 px-5 py-3 rounded-2xl text-xs font-black uppercase italic tracking-tighter border-b-4 border-black/40 hover:bg-white/20 active:translate-y-1 transition-all flex items-center gap-2 shadow-xl"
       >
         ⬅️ ESCI
       </button>
    </div>
    <div className="pointer-events-auto">
      {children}
    </div>
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

  const getAccounts = () => {
    try {
        return JSON.parse(localStorage.getItem('gallina_accounts') || '{}');
    } catch(e) {
        return {};
    }
  };
  
  const saveAccount = useCallback((p: UserProfile, currentLevel?: number) => {
    if (!p.username) return;
    const accounts = getAccounts();
    accounts[p.username.toLowerCase().trim()] = { 
        ...p, 
        claimedRewards, 
        level: currentLevel || gameState.level 
    };
    localStorage.setItem('gallina_accounts', JSON.stringify(accounts));
  }, [claimedRewards, gameState.level]);

  useEffect(() => {
    if (view === 'login') {
      const accounts = getAccounts();
      const name = profile.username.toLowerCase().trim();
      const exists = !!accounts[name];
      setUserExistsInStorage(exists && name.length > 0);
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
    }

    setProfile(userProfile);
    saveAccount(userProfile);
    setView('dashboard');
  };

  useEffect(() => {
    if (profile.username && view !== 'login' && view !== 'game' && view !== 'voice-game') {
        saveAccount(profile);
    }
  }, [profile, claimedRewards, view, saveAccount]);

  const getMultiplier = () => (profile.tier === 'VIP' ? 3 : (profile.tier === 'Premium' ? 2 : 1));

  const handleGameOver = (finalScore: number, finalCoins: number) => {
    const m = getMultiplier();
    const gainedXP = Math.floor((finalScore / 2) * m);
    const newCoins = profile.coins + (finalCoins * m);
    const newXP = profile.xp + gainedXP;
    
    setProfile(p => ({ ...p, coins: newCoins, xp: newXP }));
    setGameState(prev => ({ ...prev, isGameOver: true, score: finalScore, xpGained: gainedXP }));
    
    // Forza salvataggio immediato
    saveAccount({ ...profile, coins: newCoins, xp: newXP });
  };

  const handleLevelComplete = async (finalScore: number, finalCoins: number) => {
    const m = getMultiplier();
    const currentLevel = gameState.level;
    const gainedXP = Math.floor(((finalScore / 1.2) + (currentLevel * 400)) * m);
    const newCoins = profile.coins + (finalCoins * m);
    const newXP = profile.xp + gainedXP;
    
    setProfile(p => ({ ...p, coins: newCoins, xp: newXP }));
    setGameState(prev => ({ ...prev, score: finalScore, xpGained: gainedXP, level: prev.level + 1 }));
    
    saveAccount({ ...profile, coins: newCoins, xp: newXP }, currentLevel + 1);
    
    const flavor = await getLevelFlavorText(currentLevel);
    setLevelUpData(flavor);
    setView('levelUp');
  };

  const handleResetToHome = (e?: React.PointerEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    saveAccount(profile);
    setGameState(prev => ({ ...prev, score: 0, isGameOver: false, xpGained: 0 }));
    setView('dashboard');
  };

  const equipOrBuySkin = (skin: Skin) => {
    if (profile.tier === 'VIP') {
       setProfile(p => ({ ...p, activeSkinId: skin.id }));
       return;
    }
    if (skin.requirement === 'VIP' && profile.tier !== 'VIP') {
      alert("⚠️ RISERVATO VIP!");
      return;
    }
    if (skin.requirement === 'Premium' && profile.tier === 'Normal') {
      alert("⚠️ RISERVATO PREMIUM!");
      return;
    }
    if (skin.requirement === 'Pass' && !profile.unlockedSkins.includes(skin.id)) {
      alert("⚠️ SBLOCCALO NEL PASS!");
      return;
    }
    if (profile.unlockedSkins.includes(skin.id)) {
      setProfile(p => ({ ...p, activeSkinId: skin.id }));
      return;
    }
    if (profile.coins >= skin.price) {
      if (confirm(`Sblocca ${skin.name} per ${skin.price} 🪙?`)) {
        setProfile(p => ({
          ...p,
          coins: p.coins - skin.price,
          unlockedSkins: [...p.unlockedSkins, skin.id],
          activeSkinId: skin.id
        }));
      }
    } else {
      alert("🪙 MONETE INSUFFICIENTI!");
    }
  };

  const upgradeTier = (tier: UserTier) => {
    const prices = { Normal: 0, Premium: 5000, VIP: 10000 };
    const price = prices[tier];
    if (profile.coins >= price) {
      if (confirm(`Passa a ${tier} per ${price} 🪙?`)) {
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
      alert("MONETE INSUFFICIENTI!");
    }
  };

  const claimReward = (tier: PassTier) => {
    if (claimedRewards.includes(tier.level)) return;
    if (profile.xp < tier.xpRequired) {
      alert("XP INSUFFICIENTI!");
      return;
    }

    setClaimedRewards(prev => [...prev, tier.level]);

    if (tier.rewardType === 'coins') {
      setProfile(p => ({ ...p, coins: p.coins + tier.rewardValue }));
    } else if (tier.rewardType === 'skin') {
      setProfile(p => ({ ...p, unlockedSkins: Array.from(new Set([...p.unlockedSkins, tier.rewardValue])) }));
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

  if (view === 'login') {
    return (
      <div className="fixed inset-0 bg-indigo-900 flex items-center justify-center p-4 overflow-y-auto z-[9999]">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center border-b-[12px] border-indigo-200 my-auto">
          <h1 className="text-4xl font-black text-indigo-900 mb-2 italic uppercase tracking-tighter">GALLINA DASH</h1>
          <div className="text-8xl mb-6 animate-bounce">🐔</div>
          <div className="space-y-6 mb-8 text-left">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 tracking-widest">USERNAME</p>
              <input 
                type="text" 
                placeholder="Nome Gallina..." 
                className="w-full p-5 border-4 border-indigo-50 rounded-[1.8rem] text-xl font-black text-indigo-950 focus:border-yellow-400 outline-none transition-all shadow-inner"
                value={profile.username}
                onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))}
              />
              {profile.username.trim().length > 0 && (
                <div className={`flex items-center gap-2 ml-4 mt-3 ${userExistsInStorage ? 'text-green-600' : 'text-indigo-400'}`}>
                   <span className="text-xs">✨</span>
                   <p className="text-[11px] font-black uppercase tracking-tight">
                    {userExistsInStorage ? 'Account salvato trovato!' : 'Nuovo account in creazione'}
                   </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-300 ml-4 mb-2 tracking-widest">CODICE SEGRETO</p>
              <input 
                type="text" 
                placeholder="Optional code..." 
                className="w-full p-4 border-4 border-indigo-50 border-dashed rounded-2xl text-sm font-black focus:border-indigo-400 outline-none transition-all shadow-inner italic"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
            </div>
          </div>
          <button 
            disabled={!profile.username}
            onPointerDown={handleLogin}
            className="w-full py-6 bg-yellow-400 text-indigo-950 text-3xl font-black rounded-3xl hover:bg-yellow-500 transition-all shadow-[0_10px_0_rgb(202,138,4)] uppercase italic active:translate-y-2 active:shadow-none"
          >
            VAI! 🚀
          </button>
        </div>
      </div>
    );
  }

  if (view === 'chest-opening') {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center p-6 z-[9999] text-center overflow-hidden">
        {chestOpeningState.phase === 'closed' && (
          <div className="animate-pulse space-y-4">
            <div className="text-9xl">🎁</div>
            <h2 className="text-3xl font-black uppercase italic text-yellow-400">ARRIVA IL PREMIO...</h2>
          </div>
        )}
        {chestOpeningState.phase === 'opening' && (
          <div className="animate-chest-shake space-y-4">
            <div className="text-[12rem]">🎁</div>
            <h2 className="text-4xl font-black uppercase italic text-white drop-shadow-lg">APERTURA!</h2>
          </div>
        )}
        {chestOpeningState.phase === 'revealed' && (
          <div className="animate-float-up flex flex-col items-center max-w-sm">
            <div className="text-[10rem] mb-4">✨</div>
            <h2 className="text-2xl font-black uppercase text-yellow-500 italic tracking-tighter mb-4">{chestOpeningState.data?.chestName || 'CASSA DEL POLLAIO'}</h2>
            <div className="bg-white p-10 rounded-[3.5rem] border-[10px] border-yellow-400 text-indigo-950 shadow-2xl space-y-6 w-full">
              <p className="text-6xl font-black italic">+{chestOpeningState.coins} 🪙</p>
              <p className="text-sm font-bold text-gray-500 italic leading-tight">"{chestOpeningState.data?.message || 'Grande fortuna!'}"</p>
              <button 
                onPointerDown={() => setView('pass')}
                className="w-full py-6 bg-indigo-950 text-white rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(30,27,75)] active:translate-y-1 active:shadow-none uppercase italic"
              >
                CHIUDI 🐔
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="fixed inset-0 bg-indigo-950 text-white flex flex-col overflow-y-auto pb-48 z-[8000]">
        <Header profile={profile} setView={setView} />
        <div className="max-w-4xl mx-auto w-full px-4 space-y-8 text-center pointer-events-auto">
          <div className="bg-red-500 text-white py-2 rounded-full font-black text-[11px] uppercase tracking-widest mb-[-2rem] z-10 relative inline-block px-8 border-2 border-white shadow-lg">
            TAPPA {gameState.level}
          </div>
          
          <button 
            onPointerDown={(e) => { e.preventDefault(); setUseVoice(false); setView('game'); }} 
            className="w-full bg-yellow-400 text-indigo-950 py-12 rounded-[3rem] flex flex-col items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_0_rgb(202,138,4)] border-2 border-white/20 group"
          >
            <span className="text-7xl mb-2 group-hover:rotate-12 transition-transform">⚡</span>
            <span className="text-4xl font-black uppercase italic tracking-tighter leading-none">GIOCA ORA</span>
          </button>

          <div className="grid grid-cols-2 gap-5">
             <div onPointerDown={() => setView('worlds')} className="bg-indigo-900/60 p-6 rounded-[2rem] border-b-8 border-indigo-900 flex flex-col items-center gap-2 cursor-pointer active:translate-y-1 transition-all">
              <span className="text-4xl">🌍</span>
              <span className="font-black uppercase italic text-[11px] tracking-widest">Mappe</span>
            </div>
            <div onPointerDown={() => setView('skins')} className="bg-indigo-900/60 p-6 rounded-[2rem] border-b-8 border-indigo-900 flex flex-col items-center gap-2 cursor-pointer active:translate-y-1 transition-all">
              <span className="text-4xl">🎭</span>
              <span className="font-black uppercase italic text-[11px] tracking-widest">Skins</span>
            </div>
          </div>
        </div>
        <Navigation view={view} setView={setView} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-indigo-900 overflow-hidden font-sans select-none">
      <div className={`absolute inset-0 transition-opacity duration-300 ${gameState.isGameOver ? 'pointer-events-none opacity-50' : 'pointer-events-auto opacity-100'}`}>
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
      </div>

      {(view === 'game' || view === 'voice-game') && !gameState.isGameOver && (
        <div className="absolute top-8 left-8 z-10 text-white drop-shadow-2xl pointer-events-none">
          <p className="text-[11px] font-black text-yellow-400 uppercase tracking-widest mb-1">SCORE</p>
          <span className="text-5xl font-black italic tracking-tighter">{gameState.score}</span>
        </div>
      )}

      {gameState.isGameOver && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-indigo-950/90 backdrop-blur-xl p-8 pointer-events-auto">
          <div className="bg-white p-10 rounded-[3.5rem] text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] border-[10px] border-red-500 w-full max-w-sm">
            <h2 className="text-7xl font-black text-red-600 mb-2 italic uppercase tracking-tighter">KO!</h2>
            <div className="bg-red-50 p-6 rounded-3xl mb-8 border-2 border-red-100">
              <p className="text-2xl font-black text-indigo-950 italic uppercase">PUNTI: {gameState.score}</p>
              <p className="text-sm font-black text-red-500 uppercase tracking-widest mt-1">XP: +{gameState.xpGained}</p>
            </div>
            <button 
              onPointerDown={handleResetToHome} 
              className="w-full py-6 bg-red-600 text-white text-3xl font-black rounded-3xl shadow-[0_10px_0_rgb(153,27,27)] active:translate-y-2 active:shadow-none transition-all uppercase italic"
            >
              HOME 🏠
            </button>
          </div>
        </div>
      )}

      {(view === 'worlds' || view === 'skins' || view === 'shop' || view === 'pass' || view === 'profile' || view === 'levelUp') && (
        <div className="z-[9000]">
           {view === 'profile' ? (
             <ViewWrapper view={view} setView={setView}>
               <Header profile={profile} setView={setView} />
               <div className="max-w-4xl mx-auto w-full px-6 space-y-8">
                 <h2 className="text-3xl font-black italic mb-2 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">STILE NOME</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-10">
                   {NAME_COLORS.map(c => {
                     const isLocked = (c.tier === 'Premium' && profile.tier === 'Normal') || (c.tier === 'VIP' && profile.tier !== 'VIP');
                     return (
                       <div 
                         key={c.id} 
                         // Added type cast to UserTier to fix TypeScript error on line 591
                         onPointerDown={() => upgradeTier(c.tier as UserTier)}
                         className={`bg-indigo-900/50 p-6 rounded-[2.5rem] border-4 transition-all cursor-pointer flex flex-col items-center gap-2 ${profile.nameColor === c.value ? 'border-yellow-400 scale-105 bg-indigo-900' : 'border-transparent'} ${isLocked ? 'opacity-30 grayscale' : ''}`}
                       >
                         <div className={`w-14 h-14 rounded-full border-2 border-white/20 ${c.value === 'rainbow' ? 'name-rainbow' : (c.value === 'metallic-purple' ? 'bg-purple-400 shadow-[0_0_20px_purple]' : '')}`} style={c.value !== 'rainbow' && c.value !== 'metallic-purple' ? { backgroundColor: c.value } : {}} />
                         <p className="font-black text-[10px] uppercase tracking-widest">{c.name}</p>
                       </div>
                     );
                   })}
                 </div>
               </div>
             </ViewWrapper>
           ) : view === 'levelUp' ? (
             <div className="fixed inset-0 bg-indigo-950 flex items-center justify-center p-8 z-[10000]">
                <div className="bg-white p-10 rounded-[4rem] text-center shadow-2xl border-[15px] border-yellow-400 w-full max-w-lg animate-in zoom-in">
                  <div className="text-7xl mb-4">🏆</div>
                  <h2 className="text-5xl font-black text-indigo-950 mb-4 italic uppercase tracking-tighter leading-none">LIVELLO VINTO!</h2>
                  <div className="bg-yellow-50 p-6 rounded-[2.5rem] mb-8 space-y-3 border-2 border-yellow-100">
                    <p className="text-4xl font-black text-yellow-600">+{gameState.xpGained} XP</p>
                    <p className="text-sm font-bold text-gray-500 italic">"{levelUpData?.encouragement || 'Mito!'}"</p>
                  </div>
                  <div className="flex flex-col gap-5">
                    <button onPointerDown={startNextLevel} className="w-full py-7 bg-yellow-400 text-indigo-950 text-3xl font-black rounded-[2.5rem] shadow-[0_12px_0_rgb(202,138,4)] active:translate-y-2 uppercase italic">LIVELLO {gameState.level} 🚀</button>
                    <button onPointerDown={handleResetToHome} className="w-full py-5 bg-indigo-950 text-white text-xl font-black rounded-3xl shadow-[0_8px_0_rgb(30,27,75)] uppercase italic opacity-70">MENU 🏠</button>
                  </div>
                </div>
             </div>
           ) : (
             <ViewWrapper view={view} setView={setView}>
               <Header profile={profile} setView={setView} />
               {view === 'worlds' && (
                 <div className="max-w-4xl mx-auto w-full px-6 space-y-8">
                   <h2 className="text-3xl font-black italic mb-2 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">MAPPE MONDO</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-10">
                     <div onPointerDown={() => setShowVoicePrompt(true)} className="bg-gradient-to-br from-green-600 to-green-800 p-10 rounded-[3rem] border-4 border-yellow-400 shadow-2xl relative overflow-hidden active:scale-95 transition-all">
                        <div className="relative z-10 flex flex-col items-start gap-3">
                          <span className="text-6xl">🎙️</span>
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter">VOCE DASH</h3>
                          <p className="text-xs font-bold text-green-100 uppercase tracking-widest">MAPPA SPECIALE • LIVE {gameState.level}</p>
                        </div>
                        <div className="absolute -right-6 -bottom-6 opacity-10 text-[12rem] rotate-12">🐔</div>
                     </div>
                     <div className="bg-indigo-900/40 p-10 rounded-[3rem] border-4 border-white/5 shadow-xl relative overflow-hidden grayscale opacity-40">
                        <div className="relative z-10 flex flex-col items-start gap-3">
                          <span className="text-6xl">🌋</span>
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter">VULCANO</h3>
                          <p className="text-xs font-black bg-red-600 px-4 py-1.5 rounded-full text-white uppercase tracking-widest">PRESTO!</p>
                        </div>
                     </div>
                   </div>
                 </div>
               )}
               {view === 'skins' && (
                 <div className="max-w-4xl mx-auto w-full px-6">
                   <h2 className="text-3xl font-black italic mb-8 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">ARMADIO</h2>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-12">
                     {SKINS.map(skin => (
                       <div key={skin.id} onPointerDown={() => equipOrBuySkin(skin)} className={`bg-indigo-900/60 p-6 rounded-[2.5rem] text-center border-4 transition-all cursor-pointer relative ${profile.activeSkinId === skin.id ? 'border-yellow-400 scale-105 bg-indigo-900' : 'border-transparent active:scale-95'}`}>
                         <div className="w-20 h-20 mx-auto rounded-3xl mb-3 flex items-center justify-center border-2 border-white/10" style={{ background: skin.color }}>
                            <span className="text-4xl">🐔</span>
                         </div>
                         <p className="font-black text-[10px] uppercase tracking-widest text-white truncate">{skin.name}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
               {view === 'shop' && (
                  <div className="max-w-4xl mx-auto w-full px-6 space-y-10">
                    <h2 className="text-3xl font-black italic mb-2 uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">VIP PASS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                      <div className={`p-10 rounded-[3.5rem] border-4 shadow-2xl flex flex-col items-center transition-all ${profile.tier !== 'Normal' ? 'opacity-30 grayscale' : 'bg-indigo-900 border-cyan-500 active:scale-95'}`}>
                        <span className="text-7xl mb-6">🎫</span>
                        <h3 className="text-3xl font-black uppercase italic text-cyan-400 mb-6">PREMIUM</h3>
                        <button onPointerDown={() => upgradeTier('Premium')} className="w-full py-6 bg-yellow-400 text-indigo-950 rounded-[2rem] font-black text-2xl uppercase shadow-[0_8px_0_rgb(202,138,4)]">5000 🪙</button>
                      </div>
                      <div className={`p-10 rounded-[3.5rem] border-4 shadow-2xl flex flex-col items-center transition-all ${profile.tier === 'VIP' ? 'opacity-30 grayscale' : 'bg-gradient-to-br from-indigo-800 to-indigo-700 border-yellow-500 active:scale-95'}`}>
                        <span className="text-7xl mb-6">👑</span>
                        <h3 className="text-3xl font-black uppercase italic text-yellow-400 mb-6">VIP</h3>
                        <button onPointerDown={() => upgradeTier('VIP')} className="w-full py-6 bg-yellow-400 text-indigo-950 rounded-[2rem] font-black text-2xl uppercase shadow-[0_8px_0_rgb(202,138,4)]">10000 🪙</button>
                      </div>
                    </div>
                  </div>
               )}
             </ViewWrapper>
           )}
        </div>
      )}

      {showVoicePrompt && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-8">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-[12px] border-yellow-400 text-center max-w-sm animate-in zoom-in">
            <h2 className="text-4xl font-black text-indigo-950 uppercase italic mb-6 leading-tight">USA IL MICROFONO?</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-10">URLA PER SALTARE O GIOCA CLASSICO!</p>
            <div className="flex flex-col gap-5">
              <button onPointerDown={() => handleStartGameMode('voice')} className="w-full py-6 bg-green-500 text-white rounded-3xl font-black text-3xl shadow-[0_10px_0_rgb(21,128,61)] uppercase italic">SÌ! 🎙️</button>
              <button onPointerDown={() => handleStartGameMode('classic')} className="w-full py-5 bg-indigo-100 text-indigo-900 rounded-3xl font-black text-2xl shadow-[0_6px_0_rgb(199,210,254)] uppercase italic">NO 👆</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
