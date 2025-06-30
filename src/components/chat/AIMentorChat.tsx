import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Send, Bot, User, Lightbulb, Code, Book, ArrowLeft, Sparkles, Clock, Target, Brain, MessageSquare, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { ChatMessage, ChatSession } from '../../types';
import { addProgress } from '../../services/firestore';
import { memoryService, MemoryEvent } from '../../services/memoryService';
import { mistralService } from '../../services/mistralService';
import { 
  createChatSession, 
  addChatMessage, 
  getChatSessions, 
  getChatMessages, 
  deleteChatSession,
  updateChatSessionTitle 
} from '../../services/firestore';
import RecommendedResources from './RecommendedResources';

const AIMentorChat: React.FC = () => {
  const { currentUser, userProfile, userProgress, userPreferences, weeklyPlan } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [resourceFeedback, setResourceFeedback] = useState<Record<string, boolean>>({});
  const [memoryContext, setMemoryContext] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionList, setShowSessionList] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on component mount
  useEffect(() => {
    if (currentUser) {
      loadChatSessions();
    }
  }, [currentUser]);

  // Initialize with greeting message when starting a new session
  useEffect(() => {
    if (userProfile && messages.length === 0 && !currentSessionId) {
      const greetingMessage = generateGreeting();
      setMessages([{
        id: '1',
        content: greetingMessage,
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true,
        memoryEnhanced: false,
        mistralPowered: mistralService.isConfigured()
      }]);
    }
  }, [userProfile, currentSessionId]);

  const loadChatSessions = async () => {
    if (!currentUser) return;
    
    setIsLoadingSessions(true);
    try {
      const sessions = await getChatSessions(currentUser.uid);
      setChatSessions(sessions);
      console.log('Loaded', sessions.length, 'chat sessions');
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    if (!currentUser) return;
    
    setIsLoadingMessages(true);
    try {
      const sessionMessages = await getChatMessages(currentUser.uid, sessionId);
      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
      setShowSessionList(false);
      console.log('Loaded', sessionMessages.length, 'messages from session', sessionId);
    } catch (error) {
      console.error('Error loading chat session:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createNewSession = async () => {
    if (!currentUser) return;
    
    try {
      const sessionId = await createChatSession(currentUser.uid);
      setCurrentSessionId(sessionId);
      setMessages([]);
      setShowSessionList(false);
      
      // Add greeting message to new session
      const greetingMessage = generateGreeting();
      const greetingChatMessage: ChatMessage = {
        id: '1',
        content: greetingMessage,
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true,
        memoryEnhanced: false,
        mistralPowered: mistralService.isConfigured()
      };
      
      setMessages([greetingChatMessage]);
      
      // Save greeting to Firebase
      await addChatMessage(currentUser.uid, sessionId, {
        content: greetingMessage,
        sender: 'ai',
        adaptedToLevel: true,
        memoryEnhanced: false,
        mistralPowered: mistralService.isConfigured()
      });
      
      // Refresh sessions list
      await loadChatSessions();
      
      console.log('Created new chat session:', sessionId);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteChatSession(currentUser.uid, sessionId);
      
      // If we're currently viewing this session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      
      // Refresh sessions list
      await loadChatSessions();
      
      console.log('Deleted chat session:', sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    if (!currentUser || !newTitle.trim()) return;
    
    try {
      await updateChatSessionTitle(currentUser.uid, sessionId, newTitle.trim());
      
      // Update local state
      setChatSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle.trim() }
          : session
      ));
      
      setEditingSessionId(null);
      setEditingTitle('');
      
      console.log('Updated session title:', sessionId, newTitle);
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const generateGreeting = (): string => {
    const name = userProfile?.displayName || 'there';
    const level = userProfile?.skillLevel || 'beginner';
    const completedTopics = userProgress?.length || 0;
    const recentTopic = userProgress?.[0]?.topicName;
    
    let greeting = `Hi ${name}! 👋 I'm your AI mentor powered by Mistral AI, and I'm excited to help you on your learning journey.\n\n`;
    
    if (completedTopics > 0) {
      greeting += `I can see you've completed ${completedTopics} topics so far - that's fantastic progress! `;
      if (recentTopic) {
        greeting += `I noticed you recently worked on "${recentTopic}". `;
      }
    }
    
    greeting += `As a ${level} learner, I'll tailor my explanations and suggestions to match your current skill level.\n\n`;
    
    if (userProfile?.preferredTopics?.length) {
      greeting += `I see you're interested in ${userProfile.preferredTopics.slice(0, 3).join(', ')}. `;
    }
    
    greeting += `I have memory capabilities and can provide consistent, personalized guidance based on your learning history.\n\nWhat would you like to explore today? I can help with:\n• Explaining concepts\n• Code reviews and debugging\n• Learning path recommendations\n• Practice exercises\n\nJust ask me anything! 🚀`;
    
    return greeting;
  };

  const extractSearchQuery = (message: string): string => {
    // Extract key terms for resource search
    const lowerMessage = message.toLowerCase();
    
    // Common programming topics and their search terms
    const topicMappings: Record<string, string> = {
      'react hooks': 'react hooks useState useEffect',
      'javascript async': 'javascript async await promises',
      'css grid': 'css grid layout responsive',
      'typescript': 'typescript types interfaces',
      'node.js': 'nodejs backend server',
      'python': 'python programming basics',
      'git': 'git version control github',
      'database': 'database sql mongodb',
      'api': 'api rest graphql',
      'testing': 'testing jest unit integration'
    };
    
    // Check for direct topic matches
    for (const [topic, searchTerms] of Object.entries(topicMappings)) {
      if (lowerMessage.includes(topic)) {
        return searchTerms;
      }
    }
    
    // Extract programming-related keywords
    const programmingKeywords = [
      'react', 'javascript', 'typescript', 'python', 'css', 'html', 'node',
      'hooks', 'async', 'await', 'promise', 'function', 'component', 'state',
      'props', 'api', 'database', 'git', 'testing', 'debug', 'error'
    ];
    
    const foundKeywords = programmingKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (foundKeywords.length > 0) {
      return foundKeywords.slice(0, 3).join(' ');
    }
    
    // Fallback: use the original message if it contains question words
    if (lowerMessage.includes('how') || lowerMessage.includes('what') || 
        lowerMessage.includes('why') || lowerMessage.includes('explain')) {
      return message;
    }
    
    return '';
  };

  const getContextualResponse = async (userMessage: string): Promise<string> => {
    const level = userProfile?.skillLevel || 'beginner';
    const completedTopics = (userProgress || []).map(p => p.topicName);
    const averageScore = userProgress && userProgress.length > 0 
      ? userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length 
      : 0;

    // Retrieve relevant memories from Pinecone
    let memoryContextString = '';
    if (currentUser) {
      try {
        const topic = memoryService.extractTopicFromMessage(userMessage);
        const relevantMemories = await memoryService.retrieveRelevantMemories(
          currentUser.uid,
          userMessage,
          topic,
          3
        );
        memoryContextString = memoryService.formatMemoriesForContext(relevantMemories);
        setMemoryContext(memoryContextString);
      } catch (error) {
        console.error('Error retrieving memories:', error);
      }
    }
    
    try {
      // Use Mistral AI for personalized response
      const response = await mistralService.generatePersonalizedResponse(
        userMessage,
        {
          skillLevel: level,
          completedTopics,
          averageScore,
          memoryContext: memoryContextString
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback to rule-based response
      return generateFallbackResponse(userMessage, level, completedTopics, averageScore);
    }
  };

  const generateFallbackResponse = (
    userMessage: string, 
    level: string, 
    completedTopics: string[], 
    averageScore: number
  ): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Analyze user's question type
    const isConceptQuestion = lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('how does');
    const isCodeQuestion = lowerMessage.includes('code') || lowerMessage.includes('function') || lowerMessage.includes('syntax');
    const isProgressQuestion = lowerMessage.includes('progress') || lowerMessage.includes('next') || lowerMessage.includes('should i');
    
    let response = '';
    
    if (isProgressQuestion) {
      response = `You've completed ${completedTopics.length} topics with an average score of ${Math.round(averageScore)}%. `;
      if (averageScore >= 80) {
        response += "You're doing excellent work! Consider tackling more advanced topics.";
      } else if (averageScore >= 60) {
        response += "You're making good progress. Focus on practicing the concepts you've learned.";
      } else {
        response += "Let's strengthen your foundation with some review and practice.";
      }
    } else if (isConceptQuestion) {
      if (level === 'beginner') {
        response = "Let me explain this in simple terms with a practical example. Think of it like...";
      } else if (level === 'intermediate') {
        response = "This is a great concept to master! Here's how it works and why it's important...";
      } else {
        response = "Excellent question! Let's dive into the technical details and explore some advanced patterns...";
      }
    } else if (isCodeQuestion) {
      if (level === 'beginner') {
        response = "Let's break this down step by step. I'll show you a simple example and explain each part...";
      } else if (level === 'intermediate') {
        response = "Good question! Here's how you can approach this, along with some best practices...";
      } else {
        response = "Let's explore this with a comprehensive example, including edge cases and optimization techniques...";
      }
    } else {
      response = `That's a thoughtful question! Based on your ${level} level and progress with ${completedTopics.length} completed topics, let me provide you with a tailored explanation.`;
    }
    
    // Add memory context if available
    if (memoryContext) {
      response += `\n\n🧠 **Building on our previous conversations:** I remember we've discussed similar topics before, which helps me provide more consistent guidance tailored to your learning journey.`;
    }
    
    return response;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentUser) return;

    // If no current session, create one
    if (!currentSessionId) {
      await createNewSession();
      // Wait a bit for the session to be created
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      adaptedToLevel: false,
      memoryEnhanced: false,
      mistralPowered: false
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Extract search query for RAG resources
    const searchQuery = extractSearchQuery(currentMessage);
    setCurrentQuery(searchQuery);

    try {
      // Save user message to Firebase
      if (currentSessionId) {
        await addChatMessage(currentUser.uid, currentSessionId, {
          content: currentMessage,
          sender: 'user',
          adaptedToLevel: false,
          memoryEnhanced: false,
          mistralPowered: false
        });
      }

      const aiResponseContent = await getContextualResponse(currentMessage);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true,
        memoryEnhanced: !!memoryContext,
        mistralPowered: mistralService.isConfigured()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Save AI response to Firebase
      if (currentSessionId) {
        await addChatMessage(currentUser.uid, currentSessionId, {
          content: aiResponseContent,
          sender: 'ai',
          adaptedToLevel: true,
          memoryEnhanced: !!memoryContext,
          mistralPowered: mistralService.isConfigured()
        });
      }

      // Store this interaction in memory for future reference
      if (currentUser && userProfile) {
        try {
          const topic = memoryService.extractTopicFromMessage(currentMessage);
          const sentiment = memoryService.extractSentiment(currentMessage);
          
          const memoryEvent: MemoryEvent = {
            userId: currentUser.uid,
            question: currentMessage,
            topic: topic,
            response: aiResponseContent,
            skillLevel: userProfile.skillLevel,
            category: topic,
            sentiment: sentiment,
            difficulty: userProfile.skillLevel
          };

          await memoryService.storeMemory(memoryEvent);
          console.log('Interaction stored in memory system');
        } catch (error) {
          console.error('Error storing memory:', error);
        }
      }

      // Track interaction as progress (optional)
      if (currentUser && Math.random() > 0.7) { // 30% chance to log as learning activity
        addProgress(currentUser.uid, {
          topicId: 'ai-chat',
          topicName: 'AI Mentor Session',
          score: 100,
          timeSpent: 5,
          difficulty: userProfile?.skillLevel || 'beginner',
          category: 'mentoring'
        }).catch(console.error);
      }

      // Refresh sessions list to update message count
      await loadChatSessions();
    } catch (error) {
      console.error('Error in chat response:', error);
      
      // Fallback error message
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble generating a response right now. Please try rephrasing your question or ask about a specific programming topic.",
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true,
        memoryEnhanced: false,
        mistralPowered: false
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResourceFeedback = (resourceId: string, helpful: boolean) => {
    setResourceFeedback(prev => ({ ...prev, [resourceId]: helpful }));
    
    // In a real implementation, this would send feedback to your analytics system
    console.log(`Resource ${resourceId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
    
    // You could also track this in Firestore for improving future recommendations
    if (currentUser) {
      // addResourceFeedback(currentUser.uid, resourceId, helpful);
    }
  };

  const quickPrompts = [
    { text: "Explain a concept", icon: Lightbulb },
    { text: "Help with my code", icon: Code },
    { text: "What should I learn next?", icon: Target },
    { text: "Recommend resources", icon: Book }
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  const formatSessionDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Sidebar for Chat Sessions */}
      <div className={`${showSessionList ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className={`font-semibold transition-colors ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Chat History
              </h2>
              <button
                onClick={() => setShowSessionList(false)}
                className={`p-1 rounded transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={createNewSession}
              className="w-full mt-3 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingSessions ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className={`text-sm mt-2 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Loading sessions...
                </p>
              </div>
            ) : chatSessions.length > 0 ? (
              <div className="p-2 space-y-1">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? isDark 
                          ? 'bg-indigo-900/50 border border-indigo-700' 
                          : 'bg-indigo-50 border border-indigo-200'
                        : isDark 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => loadChatSession(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingSessionId === session.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateSessionTitle(session.id, editingTitle);
                                }
                              }}
                              className={`flex-1 px-2 py-1 text-sm border rounded ${
                                isDark 
                                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSessionTitle(session.id, editingTitle);
                              }}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(null);
                                setEditingTitle('');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <h3 className={`font-medium text-sm truncate transition-colors ${
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {session.title}
                          </h3>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {session.messageCount} messages
                          </p>
                          <p className={`text-xs transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatSessionDate(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                            setEditingTitle(session.title);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-blue-400' 
                              : 'text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-red-400' 
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <MessageSquare className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                  isDark ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No chat history yet
                </p>
                <p className={`text-xs mt-1 transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Start a conversation to see it here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`shadow-sm border-b px-6 py-4 transition-colors ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-semibold flex items-center transition-colors ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    AI Mentor
                    <Sparkles className="w-5 h-5 text-indigo-500 ml-2" />
                    <Brain className="w-5 h-5 text-purple-500 ml-1" />
                  </h1>
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Powered by Mistral AI • {userProfile?.skillLevel} level • {userProgress?.length || 0} topics completed • Memory-enhanced
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSessionList(!showSessionList)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Chat History</span>
              </button>
              
              <div className={`flex items-center space-x-4 text-sm transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Always available</span>
                </div>
                {memoryContext && (
                  <div className="flex items-center text-purple-600">
                    <Brain className="w-4 h-4 mr-1" />
                    <span>Memory active</span>
                  </div>
                )}
                {mistralService.isConfigured() && (
                  <div className="flex items-center text-emerald-600">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span>Mistral AI</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className={`transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Loading conversation...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl flex items-start space-x-3 ${
                          message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.sender === 'user'
                              ? 'bg-indigo-600'
                              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          }`}
                        >
                          {message.sender === 'user' ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <Bot className="w-5 h-5 text-white" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div
                          className={`px-6 py-4 rounded-2xl shadow-sm transition-colors ${
                            message.sender === 'user'
                              ? 'bg-indigo-600 text-white'
                              : isDark 
                                ? 'bg-gray-800 border border-gray-700'
                                : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none">
                            <p className={`whitespace-pre-wrap ${
                              message.sender === 'user' 
                                ? 'text-white' 
                                : isDark ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                              {message.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-opacity-20">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs ${
                                message.sender === 'user' 
                                  ? 'text-indigo-200' 
                                  : isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {message.adaptedToLevel && (
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                                  ✨ Adapted to your level
                                </span>
                              )}
                              {message.sender === 'ai' && message.memoryEnhanced && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                                  🧠 Memory-enhanced
                                </span>
                              )}
                              {message.sender === 'ai' && message.mistralPowered && (
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                                  🤖 Mistral AI
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Show RAG Resources after AI responses */}
                    {message.sender === 'ai' && index === messages.length - 1 && currentQuery && (
                      <RecommendedResources
                        query={currentQuery}
                        userLevel={userProfile?.skillLevel || 'beginner'}
                        onFeedback={handleResourceFeedback}
                      />
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className={`px-6 py-4 rounded-2xl shadow-sm transition-colors ${
                        isDark 
                          ? 'bg-gray-800 border border-gray-700' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className={`text-sm transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Mistral AI is thinking and accessing memory...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Quick Prompts */}
            {messages.length <= 1 && !currentSessionId && (
              <div className={`px-6 py-4 border-t transition-colors ${
                isDark 
                  ? 'border-gray-700 bg-gray-800' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <p className={`text-sm mb-3 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Quick prompts to get started:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, index) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        className={`flex items-center px-4 py-2 border rounded-lg transition-colors text-sm ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-indigo-500 text-gray-300' 
                            : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-indigo-300 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mr-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        {prompt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className={`px-6 py-4 border-t transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask me anything about programming, learning, or your progress..."
                    className={`w-full px-6 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-500 transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    disabled={isTyping}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className={`text-xs mt-2 text-center transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                AI responses are powered by Mistral AI, personalized, memory-enhanced, and include RAG-powered resource recommendations. Chat history is automatically saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentorChat;