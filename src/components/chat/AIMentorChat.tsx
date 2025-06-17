import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Bot, User, Lightbulb, Code, Book, ArrowLeft, Sparkles, Clock, Target } from 'lucide-react';
import { ChatMessage } from '../../types';
import { addProgress } from '../../services/firestore';
import RecommendedResources from './RecommendedResources';

interface AIMentorChatProps {
  onBack?: () => void;
}

const AIMentorChat: React.FC<AIMentorChatProps> = ({ onBack }) => {
  const { currentUser, userProfile, userProgress, userPreferences, weeklyPlan } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [resourceFeedback, setResourceFeedback] = useState<Record<string, boolean>>({});
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
    const completedTopics = userProgress.length;
    const recentTopic = userProgress[0]?.topicName;
    
    let greeting = `Hi ${name}! 👋 I'm your AI mentor, and I'm excited to help you on your learning journey.\n\n`;
    
    if (completedTopics > 0) {
      greeting += `I can see you've completed ${completedTopics} topics so far - that's fantastic progress! `;
      if (recentTopic) {
        greeting += `I noticed you recently worked on "${recentTopic}". `;
      }
    }
    
    greeting += `As a ${level} learner, I'll tailor my explanations and suggestions to match your current skill level.\n\n`;
    
    if (userProfile?.preferredTopics.length) {
      greeting += `I see you're interested in ${userProfile.preferredTopics.slice(0, 3).join(', ')}. `;
    }
    
    greeting += `What would you like to explore today? I can help with:\n• Explaining concepts\n• Code reviews and debugging\n• Learning path recommendations\n• Practice exercises\n\nJust ask me anything! 🚀`;
    
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

  const getContextualResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const level = userProfile?.skillLevel || 'beginner';
    const completedTopics = userProgress.length;
    const averageScore = userProgress.length > 0 
      ? userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length 
      : 0;
    
    // Analyze user's question type
    const isConceptQuestion = lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('how does');
    const isCodeQuestion = lowerMessage.includes('code') || lowerMessage.includes('function') || lowerMessage.includes('syntax');
    const isProgressQuestion = lowerMessage.includes('progress') || lowerMessage.includes('next') || lowerMessage.includes('should i');
    
    let response = '';
    let suggestedTopic = '';
    
    // Generate contextual responses based on user's data
    if (isProgressQuestion) {
      response = generateProgressResponse();
      suggestedTopic = generateProgressSuggestion();
    } else if (isConceptQuestion) {
      response = generateConceptResponse(userMessage, level);
      suggestedTopic = generateConceptSuggestion();
    } else if (isCodeQuestion) {
      response = generateCodeResponse(userMessage, level);
      suggestedTopic = generateCodeSuggestion();
    } else {
      response = generateGeneralResponse(userMessage, level);
      suggestedTopic = generateGeneralSuggestion();
    }
    
    // Add personalized context
    if (completedTopics > 0 && Math.random() > 0.5) {
      response += `\n\nBased on your ${completedTopics} completed topics with an average score of ${Math.round(averageScore)}%, `;
      if (averageScore >= 80) {
        response += "you're doing excellent work! ";
      } else if (averageScore >= 60) {
        response += "you're making good progress. ";
      } else {
        response += "let's focus on strengthening your foundation. ";
      }
    }
    
    return `${response}\n\n💡 **Suggested next step:** ${suggestedTopic}`;
  };

  const generateProgressResponse = (): string => {
    const completedTopics = userProgress.length;
    const weeklyTasks = weeklyPlan.filter(task => !task.completed).length;
    const level = userProfile?.skillLevel || 'beginner';
    
    if (completedTopics === 0) {
      return `Great question! Since you're just starting your journey, I recommend beginning with fundamental concepts in ${userProfile?.preferredTopics[0] || 'programming'}. Let's build a solid foundation first.`;
    }
    
    return `You've made excellent progress with ${completedTopics} completed topics! Looking at your learning pattern, you have ${weeklyTasks} tasks remaining this week. As a ${level} learner, I suggest focusing on practical application of what you've learned.`;
  };

  const generateConceptResponse = (message: string, level: string): string => {
    const responses = {
      beginner: "Let me explain this in simple terms with a practical example. Think of it like...",
      intermediate: "This is a great concept to master! Here's how it works and why it's important...",
      advanced: "Excellent question! Let's dive into the technical details and explore some advanced patterns..."
    };
    
    return responses[level as keyof typeof responses] || responses.beginner;
  };

  const generateCodeResponse = (message: string, level: string): string => {
    const responses = {
      beginner: "Let's break this down step by step. I'll show you a simple example and explain each part...",
      intermediate: "Good question! Here's how you can approach this, along with some best practices...",
      advanced: "Let's explore this with a comprehensive example, including edge cases and optimization techniques..."
    };
    
    return responses[level as keyof typeof responses] || responses.beginner;
  };

  const generateGeneralResponse = (message: string, level: string): string => {
    return `That's a thoughtful question! Based on your ${level} level, let me provide you with a tailored explanation that builds on what you already know.`;
  };

  const generateProgressSuggestion = (): string => {
    const incompleteTasks = weeklyPlan.filter(task => !task.completed);
    if (incompleteTasks.length > 0) {
      return `Complete "${incompleteTasks[0].topic}" from your weekly plan`;
    }
    return `Review your recent progress and set new learning goals`;
  };

  const generateConceptSuggestion = (): string => {
    const topics = userProfile?.preferredTopics || ['JavaScript', 'React'];
    return `Practice ${topics[Math.floor(Math.random() * topics.length)]} with hands-on exercises`;
  };

  const generateCodeSuggestion = (): string => {
    return `Try building a small project to apply what you've learned`;
  };

  const generateGeneralSuggestion = (): string => {
    const suggestions = [
      'Explore interactive coding challenges',
      'Join a coding community for peer learning',
      'Build a portfolio project',
      'Review and refactor your previous code'
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
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

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getContextualResponse(currentMessage),
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);

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
    }, 1500 + Math.random() * 1000); // Variable response time for realism
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
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                  AI Mentor
                  <Sparkles className="w-5 h-5 text-indigo-500 ml-2" />
                </h1>
                <p className="text-sm text-gray-500">
                  Personalized for {userProfile?.skillLevel} level • {userProgress.length} topics completed • RAG-powered
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Always available</span>
            </div>
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
                      <span className="text-sm text-gray-500">AI is thinking and searching resources...</span>
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
              AI responses are personalized and include RAG-powered resource recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentorChat;