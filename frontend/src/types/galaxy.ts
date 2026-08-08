export type CategoryType = 'Goal' | 'Memory' | 'Person' | 'Hobby' | 'Moon';
export type SkinType = 'earth' | 'saturn' | 'pink' | 'purple' | 'crystal' | 'sun';
export type MoodType = 'Great' | 'Good' | 'Okay' | 'NotGreat' | 'Terrible';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  favoriteColor: string;
  favoriteMusic: string;
  tags: string;
}

export interface CelestialObject {
  id: string;
  userId: string;
  category: CategoryType;
  title: string;
  description?: string;
  skin: SkinType;
  orbit: number;
  angle: number;
  radiusOffset?: number;
  isCompleted: boolean;
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
  angle: number;
  createdAt: string;
}
