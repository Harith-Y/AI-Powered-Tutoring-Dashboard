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
import { User, UserPreferences, Progress, WeeklyPlanItem } from '../types';
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
  removeLearningGoal,
  updateLearningGoals
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  addGoal: (goal: string) => Promise<void>;
  removeGoal: (goal: string) => Promise<void>;
  updateGoals: (goals: string[]) => Promise<void>;
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
        learningGoals: ['Master React fundamentals', 'Learn TypeScript', 'Build portfolio projects'],
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
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!currentUser) return;
    try {
      await updateUserPreferences(currentUser.uid, preferences);
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  };

  // Learning Goals CRUD Operations
  const addGoal = async (goal: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await addLearningGoal(currentUser.uid, goal);
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Add goal error:', error);
      throw error;
    }
  };

  const removeGoal = async (goal: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await removeLearningGoal(currentUser.uid, goal);
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Remove goal error:', error);
      throw error;
    }
  };

  const updateGoals = async (goals: string[]) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await updateLearningGoals(currentUser.uid, goals);
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Update goals error:', error);
      throw error;
    }
  };

  const loadUserData = async (user: FirebaseUser) => {
    try {
      // Load user preferences
      const preferences = await getUserPreferences(user.uid);
      if (preferences) {
        setUserPreferences(preferences);
      }

      // Load weekly stats
      const stats = await getWeeklyStats(user.uid);
      setWeeklyStats(stats);

      // Set up real-time listeners
      const unsubscribeProgress = subscribeToProgress(user.uid, (progress) => {
        setUserProgress(progress);
      });

      const unsubscribeWeeklyPlan = subscribeToWeeklyPlan(user.uid, (plan) => {
        setWeeklyPlan(plan);
      });

      // Set up real-time listener for user profile (including learning goals)
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
          // Update last login time
          await updateUserProfile(user.uid, { lastLoginAt: new Date() });
          
          // Load user data and set up listeners
          unsubscribeData = await loadUserData(user);
        } else {
          // Clean up data when user logs out
          setUserProfile(null);
          setUserPreferences(null);
          setUserProgress([]);
          setWeeklyPlan([]);
          setWeeklyStats(null);
          
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
    login,
    signup,
    logout,
    updatePreferences,
    addGoal,
    removeGoal,
    updateGoals,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};