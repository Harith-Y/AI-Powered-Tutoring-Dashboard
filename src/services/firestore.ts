import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserPreferences, Progress, WeeklyPlanItem, LearningGoal, Topic, ChatMessage, ChatSession } from '../types';

// User Profile Operations
export const createUserProfile = async (userId: string, userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => {
  try {
    const userRef = doc(db, 'users', userId);
    const profileData = {
      ...userData,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now()
    };
    await updateDoc(userRef, profileData);
    console.log('User profile created successfully');
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        id: userId,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData = {
      ...updates,
      lastLoginAt: Timestamp.now()
    };
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// User Preferences Operations
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const preferencesRef = doc(db, 'users', userId, 'preferences', 'settings');
    const preferencesSnap = await getDoc(preferencesRef);
    
    if (preferencesSnap.exists()) {
      return preferencesSnap.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

export const updateUserPreferences = async (userId: string, preferences: UserPreferences) => {
  try {
    const preferencesRef = doc(db, 'users', userId, 'preferences', 'settings');
    await updateDoc(preferencesRef, preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// Progress Operations
export const addProgress = async (userId: string, progressData: Omit<Progress, 'completedAt'>) => {
  try {
    const progressRef = collection(db, 'users', userId, 'progress');
    const progress = {
      ...progressData,
      completedAt: Timestamp.now()
    };
    const docRef = await addDoc(progressRef, progress);
    console.log('Progress added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding progress:', error);
    throw error;
  }
};

export const subscribeToProgress = (userId: string, callback: (progress: Progress[]) => void) => {
  const progressRef = collection(db, 'users', userId, 'progress');
  const q = query(progressRef, orderBy('completedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const progress = snapshot.docs.map(doc => ({
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date()
    })) as Progress[];
    callback(progress);
  }, (error) => {
    console.error('Error in progress subscription:', error);
    callback([]);
  });
};

// Weekly Plan Operations
export const addWeeklyPlanItem = async (userId: string, item: Omit<WeeklyPlanItem, 'id'>): Promise<string> => {
  try {
    console.log('Firestore: Adding weekly plan item:', item);
    
    // Ensure goalId is null instead of undefined to avoid Firestore errors
    const cleanItem = {
      ...item,
      goalId: item.goalId || null
    };
    
    const weeklyPlanRef = collection(db, 'users', userId, 'weekly_plan');
    const docRef = await addDoc(weeklyPlanRef, cleanItem);
    console.log('Firestore: Weekly plan item added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error adding weekly plan item:', error);
    throw error;
  }
};

export const updateWeeklyPlanItem = async (userId: string, itemId: string, updates: Partial<WeeklyPlanItem>) => {
  try {
    console.log('Firestore: Updating weekly plan item:', itemId, updates);
    
    // First check if the document exists
    const itemRef = doc(db, 'users', userId, 'weekly_plan', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      console.warn('Firestore: Document does not exist:', itemId);
      throw new Error(`No document to update: ${itemRef.path}`);
    }
    
    // Clean updates to ensure no undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(itemRef, cleanUpdates);
    console.log('Firestore: Weekly plan item updated successfully');
  } catch (error) {
    console.error('Firestore: Error updating weekly plan item:', error);
    throw error;
  }
};

export const deleteWeeklyPlanItem = async (userId: string, itemId: string) => {
  try {
    console.log('Firestore: Deleting weekly plan item:', itemId);
    
    // First check if the document exists
    const itemRef = doc(db, 'users', userId, 'weekly_plan', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      console.warn('Firestore: Document does not exist for deletion:', itemId);
      // Don't throw error for delete operations - if it doesn't exist, that's the desired state
      return;
    }
    
    await deleteDoc(itemRef);
    console.log('Firestore: Weekly plan item deleted successfully');
  } catch (error) {
    console.error('Firestore: Error deleting weekly plan item:', error);
    throw error;
  }
};

export const subscribeToWeeklyPlan = (userId: string, callback: (plan: WeeklyPlanItem[]) => void) => {
  const weeklyPlanRef = collection(db, 'users', userId, 'weekly_plan');
  
  return onSnapshot(weeklyPlanRef, (snapshot) => {
    console.log('Firestore: Weekly plan subscription update, documents:', snapshot.docs.length);
    
    const plan = snapshot.docs.map(doc => {
      const data = doc.data();
      const item: WeeklyPlanItem = {
        id: doc.id, // Always use Firestore document ID
        day: data.day,
        topic: data.topic,
        description: data.description || '',
        estimatedTime: data.estimatedTime || 30,
        difficulty: data.difficulty || 'medium',
        type: data.type || 'lesson',
        completed: data.completed || false,
        priority: data.priority || 'medium',
        scheduledTime: data.scheduledTime,
        goalId: data.goalId || null
      };
      
      console.log('Firestore: Mapped weekly plan item:', { id: item.id, topic: item.topic });
      return item;
    });
    
    console.log('Firestore: Calling callback with', plan.length, 'weekly plan items');
    callback(plan);
  }, (error) => {
    console.error('Firestore: Error in weekly plan subscription:', error);
    callback([]);
  });
};

// Clean up orphaned tasks with mismatched IDs
export const cleanupOrphanedTasks = async (userId: string): Promise<{ cleaned: number; errors: string[] }> => {
  try {
    console.log('Firestore: Starting cleanup of orphaned tasks for user:', userId);
    
    const weeklyPlanRef = collection(db, 'users', userId, 'weekly_plan');
    const snapshot = await getDocs(weeklyPlanRef);
    
    let cleaned = 0;
    const errors: string[] = [];
    const batch = writeBatch(db);
    
    // Check each document
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const firestoreId = docSnap.id;
      
      // Check if this looks like an old manually generated ID
      if (firestoreId.startsWith('manual-') || 
          firestoreId.startsWith('ai-generated-') ||
          firestoreId.includes('-spuadwgvm') ||
          firestoreId.includes('-') && firestoreId.length > 25) {
        
        console.log('Firestore: Found potentially orphaned task:', firestoreId, data.topic);
        
        // This is likely an old task with a manually generated ID
        // We'll delete it and let the user re-add if needed
        try {
          batch.delete(docSnap.ref);
          cleaned++;
          console.log('Firestore: Marked for deletion:', firestoreId);
        } catch (error) {
          const errorMsg = `Failed to delete ${firestoreId}: ${error}`;
          errors.push(errorMsg);
          console.error('Firestore:', errorMsg);
        }
      }
    }
    
    // Commit the batch deletion
    if (cleaned > 0) {
      await batch.commit();
      console.log('Firestore: Batch deletion completed, cleaned up', cleaned, 'orphaned tasks');
    }
    
    return { cleaned, errors };
  } catch (error) {
    console.error('Firestore: Error during cleanup:', error);
    return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
};

// Learning Goals Operations
export const addLearningGoal = async (userId: string, goalData: Omit<LearningGoal, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log('Firestore: Adding learning goal:', goalData);
    const goalsRef = collection(db, 'users', userId, 'learning_goals');
    const goal = {
      ...goalData,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(goalsRef, goal);
    console.log('Firestore: Learning goal added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error adding learning goal:', error);
    throw error;
  }
};

export const updateLearningGoal = async (userId: string, goalId: string, updates: Partial<LearningGoal>) => {
  try {
    console.log('Firestore: Updating learning goal:', goalId, updates);
    const goalRef = doc(db, 'users', userId, 'learning_goals', goalId);
    
    // Convert Date objects to Timestamps for Firestore
    const cleanUpdates = { ...updates };
    if (cleanUpdates.completedAt && cleanUpdates.completedAt instanceof Date) {
      cleanUpdates.completedAt = Timestamp.fromDate(cleanUpdates.completedAt);
    }
    if (cleanUpdates.targetDate && cleanUpdates.targetDate instanceof Date) {
      cleanUpdates.targetDate = Timestamp.fromDate(cleanUpdates.targetDate);
    }
    
    await updateDoc(goalRef, cleanUpdates);
    console.log('Firestore: Learning goal updated successfully');
  } catch (error) {
    console.error('Firestore: Error updating learning goal:', error);
    throw error;
  }
};

export const deleteLearningGoal = async (userId: string, goalId: string) => {
  try {
    console.log('Firestore: Deleting learning goal:', goalId);
    const goalRef = doc(db, 'users', userId, 'learning_goals', goalId);
    await deleteDoc(goalRef);
    console.log('Firestore: Learning goal deleted successfully');
  } catch (error) {
    console.error('Firestore: Error deleting learning goal:', error);
    throw error;
  }
};

export const subscribeToLearningGoals = (userId: string, callback: (goals: LearningGoal[]) => void) => {
  const goalsRef = collection(db, 'users', userId, 'learning_goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    console.log('Firestore: Learning goals subscription update, documents:', snapshot.docs.length);
    
    const goals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        targetDate: data.targetDate?.toDate()
      } as LearningGoal;
    });
    
    console.log('Firestore: Calling callback with', goals.length, 'learning goals');
    callback(goals);
  }, (error) => {
    console.error('Firestore: Error in learning goals subscription:', error);
    callback([]);
  });
};

