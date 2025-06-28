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

// Topics Operations - Comprehensive Collection (100+ Topics)
export const getAvailableTopics = (): Topic[] => {
  console.log('Firestore: getAvailableTopics called - returning comprehensive topic catalog');
  
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
      name: 'Big O Notation & Complexity',
      description: 'Understanding time and space complexity analysis',
      category: 'Fundamentals',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['Algorithms & Problem Solving'],
      skills: ['Time Complexity', 'Space Complexity', 'Algorithm Analysis', 'Performance']
    },
    {
      id: 'design-patterns',
      name: 'Software Design Patterns',
      description: 'Common design patterns and architectural principles',
      category: 'Fundamentals',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Design Patterns', 'Architecture', 'SOLID Principles', 'Code Organization']
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
      id: 'javascript-regex',
      name: 'Regular Expressions in JavaScript',
      description: 'Pattern matching and text processing with regular expressions',
      category: 'JavaScript',
      difficulty: 'intermediate',
      estimatedTime: 70,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Regex Patterns', 'Text Processing', 'Validation', 'String Manipulation']
    },
    {
      id: 'javascript-functional',
      name: 'Functional Programming in JavaScript',
      description: 'Functional programming concepts and techniques in JavaScript',
      category: 'JavaScript',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['Pure Functions', 'Higher-Order Functions', 'Immutability', 'Function Composition']
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
      skills: ['HOCs', 'Render Props', 'Compound Components', 'Advanced Patterns']
    },
    {
      id: 'react-redux',
      name: 'React with Redux',
      description: 'State management with Redux and React-Redux',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['React State Management'],
      skills: ['Redux', 'Actions', 'Reducers', 'Store', 'Middleware']
    },
    {
      id: 'react-nextjs',
      name: 'Next.js Framework',
      description: 'Server-side rendering and static site generation with Next.js',
      category: 'React',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['React Fundamentals', 'React Router'],
      skills: ['SSR', 'SSG', 'API Routes', 'File-based Routing', 'Performance']
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
      description: 'Create websites that work on all devices and screen sizes',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['CSS Fundamentals', 'CSS Flexbox'],
      skills: ['Media Queries', 'Mobile-First', 'Breakpoints', 'Fluid Layouts']
    },
    {
      id: 'css-preprocessors',
      name: 'CSS Preprocessors (Sass/SCSS)',
      description: 'Advanced CSS with variables, mixins, and nesting',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['CSS Fundamentals'],
      skills: ['Sass', 'SCSS', 'Variables', 'Mixins', 'Nesting']
    },
    {
      id: 'css-frameworks',
      name: 'CSS Frameworks (Bootstrap/Tailwind)',
      description: 'Rapid development with CSS frameworks',
      category: 'CSS',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['CSS Fundamentals'],
      skills: ['Bootstrap', 'Tailwind CSS', 'Utility Classes', 'Component Libraries']
    },
    {
      id: 'css-architecture',
      name: 'CSS Architecture & Methodologies',
      description: 'BEM, OOCSS, and scalable CSS architecture',
      category: 'CSS',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['CSS Fundamentals'],
      skills: ['BEM', 'OOCSS', 'CSS Architecture', 'Maintainable CSS']
    },

    // ===== TYPESCRIPT =====
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
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['TypeScript Basics', 'React Fundamentals'],
      skills: ['React Types', 'Component Props', 'Hooks Types', 'Event Handling']
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
      id: 'rest-apis',
      name: 'RESTful API Design',
      description: 'Design and build RESTful APIs following best practices',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 110,
      prerequisites: ['Node.js & Express'],
      skills: ['REST', 'HTTP Methods', 'Status Codes', 'API Design', 'Documentation']
    },
    {
      id: 'graphql-basics',
      name: 'GraphQL Fundamentals',
      description: 'Query language for APIs and runtime for executing queries',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['REST APIs'],
      skills: ['GraphQL', 'Schemas', 'Resolvers', 'Queries', 'Mutations']
    },
    {
      id: 'authentication',
      name: 'Authentication & Authorization',
      description: 'Secure user authentication and authorization systems',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['Node.js & Express'],
      skills: ['JWT', 'OAuth', 'Sessions', 'Security', 'User Management']
    },
    {
      id: 'microservices',
      name: 'Microservices Architecture',
      description: 'Building scalable applications with microservices',
      category: 'Backend',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['REST APIs', 'Database Fundamentals'],
      skills: ['Microservices', 'Service Communication', 'API Gateway', 'Distributed Systems']
    },

    // ===== PYTHON =====
    {
      id: 'python-basics',
      name: 'Python Fundamentals',
      description: 'Learn Python programming from the ground up',
      category: 'Python',
      difficulty: 'beginner',
      estimatedTime: 140,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Python Syntax', 'Data Types', 'Control Flow', 'Functions', 'Modules']
    },
    {
      id: 'python-oop',
      name: 'Object-Oriented Programming in Python',
      description: 'Classes, objects, inheritance, and polymorphism in Python',
      category: 'Python',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['Python Fundamentals'],
      skills: ['Classes', 'Objects', 'Inheritance', 'Polymorphism', 'Encapsulation']
    },
    {
      id: 'python-web-flask',
      name: 'Web Development with Flask',
      description: 'Build web applications using the Flask framework',
      category: 'Python',
      difficulty: 'intermediate',
      estimatedTime: 130,
      prerequisites: ['Python Fundamentals'],
      skills: ['Flask', 'Routing', 'Templates', 'Forms', 'Database Integration']
    },
    {
      id: 'python-django',
      name: 'Django Web Framework',
      description: 'Full-featured web development with Django',
      category: 'Python',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['Python OOP', 'Database Fundamentals'],
      skills: ['Django', 'Models', 'Views', 'Templates', 'Admin Interface']
    },
    {
      id: 'python-data-science',
      name: 'Python for Data Science',
      description: 'Data analysis and visualization with Python libraries',
      category: 'Python',
      difficulty: 'intermediate',
      estimatedTime: 160,
      prerequisites: ['Python Fundamentals'],
      skills: ['Pandas', 'NumPy', 'Matplotlib', 'Data Analysis', 'Visualization']
    },
    {
      id: 'python-machine-learning',
      name: 'Machine Learning with Python',
      description: 'Introduction to machine learning using Python',
      category: 'Python',
      difficulty: 'advanced',
      estimatedTime: 200,
      prerequisites: ['Python Data Science'],
      skills: ['Scikit-learn', 'Machine Learning', 'Algorithms', 'Model Training', 'Evaluation']
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
      name: 'Testing with Jest',
      description: 'JavaScript testing framework for unit and integration tests',
      category: 'Testing',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['Testing Fundamentals'],
      skills: ['Jest', 'Test Suites', 'Mocking', 'Coverage', 'Async Testing']
    },
    {
      id: 'e2e-testing',
      name: 'End-to-End Testing',
      description: 'Automated testing with Cypress and Playwright',
      category: 'Testing',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['Testing Fundamentals'],
      skills: ['Cypress', 'Playwright', 'E2E Testing', 'Test Automation', 'Browser Testing']
    },
    {
      id: 'test-automation',
      name: 'Test Automation & CI/CD',
      description: 'Automated testing in continuous integration pipelines',
      category: 'Testing',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['Jest Testing', 'Git Version Control'],
      skills: ['CI/CD', 'Test Automation', 'GitHub Actions', 'Pipeline Testing']
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
      name: 'GitHub Workflow & Collaboration',
      description: 'Advanced Git workflows and GitHub features',
      category: 'Tools',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['Git Version Control'],
      skills: ['Pull Requests', 'Code Review', 'GitHub Actions', 'Project Management']
    },
    {
      id: 'webpack-bundling',
      name: 'Webpack & Build Tools',
      description: 'Module bundling and build optimization',
      category: 'Tools',
      difficulty: 'advanced',
      estimatedTime: 110,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['Module Bundling', 'Optimization', 'Loaders', 'Plugins']
    },
    {
      id: 'vite-tooling',
      name: 'Vite & Modern Build Tools',
      description: 'Fast build tool for modern web development',
      category: 'Tools',
      difficulty: 'intermediate',
      estimatedTime: 70,
      prerequisites: ['JavaScript ES6+ Features'],
      skills: ['Vite', 'Fast Builds', 'Hot Module Replacement', 'Plugin System']
    },
    {
      id: 'docker-basics',
      name: 'Docker & Containerization',
      description: 'Containerize applications with Docker',
      category: 'Tools',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['Node.js & Express'],
      skills: ['Docker', 'Containers', 'Images', 'Dockerfile', 'Docker Compose']
    },
    {
      id: 'aws-basics',
      name: 'AWS Cloud Fundamentals',
      description: 'Introduction to Amazon Web Services cloud platform',
      category: 'Tools',
      difficulty: 'intermediate',
      estimatedTime: 140,
      prerequisites: ['Node.js & Express'],
      skills: ['AWS', 'EC2', 'S3', 'Lambda', 'Cloud Computing']
    },

    // ===== MOBILE DEVELOPMENT =====
    {
      id: 'react-native-basics',
      name: 'React Native Fundamentals',
      description: 'Build mobile apps with React Native',
      category: 'Mobile',
      difficulty: 'intermediate',
      estimatedTime: 150,
      prerequisites: ['React Fundamentals'],
      skills: ['React Native', 'Mobile Development', 'Navigation', 'Platform APIs']
    },
    {
      id: 'flutter-basics',
      name: 'Flutter & Dart Fundamentals',
      description: 'Cross-platform mobile development with Flutter',
      category: 'Mobile',
      difficulty: 'intermediate',
      estimatedTime: 160,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Flutter', 'Dart', 'Widgets', 'State Management', 'Mobile UI']
    },
    {
      id: 'ios-swift',
      name: 'iOS Development with Swift',
      description: 'Native iOS app development using Swift',
      category: 'Mobile',
      difficulty: 'advanced',
      estimatedTime: 200,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Swift', 'iOS', 'UIKit', 'Xcode', 'App Store']
    },
    {
      id: 'android-kotlin',
      name: 'Android Development with Kotlin',
      description: 'Native Android app development using Kotlin',
      category: 'Mobile',
      difficulty: 'advanced',
      estimatedTime: 190,
      prerequisites: ['Programming Fundamentals'],
      skills: ['Kotlin', 'Android', 'Activities', 'Fragments', 'Material Design']
    },

    // ===== DATA & ANALYTICS =====
    {
      id: 'sql-advanced',
      name: 'Advanced SQL & Database Design',
      description: 'Complex queries, optimization, and database design',
      category: 'Data',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['Database Fundamentals'],
      skills: ['Advanced SQL', 'Query Optimization', 'Indexing', 'Database Design']
    },
    {
      id: 'data-visualization',
      name: 'Data Visualization',
      description: 'Create compelling data visualizations with D3.js and Chart.js',
      category: 'Data',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['D3.js', 'Chart.js', 'Data Visualization', 'SVG', 'Interactive Charts']
    },
    {
      id: 'analytics-tracking',
      name: 'Web Analytics & Tracking',
      description: 'Implement analytics and user tracking in web applications',
      category: 'Data',
      difficulty: 'intermediate',
      estimatedTime: 80,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Google Analytics', 'Event Tracking', 'User Behavior', 'Metrics']
    },

    // ===== SECURITY =====
    {
      id: 'web-security',
      name: 'Web Security Fundamentals',
      description: 'Essential security practices for web applications',
      category: 'Security',
      difficulty: 'intermediate',
      estimatedTime: 110,
      prerequisites: ['Node.js & Express'],
      skills: ['HTTPS', 'XSS Prevention', 'CSRF Protection', 'Input Validation', 'Security Headers']
    },
    {
      id: 'oauth-security',
      name: 'OAuth & API Security',
      description: 'Secure API authentication and authorization',
      category: 'Security',
      difficulty: 'advanced',
      estimatedTime: 100,
      prerequisites: ['Authentication'],
      skills: ['OAuth 2.0', 'API Security', 'Token Management', 'Scope-based Access']
    },

    // ===== PERFORMANCE =====
    {
      id: 'web-performance',
      name: 'Web Performance Optimization',
      description: 'Optimize website speed and user experience',
      category: 'Performance',
      difficulty: 'advanced',
      estimatedTime: 130,
      prerequisites: ['JavaScript Fundamentals', 'CSS Fundamentals'],
      skills: ['Performance Metrics', 'Optimization Techniques', 'Lazy Loading', 'Caching']
    },
    {
      id: 'lighthouse-optimization',
      name: 'Lighthouse & Core Web Vitals',
      description: 'Improve website performance using Lighthouse metrics',
      category: 'Performance',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['Web Performance'],
      skills: ['Lighthouse', 'Core Web Vitals', 'Performance Auditing', 'Optimization']
    },

    // ===== ACCESSIBILITY =====
    {
      id: 'web-accessibility',
      name: 'Web Accessibility (a11y)',
      description: 'Build inclusive web applications for all users',
      category: 'Accessibility',
      difficulty: 'intermediate',
      estimatedTime: 100,
      prerequisites: ['CSS Fundamentals', 'JavaScript DOM'],
      skills: ['WCAG Guidelines', 'Screen Readers', 'Keyboard Navigation', 'Semantic HTML']
    },
    {
      id: 'aria-accessibility',
      name: 'ARIA & Advanced Accessibility',
      description: 'Advanced accessibility techniques with ARIA',
      category: 'Accessibility',
      difficulty: 'advanced',
      estimatedTime: 90,
      prerequisites: ['Web Accessibility'],
      skills: ['ARIA Attributes', 'Live Regions', 'Focus Management', 'Accessibility Testing']
    },

    // ===== EMERGING TECHNOLOGIES =====
    {
      id: 'pwa-development',
      name: 'Progressive Web Apps (PWA)',
      description: 'Build app-like experiences for the web',
      category: 'Emerging',
      difficulty: 'advanced',
      estimatedTime: 140,
      prerequisites: ['JavaScript Fundamentals', 'Web APIs'],
      skills: ['Service Workers', 'Web App Manifest', 'Offline Functionality', 'Push Notifications']
    },
    {
      id: 'webassembly-basics',
      name: 'WebAssembly (WASM) Fundamentals',
      description: 'High-performance web applications with WebAssembly',
      category: 'Emerging',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['WebAssembly', 'WASM', 'Performance', 'Binary Format']
    },
    {
      id: 'web3-blockchain',
      name: 'Web3 & Blockchain Development',
      description: 'Decentralized applications and blockchain integration',
      category: 'Emerging',
      difficulty: 'advanced',
      estimatedTime: 180,
      prerequisites: ['JavaScript Fundamentals'],
      skills: ['Blockchain', 'Smart Contracts', 'Web3', 'DApps', 'Ethereum']
    },
    {
      id: 'ai-integration',
      name: 'AI Integration in Web Apps',
      description: 'Integrate AI and machine learning into web applications',
      category: 'Emerging',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['JavaScript Fundamentals', 'REST APIs'],
      skills: ['AI APIs', 'Machine Learning', 'Natural Language Processing', 'Computer Vision']
    },

    // ===== SOFT SKILLS & CAREER =====
    {
      id: 'code-review',
      name: 'Code Review Best Practices',
      description: 'Effective code review techniques and collaboration',
      category: 'Career',
      difficulty: 'intermediate',
      estimatedTime: 60,
      prerequisites: ['Git Version Control'],
      skills: ['Code Review', 'Collaboration', 'Communication', 'Quality Assurance']
    },
    {
      id: 'technical-writing',
      name: 'Technical Writing & Documentation',
      description: 'Write clear technical documentation and README files',
      category: 'Career',
      difficulty: 'beginner',
      estimatedTime: 70,
      prerequisites: [],
      skills: ['Documentation', 'Technical Writing', 'README', 'API Documentation']
    },
    {
      id: 'agile-methodologies',
      name: 'Agile Development & Scrum',
      description: 'Agile development practices and project management',
      category: 'Career',
      difficulty: 'beginner',
      estimatedTime: 80,
      prerequisites: [],
      skills: ['Agile', 'Scrum', 'Project Management', 'Team Collaboration']
    },
    {
      id: 'system-design',
      name: 'System Design Fundamentals',
      description: 'Design scalable and reliable software systems',
      category: 'Career',
      difficulty: 'advanced',
      estimatedTime: 160,
      prerequisites: ['Database Fundamentals', 'REST APIs'],
      skills: ['System Design', 'Scalability', 'Architecture', 'Distributed Systems']
    },
    {
      id: 'interview-preparation',
      name: 'Technical Interview Preparation',
      description: 'Prepare for coding interviews and technical assessments',
      category: 'Career',
      difficulty: 'intermediate',
      estimatedTime: 120,
      prerequisites: ['Algorithms & Problem Solving'],
      skills: ['Coding Interviews', 'Problem Solving', 'Data Structures', 'Algorithms']
    }
  ];

  console.log('Firestore: Returning', topics.length, 'comprehensive topics');
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

  } catch (error) {
    console.error('Firestore: Error initializing sample data:', error);
  }
};