import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { User, UserPreferences, Progress, WeeklyPlanItem, Topic, LearningGoal } from '../types';
import { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  subscribeToProgress,
  subscribeToWeeklyPlan,
  getWeeklyStats,
  addLearningGoal,
  updateLearningGoal,
  deleteLearningGoal,
  subscribeToLearningGoals,
  getTopicsWithProgress,
  addProgress
} from '../services/firestore';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  userPreferences: UserPreferences | null;
  userProgress: Progress[];
  weeklyPlan: WeeklyPlanItem[];
  weeklyStats: any;
  learningGoals: LearningGoal[];
  availableTopics: Topic[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  addGoal: (goal: Omit<LearningGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<LearningGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  completeGoal: (goalId: string) => Promise<void>;
  completeTopic: (topicId: string, score: number, timeSpent: number) => Promise<void>;
  refreshTopics: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userProgress, setUserProgress] = useState<Progress[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateProfile(userCredential.user, { displayName });
      
      // Create user profile in Firestore
      const newUserProfile: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'> = {
        email: email,
        displayName: displayName,
        skillLevel: 'beginner',
        learningGoals: [],
        preferredTopics: ['JavaScript', 'React', 'CSS'],
        learningStyle: 'visual'
      };
      
      await createUserProfile(userCredential.user.uid, newUserProfile);
      
      // Create default preferences
      const defaultPreferences: UserPreferences = {
        preferredTopics: ['JavaScript', 'React', 'CSS'],
        difficultyLevel: 'beginner',
        availableTimePerDay: 60, // 1 hour
        learningStyle: 'visual',
        studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        preferredStudyTime: 'evening',
        notifications: true
      };
      
      await updateUserPreferences(userCredential.user.uid, defaultPreferences);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear state immediately
      setUserProfile(null);
      setUserPreferences(null);
      setUserProgress([]);
      setWeeklyPlan([]);
      setWeeklyStats(null);
      setLearningGoals([]);
      setAvailableTopics([]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await updateUserPreferences(currentUser.uid, preferences);
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  };

  // Learning Goals CRUD Operations
  const addGoal = async (goal: Omit<LearningGoal, 'id' | 'createdAt'>) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      const goalWithDefaults: LearningGoal = {
        id: '', // Will be set by Firestore
        ...goal,
        createdAt: new Date(),
        progress: 0,
        isCompleted: false,
        relatedTopics: goal.relatedTopics || []
      };
      await addLearningGoal(currentUser.uid, goalWithDefaults);
    } catch (error) {
      console.error('Add goal error:', error);
      throw error;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<LearningGoal>) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await updateLearningGoal(currentUser.uid, goalId, updates);
    } catch (error) {
      console.error('Update goal error:', error);
      throw error;
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await deleteLearningGoal(currentUser.uid, goalId);
    } catch (error) {
      console.error('Delete goal error:', error);
      throw error;
    }
  };

  const completeGoal = async (goalId: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await updateLearningGoal(currentUser.uid, goalId, {
        isCompleted: true,
        completedAt: new Date(),
        progress: 100
      });
    } catch (error) {
      console.error('Complete goal error:', error);
      throw error;
    }
  };

  // Topic Completion
  const completeTopic = async (topicId: string, score: number, timeSpent: number) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      const topic = availableTopics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      await addProgress(currentUser.uid, {
        topicId: topic.id,
        topicName: topic.name,
        score,
        timeSpent,
        difficulty: topic.difficulty,
        category: topic.category
      });

      // Refresh topics to update completion status
      await refreshTopics();
    } catch (error) {
      console.error('Complete topic error:', error);
      throw error;
    }
  };

  const refreshTopics = async () => {
    if (!currentUser) return;
    try {
      console.log('Refreshing topics for user:', currentUser.uid);
      const topics = await getTopicsWithProgress(currentUser.uid);
      console.log('Loaded topics:', topics.length, topics);
      setAvailableTopics(topics);
    } catch (error) {
      console.error('Error refreshing topics:', error);
    }
  };

  const loadUserData = async (user: FirebaseUser) => {
    try {
      console.log('Loading user data for:', user.uid);
      
      // Load user preferences
      const preferences = await getUserPreferences(user.uid);
      if (preferences) {
        setUserPreferences(preferences);
      }

      // Load weekly stats
      const stats = await getWeeklyStats(user.uid);
      setWeeklyStats(stats);

      // Load topics with progress - this is the key fix
      console.log('Loading topics with progress...');
      await refreshTopics();

      // Set up real-time listeners
      const unsubscribeProgress = subscribeToProgress(user.uid, (progress) => {
        console.log('Progress updated:', progress.length, 'items');
        setUserProgress(progress);
        // Refresh topics when progress changes to update completion status
        refreshTopics();
      });

      const unsubscribeWeeklyPlan = subscribeToWeeklyPlan(user.uid, (plan) => {
        setWeeklyPlan(plan);
      });

      const unsubscribeLearningGoals = subscribeToLearningGoals(user.uid, (goals) => {
        setLearningGoals(goals);
      });

      // Set up real-time listener for user profile
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const profile: User = {
            ...data,
            id: user.uid,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLoginAt: data.lastLoginAt?.toDate() || new Date()
          } as User;
          setUserProfile(profile);
        }
      });

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribeProgress();
        unsubscribeWeeklyPlan();
        unsubscribeLearningGoals();
        unsubscribeProfile();
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return undefined;
    }
  };

  useEffect(() => {
    let unsubscribeData: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          console.log('User authenticated:', user.uid);
          // Update last login time
          await updateUserProfile(user.uid, { lastLoginAt: new Date() });
          
          // Load user data and set up listeners
          unsubscribeData = await loadUserData(user);
        } else {
          console.log('User logged out, clearing data');
          // Clean up data when user logs out
          setUserProfile(null);
          setUserPreferences(null);
          setUserProgress([]);
          setWeeklyPlan([]);
          setWeeklyStats(null);
          setLearningGoals([]);
          setAvailableTopics([]);
          
          if (unsubscribeData) {
            unsubscribeData();
            unsubscribeData = undefined;
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeData) {
        unsubscribeData();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    userPreferences,
    userProgress,
    weeklyPlan,
    weeklyStats,
    learningGoals,
    availableTopics,
    login,
    signup,
    logout,
    updatePreferences,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    completeTopic,
    refreshTopics,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};