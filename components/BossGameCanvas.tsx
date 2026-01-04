import React, { useRef, useEffect, useState } from 'react';
import { Player, Obstacle, Boss } from '../types';

interface Props {
  activeSkinColor: string;
  // Fix: Corrected parameter name 'coinsGained' (removed space that caused a syntax error)
  onGameOver: (score: number, coinsGained: number) => void;
  onVictory: (score: number, coinsGained: number) => void;
  isGameOver: boolean;
}

const BossGameCanvas: React.FC<Props> = ({ activeSkinColor, onGameOver, onVictory, isGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [victoryStage, setVictoryStage] = useState<0 | 1 | 2 | 3>(0); // 0: combat, 1: surrender, 2: choice modal, 3: final cinematic
  const [finalChoice, setFinalChoice] = useState<'morte' | 'vita' | null>(null);
  const [finalProjectileX, setFinalProjectileX] = useState<number | null>(null);
  const [teleportEffect, setTeleportEffect] = useState(0); // 0 to 1 for flash effect
  
  const getScale = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const baseScale = Math.min(width / 1100, height / 800);
    return Math.max(baseScale, 0.45);
  };

  const scale = getScale();

  const BRESCIANO_PHRASES = ["POTA!", "GNARI!", "OCIO!", "INCÙ L'È TARDE!", "FIGA!", "MA VA A CA'!", "TA PISE!"];
  const SURRENDER_PHRASE = "ORCA CAN! FERMET GNARO... ME ARRENDO!";
  const MORTE_INSULT = "ALURA TE SE' 'N BALOSS! P...!";
  const VITA_THANKS = "BRAO GNARO! SOM AMIS, ANDOMA A BE' 'NA BIRRA!";

  const player = useRef<Player>({
    x: 80 * scale,
    y: window.innerHeight / 2,
    width: 50 * scale, // Ridotta dimensione
    height: 50 * scale,
    vy: 0,
    rotation: 0,
    isGrounded: false,
    skinColor: activeSkinColor,
    hp: 100
  });

  const boss = useRef<Boss>({
    x: window.innerWidth - (280 * scale),
    y: 100,
    width: 150 * scale, // Ridotta dimensione
    height: 150 * scale,
    hp: 200,
    maxHp: 200,
    phrase: "POTA!",
    direction: 1
  });

  const projectiles = useRef<Obstacle[]>([]);
  const bossProjectiles = useRef<Obstacle[]>([]);
  const lastBossShot = useRef(0);
  const lastPhraseTime = useRef(0);
  const timerRef = useRef<number | null>(null);

  const startTeleport = (score: number, coins: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      setTeleportEffect(progress);
      if (progress >= 1.2) {
        clearInterval(interval);
        onVictory(score, coins);
      }
    }, 50);
  };

  const shoot = () => {
    if (isGameOver || victoryStage > 0) return;
    const s = getScale();
    projectiles.current.push({
      x: player.current.x + player.current.width,
      y: player.current.y + player.current.height / 2,
      width: 30 * s,
      height: 12 * s,
      type: 'bullet',
      vx: 18 * s
    });
  };

  const handleChoice = (choice: 'morte' | 'vita') => {
    setFinalChoice(choice);
    setVictoryStage(3);
    
    if (choice === 'morte') {
      setFinalProjectileX(player.current.x + player.current.width);
      boss.current.phrase = "NOOO! FERMET!";
      timerRef.current = window.setTimeout(() => {
        boss.current.phrase = MORTE_INSULT;
        timerRef.current = window.setTimeout(() => {
          startTeleport(2000, 300);
        }, 1500);
      }, 1500);
    } else {
      boss.current.phrase = VITA_THANKS;
      timerRef.current = window.setTimeout(() => {
        startTeleport(4000, 1500);
      }, 2500);
    }
  };

  const update = (ctx: CanvasRenderingContext2D) => {
    if (isGameOver) return;
    const { width, height } = ctx.canvas;
    const s = getScale();

    if (victoryStage === 0) {
      boss.current.x = width - boss.current.width - (40 * s);
      boss.current.y += boss.current.direction * (4.0 * s);
      if (boss.current.y < (40 * s) || boss.current.y > height - (boss.current.height + 40 * s)) {
        boss.current.direction *= -1;
      }

      if (Date.now() - lastPhraseTime.current > 3000) {
        boss.current.phrase = BRESCIANO_PHRASES[Math.floor(Math.random() * BRESCIANO_PHRASES.length)];
        lastPhraseTime.current = Date.now();
      }

      if (Date.now() - lastBossShot.current > 1500) {
        bossProjectiles.current.push({
          x: boss.current.x,
          y: boss.current.y + boss.current.height / 2,
          width: 35 * s,
          height: 35 * s,
          type: 'boss_projectile',
          vx: -10 * s,
          vy: (Math.random() - 0.5) * (7 * s)
        });
        lastBossShot.current = Date.now();
      }
    } else if (victoryStage === 1 || victoryStage === 2) {
      boss.current.x = (width - boss.current.width - (40 * s)) + (Math.random() - 0.5) * 6;
    } else if (victoryStage === 3 && finalChoice === 'morte' && finalProjectileX !== null) {
      setFinalProjectileX(prev => {
        if (prev === null) return null;
        const nextX = prev + (30 * s);
        if (nextX >= boss.current.x + boss.current.width / 3) {
            return null;
        }
        return nextX;
      });
    }

    projectiles.current.forEach((p, index) => {
      p.x += p.vx || 0;
      if (victoryStage === 0 && p.x > boss.current.x && p.x < boss.current.x + boss.current.width && p.y > boss.current.y && p.y < boss.current.y + boss.current.height) {
        boss.current.hp -= 10;
        projectiles.current.splice(index, 1);
        if (boss.current.hp <= 0) {
          boss.current.hp = 0;
          setVictoryStage(1);
          boss.current.phrase = SURRENDER_PHRASE;
          timerRef.current = window.setTimeout(() => {
            setVictoryStage(2);
          }, 2500);
        }
      }
    });

    bossProjectiles.current.forEach((p, index) => {
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      const buffer = 6 * s;
      if (p.x < player.current.x + player.current.width - buffer && p.x + p.width > player.current.x + buffer && p.y < player.current.y + player.current.height - buffer && p.y + p.height > player.current.y + buffer) {
        if (victoryStage === 0) {
          player.current.hp! -= 15;
          bossProjectiles.current.splice(index, 1);
          if (player.current.hp! <= 0) {
            onGameOver(500, 50);
          }
        }
      }
    });

    projectiles.current = projectiles.current.filter(p => p.x < width + 100);
    bossProjectiles.current = bossProjectiles.current.filter(p => p.x > -100);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const s = getScale();
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for(let i=0; i<width; i+=80*s) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for(let i=0; i<height; i+=80*s) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    if (victoryStage < 3 || finalChoice === 'vita' || (finalChoice === 'morte' && finalProjectileX !== null)) {
      ctx.save();
      if (victoryStage >= 1) ctx.globalAlpha = 0.9;
      ctx.fillStyle = finalChoice === 'vita' ? '#22c55e' : '#dc2626'; 
      ctx.beginPath(); ctx.roundRect(boss.current.x, boss.current.y, boss.current.width, boss.current.height, 15 * s); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(boss.current.x + (10 * s), boss.current.y - (20 * s), boss.current.width - (20 * s), 30 * s);
      ctx.fillStyle = 'white'; ctx.font = `bold ${28 * s}px Fredoka One`;
      ctx.textAlign = 'right';
      ctx.shadowBlur = 4; ctx.shadowColor = 'black';
      ctx.fillText(boss.current.phrase, boss.current.x - (15 * s), boss.current.y + (30 * s));
      ctx.shadowBlur = 0;
      if (victoryStage === 0) {
        ctx.fillStyle = 'black'; ctx.fillRect(boss.current.x, boss.current.y - (15 * s), boss.current.width, 8 * s);
        ctx.fillStyle = '#ff0000'; ctx.fillRect(boss.current.x, boss.current.y - (15 * s), boss.current.width * (boss.current.hp / boss.current.maxHp), 8 * s);
      }
      ctx.restore();
    } else if (victoryStage === 3 && finalChoice === 'morte' && finalProjectileX === null) {
      const explosionSize = (Date.now() % 300) / 300 * 400 * s;
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(boss.current.x + boss.current.width/2, boss.current.y + boss.current.height/2, explosionSize, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.font = `bold ${35 * s}px Fredoka One`; ctx.textAlign='center';
      ctx.fillText(boss.current.phrase, boss.current.x + boss.current.width/2, boss.current.y - 30 * s);
    }

    if (finalProjectileX !== null) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 20 * s; ctx.shadowColor = '#f59e0b';
        ctx.fillRect(finalProjectileX, player.current.y + player.current.height/2, 50 * s, 15 * s);
        ctx.shadowBlur = 0;
    }

    if (finalChoice === 'vita' && victoryStage === 3) {
        const bounce = Math.sin(Date.now()/120) * 15;
        ctx.font = `${70 * s}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText("🐔🤝🐗", width/2, height/2 - (80*s) + bounce);
    }

    ctx.save();
    ctx.translate(player.current.x + player.current.width/2, player.current.y + player.current.height/2);
    ctx.fillStyle = player.current.skinColor;
    ctx.beginPath(); ctx.roundRect(-player.current.width/2, -player.current.height/2, player.current.width, player.current.height, 8 * s); ctx.fill();
    if (!(finalChoice === 'vita' && victoryStage === 3)) {
        ctx.fillStyle = '#374151'; ctx.fillRect(15 * s, -8 * s, 50 * s, 18 * s); 
    }
    ctx.restore();

    // UI Salute
    ctx.fillStyle = 'black'; ctx.fillRect(20 * s, height - (40 * s), 150 * s, 14 * s);
    ctx.fillStyle = '#10b981'; ctx.fillRect(20 * s, height - (40 * s), (150 * s) * (player.current.hp! / 100), 14 * s);

    projectiles.current.forEach(p => { 
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    bossProjectiles.current.forEach(p => { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill(); });

    if (victoryStage === 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,width,height);
      ctx.fillStyle = 'white'; ctx.font = `bold ${40 * s}px Fredoka One`; ctx.textAlign = 'center';
      ctx.fillText(finalChoice === 'morte' ? "GIUSTIZIA FATTA! 💣" : "EROE DEL POLLAIO! 🤝", width/2, height/2);
      ctx.font = `bold ${18 * s}px Fredoka One`;
      ctx.fillText("Teletrasporto in corso...", width/2, height/2 + 50 * s);
      
      if (teleportEffect > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${teleportEffect})`;
        ctx.fillRect(0,0,width,height);
      }
    }
  };

  const loop = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { update(ctx); draw(ctx); }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const moveAction = (e: any) => {
        const clientY = e.clientY || (e.touches ? e.touches[0].clientY : player.current.y);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const y = clientY - rect.top;
            player.current.y = Math.max(30, Math.min(window.innerHeight - (player.current.height + 30), y - player.current.height / 2));
        }
    };
    const shootAction = (e: any) => { if (victoryStage === 0) shoot(); };

    window.addEventListener('mousemove', moveAction);
    window.addEventListener('touchmove', (e) => { e.preventDefault(); moveAction(e); }, { passive: false });
    window.addEventListener('mousedown', shootAction);
    window.addEventListener('touchstart', (e) => { e.preventDefault(); shootAction(e); }, { passive: false });

    requestRef.current = requestAnimationFrame(loop);
    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', moveAction);
        window.removeEventListener('touchmove', moveAction);
        window.removeEventListener('mousedown', shootAction);
        window.removeEventListener('touchstart', shootAction);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isGameOver, victoryStage]);

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col items-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      
      {victoryStage === 2 && (
        <div className="relative z-50 flex flex-col items-center justify-center h-full w-full bg-black/75 backdrop-blur-xl animate-in fade-in zoom-in p-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-[8px] border-yellow-400 text-center max-w-xs sm:max-w-md">
            <h2 className="text-3xl sm:text-4xl font-black text-indigo-950 uppercase italic mb-4 leading-tight">IL BOSS È ALLE STRETTE!</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">COSA VUOI FARE CON LUI, GNARO?</p>
            <div className="flex flex-col gap-5">
               <button 
                 onClick={() => handleChoice('morte')}
                 className="py-6 bg-red-600 text-white rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none uppercase italic tracking-tighter"
               >
                 SPARALO IN FRONTE 💣
               </button>
               <button 
                 onClick={() => handleChoice('vita')}
                 className="py-6 bg-green-500 text-white rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none uppercase italic tracking-tighter"
               >
                 SALVALO 🤝
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BossGameCanvas;