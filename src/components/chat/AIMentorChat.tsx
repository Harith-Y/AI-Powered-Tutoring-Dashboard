import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, Bot, User, Lightbulb, Code, Book, ArrowLeft, Sparkles, Clock, Target, Brain } from 'lucide-react';
import { ChatMessage } from '../../types';
import { addProgress } from '../../services/firestore';
import { memoryService, MemoryEvent } from '../../services/memoryService';
import { mistralService } from '../../services/mistralService';
import RecommendedResources from './RecommendedResources';

const AIMentorChat: React.FC = () => {
  const { currentUser, userProfile, userProgress, userPreferences, weeklyPlan } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [resourceFeedback, setResourceFeedback] = useState<Record<string, boolean>>({});
  const [memoryContext, setMemoryContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with greeting message
    if (userProfile && messages.length === 0) {
      const greetingMessage = generateGreeting();
      setMessages([{
        id: '1',
        content: greetingMessage,
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true
      }]);
    }
  }, [userProfile]);

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
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Extract search query for RAG resources
    const searchQuery = extractSearchQuery(currentMessage);
    setCurrentQuery(searchQuery);

    try {
      const aiResponseContent = await getContextualResponse(currentMessage);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true
      };

      setMessages(prev => [...prev, aiResponse]);

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
    } catch (error) {
      console.error('Error in chat response:', error);
      
      // Fallback error message
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble generating a response right now. Please try rephrasing your question or ask about a specific programming topic.",
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                  AI Mentor
                  <Sparkles className="w-5 h-5 text-indigo-500 ml-2" />
                  <Brain className="w-5 h-5 text-purple-500 ml-1" />
                </h1>
                <p className="text-sm text-gray-500">
                  Powered by Mistral AI • {userProfile?.skillLevel} level • {userProgress?.length || 0} topics completed • Memory-enhanced
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
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

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
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
                      className={`px-6 py-4 rounded-2xl shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none">
                        <p className={`whitespace-pre-wrap ${message.sender === 'user' ? 'text-white' : 'text-gray-900'}`}>
                          {message.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-opacity-20">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.adaptedToLevel && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                              ✨ Adapted to your level
                            </span>
                          )}
                          {message.sender === 'ai' && memoryContext && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              🧠 Memory-enhanced
                            </span>
                          )}
                          {message.sender === 'ai' && mistralService.isConfigured() && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
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
                  <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Mistral AI is thinking and accessing memory...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Quick prompts to get started:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors text-sm"
                    >
                      <Icon className="w-4 h-4 mr-2 text-gray-500" />
                      {prompt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything about programming, learning, or your progress..."
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
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
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI responses are powered by Mistral AI, personalized, memory-enhanced, and include RAG-powered resource recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentorChat;