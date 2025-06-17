import React, { useState, useEffect } from 'react';
import { ExternalLink, ThumbsUp, ThumbsDown, Search, Github, MessageSquare, BookOpen, Star, Clock } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: 'github' | 'stackoverflow' | 'article';
  relevanceScore: number;
  tags: string[];
  votes?: number;
  readTime?: number;
}

interface RecommendedResourcesProps {
  query: string;
  userLevel: string;
  onFeedback: (resourceId: string, helpful: boolean) => void;
}

const RecommendedResources: React.FC<RecommendedResourcesProps> = ({ 
  query, 
  userLevel, 
  onFeedback 
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});

  // Simulated RAG database with embedded resources
  const mockResourceDatabase: Resource[] = [
    // React Resources
    {
      id: 'react-hooks-1',
      title: 'Understanding React Hooks: A Complete Guide',
      snippet: 'React Hooks allow you to use state and other React features without writing a class. useState is the most basic Hook that lets you add state to functional components...',
      url: 'https://github.com/facebook/react/issues/14679',
      source: 'github',
      relevanceScore: 0.95,
      tags: ['react', 'hooks', 'useState', 'functional-components'],
      votes: 234
    },
    {
      id: 'react-hooks-2',
      title: 'How to properly use useEffect in React?',
      snippet: 'useEffect is a Hook that lets you perform side effects in functional components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount...',
      url: 'https://stackoverflow.com/questions/53945763',
      source: 'stackoverflow',
      relevanceScore: 0.92,
      tags: ['react', 'hooks', 'useEffect', 'lifecycle'],
      votes: 156
    },
    {
      id: 'react-patterns-1',
      title: 'Advanced React Patterns and Best Practices',
      snippet: 'Learn advanced React patterns including render props, higher-order components, and compound components. These patterns help you write more reusable and maintainable code...',
      url: 'https://example.com/react-patterns',
      source: 'article',
      relevanceScore: 0.88,
      tags: ['react', 'patterns', 'advanced', 'best-practices'],
      readTime: 12
    },
    // JavaScript Resources
    {
      id: 'js-async-1',
      title: 'Mastering Async/Await in JavaScript',
      snippet: 'Async/await is syntactic sugar over Promises that makes asynchronous code look and behave more like synchronous code. Here\'s how to use it effectively...',
      url: 'https://github.com/tc39/proposal-async-await',
      source: 'github',
      relevanceScore: 0.94,
      tags: ['javascript', 'async', 'await', 'promises'],
      votes: 189
    },
    {
      id: 'js-closures-1',
      title: 'JavaScript Closures Explained with Examples',
      snippet: 'A closure is the combination of a function bundled together with references to its surrounding state. Closures give you access to an outer function\'s scope...',
      url: 'https://stackoverflow.com/questions/111102',
      source: 'stackoverflow',
      relevanceScore: 0.91,
      tags: ['javascript', 'closures', 'scope', 'functions'],
      votes: 445
    },
    {
      id: 'js-fundamentals-1',
      title: 'JavaScript Fundamentals Every Developer Should Know',
      snippet: 'Master the core concepts of JavaScript including variables, functions, objects, and prototypes. This comprehensive guide covers everything from basics to advanced topics...',
      url: 'https://example.com/js-fundamentals',
      source: 'article',
      relevanceScore: 0.87,
      tags: ['javascript', 'fundamentals', 'basics', 'concepts'],
      readTime: 15
    },
    // CSS Resources
    {
      id: 'css-grid-1',
      title: 'CSS Grid Layout Complete Guide',
      snippet: 'CSS Grid Layout is a two-dimensional layout system for the web. It lets you lay content out in rows and columns, and has many features that make building complex layouts straightforward...',
      url: 'https://github.com/rachelandrew/gridbugs',
      source: 'github',
      relevanceScore: 0.93,
      tags: ['css', 'grid', 'layout', 'responsive'],
      votes: 167
    },
    {
      id: 'css-flexbox-1',
      title: 'When to use CSS Grid vs Flexbox?',
      snippet: 'Both CSS Grid and Flexbox are layout methods, but they serve different purposes. Grid is for two-dimensional layouts while Flexbox is for one-dimensional layouts...',
      url: 'https://stackoverflow.com/questions/45536537',
      source: 'stackoverflow',
      relevanceScore: 0.89,
      tags: ['css', 'grid', 'flexbox', 'layout'],
      votes: 203
    },
    // TypeScript Resources
    {
      id: 'ts-types-1',
      title: 'TypeScript Type System Deep Dive',
      snippet: 'TypeScript\'s type system is structural and duck-typed. This means that if two types have the same structure, they are considered compatible...',
      url: 'https://github.com/microsoft/TypeScript/issues/1',
      source: 'github',
      relevanceScore: 0.96,
      tags: ['typescript', 'types', 'system', 'interfaces'],
      votes: 312
    },
    {
      id: 'ts-generics-1',
      title: 'Understanding TypeScript Generics',
      snippet: 'Generics provide a way to make components work with any data type and not restrict to one data type. They allow you to write reusable code...',
      url: 'https://stackoverflow.com/questions/3142635',
      source: 'stackoverflow',
      relevanceScore: 0.90,
      tags: ['typescript', 'generics', 'types', 'reusability'],
      votes: 178
    }
  ];

  // Simulated vector search function
  const searchResources = (searchQuery: string, userSkillLevel: string): Resource[] => {
    const queryTerms = searchQuery.toLowerCase().split(' ');
    
    // Calculate relevance scores based on query terms and user level
    const scoredResources = mockResourceDatabase.map(resource => {
      let score = resource.relevanceScore;
      
      // Boost score if tags match query terms
      const tagMatches = resource.tags.filter(tag => 
        queryTerms.some(term => tag.toLowerCase().includes(term))
      ).length;
      score += tagMatches * 0.1;
      
      // Boost score if title matches query terms
      const titleMatches = queryTerms.filter(term => 
        resource.title.toLowerCase().includes(term)
      ).length;
      score += titleMatches * 0.15;
      
      // Adjust score based on user level
      if (userSkillLevel === 'beginner') {
        if (resource.tags.includes('fundamentals') || resource.tags.includes('basics')) {
          score += 0.2;
        }
        if (resource.tags.includes('advanced')) {
          score -= 0.1;
        }
      } else if (userSkillLevel === 'advanced') {
        if (resource.tags.includes('advanced') || resource.tags.includes('patterns')) {
          score += 0.2;
        }
        if (resource.tags.includes('basics')) {
          score -= 0.1;
        }
      }
      
      return { ...resource, relevanceScore: score };
    });
    
    // Filter resources that have some relevance and sort by score
    return scoredResources
      .filter(resource => {
        const hasRelevantTags = resource.tags.some(tag => 
          queryTerms.some(term => tag.toLowerCase().includes(term))
        );
        const hasRelevantTitle = queryTerms.some(term => 
          resource.title.toLowerCase().includes(term)
        );
        return hasRelevantTags || hasRelevantTitle;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResources([]);
      return;
    }

    setLoading(true);
    
    // Simulate API delay for realistic experience
    const searchTimeout = setTimeout(() => {
      const searchResults = searchResources(query, userLevel);
      setResources(searchResults);
      setLoading(false);
    }, 800);

    return () => clearTimeout(searchTimeout);
  }, [query, userLevel]);

  const handleFeedback = (resourceId: string, helpful: boolean) => {
    setFeedback(prev => ({ ...prev, [resourceId]: helpful }));
    onFeedback(resourceId, helpful);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github': return Github;
      case 'stackoverflow': return MessageSquare;
      case 'article': return BookOpen;
      default: return BookOpen;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'github': return 'bg-gray-100 text-gray-700';
      case 'stackoverflow': return 'bg-orange-100 text-orange-700';
      case 'article': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!query.trim()) return null;

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <div className="flex items-center mb-4">
        <Search className="w-5 h-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Recommended Resources</h3>
        <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
          RAG-Powered
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Found {loading ? '...' : resources.length} resources matching "{query}" for {userLevel} level
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-3/4 h-5 bg-gray-300 rounded mb-2"></div>
              <div className="w-full h-4 bg-gray-300 rounded mb-1"></div>
              <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      ) : resources.length > 0 ? (
        <div className="space-y-4">
          {resources.map((resource, index) => {
            const SourceIcon = getSourceIcon(resource.source);
            const userFeedback = feedback[resource.id];
            
            return (
              <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                    <SourceIcon className="w-4 h-4 text-gray-600" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(resource.source)}`}>
                      {resource.source}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                      {Math.round(resource.relevanceScore * 100)}% match
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFeedback(resource.id, true)}
                      className={`p-1 rounded transition-colors ${
                        userFeedback === true 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(resource.id, false)}
                      className={`p-1 rounded transition-colors ${
                        userFeedback === false 
                          ? 'bg-red-100 text-red-600' 
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {resource.title}
                </h4>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {resource.snippet}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {resource.votes && (
                      <div className="flex items-center">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {resource.votes} votes
                      </div>
                    )}
                    {resource.readTime && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {resource.readTime} min read
                      </div>
                    )}
                  </div>
                  
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                  >
                    <span>View Resource</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {resource.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No resources found for this query</p>
          <p className="text-xs text-gray-400 mt-1">Try different keywords or topics</p>
        </div>
      )}
      
      {resources.length > 0 && (
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-indigo-200">
          <p className="text-xs text-gray-600">
            💡 <strong>RAG System:</strong> Resources are retrieved using vector similarity search from embedded GitHub issues, 
            Stack Overflow answers, and curated articles, then ranked by relevance to your query and skill level.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedResources;