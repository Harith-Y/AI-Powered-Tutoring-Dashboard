import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserPreferences, Progress, WeeklyPlanItem, Topic, LearningGoal } from '../types';

// User Profile Operations
export const createUserProfile = async (uid: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...userData,
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now()
  });
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      ...data,
      id: uid,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date()
    } as User;
  }
  return null;
};

export const updateUserProfile = async (uid: string, updates: Partial<User>) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...updates,
    lastLoginAt: Timestamp.now()
  }, { merge: true });
};

// Learning Goals Operations (Enhanced)
export const addLearningGoal = async (uid: string, goal: LearningGoal) => {
  const goalsRef = collection(db, 'users', uid, 'learning_goals');
  const docRef = await addDoc(goalsRef, {
    ...goal,
    createdAt: Timestamp.now(),
    completedAt: goal.completedAt ? Timestamp.fromDate(goal.completedAt) : null
  });
  return docRef.id;
};

export const updateLearningGoal = async (uid: string, goalId: string, updates: Partial<LearningGoal>) => {
  const goalRef = doc(db, 'users', uid, 'learning_goals', goalId);
  await updateDoc(goalRef, {
    ...updates,
    completedAt: updates.completedAt ? Timestamp.fromDate(updates.completedAt) : null
  });
};

export const deleteLearningGoal = async (uid: string, goalId: string) => {
  const goalRef = doc(db, 'users', uid, 'learning_goals', goalId);
  await deleteDoc(goalRef);
};

export const getLearningGoals = async (uid: string): Promise<LearningGoal[]> => {
  const goalsRef = collection(db, 'users', uid, 'learning_goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    completedAt: doc.data().completedAt?.toDate() || null,
    targetDate: doc.data().targetDate?.toDate() || null
  })) as LearningGoal[];
};

export const subscribeToLearningGoals = (uid: string, callback: (goals: LearningGoal[]) => void) => {
  const goalsRef = collection(db, 'users', uid, 'learning_goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
      targetDate: doc.data().targetDate?.toDate() || null
    })) as LearningGoal[];
    callback(goals);
  });
};

// Topics Operations - Fixed and Enhanced
export const getAvailableTopics = (): Topic[] => {
  console.log('Firestore: getAvailableTopics called - returning curated topics');
  
  // Comprehensive curated list of topics with consistent IDs
  const topics: Topic[] = [
    // JavaScript Topics
    {
      id: 'javascript-fundamentals',
      name: 'JavaScript Fundamentals',
      description: 'Core JavaScript concepts including variables, functions, and objects',
      category: 'JavaScript',
      difficulty: 'beginner',
      estimatedTime: 150,
      prerequisites: [],
      skills: ['Variables', 'Functions', 'Objects', 'Arrays', 'Control Flow']
    },
    {
      id: 'javascript-es6',
      name: 'JavaScript ES6+ Features',
      description: 'Modern JavaScript features including arrow functions, destructuring, and modules',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 95,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Arrow Functions', 'Destructuring', 'Modules', 'Template Literals', 'Spread Operator']
    },
    {
      id: 'javascript-async',
      name: 'Async JavaScript',
      description: 'Learn asynchronous programming with Promises and async/await',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Promises', 'Async/Await', 'Fetch API', 'Error Handling']
    },
    {
      id: 'javascript-dom',
      name: 'DOM Manipulation',
      description: 'Learn to interact with and manipulate the Document Object Model',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 85,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['DOM Selection', 'Event Handling', 'Element Manipulation', 'Dynamic Content']
    },
    {
      id: 'web-apis',
      name: 'Web APIs & Fetch',
      description: 'Learn to work with REST APIs, fetch data, and handle responses',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['JavaScript Fundamentals', 'Async JavaScript'],
      skills: ['Fetch API', 'REST APIs', 'JSON', 'Error Handling', 'HTTP Methods']
    },

    // React Topics
    {
      id: 'react-fundamentals',
      name: 'React Fundamentals',
      description: 'Learn the basics of React including components, JSX, and props',
      category: 'React',
      difficulty: 'beginner',
      estimatedTime: 120,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Components', 'JSX', 'Props', 'State']
    },
    {
      id: 'react-hooks',
      name: 'React Hooks',
      description: 'Master React hooks including useState, useEffect, and custom hooks',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['React Fundamentals'],
      skills: ['useState', 'useEffect', 'Custom Hooks', 'Hook Rules']
    },
    {
      id: 'react-state-management',
      name: 'React State Management',
      description: 'Advanced state management patterns in React applications',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['React Fundamentals', 'React Hooks'],
      skills: ['Context API', 'useReducer', 'State Patterns', 'Performance']
    },
    {
      id: 'react-router',
      name: 'React Router',
      description: 'Learn client-side routing in React applications',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 75,
      prerequisites: ['React Fundamentals'],
      skills: ['Routing', 'Navigation', 'Route Parameters', 'Protected Routes']
    },

    // CSS Topics
    {
      id: 'css-fundamentals',
      name: 'CSS Fundamentals',
      description: 'Learn CSS basics including selectors, properties, and the box model',
      category: 'CSS',
      difficulty: 'beginner',
      estimatedTime: 90,
      prerequisites: [],
      skills: ['Selectors', 'Box Model', 'Typography', 'Colors']
    },
    {
      id: 'css-flexbox',
      name: 'CSS Flexbox',
      description: 'Master flexible box layout for one-dimensional layouts',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 75,
      prerequisites: ['CSS Fundamentals'],
      skills: ['Flex Container', 'Flex Items', 'Alignment', 'Responsive Design']
    },
    {
      id: 'css-grid',
      name: 'CSS Grid',
      description: 'Learn CSS Grid for complex two-dimensional layouts',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 85,
      prerequisites: ['CSS Fundamentals', 'CSS Flexbox'],
      skills: ['Grid Container', 'Grid Items', 'Grid Areas', 'Responsive Grids']
    },
    {
      id: 'css-animations',
      name: 'CSS Animations & Transitions',
      description: 'Create smooth animations and transitions with CSS',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 70,
      prerequisites: ['CSS Fundamentals'],
      skills: ['Transitions', 'Keyframes', 'Transform', 'Animation Properties']
    },

    // TypeScript Topics
    {
      id: 'typescript-basics',
      name: 'TypeScript Basics',
      description: 'Add static typing to JavaScript with TypeScript',
      category: 'TypeScript',
      difficulty: 'intermediate',
      estimatedTime: 110,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Type Annotations', 'Interfaces', 'Types', 'Generics']
    },
    {
      id: 'typescript-advanced',
      name: 'Advanced TypeScript',
      description: 'Master advanced TypeScript features and patterns',
      category: 'TypeScript',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['TypeScript Basics'],
      skills: ['Advanced Types', 'Decorators', 'Modules', 'Type Guards']
    },

    // Backend Topics
    {
      id: 'node-express',
      name: 'Node.js & Express',
      description: 'Build server-side applications with Node.js and Express',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 140,
      prerequisites: ['JavaScript Fundamentals', 'Async JavaScript'],
      skills: ['Node.js', 'Express', 'Routing', 'Middleware', 'APIs']
    },
    {
      id: 'database-basics',
      name: 'Database Fundamentals',
      description: 'Learn database concepts and SQL basics',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['Node.js & Express'],
      skills: ['SQL', 'Database Design', 'Queries', 'Relationships']
    },

    // Testing Topics
    {
      id: 'testing-fundamentals',
      name: 'Testing Fundamentals',
      description: 'Learn testing concepts and write unit tests',
      category: 'Testing',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Unit Testing', 'Test-Driven Development', 'Mocking', 'Assertions']
    },

    // Tools & Workflow
    {
      id: 'git-version-control',
      name: 'Git & Version Control',
      description: 'Master Git for version control and collaboration',
      category: 'Tools',
      difficulty: 'beginner',
      estimatedTime: 90,
      prerequisites: [],
      skills: ['Git Commands', 'Branching', 'Merging', 'Collaboration']
    },
    {
      id: 'webpack-bundling',
      name: 'Webpack & Build Tools',
      description: 'Learn module bundling and build optimization',
      category: 'Tools',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['Module Bundling', 'Optimization', 'Loaders', 'Plugins']
    }
  ];

  console.log('Firestore: Returning', topics.length, 'curated topics');
  return topics;
};

export const getTopicsWithProgress = async (uid: string): Promise<Topic[]> => {
  try {
    console.log('Firestore: getTopicsWithProgress called for user:', uid);
    
    // Get all available topics first
    const baseTopics = getAvailableTopics();
    console.log('Firestore: Got', baseTopics.length, 'base topics');
    
    // Get user's progress
    const userProgressData = await getUserProgress(uid);
    console.log('Firestore: Got', userProgressData.length, 'progress entries');
    
    // Create a map of completed topic IDs for faster lookup
    const completedTopicIds = new Set(userProgressData.map(p => p.topicId));
    console.log('Firestore: Completed topic IDs:', Array.from(completedTopicIds));
    
    // Map topics with completion status
    const topicsWithProgress = baseTopics.map(topic => {
      const isCompleted = completedTopicIds.has(topic.id);
      const progressEntry = userProgressData.find(p => p.topicId === topic.id);
      
      const result = {
        ...topic,
        isCompleted,
        completedAt: progressEntry?.completedAt,
        score: progressEntry?.score
      };
      
      if (isCompleted) {
        console.log('Firestore: Topic', topic.name, 'is completed with score', progressEntry?.score);
      }
      
      return result;
    });
    
    console.log('Firestore: Returning', topicsWithProgress.length, 'topics with progress');
    console.log('Firestore: Completed topics count:', topicsWithProgress.filter(t => t.isCompleted).length);
    console.log('Firestore: Available topics count:', topicsWithProgress.filter(t => !t.isCompleted).length);
    
    return topicsWithProgress;
  } catch (error) {
    console.error('Firestore: Error in getTopicsWithProgress:', error);
    // Return base topics without progress on error
    const baseTopics = getAvailableTopics();
    return baseTopics.map(topic => ({ ...topic, isCompleted: false }));
  }
};

// User Preferences Operations
export const getUserPreferences = async (uid: string): Promise<UserPreferences | null> => {
  const preferencesRef = doc(db, 'users', uid, 'preferences', 'settings');
  const preferencesSnap = await getDoc(preferencesRef);
  
  if (preferencesSnap.exists()) {
    return preferencesSnap.data() as UserPreferences;
  }
  return null;
};

export const updateUserPreferences = async (uid: string, preferences: UserPreferences) => {
  const preferencesRef = doc(db, 'users', uid, 'preferences', 'settings');
  await setDoc(preferencesRef, preferences, { merge: true });
};

// Progress Operations - Enhanced
export const addProgress = async (uid: string, progressData: Omit<Progress, 'completedAt'>) => {
  console.log('Firestore: Adding progress for user', uid, 'topic', progressData.topicId, progressData.topicName);
  
  try {
    const progressRef = collection(db, 'users', uid, 'progress');
    const docRef = await addDoc(progressRef, {
      ...progressData,
      completedAt: Timestamp.now()
    });
    console.log('Firestore: Successfully added progress with ID', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error adding progress:', error);
    throw error;
  }
};

export const getUserProgress = async (uid: string): Promise<Progress[]> => {
  try {
    console.log('Firestore: Loading progress for user', uid);
    const progressRef = collection(db, 'users', uid, 'progress');
    const q = query(progressRef, orderBy('completedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const progress = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        completedAt: data.completedAt?.toDate() || new Date()
      };
    }) as Progress[];
    
    console.log('Firestore: Loaded', progress.length, 'progress entries');
    progress.forEach(p => {
      console.log('Firestore: Progress entry -', p.topicId, p.topicName, 'score:', p.score);
    });
    
    return progress;
  } catch (error) {
    console.error('Firestore: Error loading progress:', error);
    return [];
  }
};

export const subscribeToProgress = (uid: string, callback: (progress: Progress[]) => void) => {
  console.log('Firestore: Setting up progress subscription for user', uid);
  const progressRef = collection(db, 'users', uid, 'progress');
  const q = query(progressRef, orderBy('completedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const progress = snapshot.docs.map(doc => ({
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date()
    })) as Progress[];
    
    console.log('Firestore: Progress subscription update - now have', progress.length, 'entries');
    callback(progress);
  }, (error) => {
    console.error('Firestore: Progress subscription error:', error);
    // Call callback with empty array on error to prevent app crash
    callback([]);
  });
};

// Weekly Plan Operations
export const getWeeklyPlan = async (uid: string): Promise<WeeklyPlanItem[]> => {
  try {
    const weeklyPlanRef = collection(db, 'users', uid, 'weekly_plan');
    const querySnapshot = await getDocs(weeklyPlanRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WeeklyPlanItem[];
  } catch (error) {
    console.error('Firestore: Error loading weekly plan:', error);
    return [];
  }
};

export const addWeeklyPlanItem = async (uid: string, planItem: Omit<WeeklyPlanItem, 'id'>) => {
  try {
    const weeklyPlanRef = collection(db, 'users', uid, 'weekly_plan');
    const docRef = await addDoc(weeklyPlanRef, planItem);
    console.log('Firestore: Added weekly plan item with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error adding weekly plan item:', error);
    throw error;
  }
};

export const updateWeeklyPlanItem = async (uid: string, itemId: string, updates: Partial<WeeklyPlanItem>) => {
  try {
    const itemRef = doc(db, 'users', uid, 'weekly_plan', itemId);
    await updateDoc(itemRef, updates);
    console.log('Firestore: Updated weekly plan item:', itemId);
  } catch (error) {
    console.error('Firestore: Error updating weekly plan item:', error);
    throw error;
  }
};

export const deleteWeeklyPlanItem = async (uid: string, itemId: string) => {
  try {
    const itemRef = doc(db, 'users', uid, 'weekly_plan', itemId);
    await deleteDoc(itemRef);
    console.log('Firestore: Deleted weekly plan item:', itemId);
  } catch (error) {
    console.error('Firestore: Error deleting weekly plan item:', error);
    throw error;
  }
};

export const subscribeToWeeklyPlan = (uid: string, callback: (plan: WeeklyPlanItem[]) => void) => {
  const weeklyPlanRef = collection(db, 'users', uid, 'weekly_plan');
  
  return onSnapshot(weeklyPlanRef, (snapshot) => {
    const plan = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WeeklyPlanItem[];
    callback(plan);
  }, (error) => {
    console.error('Firestore: Weekly plan subscription error:', error);
    callback([]);
  });
};

// Analytics and Insights
export const getWeeklyStats = async (uid: string) => {
  try {
    const progressRef = collection(db, 'users', uid, 'progress');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const q = query(
      progressRef, 
      where('completedAt', '>=', Timestamp.fromDate(weekAgo)),
      orderBy('completedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const weeklyProgress = querySnapshot.docs.map(doc => doc.data()) as Progress[];
    
    return {
      topicsCompleted: weeklyProgress.length,
      totalTimeSpent: weeklyProgress.reduce((acc, item) => acc + item.timeSpent, 0),
      averageScore: weeklyProgress.length > 0 
        ? weeklyProgress.reduce((acc, item) => acc + item.score, 0) / weeklyProgress.length 
        : 0,
      streakDays: calculateStreakDays(weeklyProgress)
    };
  } catch (error) {
    console.error('Firestore: Error getting weekly stats:', error);
    return {
      topicsCompleted: 0,
      totalTimeSpent: 0,
      averageScore: 0,
      streakDays: 0
    };
  }
};

const calculateStreakDays = (progress: Progress[]): number => {
  if (progress.length === 0) return 0;
  
  const dates = progress.map(p => p.completedAt.toDateString());
  const uniqueDates = [...new Set(dates)].sort();
  
  let streak = 0;
  const today = new Date().toDateString();
  let currentDate = new Date();
  
  for (let i = 0; i < 30; i++) { // Check last 30 days
    const dateStr = currentDate.toDateString();
    if (uniqueDates.includes(dateStr)) {
      streak++;
    } else if (dateStr !== today) {
      break;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

// Initialize sample data for new users
export const initializeSampleData = async (uid: string) => {
  try {
    console.log('Firestore: Initializing sample data for user:', uid);
    
    // Add some sample progress to demonstrate the system
    const sampleProgress = [
      {
        topicId: 'javascript-fundamentals',
        topicName: 'JavaScript Fundamentals',
        score: 85,
        timeSpent: 120,
        difficulty: 'beginner' as const,
        category: 'JavaScript'
      },
      {
        topicId: 'css-fundamentals',
        topicName: 'CSS Fundamentals',
        score: 92,
        timeSpent: 90,
        difficulty: 'beginner' as const,
        category: 'CSS'
      }
    ];

    // Add sample progress (only if user has no existing progress)
    const existingProgress = await getUserProgress(uid);
    if (existingProgress.length === 0) {
      for (const progress of sampleProgress) {
        await addProgress(uid, progress);
      }
      console.log('Firestore: Added sample progress data');
    }

  } catch (error) {
    console.error('Firestore: Error initializing sample data:', error);
  }
};