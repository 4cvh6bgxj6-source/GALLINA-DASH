
import React, { useRef, useEffect, useState } from 'react';
import { Player, Obstacle } from '../types';

interface Props {
  level: number;
  activeSkinColor: string;
  onScoreUpdate: (score: number, coins: number) => void;
  onGameOver: (score: number, coinsGained: number) => void;
  onLevelComplete: (score: number, coinsGained: number) => void;
  isGameOver: boolean;
  multiplier: number;
}

const GameCanvas: React.FC<Props> = ({ level, activeSkinColor, onScoreUpdate, onGameOver, onLevelComplete, isGameOver, multiplier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [teleportAlpha, setTeleportAlpha] = useState(0);
  
  const getScale = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const baseScale = Math.min(width / 1000, height / 800);
    return Math.max(baseScale, 0.4);
  };
  
  const scale = getScale();
  const scoreRef = useRef(0);
  const coinsCollectedRef = useRef(0);
  const distanceRef = useRef(0);
  const lastObstacleX = useRef(1200 * scale);
  const portalSpawned = useRef(false);

  const LEVEL_TARGET_DISTANCE = (5000 + (level * 2500)) * scale;

  const player = useRef<Player>({
    x: 100 * scale,
    y: 0,
    width: 45 * scale,
    height: 45 * scale,
    vy: 0,
    rotation: 0,
    isGrounded: false,
    skinColor: activeSkinColor
  });

  const obstacles = useRef<Obstacle[]>([]);

  const generateObstacle = (canvasHeight: number) => {
    if (portalSpawned.current) return;
    const s = getScale();
    const x = lastObstacleX.current + (400 * s) + (Math.random() * (450 * s) / (1 + level * 0.15));
    const groundY = canvasHeight * 0.75;

    const rand = Math.random();
    if (rand < 0.75) {
      obstacles.current.push({ x, y: groundY - (40 * s), width: 40 * s, height: 40 * s, type: 'spike' });
    } else {
      obstacles.current.push({ x, y: groundY - (140 * s) - (Math.random() * 80 * s), width: 30 * s, height: 30 * s, type: 'coin' });
    }
    lastObstacleX.current = x;
  };

  const spawnPortal = (canvasHeight: number) => {
    const s = getScale();
    const groundY = canvasHeight * 0.75;
    obstacles.current.push({ 
      x: lastObstacleX.current + (600 * s), 
      y: groundY - (220 * s), 
      width: 120 * s, 
      height: 220 * s, 
      type: 'portal' 
    });
    portalSpawned.current = true;
  };

  const update = (ctx: CanvasRenderingContext2D) => {
    if (isGameOver || isTeleporting) return;
    const s = getScale();
    const groundY = ctx.canvas.height * 0.75;
    const currentSpeed = (7.5 + (level * 1.2)) * s;

    player.current.vy += 0.85 * s;
    player.current.y += player.current.vy;

    const pw = player.current.width;
    const ph = player.current.height;

    if (player.current.y + ph > groundY) {
      player.current.y = groundY - ph;
      player.current.vy = 0;
      player.current.isGrounded = true;
      player.current.rotation = Math.round(player.current.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else { 
      player.current.rotation += 0.18; 
      player.current.isGrounded = false;
    }

    distanceRef.current += currentSpeed;
    scoreRef.current = Math.floor(distanceRef.current / (12 * s));
    onScoreUpdate(scoreRef.current, coinsCollectedRef.current);

    if (distanceRef.current >= LEVEL_TARGET_DISTANCE && !portalSpawned.current) {
      spawnPortal(ctx.canvas.height);
    }

    obstacles.current.forEach(obs => {
      obs.x -= currentSpeed;
      const buffer = 4 * s;
      if (!obs.collected && player.current.x + buffer < obs.x + obs.width - buffer && player.current.x + pw - buffer > obs.x + buffer && player.current.y + buffer < obs.y + obs.height - buffer && player.current.y + ph - buffer > obs.y + buffer) {
        if (obs.type === 'coin') {
          obs.collected = true;
          coinsCollectedRef.current += 10 * multiplier;
        } else if (obs.type === 'portal') {
          handlePortalTouch();
        } else {
          onGameOver(scoreRef.current, coinsCollectedRef.current);
        }
      }
    });

    if (obstacles.current.length < 10) generateObstacle(ctx.canvas.height);
    lastObstacleX.current -= currentSpeed;
    obstacles.current = obstacles.current.filter(o => o.x + o.width > -100);
  };

  const handlePortalTouch = () => {
    setIsTeleporting(true);
    let alpha = 0;
    const interval = setInterval(() => {
      alpha += 0.05;
      setTeleportAlpha(alpha);
      if (alpha >= 1.2) {
        clearInterval(interval);
        onLevelComplete(scoreRef.current, coinsCollectedRef.current + 100);
      }
    }, 50);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const s = getScale();
    const groundY = height * 0.75;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, groundY, width, height - groundY);

    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();

    obstacles.current.forEach(obs => {
      if (obs.collected) return;
      if (obs.type === 'spike') {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width/2, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.fill();
      } else if (obs.type === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 10 * s; ctx.shadowColor = '#fbbf24';
        ctx.beginPath(); ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'portal') {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.ellipse(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, obs.height/2, 0, 0, Math.PI*2); ctx.fill();
      }
    });

    ctx.save();
    const pw = player.current.width; const ph = player.current.height;
    ctx.translate(player.current.x + pw/2, player.current.y + ph/2);
    ctx.rotate(player.current.rotation);
    
    // Corpo Gallina
    ctx.fillStyle = player.current.skinColor;
    ctx.beginPath(); ctx.roundRect(-pw/2, -ph/2, pw, ph, 12 * s); ctx.fill(); 
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2 * s; ctx.stroke();

    // Cresta
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-pw/4, -ph/2, 6 * s, 0, Math.PI*2);
    ctx.arc(0, -ph/2, 6 * s, 0, Math.PI*2);
    ctx.arc(pw/4, -ph/2, 6 * s, 0, Math.PI*2);
    ctx.fill();

    // Becco
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(pw/2 - (2 * s), -ph/4);
    ctx.lineTo(pw/2 + (12 * s), 0);
    ctx.lineTo(pw/2 - (2 * s), ph/4);
    ctx.fill();

    // Occhio
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(pw/4, -ph/6, 3 * s, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();

    if (teleportAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${teleportAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'black';
      ctx.font = `bold ${32 * s}px Fredoka One`;
      ctx.textAlign = 'center';
      ctx.fillText("TELETRASPORTO...", width/2, height/2);
    }
  };

  const loop = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
       ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
       update(ctx); 
       draw(ctx); 
    }
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

    requestRef.current = requestAnimationFrame(loop);

    const handleAction = (e: any) => { 
      // Se è Game Over, non intercettare il tocco per permettere ai pulsanti di funzionare
      if (isGameOver || isTeleporting) return;
      if (e.type === 'touchstart') e.preventDefault();
      if (player.current.isGrounded) { 
        player.current.vy = -16 * getScale(); 
        player.current.isGrounded = false; 
      } 
    };

    window.addEventListener('mousedown', handleAction);
    window.addEventListener('touchstart', handleAction, { passive: false });
    
    return () => { 
      cancelAnimationFrame(requestRef.current!); 
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleAction); 
      window.removeEventListener('touchstart', handleAction); 
    };
  }, [isGameOver, level, isTeleporting]);

  return <canvas ref={canvasRef} className="w-full h-full block touch-none" />;
};

export default GameCanvas;
