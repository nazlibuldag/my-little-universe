export type CategoryType = 'Goal' | 'Memory' | 'Person' | 'Hobby' | 'Moon' | 'Habit' | 'Location';
export type SkinType = 'earth' | 'saturn' | 'pink' | 'purple' | 'crystal' | 'sun';
export type MoodType = 'Great' | 'Good' | 'Okay' | 'NotGreat' | 'Terrible';

export interface UserProfile {
  id: string;
  name: string;
  universeName: string;
  avatar: string;
  bio: string;
  favoriteColor: string;
  activeTheme: string;
  soundEnabled: boolean;
}

export interface CelestialObject {
  id: string;
  userId: string;
  category: CategoryType;
  title: string;
  description?: string;
  imageUrl?: string;
  audioUrl?: string;
  skin: SkinType;
  orbit: number;
  angle: number;
  radiusOffset?: number;
  progress: number; // 0 - 100%
  isCompleted: boolean;
  importance?: number;
  color?: string;
  relationship?: string;
  firstMet?: string;
  tags?: string;
  constellationGroup?: string;
  parentPlanetId?: string;
  createdAt: string;
}

export interface DailyMood {
  id: string;
  userId: string;
  date: string;
  mood: MoodType;
  note?: string;
  tags?: string;
  angle: number;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: string;
  streak: number;
  longestStreak: number;
  lastCompletedAt?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  celestialId?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  date?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}
