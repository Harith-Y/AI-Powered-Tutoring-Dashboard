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
  getWeeklyStats
} from '../services/firestore';

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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update Firebase Auth profile
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile in Firestore
    const newUserProfile: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'> = {
      email: email,
      displayName: displayName,
      skillLevel: 'beginner',
      learningGoals: [],
      preferredTopics: [],
      learningStyle: 'visual'
    };
    
    await createUserProfile(userCredential.user.uid, newUserProfile);
    
    // Create default preferences
    const defaultPreferences: UserPreferences = {
      preferredTopics: [],
      difficultyLevel: 'beginner',
      availableTimePerDay: 60, // 1 hour
      learningStyle: 'visual',
      studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      preferredStudyTime: 'evening',
      notifications: true
    };
    
    await updateUserPreferences(userCredential.user.uid, defaultPreferences);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setUserPreferences(null);
    setUserProgress([]);
    setWeeklyPlan([]);
    setWeeklyStats(null);
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!currentUser) return;
    await updateUserPreferences(currentUser.uid, preferences);
    setUserPreferences(preferences);
  };

  const loadUserData = async (user: FirebaseUser) => {
    try {
      // Load user profile
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }

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

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribeProgress();
        unsubscribeWeeklyPlan();
      };
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    let unsubscribeData: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
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
        }
      }
      
      setLoading(false);
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};