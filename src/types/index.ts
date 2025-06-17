export interface User {
  id: string;
  email: string;
  displayName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  preferredTopics: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}

export interface Progress {
  topicsCompleted: number;
  totalTopics: number;
  streakDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  adaptedToLevel?: boolean;
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