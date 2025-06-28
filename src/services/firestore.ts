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

// Learning Goals Operations (Enhanced and Fixed)
export const addLearningGoal = async (uid: string, goal: Omit<LearningGoal, 'id' | 'createdAt'>): Promise<string> => {
  console.log('Firestore: Adding learning goal for user:', uid, goal);
  
  try {
    const goalsRef = collection(db, 'users', uid, 'learning_goals');
    const goalData = {
      title: goal.title,
      description: goal.description || '',
      targetDate: goal.targetDate ? Timestamp.fromDate(goal.targetDate) : null,
      isCompleted: false,
      progress: 0,
      relatedTopics: goal.relatedTopics || [],
      createdAt: Timestamp.now(),
      completedAt: null
    };
    
    console.log('Firestore: Goal data to save:', goalData);
    
    const docRef = await addDoc(goalsRef, goalData);
    console.log('Firestore: Learning goal added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore: Error adding learning goal:', error);
    throw error;
  }
};

export const updateLearningGoal = async (uid: string, goalId: string, updates: Partial<LearningGoal>) => {
  // Validate goalId parameter
  if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
    throw new Error('Invalid goalId: goalId must be a non-empty string');
  }

  console.log('Firestore: Updating learning goal:', uid, goalId, updates);

  try {
    const goalRef = doc(db, 'users', uid, 'learning_goals', goalId);
    const updateData: any = { ...updates };
    
    // Convert dates to Timestamps
    if (updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }
    if (updates.targetDate) {
      updateData.targetDate = Timestamp.fromDate(updates.targetDate);
    }
    
    await updateDoc(goalRef, updateData);
    console.log('Firestore: Learning goal updated successfully');
  } catch (error) {
    console.error('Firestore: Error updating learning goal:', error);
    throw error;
  }
};

export const deleteLearningGoal = async (uid: string, goalId: string) => {
  // Validate goalId parameter
  if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
    throw new Error('Invalid goalId: goalId must be a non-empty string');
  }

  console.log('Firestore: Deleting learning goal:', uid, goalId);

  try {
    const goalRef = doc(db, 'users', uid, 'learning_goals', goalId);
    await deleteDoc(goalRef);
    console.log('Firestore: Learning goal deleted successfully');
  } catch (error) {
    console.error('Firestore: Error deleting learning goal:', error);
    throw error;
  }
};

export const getLearningGoals = async (uid: string): Promise<LearningGoal[]> => {
  try {
    console.log('Firestore: Loading learning goals for user:', uid);
    const goalsRef = collection(db, 'users', uid, 'learning_goals');
    const q = query(goalsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const goals = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        targetDate: data.targetDate?.toDate() || null,
        isCompleted: data.isCompleted || false,
        completedAt: data.completedAt?.toDate() || null,
        progress: data.progress || 0,
        relatedTopics: data.relatedTopics || [],
        createdAt: data.createdAt?.toDate() || new Date()
      } as LearningGoal;
    });
    
    console.log('Firestore: Loaded', goals.length, 'learning goals');
    return goals;
  } catch (error) {
    console.error('Firestore: Error loading learning goals:', error);
    return [];
  }
};

export const subscribeToLearningGoals = (uid: string, callback: (goals: LearningGoal[]) => void) => {
  console.log('Firestore: Setting up learning goals subscription for user:', uid);
  const goalsRef = collection(db, 'users', uid, 'learning_goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        targetDate: data.targetDate?.toDate() || null,
        isCompleted: data.isCompleted || false,
        completedAt: data.completedAt?.toDate() || null,
        progress: data.progress || 0,
        relatedTopics: data.relatedTopics || [],
        createdAt: data.createdAt?.toDate() || new Date()
      } as LearningGoal;
    });
    
    console.log('Firestore: Learning goals subscription update - now have', goals.length, 'goals');
    callback(goals);
  }, (error) => {
    console.error('Firestore: Learning goals subscription error:', error);
    callback([]);
  });
};

