import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink, Star, Clock, Github, MessageSquare, BookOpen, Filter, Search } from 'lucide-react';
import { Resource } from '../../types';

const ResourceRecommender: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Mock resources data
  const resources: Resource[] = [
    {
      id: '1',
      title: 'React Hooks Complete Guide',
      description: 'Comprehensive tutorial covering all React hooks with practical examples and best practices.',
      type: 'tutorial',
      url: 'https://example.com/react-hooks',
      difficulty: 'intermediate',
      tags: ['React', 'Hooks', 'JavaScript'],
      rating: 4.8,
      estimatedReadTime: 45
    },
    {
      id: '2',
      title: 'TypeScript Handbook',
      description: 'Official TypeScript documentation with examples and advanced concepts.',
      type: 'documentation',
      url: 'https://example.com/typescript',
      difficulty: 'beginner',
      tags: ['TypeScript', 'JavaScript', 'Types'],
      rating: 4.9,
      estimatedReadTime: 120
    },
    {
      id: '3',
      title: 'Awesome React Components',
      description: 'Curated list of React components and libraries for building modern applications.',
      type: 'github',
      url: 'https://github.com/example/awesome-react',
      difficulty: 'intermediate',
      tags: ['React', 'Components', 'Libraries'],
      rating: 4.7,
      estimatedReadTime: 30
    },
    {
      id: '4',
      title: 'How to handle async operations in React?',
      description: 'Stack Overflow discussion about best practices for handling asynchronous operations.',
      type: 'stackoverflow',
      url: 'https://stackoverflow.com/questions/example',
      difficulty: 'advanced',
      tags: ['React', 'Async', 'Promises'],
      rating: 4.6,
      estimatedReadTime: 15
    },
    {
      id: '5',
      title: 'CSS Grid Layout Tutorial',
      description: 'Interactive tutorial for learning CSS Grid with visual examples and exercises.',
      type: 'tutorial',
      url: 'https://example.com/css-grid',
      difficulty: 'beginner',
      tags: ['CSS', 'Layout', 'Grid'],
      rating: 4.8,
      estimatedReadTime: 60
    },
    {
      id: '6',
      title: 'Node.js Best Practices',
      description: 'Community-driven collection of Node.js best practices and code examples.',
      type: 'github',
      url: 'https://github.com/example/nodejs-best-practices',
      difficulty: 'intermediate',
      tags: ['Node.js', 'Backend', 'JavaScript'],
      rating: 4.9,
      estimatedReadTime: 90
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'github': return Github;
      case 'stackoverflow': return MessageSquare;
      case 'tutorial': return BookOpen;
      case 'documentation': return BookOpen;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'github': return 'bg-gray-100 text-gray-700';
      case 'stackoverflow': return 'bg-orange-100 text-orange-700';
      case 'tutorial': return 'bg-blue-100 text-blue-700';
      case 'documentation': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-100 text-emerald-700';
      case 'intermediate': return 'bg-orange-100 text-orange-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const recommendedResources = filteredResources.filter(resource => 
    resource.difficulty === userProfile?.skillLevel || 
    (userProfile?.skillLevel === 'beginner' && resource.difficulty === 'intermediate') ||
    (userProfile?.skillLevel === 'advanced' && resource.difficulty === 'intermediate')
  );

  return (
    <div className="space-y-6">
      {/* AI Recommendations Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">🤖 AI-Powered Recommendations</h2>
        <p className="text-indigo-100 mb-4">
          Based on your {userProfile?.skillLevel} level and interests in {userProfile?.preferredTopics.join(', ')}, 
          I've curated the best resources for your learning journey.
        </p>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1" />
            <span>Personalized for you</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Updated daily</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="tutorial">Tutorials</option>
              <option value="github">GitHub</option>
              <option value="stackoverflow">Stack Overflow</option>
              <option value="documentation">Documentation</option>
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedResources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-indigo-600 mr-2" />
            Recommended for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {recommendedResources.slice(0, 4).map((resource) => {
              const Icon = getTypeIcon(resource.type);
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                        {resource.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{resource.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                        {resource.difficulty}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {resource.estimatedReadTime}m
                      </div>
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      <span>View</span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Resources ({filteredResources.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = getTypeIcon(resource.type);
            return (
              <div
                key={resource.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{resource.rating}</span>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">{resource.title}</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {resource.estimatedReadTime}m
                    </div>
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  >
                    <span>View</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredResources.length === 0 && (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No resources found matching your criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedDifficulty('all');
              }}
              className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceRecommender;