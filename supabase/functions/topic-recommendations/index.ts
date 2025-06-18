import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface UserTopicHistory {
  topicId: string;
  topicName: string;
  category: string;
  score: number;
  timeSpent: number;
  difficulty: string;
  completedAt: string;
}

interface RecommendationRequest {
  userId: string;
  topicHistory: UserTopicHistory[];
  skillLevel: string;
  preferredTopics: string[];
}

interface TopicRecommendation {
  topicId: string;
  topicName: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  confidence: number;
  reasoning: string;
  prerequisites: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Mistral AI chat completion function
async function generateMistralRecommendations(
  topicHistory: UserTopicHistory[],
  skillLevel: string,
  preferredTopics: string[]
): Promise<TopicRecommendation[]> {
  const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
  
  if (!mistralApiKey) {
    console.log('Mistral API key not found, using fallback recommendations');
    return getFallbackRecommendations(skillLevel, preferredTopics, topicHistory);
  }

  try {
    const systemPrompt = `You are an AI learning advisor. Based on the user's learning history, recommend exactly 3 next topics for learning.

User Profile:
- Skill Level: ${skillLevel}
- Preferred Topics: ${preferredTopics.join(', ')}
- Completed Topics: ${topicHistory.length}

Learning History:
${topicHistory.map(h => `- ${h.topicName} (${h.category}, ${h.difficulty}): ${h.score}%`).join('\n')}

Provide exactly 3 recommendations in this JSON format (no additional text):
[
  {
    "topicId": "unique-topic-id",
    "topicName": "Topic Name",
    "category": "Category",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedTime": 120,
    "confidence": 0.85,
    "reasoning": "Why this topic is recommended based on user's history",
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
  }
]

Rules:
- Match difficulty to user's skill level or slightly above
- Consider completed topics to avoid repetition
- Focus on preferred topics when possible
- Provide clear reasoning for each recommendation
- Ensure logical progression from completed topics`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Please provide 3 topic recommendations based on my learning history.' }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('Mistral API error:', await response.text());
      return getFallbackRecommendations(skillLevel, preferredTopics, topicHistory);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content in Mistral response');
      return getFallbackRecommendations(skillLevel, preferredTopics, topicHistory);
    }

    // Try to parse JSON response
    try {
      const recommendations = JSON.parse(content);
      if (Array.isArray(recommendations) && recommendations.length > 0) {
        return recommendations.slice(0, 3).map((rec: any) => ({
          topicId: rec.topicId || `mistral-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          topicName: rec.topicName || 'Unknown Topic',
          category: rec.category || 'General',
          difficulty: rec.difficulty || skillLevel,
          estimatedTime: rec.estimatedTime || 120,
          confidence: rec.confidence || 0.7,
          reasoning: rec.reasoning || 'Recommended based on your learning progress.',
          prerequisites: rec.prerequisites || []
        }));
      }
    } catch (parseError) {
      console.warn('Could not parse Mistral recommendations JSON:', parseError);
    }
  } catch (error) {
    console.error('Error calling Mistral API:', error);
  }

  return getFallbackRecommendations(skillLevel, preferredTopics, topicHistory);
}

// Topic knowledge graph with relationships and prerequisites
const TOPIC_KNOWLEDGE_GRAPH = {
  'javascript-basics': {
    name: 'JavaScript Fundamentals',
    category: 'JavaScript',
    difficulty: 'beginner',
    estimatedTime: 120,
    prerequisites: [],
    leads_to: ['javascript-dom', 'javascript-async', 'javascript-es6']
  },
  'javascript-dom': {
    name: 'DOM Manipulation',
    category: 'JavaScript',
    difficulty: 'beginner',
    estimatedTime: 90,
    prerequisites: ['JavaScript Fundamentals'],
    leads_to: ['javascript-events', 'react-basics']
  },
  'javascript-async': {
    name: 'Async JavaScript & Promises',
    category: 'JavaScript',
    difficulty: 'intermediate',
    estimatedTime: 150,
    prerequisites: ['JavaScript Fundamentals'],
    leads_to: ['javascript-fetch', 'node-basics']
  },
  'javascript-es6': {
    name: 'ES6+ Features',
    category: 'JavaScript',
    difficulty: 'intermediate',
    estimatedTime: 100,
    prerequisites: ['JavaScript Fundamentals'],
    leads_to: ['javascript-modules', 'react-basics']
  },
  'react-basics': {
    name: 'React Fundamentals',
    category: 'React',
    difficulty: 'beginner',
    estimatedTime: 180,
    prerequisites: ['JavaScript Fundamentals', 'ES6+ Features'],
    leads_to: ['react-hooks', 'react-state']
  },
  'react-hooks': {
    name: 'React Hooks Deep Dive',
    category: 'React',
    difficulty: 'intermediate',
    estimatedTime: 120,
    prerequisites: ['React Fundamentals'],
    leads_to: ['react-context', 'react-performance']
  },
  'react-state': {
    name: 'Advanced State Management',
    category: 'React',
    difficulty: 'intermediate',
    estimatedTime: 140,
    prerequisites: ['React Fundamentals', 'React Hooks'],
    leads_to: ['react-redux', 'react-context']
  },
  'css-basics': {
    name: 'CSS Fundamentals',
    category: 'CSS',
    difficulty: 'beginner',
    estimatedTime: 100,
    prerequisites: [],
    leads_to: ['css-flexbox', 'css-grid']
  },
  'css-flexbox': {
    name: 'CSS Flexbox Layout',
    category: 'CSS',
    difficulty: 'beginner',
    estimatedTime: 80,
    prerequisites: ['CSS Fundamentals'],
    leads_to: ['css-grid', 'css-responsive']
  },
  'css-grid': {
    name: 'CSS Grid Layout',
    category: 'CSS',
    difficulty: 'intermediate',
    estimatedTime: 100,
    prerequisites: ['CSS Fundamentals', 'CSS Flexbox'],
    leads_to: ['css-responsive', 'css-animations']
  },
  'typescript-basics': {
    name: 'TypeScript Fundamentals',
    category: 'TypeScript',
    difficulty: 'intermediate',
    estimatedTime: 160,
    prerequisites: ['JavaScript Fundamentals', 'ES6+ Features'],
    leads_to: ['typescript-advanced', 'react-typescript']
  },
  'node-basics': {
    name: 'Node.js & Express',
    category: 'Backend',
    difficulty: 'intermediate',
    estimatedTime: 140,
    prerequisites: ['JavaScript Fundamentals', 'Async JavaScript'],
    leads_to: ['node-express', 'node-database']
  }
};

function getFallbackRecommendations(
  skillLevel: string,
  preferredTopics: string[],
  topicHistory: UserTopicHistory[]
): TopicRecommendation[] {
  const completedTopics = topicHistory.map(h => h.topicName.toLowerCase());
  const completedCategories = new Set(topicHistory.map(h => h.category));
  
  const recommendations: TopicRecommendation[] = [
    {
      topicId: 'react-hooks-deep',
      topicName: 'React Hooks Deep Dive',
      category: 'React',
      difficulty: skillLevel === 'beginner' ? 'intermediate' : skillLevel,
      estimatedTime: 120,
      confidence: 0.85,
      reasoning: 'Essential for modern React development. Hooks are fundamental to building efficient, reusable components.',
      prerequisites: ['React Fundamentals']
    },
    {
      topicId: 'async-javascript',
      topicName: 'Async JavaScript & Promises',
      category: 'JavaScript',
      difficulty: skillLevel === 'beginner' ? 'intermediate' : skillLevel,
      estimatedTime: 90,
      confidence: 0.80,
      reasoning: 'Critical for handling API calls and asynchronous operations in modern web development.',
      prerequisites: ['JavaScript Fundamentals']
    },
    {
      topicId: 'css-grid-layout',
      topicName: 'CSS Grid Layout',
      category: 'CSS',
      difficulty: skillLevel === 'advanced' ? 'intermediate' : skillLevel,
      estimatedTime: 75,
      confidence: 0.75,
      reasoning: 'Modern layout system that complements Flexbox for creating complex, responsive designs.',
      prerequisites: ['CSS Basics', 'CSS Flexbox']
    },
    {
      topicId: 'typescript-fundamentals',
      topicName: 'TypeScript Fundamentals',
      category: 'TypeScript',
      difficulty: 'intermediate',
      estimatedTime: 160,
      confidence: 0.78,
      reasoning: 'Add type safety to JavaScript projects and improve code quality and developer experience.',
      prerequisites: ['JavaScript Fundamentals', 'ES6+ Features']
    },
    {
      topicId: 'node-express-server',
      topicName: 'Node.js & Express Server',
      category: 'Backend',
      difficulty: 'intermediate',
      estimatedTime: 140,
      confidence: 0.72,
      reasoning: 'Learn server-side development to build full-stack applications and APIs.',
      prerequisites: ['JavaScript Fundamentals', 'Async JavaScript']
    },
    {
      topicId: 'testing-fundamentals',
      topicName: 'Testing with Jest & React Testing Library',
      category: 'Testing',
      difficulty: skillLevel === 'beginner' ? 'intermediate' : skillLevel,
      estimatedTime: 100,
      confidence: 0.70,
      reasoning: 'Essential skill for writing reliable, maintainable code and preventing bugs.',
      prerequisites: ['JavaScript Fundamentals', 'React Fundamentals']
    }
  ];

  // Filter based on preferred topics and completed work
  const filteredRecommendations = recommendations.filter(rec => {
    // Don't recommend topics already completed
    if (completedTopics.some(topic => rec.topicName.toLowerCase().includes(topic))) {
      return false;
    }

    // Prefer topics that match user's interests
    const matchesPreferences = preferredTopics.some(topic => 
      rec.category.toLowerCase().includes(topic.toLowerCase()) ||
      rec.topicName.toLowerCase().includes(topic.toLowerCase())
    );

    // Include if matches preferences or if user has few completed topics
    return matchesPreferences || topicHistory.length < 3;
  });

  // Adjust confidence based on user's performance
  const avgScore = topicHistory.length > 0 
    ? topicHistory.reduce((sum, h) => sum + h.score, 0) / topicHistory.length 
    : 70;

  return filteredRecommendations.slice(0, 3).map(rec => ({
    ...rec,
    confidence: Math.min(rec.confidence + (avgScore > 80 ? 0.1 : 0), 1),
    reasoning: `${rec.reasoning} Based on your ${avgScore.toFixed(0)}% average score, this topic is well-suited for your current level.`
  }));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, topicHistory, skillLevel, preferredTopics }: RecommendationRequest = await req.json()

    if (!userId || !Array.isArray(topicHistory)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, topicHistory' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recommendations using Mistral AI or fallback
    const recommendations = await generateMistralRecommendations(
      topicHistory,
      skillLevel || 'beginner',
      preferredTopics || []
    );

    console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations,
        timestamp: new Date().toISOString(),
        model_version: '1.0.0',
        ai_provider: Deno.env.get('MISTRAL_API_KEY') ? 'mistral' : 'fallback'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})