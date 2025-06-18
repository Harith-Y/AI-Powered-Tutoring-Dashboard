import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Brain, 
  MessageCircle, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  Play, 
  ArrowRight, 
  Target, 
  Zap,
  BookOpen,
  Users,
  Trophy,
  Clock,
  Star,
  ChevronRight,
  X
} from 'lucide-react';

interface TooltipProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  isVisible, 
  onClose, 
  title, 
  description, 
  position, 
  children 
}) => {
  if (!isVisible) return <>{children}</>;

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative">
      {children}
      <div className={`absolute z-50 ${positionClasses[position]}`}>
        <div className="bg-gray-900 text-white p-3 sm:p-4 rounded-xl shadow-xl max-w-xs">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white ml-2 touch-target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-300">{description}</p>
          <div className="mt-3">
            <button
              onClick={onClose}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors touch-target"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingScreen: React.FC = () => {
  const { userProfile, userProgress = [], weeklyStats } = useAuth();
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const demoActions = [
    {
      id: 'dashboard',
      title: 'View Dashboard',
      description: 'Explore your personalized learning analytics and progress tracking',
      icon: BarChart3,
      gradient: 'from-blue-500 to-cyan-500',
      action: () => navigate('/progress'),
      tooltip: {
        title: 'Progress Dashboard',
        description: 'See detailed analytics of your learning journey, including completion rates, time spent, and skill progression across different topics.'
      }
    },
    {
      id: 'mentor',
      title: 'Ask AI Mentor',
      description: 'Chat with your intelligent tutor for personalized guidance',
      icon: MessageCircle,
      gradient: 'from-purple-500 to-pink-500',
      action: () => navigate('/mentor'),
      tooltip: {
        title: 'AI Mentor Chat',
        description: 'Get instant help from your AI mentor. Ask questions, get explanations, and receive personalized learning recommendations based on your progress.'
      }
    },
    {
      id: 'planner',
      title: 'Generate Weekly Plan',
      description: 'Let AI create a personalized study schedule based on your goals',
      icon: Brain,
      gradient: 'from-indigo-500 to-purple-500',
      action: () => navigate('/planner'),
      tooltip: {
        title: 'AI Weekly Planner',
        description: 'Our AI analyzes your learning patterns, available time, and skill gaps to create an optimized weekly study plan tailored just for you.'
      }
    }
  ];

  const features = [
    {
      icon: Target,
      title: 'Personalized Learning',
      description: 'AI adapts to your skill level and learning style'
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Get topic suggestions based on your progress'
    },
    {
      icon: Clock,
      title: 'Time Optimization',
      description: 'Efficient study plans that fit your schedule'
    },
    {
      icon: Trophy,
      title: 'Progress Tracking',
      description: 'Visual analytics and achievement system'
    }
  ];

  const stats = [
    {
      value: (userProgress || []).length.toString(),
      label: 'Topics Completed',
      icon: BookOpen
    },
    {
      value: `${Math.round((weeklyStats?.totalTimeSpent || 0) / 60)}h`,
      label: 'Study Time',
      icon: Clock
    },
    {
      value: `${Math.round(weeklyStats?.averageScore || 0)}%`,
      label: 'Average Score',
      icon: Star
    },
    {
      value: `${weeklyStats?.streakDays || 0}`,
      label: 'Day Streak',
      icon: Zap
    }
  ];

  const startTour = () => {
    setShowTour(true);
    setTourStep(0);
    setActiveTooltip(demoActions[0].id);
  };

  const nextTourStep = () => {
    if (tourStep < demoActions.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      setActiveTooltip(demoActions[nextStep].id);
    } else {
      closeTour();
    }
  };

  const closeTour = () => {
    setShowTour(false);
    setActiveTooltip(null);
    setTourStep(0);
  };

  const handleActionClick = (action: typeof demoActions[0]) => {
    if (showTour) {
      nextTourStep();
    } else {
      try {
        action.action();
      } catch (error) {
        console.error('Navigation error:', error);
        navigate('/overview');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container-modern section-padding">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 sm:mb-8 shadow-xl">
            <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          
          <h1 className="text-responsive-xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Welcome to Your
            <span className="block gradient-text">AI Learning Journey</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of personalized education with AI-powered mentoring, 
            intelligent scheduling, and adaptive learning paths tailored just for you.
          </p>

          {/* Tour Control */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-12">
            <button
              onClick={startTour}
              className="btn-primary flex items-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Demo Tour
            </button>
            <span className="text-sm text-gray-500 text-center">
              {showTour ? `Step ${tourStep + 1} of ${demoActions.length}` : 'Interactive walkthrough available'}
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        {(userProgress || []).length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="card text-center hover-lift">
                  <div className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Demo Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {demoActions.map((action, index) => {
            const Icon = action.icon;
            const isActive = activeTooltip === action.id;
            
            return (
              <Tooltip
                key={action.id}
                isVisible={isActive}
                onClose={() => {
                  setActiveTooltip(null);
                  if (showTour) nextTourStep();
                }}
                title={action.tooltip.title}
                description={action.tooltip.description}
                position="bottom"
              >
                <div 
                  className={`card hover-lift group cursor-pointer transition-all duration-300 ${
                    isActive ? 'ring-4 ring-indigo-300 ring-opacity-50 scale-105' : ''
                  }`}
                  onClick={() => handleActionClick(action)}
                >
                  <div className="p-6 sm:p-8">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{action.title}</h3>
                    <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{action.description}</p>
                    
                    <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-800 transition-colors">
                      <span>Try it now</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines machine learning, natural language processing, and educational psychology 
              to create the most effective learning experience possible.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card-compact hover-lift text-center">
                  <div className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technology Showcase */}
        <div className="card mb-12 sm:mb-16">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-500" />
                Advanced AI Features
              </h2>
              <p className="text-gray-600">
                Experience cutting-edge technology that adapts to your unique learning style
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">TensorFlow Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Machine learning models analyze your progress to suggest optimal next topics
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Memory-Enhanced Chat</h3>
                <p className="text-sm text-gray-600">
                  Pinecone vector database remembers your conversations for consistent guidance
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">RAG-Powered Resources</h3>
                <p className="text-sm text-gray-600">
                  Retrieval-augmented generation finds the most relevant learning materials
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-indigo-100 mb-6 text-base sm:text-lg">
              Join thousands of learners who are accelerating their skills with AI-powered education
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/overview')}
                className="bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center w-full sm:w-auto justify-center"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Full Dashboard
              </button>
              <button
                onClick={startTour}
                className="bg-white/20 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center w-full sm:w-auto justify-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Restart Tour
              </button>
            </div>
          </div>
        </div>

        {/* Tour Progress Indicator */}
        {showTour && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-xl shadow-xl flex items-center space-x-4">
              <div className="flex space-x-2">
                {demoActions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= tourStep ? 'bg-indigo-400' : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
              <span className="text-sm">Demo Tour Progress</span>
              <button
                onClick={closeTour}
                className="text-gray-400 hover:text-white touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingScreen;