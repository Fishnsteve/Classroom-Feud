
// FIX: Removed circular import of 'Difficulty' from './types'. A file cannot import from itself.
export enum Difficulty {
  Easy = "Easy",
  NotSoEasy = "Not-so-easy",
  Hard = "Hard",
  DeathMode = "DEATH MODE",
}

export enum GamePhase {
  CategoryReveal,
  FaceOff,
  PlayOrPass,
  MainRound,
  StealAttempt,
  RoundReveal,
  RoundRevealComplete,
  RoundOver,
}

export interface Answer {
  text: string;
  points: number;
  accepted?: string[];
}

export interface RevealedAnswer extends Answer {
  revealed: boolean;
  emoji?: string;
}

export type Team = 1 | 2;

export interface AnswerData {
  text: string;
  emoji?: string;
  accepted?: string[];
}

export interface GameData {
  category: string;
  difficulty: Difficulty;
  answers: AnswerData[];
}

export type FaceOffMinigameType = 'Classic' | 'TeleportingBell' | 'QuickDraw';