// Chat History Operations
export const createChatSession = async (userId: string, title?: string): Promise<string> => {
  try {
    console.log('Firestore: Creating new chat session for user:', userId);
    
    const chatSessionsRef = collection(db, 'users', userId, 'chat_sessions');
    const sessionData = {
      userId,
      title: title || `Chat Session ${new Date().toLocaleDateString()}`,
      messageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(chatSessionsRef, sessionData);
    console.log('Firestore: Chat session created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error creating chat session:', error);
    throw error;
  }
};

export const addChatMessage = async (
  userId: string, 
  sessionId: string, 
  messageData: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<string> => {
  try {
    console.log('Firestore: Adding chat message to session:', sessionId);
    
    const messagesRef = collection(db, 'users', userId, 'chat_sessions', sessionId, 'messages');
    const message = {
      ...messageData,
      timestamp: Timestamp.now()
    };
    
    const docRef = await addDoc(messagesRef, message);
    
    // Update session's message count and last updated time
    const sessionRef = doc(db, 'users', userId, 'chat_sessions', sessionId);
    await updateDoc(sessionRef, {
      messageCount: (await getDoc(sessionRef)).data()?.messageCount + 1 || 1,
      updatedAt: Timestamp.now()
    });
    
    console.log('Firestore: Chat message added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error adding chat message:', error);
    throw error;
  }
};

export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    console.log('Firestore: Getting chat sessions for user:', userId);
    
    const chatSessionsRef = collection(db, 'users', userId, 'chat_sessions');
    const q = query(chatSessionsRef, orderBy('updatedAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    
    const sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        messageCount: data.messageCount || 0,
        messages: [], // Messages will be loaded separately
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as ChatSession;
    });
    
    console.log('Firestore: Found', sessions.length, 'chat sessions');
    return sessions;
  } catch (error) {
    console.error('Firestore: Error getting chat sessions:', error);
    return [];
  }
};

export const getChatMessages = async (userId: string, sessionId: string): Promise<ChatMessage[]> => {
  try {
    console.log('Firestore: Getting chat messages for session:', sessionId);
    
    const messagesRef = collection(db, 'users', userId, 'chat_sessions', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        sender: data.sender,
        timestamp: data.timestamp?.toDate() || new Date(),
        adaptedToLevel: data.adaptedToLevel || false,
        memoryEnhanced: data.memoryEnhanced || false,
        mistralPowered: data.mistralPowered || false
      } as ChatMessage;
    });
    
    console.log('Firestore: Found', messages.length, 'messages in session');
    return messages;
  } catch (error) {
    console.error('Firestore: Error getting chat messages:', error);
    return [];
  }
};

export const deleteChatSession = async (userId: string, sessionId: string) => {
  try {
    console.log('Firestore: Deleting chat session:', sessionId);
    
    // Delete all messages in the session first
    const messagesRef = collection(db, 'users', userId, 'chat_sessions', sessionId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    
    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the session document
    const sessionRef = doc(db, 'users', userId, 'chat_sessions', sessionId);
    batch.delete(sessionRef);
    
    await batch.commit();
    console.log('Firestore: Chat session and messages deleted successfully');
  } catch (error) {
    console.error('Firestore: Error deleting chat session:', error);
    throw error;
  }
};

export const updateChatSessionTitle = async (userId: string, sessionId: string, title: string) => {
  try {
    console.log('Firestore: Updating chat session title:', sessionId, title);
    
    const sessionRef = doc(db, 'users', userId, 'chat_sessions', sessionId);
    await updateDoc(sessionRef, {
      title,
      updatedAt: Timestamp.now()
    });
    
    console.log('Firestore: Chat session title updated successfully');
  } catch (error) {
    console.error('Firestore: Error updating chat session title:', error);
    throw error;
  }
};

// Weekly Stats
export const getWeeklyStats = async (userId: string) => {
  try {
    const progressRef = collection(db, 'users', userId, 'progress');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const q = query(
      progressRef, 
      where('completedAt', '>=', Timestamp.fromDate(weekAgo)),
      orderBy('completedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const weeklyProgress = snapshot.docs.map(doc => doc.data());
    
    const topicsCompleted = weeklyProgress.length;
    const totalTimeSpent = weeklyProgress.reduce((acc, p) => acc + (p.timeSpent || 0), 0);
    const averageScore = weeklyProgress.length > 0 
      ? weeklyProgress.reduce((acc, p) => acc + (p.score || 0), 0) / weeklyProgress.length 
      : 0;
    
    // Calculate streak (simplified)
    const streakDays = Math.min(topicsCompleted, 7);
    
    return {
      topicsCompleted,
      totalTimeSpent,
      averageScore,
      streakDays
    };
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    return {
      topicsCompleted: 0,
      totalTimeSpent: 0,
      averageScore: 0,
      streakDays: 0
    };
  }
};

// Topics with Progress
export const getAvailableTopics = (): Topic[] => {
  return [
    {
      id: 'js-fundamentals',
      name: 'JavaScript Fundamentals',
      description: 'Learn the core concepts of JavaScript programming',
      category: 'JavaScript',
      difficulty: 'beginner',
      estimatedTime: 120,
      prerequisites: [],
      skills: ['Variables', 'Functions', 'Objects', 'Arrays']
    },
    {
      id: 'react-basics',
      name: 'React Basics',
      description: 'Introduction to React components and JSX',
      category: 'React',
      difficulty: 'beginner',
      estimatedTime: 150,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Components', 'JSX', 'Props', 'State']
    },
    {
      id: 'css-fundamentals',
      name: 'CSS Fundamentals',
      description: 'Master the basics of CSS styling',
      category: 'CSS',
      difficulty: 'beginner',
      estimatedTime: 90,
      prerequisites: [],
      skills: ['Selectors', 'Properties', 'Box Model', 'Layout']
    },
    {
      id: 'react-hooks',
      name: 'React Hooks',
      description: 'Learn useState, useEffect, and custom hooks',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 180,
      prerequisites: ['React Basics'],
      skills: ['useState', 'useEffect', 'Custom Hooks', 'Hook Rules']
    },
    {
      id: 'async-javascript',
      name: 'Async JavaScript',
      description: 'Master promises, async/await, and API calls',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 160,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Promises', 'Async/Await', 'Fetch API', 'Error Handling']
    },
    {
      id: 'css-grid',
      name: 'CSS Grid',
      description: 'Create complex layouts with CSS Grid',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['CSS Fundamentals'],
      skills: ['Grid Container', 'Grid Items', 'Grid Areas', 'Responsive Design']
    },
    {
      id: 'typescript-basics',
      name: 'TypeScript Basics',
      description: 'Add type safety to your JavaScript',
      category: 'TypeScript',
      difficulty: 'intermediate',
      estimatedTime: 140,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Types', 'Interfaces', 'Generics', 'Type Guards']
    },
    {
      id: 'node-fundamentals',
      name: 'Node.js Fundamentals',
      description: 'Server-side JavaScript with Node.js',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 200,
      prerequisites: ['JavaScript Fundamentals', 'Async JavaScript'],
      skills: ['Modules', 'File System', 'HTTP Server', 'NPM']
    },
    {
      id: 'react-advanced',
      name: 'Advanced React Patterns',
      description: 'Learn advanced React concepts and patterns',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 240,
      prerequisites: ['React Hooks'],
      skills: ['Context API', 'Render Props', 'HOCs', 'Performance Optimization']
    },
    {
      id: 'testing-fundamentals',
      name: 'Testing Fundamentals',
      description: 'Learn to write tests for your applications',
      category: 'Testing',
      difficulty: 'intermediate',
      estimatedTime: 180,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Unit Testing', 'Integration Testing', 'Jest', 'Testing Library']
    }
  ];
};

export const getTopicsWithProgress = async (userId: string): Promise<Topic[]> => {
  try {
    console.log('Firestore: Getting topics with progress for user:', userId);
    
    // Get user's progress
    const progressRef = collection(db, 'users', userId, 'progress');
    const progressSnapshot = await getDocs(progressRef);
    
    const userProgress = progressSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        completedAt: data.completedAt?.toDate() || new Date()
      } as Progress;
    });
    
    console.log('Firestore: Found', userProgress.length, 'progress entries');
    
    // Get available topics
    const availableTopics = getAvailableTopics();
    
    // Map topics with completion status
    const topicsWithProgress = availableTopics.map(topic => {
      const progress = userProgress.find(p => 
        p.topicId === topic.id || 
        p.topicName.toLowerCase() === topic.name.toLowerCase()
      );
      
      return {
        ...topic,
        isCompleted: !!progress,
        completedAt: progress?.completedAt,
        score: progress?.score
      };
    });
    
    console.log('Firestore: Mapped topics with progress:', {
      total: topicsWithProgress.length,
      completed: topicsWithProgress.filter(t => t.isCompleted).length,
      available: topicsWithProgress.filter(t => !t.isCompleted).length
    });
    
    return topicsWithProgress;
  } catch (error) {
    console.error('Firestore: Error getting topics with progress:', error);
    return getAvailableTopics().map(topic => ({ ...topic, isCompleted: false }));
  }
};

// Initialize sample data for new users
export const initializeSampleData = async (userId: string) => {
  try {
    console.log('Firestore: Initializing sample data for user:', userId);
    
    // Add some sample progress
    const sampleProgress = [
      {
        topicId: 'js-fundamentals',
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
    
    for (const progress of sampleProgress) {
      await addProgress(userId, progress);
    }
    
    // Add a sample learning goal
    const sampleGoal = {
      title: 'Master React Development',
      description: 'Learn React from basics to advanced concepts',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isCompleted: false,
      progress: 0,
      relatedTopics: ['React', 'JavaScript', 'CSS']
    };
    
    await addLearningGoal(userId, sampleGoal);
    
    console.log('Firestore: Sample data initialized successfully');
  } catch (error) {
    console.error('Firestore: Error initializing sample data:', error);
  }
};