// Topics Operations - Massively Expanded with 100+ Topics
export const getAvailableTopics = (): Topic[] => {
  console.log('Firestore: getAvailableTopics called - returning comprehensive topic catalog with 100+ topics');
  
  // Comprehensive curated list of topics with consistent IDs
  const topics: Topic[] = [
    // ===== PROGRAMMING FUNDAMENTALS =====
    {
      id: 'programming-basics',
      name: 'Programming Fundamentals',
      description: 'Core programming concepts including variables, data types, and control structures',
      category: 'Fundamentals',
      difficulty: 'beginner',
      estimatedTime: 180,
      prerequisites: [],
      skills: ['Variables', 'Data Types', 'Control Flow', 'Functions', 'Problem Solving']
    },
    {
      id: 'algorithms-basics',
      name: 'Algorithms & Problem Solving',
      description: 'Introduction to algorithmic thinking and problem-solving strategies',
      category: 'Fundamentals',
      difficulty: 'beginner',
      estimatedTime: 120,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Algorithm Design', 'Problem Solving', 'Pseudocode', 'Flowcharts']
    },
    {
      id: 'data-structures-intro',
      name: 'Data Structures Introduction',
      description: 'Arrays, objects, and basic data organization concepts',
      category: 'Fundamentals',
      difficulty: 'intermediate',
      estimatedTime: 140,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Arrays', 'Objects', 'Lists', 'Data Organization']
    },
    {
      id: 'big-o-notation',
      name: 'Big O Notation & Complexity Analysis',
      description: 'Understanding time and space complexity for algorithm analysis',
      category: 'Fundamentals',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['Algorithms & Problem Solving'],
      skills: ['Time Complexity', 'Space Complexity', 'Algorithm Analysis', 'Performance']
    },
    {
      id: 'recursion-fundamentals',
      name: 'Recursion & Recursive Thinking',
      description: 'Master recursive algorithms and problem-solving techniques',
      category: 'Fundamentals',
      difficulty: 'intermediate',
      estimatedTime: 110,
      prerequisites: ['Programming Fundamentals', 'Algorithms & Problem Solving'],
      skills: ['Recursion', 'Base Cases', 'Recursive Patterns', 'Stack Frames']
    },

    // ===== JAVASCRIPT (EXPANDED) =====
    {
      id: 'javascript-fundamentals',
      name: 'JavaScript Fundamentals',
      description: 'Core JavaScript concepts including variables, functions, and objects',
      category: 'JavaScript',
      difficulty: 'beginner',
      estimatedTime: 150,
      prerequisites: ['Programming Fundamentals'],
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
      id: 'javascript-closures',
      name: 'JavaScript Closures & Scope',
      description: 'Master closures, scope chains, and lexical environments',
      category: 'JavaScript',
      difficulty: 'advanced',
      estimatedTime: 90,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Closures', 'Scope', 'Lexical Environment', 'Function Context']
    },
    {
      id: 'javascript-prototypes',
      name: 'Prototypes & Inheritance',
      description: 'Understanding JavaScript\'s prototype-based inheritance system',
      category: 'JavaScript',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Prototypes', 'Inheritance', 'Constructor Functions', 'Object Creation']
    },
    {
      id: 'javascript-modules',
      name: 'JavaScript Modules & Bundling',
      description: 'ES6 modules, CommonJS, and modern bundling concepts',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 75,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['ES6 Modules', 'Import/Export', 'Module Bundling', 'Code Organization']
    },
    {
      id: 'javascript-performance',
      name: 'JavaScript Performance Optimization',
      description: 'Techniques for writing efficient and performant JavaScript code',
      category: 'JavaScript',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['JavaScript Fundamentals', 'Async JavaScript'],
      skills: ['Performance Optimization', 'Memory Management', 'Profiling', 'Best Practices']
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
    {
      id: 'javascript-design-patterns',
      name: 'JavaScript Design Patterns',
      description: 'Common design patterns and architectural approaches in JavaScript',
      category: 'JavaScript',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['JavaScript Fundamentals', 'JavaScript Closures'],
      skills: ['Module Pattern', 'Observer Pattern', 'Factory Pattern', 'Singleton Pattern']
    },
    {
      id: 'javascript-functional',
      name: 'Functional Programming in JavaScript',
      description: 'Functional programming concepts and techniques in JavaScript',
      category: 'JavaScript',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['Pure Functions', 'Higher-Order Functions', 'Immutability', 'Function Composition']
    },
    {
      id: 'javascript-regex',
      name: 'Regular Expressions in JavaScript',
      description: 'Master pattern matching and text processing with regex',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 70,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Regex Patterns', 'String Matching', 'Text Processing', 'Validation']
    },

    // ===== REACT (EXPANDED) =====
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
    {
      id: 'react-context',
      name: 'React Context API',
      description: 'Global state management using React Context',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 85,
      prerequisites: ['React Hooks'],
      skills: ['Context API', 'Provider Pattern', 'Global State', 'State Sharing']
    },
    {
      id: 'react-performance',
      name: 'React Performance Optimization',
      description: 'Optimize React apps with memoization, lazy loading, and profiling',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['React Hooks', 'React State Management'],
      skills: ['React.memo', 'useMemo', 'useCallback', 'Lazy Loading', 'Profiling']
    },
    {
      id: 'react-testing',
      name: 'React Testing',
      description: 'Testing React components with Jest and React Testing Library',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['React Fundamentals', 'Testing Fundamentals'],
      skills: ['Component Testing', 'React Testing Library', 'Jest', 'Test Strategies']
    },
    {
      id: 'react-patterns',
      name: 'Advanced React Patterns',
      description: 'Higher-order components, render props, and compound components',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['React Hooks', 'React Context'],
      skills: ['HOCs', 'Render Props', 'Compound Components', 'Component Composition']
    },
    {
      id: 'react-forms',
      name: 'React Forms & Validation',
      description: 'Building and validating forms in React applications',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['React Fundamentals', 'React Hooks'],
      skills: ['Form Handling', 'Validation', 'Controlled Components', 'Form Libraries']
    },
    {
      id: 'react-animation',
      name: 'React Animations & Transitions',
      description: 'Creating smooth animations and transitions in React',
      category: 'React',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['React Fundamentals', 'CSS Animations'],
      skills: ['React Transition Group', 'Framer Motion', 'CSS Transitions', 'Animation Libraries']
    },
    {
      id: 'react-ssr',
      name: 'React Server-Side Rendering',
      description: 'Implementing SSR with Next.js and React',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 150,
      prerequisites: ['React Fundamentals', 'Node.js & Express'],
      skills: ['Server-Side Rendering', 'Next.js', 'Static Generation', 'Hydration']
    },

    // ===== CSS (EXPANDED) =====
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
    {
      id: 'css-responsive',
      name: 'Responsive Web Design',
      description: 'Creating websites that work on all devices and screen sizes',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['CSS Fundamentals', 'CSS Flexbox'],
      skills: ['Media Queries', 'Mobile-First Design', 'Breakpoints', 'Fluid Layouts']
    },
    {
      id: 'css-preprocessors',
      name: 'CSS Preprocessors (Sass/SCSS)',
      description: 'Advanced CSS with variables, mixins, and functions',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['CSS Fundamentals'],
      skills: ['Sass/SCSS', 'Variables', 'Mixins', 'Nesting', 'Functions']
    },
    {
      id: 'css-architecture',
      name: 'CSS Architecture & Methodologies',
      description: 'BEM, OOCSS, and other CSS organization strategies',
      category: 'CSS',
      difficulty: 'advanced',
      estimatedTime: 90,
      prerequisites: ['CSS Fundamentals'],
      skills: ['BEM', 'OOCSS', 'SMACSS', 'CSS Modules', 'Atomic CSS']
    },
    {
      id: 'css-custom-properties',
      name: 'CSS Custom Properties (Variables)',
      description: 'Dynamic styling with CSS custom properties and theming',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 60,
      prerequisites: ['CSS Fundamentals'],
      skills: ['CSS Variables', 'Dynamic Theming', 'Custom Properties', 'CSS Functions']
    },

    // ===== TYPESCRIPT (EXPANDED) =====
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
    {
      id: 'typescript-react',
      name: 'TypeScript with React',
      description: 'Building type-safe React applications with TypeScript',
      category: 'TypeScript',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['TypeScript Basics', 'React Fundamentals'],
      skills: ['React Types', 'Component Props', 'Event Handling', 'Hooks with TypeScript']
    },
    {
      id: 'typescript-node',
      name: 'TypeScript with Node.js',
      description: 'Server-side development with TypeScript and Node.js',
      category: 'TypeScript',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['TypeScript Basics', 'Node.js & Express'],
      skills: ['Node.js Types', 'Express with TypeScript', 'API Development', 'Type Safety']
    },

    // ===== BACKEND DEVELOPMENT =====
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
    {
      id: 'mongodb-basics',
      name: 'MongoDB & NoSQL',
      description: 'Document-based databases with MongoDB',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['Database Fundamentals'],
      skills: ['MongoDB', 'NoSQL', 'Document Databases', 'Mongoose']
    },
    {
      id: 'postgresql-advanced',
      name: 'PostgreSQL & Advanced SQL',
      description: 'Advanced relational database concepts with PostgreSQL',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['Database Fundamentals'],
      skills: ['PostgreSQL', 'Advanced SQL', 'Indexing', 'Performance Optimization']
    },
    {
      id: 'rest-api-design',
      name: 'REST API Design & Development',
      description: 'Building robust and scalable REST APIs',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 110,
      prerequisites: ['Node.js & Express', 'Database Fundamentals'],
      skills: ['REST Principles', 'API Design', 'HTTP Methods', 'Status Codes']
    },
    {
      id: 'graphql-basics',
      name: 'GraphQL Fundamentals',
      description: 'Query language for APIs and runtime for executing queries',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['REST API Design'],
      skills: ['GraphQL', 'Schemas', 'Resolvers', 'Queries', 'Mutations']
    },
    {
      id: 'authentication-security',
      name: 'Authentication & Security',
      description: 'Implementing secure authentication and authorization',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 150,
      prerequisites: ['REST API Design'],
      skills: ['JWT', 'OAuth', 'Password Hashing', 'Security Best Practices']
    },
    {
      id: 'microservices-architecture',
      name: 'Microservices Architecture',
      description: 'Designing and building microservices-based applications',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['REST API Design', 'Database Fundamentals'],
      skills: ['Microservices', 'Service Communication', 'API Gateway', 'Distributed Systems']
    },

    // ===== TESTING =====
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
    {
      id: 'jest-testing',
      name: 'Jest Testing Framework',
      description: 'Comprehensive testing with Jest',
      category: 'Testing',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['Testing Fundamentals'],
      skills: ['Jest', 'Test Suites', 'Mocking', 'Coverage Reports']
    },
    {
      id: 'e2e-testing',
      name: 'End-to-End Testing',
      description: 'Full application testing with Cypress and Playwright',
      category: 'Testing',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['Testing Fundamentals'],
      skills: ['Cypress', 'Playwright', 'E2E Testing', 'Test Automation']
    },
    {
      id: 'api-testing',
      name: 'API Testing & Integration Tests',
      description: 'Testing APIs and service integrations',
      category: 'Testing',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['Testing Fundamentals', 'REST API Design'],
      skills: ['API Testing', 'Integration Tests', 'Postman', 'Test Automation']
    },

    // ===== TOOLS & WORKFLOW =====
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
      id: 'github-workflow',
      name: 'GitHub & Collaboration',
      description: 'Advanced Git workflows and GitHub features',
      category: 'Tools',
      difficulty: 'intermediate',
      estimatedTime: 70,
      prerequisites: ['Git & Version Control'],
      skills: ['Pull Requests', 'Code Reviews', 'GitHub Actions', 'Project Management']
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
    },
    {
      id: 'vite-tooling',
      name: 'Vite & Modern Build Tools',
      description: 'Fast build tool and development server',
      category: 'Tools',
      difficulty: 'intermediate',
      estimatedTime: 60,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['Vite', 'Fast Builds', 'Hot Module Replacement', 'Plugin System']
    },
    {
      id: 'docker-containers',
      name: 'Docker & Containerization',
      description: 'Containerizing applications with Docker',
      category: 'Tools',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['Node.js & Express'],
      skills: ['Docker', 'Containers', 'Images', 'Docker Compose']
    },
    {
      id: 'ci-cd-pipelines',
      name: 'CI/CD Pipelines',
      description: 'Continuous integration and deployment workflows',
      category: 'Tools',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['Git & Version Control', 'Docker & Containerization'],
      skills: ['CI/CD', 'GitHub Actions', 'Automated Testing', 'Deployment']
    },

    // ===== FRONTEND FRAMEWORKS =====
    {
      id: 'vue-fundamentals',
      name: 'Vue.js Fundamentals',
      description: 'Progressive JavaScript framework for building user interfaces',
      category: 'Frontend Frameworks',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Vue Components', 'Directives', 'Vue Router', 'Vuex']
    },
    {
      id: 'angular-basics',
      name: 'Angular Fundamentals',
      description: 'TypeScript-based framework for building web applications',
      category: 'Frontend Frameworks',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['TypeScript Basics'],
      skills: ['Angular Components', 'Services', 'Dependency Injection', 'RxJS']
    },
    {
      id: 'svelte-basics',
      name: 'Svelte Fundamentals',
      description: 'Compile-time framework for building fast web applications',
      category: 'Frontend Frameworks',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Svelte Components', 'Reactivity', 'Stores', 'SvelteKit']
    },
    {
      id: 'nextjs-framework',
      name: 'Next.js Full-Stack Framework',
      description: 'React framework with server-side rendering and static generation',
      category: 'Frontend Frameworks',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['React Fundamentals', 'Node.js & Express'],
      skills: ['Next.js', 'SSR', 'Static Generation', 'API Routes']
    },

    // ===== MOBILE DEVELOPMENT =====
    {
      id: 'react-native-basics',
      name: 'React Native Fundamentals',
      description: 'Build native mobile apps using React',
      category: 'Mobile',
      difficulty: 'advanced',
      estimatedTime: 150,
      prerequisites: ['React Fundamentals'],
      skills: ['React Native', 'Mobile Components', 'Navigation', 'Platform APIs']
    },
    {
      id: 'flutter-dart',
      name: 'Flutter & Dart',
      description: 'Cross-platform mobile development with Flutter',
      category: 'Mobile',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Flutter', 'Dart', 'Widgets', 'State Management']
    },
    {
      id: 'pwa-development',
      name: 'Progressive Web Apps (PWA)',
      description: 'Building app-like experiences on the web',
      category: 'Mobile',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['JavaScript Fundamentals', 'Web APIs'],
      skills: ['Service Workers', 'Web App Manifest', 'Offline Functionality', 'Push Notifications']
    },

    // ===== DATA SCIENCE & AI =====
    {
      id: 'python-basics',
      name: 'Python Fundamentals',
      description: 'Learn Python programming from basics to intermediate concepts',
      category: 'Python',
      difficulty: 'beginner',
      estimatedTime: 140,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Python Syntax', 'Data Types', 'Functions', 'Object-Oriented Programming']
    },
    {
      id: 'data-analysis-pandas',
      name: 'Data Analysis with Pandas',
      description: 'Data manipulation and analysis using Python Pandas',
      category: 'Data Science',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['Python Fundamentals'],
      skills: ['Pandas', 'Data Manipulation', 'Data Cleaning', 'Data Analysis']
    },
    {
      id: 'machine-learning-basics',
      name: 'Machine Learning Fundamentals',
      description: 'Introduction to machine learning concepts and algorithms',
      category: 'Data Science',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['Python Fundamentals', 'Data Analysis with Pandas'],
      skills: ['ML Algorithms', 'Supervised Learning', 'Unsupervised Learning', 'Model Evaluation']
    },
    {
      id: 'data-visualization',
      name: 'Data Visualization',
      description: 'Creating compelling visualizations with D3.js and Chart.js',
      category: 'Data Science',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['D3.js', 'Chart.js', 'Data Visualization', 'Interactive Charts']
    },

    // ===== CYBERSECURITY =====
    {
      id: 'web-security-basics',
      name: 'Web Security Fundamentals',
      description: 'Essential web security concepts and best practices',
      category: 'Security',
      difficulty: 'intermediate',
      estimatedTime: 110,
      prerequisites: ['Web APIs & Fetch'],
      skills: ['HTTPS', 'XSS Prevention', 'CSRF Protection', 'Security Headers']
    },
    {
      id: 'owasp-top-10',
      name: 'OWASP Top 10 Security Risks',
      description: 'Understanding and mitigating the most critical web application security risks',
      category: 'Security',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['Web Security Fundamentals'],
      skills: ['OWASP', 'Vulnerability Assessment', 'Security Testing', 'Risk Mitigation']
    },
    {
      id: 'penetration-testing',
      name: 'Ethical Hacking & Penetration Testing',
      description: 'Learn ethical hacking techniques and penetration testing methodologies',
      category: 'Security',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['OWASP Top 10 Security Risks'],
      skills: ['Penetration Testing', 'Vulnerability Scanning', 'Ethical Hacking', 'Security Assessment']
    },

    // ===== CLOUD & DEVOPS =====
    {
      id: 'aws-basics',
      name: 'AWS Cloud Fundamentals',
      description: 'Introduction to Amazon Web Services and cloud computing',
      category: 'Cloud',
      difficulty: 'intermediate',
      estimatedTime: 140,
      prerequisites: ['Node.js & Express'],
      skills: ['AWS Services', 'EC2', 'S3', 'Lambda', 'Cloud Architecture']
    },
    {
      id: 'azure-fundamentals',
      name: 'Microsoft Azure Basics',
      description: 'Getting started with Microsoft Azure cloud platform',
      category: 'Cloud',
      difficulty: 'intermediate',
      estimatedTime: 130,
      prerequisites: ['Node.js & Express'],
      skills: ['Azure Services', 'Virtual Machines', 'App Services', 'Azure Functions']
    },
    {
      id: 'kubernetes-basics',
      name: 'Kubernetes Fundamentals',
      description: 'Container orchestration with Kubernetes',
      category: 'Cloud',
      difficulty: 'advanced',
      estimatedTime: 150,
      prerequisites: ['Docker & Containerization'],
      skills: ['Kubernetes', 'Pods', 'Services', 'Deployments', 'Container Orchestration']
    },
    {
      id: 'terraform-iac',
      name: 'Infrastructure as Code with Terraform',
      description: 'Managing cloud infrastructure with Terraform',
      category: 'Cloud',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['AWS Cloud Fundamentals'],
      skills: ['Terraform', 'Infrastructure as Code', 'Cloud Provisioning', 'State Management']
    },

    // ===== BLOCKCHAIN & WEB3 =====
    {
      id: 'blockchain-basics',
      name: 'Blockchain Fundamentals',
      description: 'Understanding blockchain technology and cryptocurrencies',
      category: 'Blockchain',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Blockchain', 'Cryptocurrency', 'Distributed Ledger', 'Consensus Mechanisms']
    },
    {
      id: 'ethereum-solidity',
      name: 'Ethereum & Solidity Development',
      description: 'Smart contract development on the Ethereum blockchain',
      category: 'Blockchain',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['Blockchain Fundamentals'],
      skills: ['Ethereum', 'Solidity', 'Smart Contracts', 'DApps']
    },
    {
      id: 'web3-development',
      name: 'Web3 & DApp Development',
      description: 'Building decentralized applications with Web3 technologies',
      category: 'Blockchain',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['Ethereum & Solidity Development', 'React Fundamentals'],
      skills: ['Web3.js', 'MetaMask Integration', 'DApp Frontend', 'Blockchain Interaction']
    },

    // ===== GAME DEVELOPMENT =====
    {
      id: 'unity-csharp',
      name: 'Unity Game Development with C#',
      description: 'Creating games using Unity engine and C# programming',
      category: 'Game Development',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Unity', 'C#', 'Game Physics', '3D Graphics', 'Game Logic']
    },
    {
      id: 'javascript-game-dev',
      name: 'JavaScript Game Development',
      description: 'Browser-based game development with JavaScript and Canvas',
      category: 'Game Development',
      difficulty: 'intermediate',
      estimatedTime: 130,
      prerequisites: ['JavaScript Fundamentals', 'DOM Manipulation'],
      skills: ['Canvas API', 'Game Loop', 'Collision Detection', 'Animation']
    },

    // ===== SPECIALIZED TOPICS =====
    {
      id: 'accessibility-a11y',
      name: 'Web Accessibility (A11y)',
      description: 'Creating inclusive web experiences for all users',
      category: 'Accessibility',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['CSS Fundamentals', 'JavaScript Fundamentals'],
      skills: ['WCAG Guidelines', 'Screen Readers', 'Keyboard Navigation', 'Semantic HTML']
    },
    {
      id: 'seo-optimization',
      name: 'SEO & Web Performance',
      description: 'Search engine optimization and web performance techniques',
      category: 'Performance',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['CSS Fundamentals', 'JavaScript Fundamentals'],
      skills: ['SEO', 'Core Web Vitals', 'Performance Optimization', 'Technical SEO']
    },
    {
      id: 'webgl-graphics',
      name: 'WebGL & 3D Graphics',
      description: 'Creating 3D graphics and visualizations in the browser',
      category: 'Graphics',
      difficulty: 'advanced',
      estimatedTime: 150,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['WebGL', '3D Graphics', 'Shaders', 'Three.js']
    },
    {
      id: 'iot-development',
      name: 'IoT Development with JavaScript',
      description: 'Internet of Things development using Node.js and hardware',
      category: 'IoT',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['Node.js & Express'],
      skills: ['IoT', 'Hardware Programming', 'Sensors', 'Real-time Communication']
    },
    {
      id: 'ar-vr-web',
      name: 'AR/VR Web Development',
      description: 'Augmented and Virtual Reality experiences on the web',
      category: 'AR/VR',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['WebGL & 3D Graphics'],
      skills: ['WebXR', 'A-Frame', 'AR.js', 'VR Development']
    }
  ];

  console.log('Firestore: Returning comprehensive catalog with', topics.length, 'topics across', new Set(topics.map(t => t.category)).size, 'categories');
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
    const weeklyProgress = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        completedAt: data.completedAt?.toDate() || new Date()
      };
    }) as Progress[];
    
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

    // Add sample learning goal (only if user has no existing goals)
    const existingGoals = await getLearningGoals(uid);
    if (existingGoals.length === 0) {
      await addLearningGoal(uid, {
        title: 'Master React Fundamentals',
        description: 'Learn React components, state, and props to build interactive web applications',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isCompleted: false,
        progress: 0,
        relatedTopics: ['React', 'JavaScript']
      });
      console.log('Firestore: Added sample learning goal');
    }

  } catch (error) {
    console.error('Firestore: Error initializing sample data:', error);
  }
};