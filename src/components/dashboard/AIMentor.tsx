import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Bot, User, Lightbulb, Code, Book } from 'lucide-react';
import { ChatMessage } from '../../types';

const AIMentor: React.FC = () => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: `Hi ${userProfile?.displayName}! I'm your AI mentor. I can help you with your learning journey, explain concepts at your ${userProfile?.skillLevel} level, and provide personalized guidance. What would you like to learn about today?`,
      sender: 'ai',
      timestamp: new Date(),
      adaptedToLevel: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const responses = {
      beginner: {
        react: "Great question about React! React is like building with LEGO blocks - each component is a reusable piece. Let's start with a simple example: a button component that you can use anywhere in your app.",
        javascript: "JavaScript is the language that makes websites interactive! Think of it as giving instructions to your computer. Let's start with variables - they're like boxes where you store information.",
        css: "CSS is what makes websites look beautiful! It's like decorating a house - you choose colors, layouts, and styles. Let's start with simple selectors and properties."
      },
      intermediate: {
        react: "For React hooks, useState is fundamental for managing component state. Here's how you can optimize your component re-renders and handle complex state logic effectively.",
        javascript: "Let's dive into async/await patterns and how they improve upon promises. Understanding the event loop will help you write more efficient JavaScript code.",
        css: "CSS Grid and Flexbox are powerful layout systems. Here's how you can combine them for responsive designs and complex layouts."
      },
      advanced: {
        react: "Let's explore advanced patterns like render props, higher-order components, and custom hooks for complex state management scenarios. Consider implementing a compound component pattern.",
        javascript: "We can discuss performance optimization techniques, memory management, and advanced functional programming concepts like currying and composition.",
        css: "Let's look at CSS architecture patterns like BEM, atomic design, and CSS-in-JS solutions for large-scale applications."
      }
    };

    const level = userProfile?.skillLevel || 'beginner';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('react')) {
      return responses[level].react;
    } else if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
      return responses[level].javascript;
    } else if (lowerMessage.includes('css')) {
      return responses[level].css;
    } else {
      return `I'd be happy to help you with that! Based on your ${level} level, I can provide explanations and examples that match your current understanding. Can you tell me more about what specific aspect you'd like to explore?`;
    }
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
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date(),
        adaptedToLevel: true
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickActions = [
    { label: 'Explain a concept', icon: Lightbulb },
    { label: 'Help with code', icon: Code },
    { label: 'Recommend resources', icon: Book }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Mentor</h2>
            <p className="text-sm text-gray-500">Adapted for {userProfile?.skillLevel} level</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => setInputMessage(action.label)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={action.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && (
                  <Bot className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                )}
                {message.sender === 'user' && (
                  <User className="w-4 h-4 text-indigo-200 mt-1 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm">{message.content}</p>
                  {message.adaptedToLevel && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✨ Adapted to your level
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-gray-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about programming..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIMentor;