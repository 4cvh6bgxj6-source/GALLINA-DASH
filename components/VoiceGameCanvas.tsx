
import React, { useRef, useEffect, useState } from 'react';
import { Player, Obstacle } from '../types';

interface Props {
  level: number;
  activeSkinColor: string;
  onScoreUpdate: (score: number, coins: number) => void;
  onGameOver: (score: number, coinsGained: number) => void;
  onLevelComplete: (score: number, coinsGained: number) => void;
  isGameOver: boolean;
  useVoice: boolean;
  multiplier: number;
}

const VoiceGameCanvas: React.FC<Props> = ({ level, activeSkinColor, onScoreUpdate, onGameOver, onLevelComplete, isGameOver, useVoice, multiplier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [teleportAlpha, setTeleportAlpha] = useState(0);
  
  const getScale = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const baseScale = Math.min(width / 1000, height / 800);
    return Math.max(baseScale, 0.45);
  };

  const scale = getScale();
  const JUMP_FORCE = -15 * scale;
  const BASE_SPEED = (7.0 + (level * 0.5)) * scale;
  const GROUND_Y_RATIO = 0.75;
  const LEVEL_TARGET_DISTANCE = (6000 + (level * 2000)) * scale;
  const VOICE_THRESHOLD = 45; 

  const scoreRef = useRef(0);
  const coinsCollectedRef = useRef(0);
  const distanceRef = useRef(0);
  const lastObstacleX = useRef(1200 * scale);
  const portalSpawned = useRef(false);

  const player = useRef<Player>({
    x: 120 * scale,
    y: 0,
    width: 45 * scale,
    height: 45 * scale,
    vy: 0,
    rotation: 0,
    isGrounded: false,
    skinColor: activeSkinColor
  });

  const obstacles = useRef<Obstacle[]>([]);

  useEffect(() => {
    if (!useVoice) return;
    
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        setMicActive(true);
      } catch (err) {
        setMicActive(false);
      }
    };
    startMic();
    return () => { if (audioContextRef.current) audioContextRef.current.close(); };
  }, [useVoice]);

  const jump = () => {
    if (player.current.isGrounded && !isGameOver && !isTeleporting) {
      player.current.vy = JUMP_FORCE;
      player.current.isGrounded = false;
    }
  };

  const generateObstacle = (canvasHeight: number) => {
    if (portalSpawned.current) return;
    const s = getScale();
    const x = lastObstacleX.current + (500 * s) + Math.random() * (400 * s);
    const groundY = canvasHeight * GROUND_Y_RATIO;
    const rand = Math.random();
    if (rand < 0.7) {
      obstacles.current.push({ x, y: groundY - (40 * s), width: 40 * s, height: 40 * s, type: 'spike' });
    } else {
      obstacles.current.push({ x, y: groundY - (140 * s), width: 30 * s, height: 30 * s, type: 'coin' });
    }
    lastObstacleX.current = x;
  };

  const handlePortalTouch = () => {
    setIsTeleporting(true);
    let alpha = 0;
    const interval = setInterval(() => {
      alpha += 0.05;
      setTeleportAlpha(alpha);
      if (alpha >= 1.2) {
        clearInterval(interval);
        onLevelComplete(scoreRef.current, coinsCollectedRef.current + 150);
      }
    }, 50);
  };

  const update = (ctx: CanvasRenderingContext2D) => {
    if (isGameOver || isTeleporting) return;
    
    if (useVoice && analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      if (average > VOICE_THRESHOLD) jump();
    }

    const s = getScale();
    const { height } = ctx.canvas;
    const groundY = height * GROUND_Y_RATIO;
    const currentSpeed = BASE_SPEED;

    player.current.vy += 0.8 * s;
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
      obstacles.current.push({ x: lastObstacleX.current + (700 * s), y: groundY - (220 * s), width: 120 * s, height: 220 * s, type: 'portal' });
      portalSpawned.current = true;
    }

    obstacles.current.forEach(obs => {
      obs.x -= currentSpeed;
      const px = player.current.x;
      const py = player.current.y;
      const buffer = 5 * s;
      if (!obs.collected && px + buffer < obs.x + obs.width - buffer && px + pw - buffer > obs.x + buffer && py + buffer < obs.y + obs.height - buffer && py + ph - buffer > obs.y + buffer) {
        if (obs.type === 'coin') {
          obs.collected = true;
          coinsCollectedRef.current += 10 * multiplier;
        } else if (obs.type === 'portal') {
          handlePortalTouch();
        } else { onGameOver(scoreRef.current, coinsCollectedRef.current); }
      }
    });

    obstacles.current = obstacles.current.filter(obs => obs.x + obs.width > -100);
    if (obstacles.current.length < 8) generateObstacle(height);
    lastObstacleX.current -= currentSpeed;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const s = getScale();
    const groundY = height * GROUND_Y_RATIO;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, groundY, width, height - groundY);
    
    if (useVoice && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(width / 2 - (100 * s), 40 * s, 200 * s, 10 * s);
        ctx.fillStyle = average > VOICE_THRESHOLD ? '#fbbf24' : '#60a5fa';
        ctx.fillRect(width / 2 - (100 * s), 40 * s, (average / 100) * 200 * s, 10 * s);
    }

    obstacles.current.forEach(obs => {
      if (obs.collected) return;
      ctx.fillStyle = obs.type === 'spike' ? '#f43f5e' : (obs.type === 'coin' ? '#fbbf24' : '#a855f7');
      if (obs.type === 'spike') {
        ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width/2, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, obs.height/2, 0, 0, Math.PI*2); ctx.fill();
      }
    });

    ctx.save();
    const pw = player.current.width;
    const ph = player.current.height;
    ctx.translate(player.current.x + pw/2, player.current.y + ph/2);
    ctx.rotate(player.current.rotation);
    
    // Corpo Gallina
    ctx.fillStyle = player.current.skinColor;
    ctx.beginPath(); ctx.roundRect(-pw/2, -ph/2, pw, ph, 12 * s); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

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
    requestRef.current = requestAnimationFrame(loop);

    const handleAction = (e: any) => {
      if (isGameOver || isTeleporting) return;
      if (!useVoice) {
        if (e.type === 'touchstart') e.preventDefault();
        jump();
      }
    };

    window.addEventListener('mousedown', handleAction);
    window.addEventListener('touchstart', handleAction, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleAction);
      window.removeEventListener('touchstart', handleAction);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isGameOver, useVoice, isTeleporting]);

  return <div className="relative w-full h-full"><canvas ref={canvasRef} className="w-full h-full block touch-none" /></div>;
};

export default VoiceGameCanvas;
