import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
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
  addProgress,
  initializeSampleData
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
  resetPassword: (email: string) => Promise<void>;
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
      
      // Initialize sample data for new users
      await initializeSampleData(userCredential.user.uid);
      
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

  const resetPassword = async (email: string) => {
    try {
      // Get the current domain, but handle localhost specially
      const currentDomain = window.location.origin;
      const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
      
      // For localhost, don't specify a continue URL to avoid domain authorization issues
      // Firebase will use the default domain configured in the project
      const actionCodeSettings = isLocalhost ? undefined : {
        url: `${currentDomain}/auth`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error) {
      console.error('Password reset error:', error);
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

      console.log('AuthContext: Completing topic', topicId, topic.name, 'with score', score);

      await addProgress(currentUser.uid, {
        topicId: topic.id,
        topicName: topic.name,
        score,
        timeSpent,
        difficulty: topic.difficulty,
        category: topic.category
      });

      console.log('AuthContext: Topic completion saved, refreshing topics...');
      // Refresh topics to update completion status
      await refreshTopics();
    } catch (error) {
      console.error('Complete topic error:', error);
      throw error;
    }
  };

  const refreshTopics = async () => {
    if (!currentUser) {
      console.log('AuthContext: No current user, cannot refresh topics');
      return;
    }
    
    try {
      console.log('AuthContext: Refreshing topics for user:', currentUser.uid);
      const topics = await getTopicsWithProgress(currentUser.uid);
      console.log('AuthContext: Loaded topics:', topics.length, 'total');
      console.log('AuthContext: Available topics:', topics.filter(t => !t.isCompleted).length);
      console.log('AuthContext: Completed topics:', topics.filter(t => t.isCompleted).length);
      
      // Log first few topics for debugging
      if (topics.length > 0) {
        console.log('AuthContext: First 3 topics:', topics.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          isCompleted: t.isCompleted,
          category: t.category
        })));
      }
      
      setAvailableTopics(topics);
    } catch (error) {
      console.error('AuthContext: Error refreshing topics:', error);
      // Set empty array on error to prevent crashes
      setAvailableTopics([]);
    }
  };

  const loadUserData = async (user: FirebaseUser) => {
    try {
      console.log('AuthContext: Loading user data for:', user.uid);
      
      // Load user preferences
      const preferences = await getUserPreferences(user.uid);
      if (preferences) {
        setUserPreferences(preferences);
      }

      // Load weekly stats
      const stats = await getWeeklyStats(user.uid);
      setWeeklyStats(stats);

      // Load topics with progress - this is critical for the overview page
      console.log('AuthContext: Loading topics with progress...');
      await refreshTopics();

      // Set up real-time listeners
      const unsubscribeProgress = subscribeToProgress(user.uid, (progress) => {
        console.log('AuthContext: Progress subscription update - now have', progress.length, 'entries');
        setUserProgress(progress);
        // Refresh topics when progress changes to update completion status
        setTimeout(() => {
          console.log('AuthContext: Refreshing topics after progress update...');
          refreshTopics();
        }, 500); // Small delay to ensure progress is saved
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
      }, (error) => {
        console.error('AuthContext: Profile subscription error:', error);
      });

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribeProgress();
        unsubscribeWeeklyPlan();
        unsubscribeLearningGoals();
        unsubscribeProfile();
      };
    } catch (error) {
      console.error('AuthContext: Error loading user data:', error);
      return undefined;
    }
  };

  // Initial topics load effect - Load topics immediately when component mounts
  useEffect(() => {
    console.log('AuthContext: Initial topics load effect triggered');
    
    // Load topics immediately even without a user to show the base topics
    const loadInitialTopics = async () => {
      try {
        if (currentUser) {
          console.log('AuthContext: Loading topics with progress for authenticated user');
          await refreshTopics();
        } else {
          console.log('AuthContext: Loading base topics for unauthenticated state');
          // Load base topics without progress for unauthenticated users
          const { getAvailableTopics } = await import('../services/firestore');
          const baseTopics = getAvailableTopics();
          const topicsWithoutProgress = baseTopics.map(topic => ({
            ...topic,
            isCompleted: false
          }));
          setAvailableTopics(topicsWithoutProgress);
          console.log('AuthContext: Loaded', topicsWithoutProgress.length, 'base topics');
        }
      } catch (error) {
        console.error('AuthContext: Error in initial topics load:', error);
      }
    };

    loadInitialTopics();
  }, [currentUser]); // Re-run when currentUser changes

  useEffect(() => {
    let unsubscribeData: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          console.log('AuthContext: User authenticated:', user.uid);
          // Update last login time
          await updateUserProfile(user.uid, { lastLoginAt: new Date() });
          
          // Load user data and set up listeners
          console.log('AuthContext: Loading user data for:', user.uid);
          unsubscribeData = await loadUserData(user);
        } else {
          console.log('AuthContext: User logged out, clearing data');
          // Clean up data when user logs out
          setUserProfile(null);
          setUserPreferences(null);
          setUserProgress([]);
          setWeeklyPlan([]);
          setWeeklyStats(null);
          setLearningGoals([]);
          // Keep base topics available for unauthenticated users
          const { getAvailableTopics } = await import('../services/firestore');
          const baseTopics = getAvailableTopics();
          const topicsWithoutProgress = baseTopics.map(topic => ({
            ...topic,
            isCompleted: false
          }));
          setAvailableTopics(topicsWithoutProgress);
          
          if (unsubscribeData) {
            unsubscribeData();
            unsubscribeData = undefined;
          }
        }
      } catch (error) {
        console.error('AuthContext: Auth state change error:', error);
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

  // Debug effect to log topics state changes
  useEffect(() => {
    console.log('AuthContext: availableTopics state changed:', availableTopics.length, 'topics');
    if (availableTopics.length > 0) {
      const available = availableTopics.filter(t => !t.isCompleted);
      const completed = availableTopics.filter(t => t.isCompleted);
      console.log('AuthContext: Available topics:', available.length);
      console.log('AuthContext: Completed topics:', completed.length);
      console.log('AuthContext: First few available topics:', available.slice(0, 3).map(t => ({ id: t.id, name: t.name })));
      console.log('AuthContext: First few completed topics:', completed.slice(0, 3).map(t => ({ id: t.id, name: t.name })));
    } else {
      console.log('AuthContext: No topics available - this might be the issue!');
    }
  }, [availableTopics]);

  // Debug effect to log when user progress changes
  useEffect(() => {
    console.log('AuthContext: userProgress state changed:', userProgress.length, 'progress entries');
    if (userProgress.length > 0) {
      console.log('AuthContext: Recent progress entries:', userProgress.slice(0, 3).map(p => ({
        topicId: p.topicId,
        topicName: p.topicName,
        score: p.score
      })));
    }
  }, [userProgress]);

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
    resetPassword,
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