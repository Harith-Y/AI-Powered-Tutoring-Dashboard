export interface User {
  id: string;
  email: string;
  displayName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  preferredTopics: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserPreferences {
  preferredTopics: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  availableTimePerDay: number; // in minutes
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  studyDays: string[]; // ['monday', 'tuesday', etc.]
  preferredStudyTime: 'morning' | 'afternoon' | 'evening';
  notifications: boolean;
}

export interface Progress {
  topicId: string;
  topicName: string;
  completedAt: Date;
  score: number; // 0-100
  timeSpent: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  prerequisites: string[];
  skills: string[];
  isCompleted?: boolean;
  completedAt?: Date;
  score?: number;
}

export interface LearningGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  progress: number; // 0-100
  relatedTopics: string[];
  createdAt: Date;
}

export interface WeeklyPlanItem {
  id: string;
  day: string; // 'monday', 'tuesday', etc.
  topic: string;
  description: string;
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'lesson' | 'practice' | 'project' | 'review';
  completed: boolean;
  scheduledTime?: string; // '09:00', '14:30', etc.
  priority: 'low' | 'medium' | 'high';
  goalId?: string; // Reference to the associated learning goal
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  adaptedToLevel?: boolean;
  memoryEnhanced?: boolean;
  mistralPowered?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ScheduleTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'lesson' | 'practice' | 'project' | 'review';
  completed: boolean;
  scheduledDate: Date;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'github' | 'stackoverflow' | 'tutorial' | 'documentation';
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  rating: number;
  estimatedReadTime: number;
}