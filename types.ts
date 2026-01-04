
export type PlatformType = 'block' | 'spike' | 'coin' | 'portal' | 'bullet' | 'boss_projectile';
export type UserTier = 'Normal' | 'Premium' | 'VIP';

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  collected?: boolean;
  vx?: number;
  vy?: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  rotation: number;
  isGrounded: boolean;
  skinColor: string;
  hp?: number;
}

export interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  phrase: string;
  direction: number;
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  price: number;
  requirement?: string; // 'Pass', 'VIP', 'Premium'
}

export interface UserProfile {
  username: string;
  coins: number;
  xp: number;
  tier: UserTier;
  unlockedSkins: string[];
  activeSkinId: string;
  nameColor?: string;
}

export interface PassTier {
  level: number;
  xpRequired: number;
  rewardType: 'coins' | 'chest' | 'skin';
  rewardValue: any;
  isPremium: boolean;
}
