import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// TensorFlow.js for Deno
import * as tf from 'https://esm.sh/@tensorflow/tfjs@4.10.0'

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
    prerequisites: ['javascript-basics'],
    leads_to: ['javascript-events', 'react-basics']
  },
  'javascript-async': {
    name: 'Async JavaScript & Promises',
    category: 'JavaScript',
    difficulty: 'intermediate',
    estimatedTime: 150,
    prerequisites: ['javascript-basics'],
    leads_to: ['javascript-fetch', 'node-basics']
  },
  'javascript-es6': {
    name: 'ES6+ Features',
    category: 'JavaScript',
    difficulty: 'intermediate',
    estimatedTime: 100,
    prerequisites: ['javascript-basics'],
    leads_to: ['javascript-modules', 'react-basics']
  },
  'react-basics': {
    name: 'React Fundamentals',
    category: 'React',
    difficulty: 'beginner',
    estimatedTime: 180,
    prerequisites: ['javascript-basics', 'javascript-es6'],
    leads_to: ['react-hooks', 'react-state']
  },
  'react-hooks': {
    name: 'React Hooks',
    category: 'React',
    difficulty: 'intermediate',
    estimatedTime: 120,
    prerequisites: ['react-basics'],
    leads_to: ['react-context', 'react-performance']
  },
  'react-state': {
    name: 'State Management',
    category: 'React',
    difficulty: 'intermediate',
    estimatedTime: 140,
    prerequisites: ['react-basics', 'react-hooks'],
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
    name: 'CSS Flexbox',
    category: 'CSS',
    difficulty: 'beginner',
    estimatedTime: 80,
    prerequisites: ['css-basics'],
    leads_to: ['css-grid', 'css-responsive']
  },
  'css-grid': {
    name: 'CSS Grid Layout',
    category: 'CSS',
    difficulty: 'intermediate',
    estimatedTime: 100,
    prerequisites: ['css-basics', 'css-flexbox'],
    leads_to: ['css-responsive', 'css-animations']
  },
  'typescript-basics': {
    name: 'TypeScript Fundamentals',
    category: 'TypeScript',
    difficulty: 'intermediate',
    estimatedTime: 160,
    prerequisites: ['javascript-basics', 'javascript-es6'],
    leads_to: ['typescript-advanced', 'react-typescript']
  },
  'node-basics': {
    name: 'Node.js Fundamentals',
    category: 'Backend',
    difficulty: 'intermediate',
    estimatedTime: 140,
    prerequisites: ['javascript-basics', 'javascript-async'],
    leads_to: ['node-express', 'node-database']
  }
};

class TensorFlowRecommender {
  private model: tf.LayersModel | null = null;
  private topicEmbeddings: Map<string, number[]> = new Map();
  private userEmbeddings: Map<string, number[]> = new Map();

  constructor() {
    this.initializeEmbeddings();
  }

  private initializeEmbeddings() {
    // Create topic embeddings based on category, difficulty, and relationships
    const topics = Object.keys(TOPIC_KNOWLEDGE_GRAPH);
    const categories = ['JavaScript', 'React', 'CSS', 'TypeScript', 'Backend'];
    const difficulties = ['beginner', 'intermediate', 'advanced'];

    topics.forEach(topicId => {
      const topic = TOPIC_KNOWLEDGE_GRAPH[topicId as keyof typeof TOPIC_KNOWLEDGE_GRAPH];
      const embedding = [
        // Category one-hot encoding
        ...categories.map(cat => cat === topic.category ? 1 : 0),
        // Difficulty encoding
        ...difficulties.map(diff => diff === topic.difficulty ? 1 : 0),
        // Time complexity (normalized)
        topic.estimatedTime / 200,
        // Prerequisites count (normalized)
        topic.prerequisites.length / 5,
        // Leads to count (normalized)
        topic.leads_to.length / 5,
        // Random features for diversity
        Math.random() * 0.1,
        Math.random() * 0.1
      ];
      
      this.topicEmbeddings.set(topicId, embedding);
    });
  }

  private createUserEmbedding(topicHistory: UserTopicHistory[], skillLevel: string, preferredTopics: string[]): number[] {
    const categories = ['JavaScript', 'React', 'CSS', 'TypeScript', 'Backend'];
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    
    // Calculate user preferences based on history
    const categoryScores = categories.map(cat => {
      const categoryTopics = topicHistory.filter(t => t.category === cat);
      if (categoryTopics.length === 0) return 0;
      return categoryTopics.reduce((sum, t) => sum + t.score, 0) / categoryTopics.length / 100;
    });

    const difficultyPreference = difficulties.map(diff => diff === skillLevel ? 1 : 0);
    
    // Time spent patterns
    const avgTimeSpent = topicHistory.length > 0 
      ? topicHistory.reduce((sum, t) => sum + t.timeSpent, 0) / topicHistory.length / 120 
      : 0.5;

    // Recent activity bias
    const recentActivityBias = topicHistory.length > 0 ? 1 : 0;

    // Preferred topics influence
    const preferredTopicsBias = preferredTopics.length / 5;

    return [
      ...categoryScores,
      ...difficultyPreference,
      avgTimeSpent,
      recentActivityBias,
      preferredTopicsBias,
      Math.random() * 0.05 // Small random component for exploration
    ];
  }

  private calculateSimilarity(userEmbedding: number[], topicEmbedding: number[]): number {
    // Cosine similarity
    const dotProduct = userEmbedding.reduce((sum, val, i) => sum + val * topicEmbedding[i], 0);
    const userMagnitude = Math.sqrt(userEmbedding.reduce((sum, val) => sum + val * val, 0));
    const topicMagnitude = Math.sqrt(topicEmbedding.reduce((sum, val) => sum + val * val, 0));
    
    if (userMagnitude === 0 || topicMagnitude === 0) return 0;
    return dotProduct / (userMagnitude * topicMagnitude);
  }

  private checkPrerequisites(topicId: string, completedTopics: string[]): boolean {
    const topic = TOPIC_KNOWLEDGE_GRAPH[topicId as keyof typeof TOPIC_KNOWLEDGE_GRAPH];
    if (!topic) return false;
    
    return topic.prerequisites.every(prereq => completedTopics.includes(prereq));
  }

  private generateReasoning(topicId: string, userHistory: UserTopicHistory[], confidence: number): string {
    const topic = TOPIC_KNOWLEDGE_GRAPH[topicId as keyof typeof TOPIC_KNOWLEDGE_GRAPH];
    if (!topic) return "Recommended based on your learning pattern.";

    const categoryHistory = userHistory.filter(h => h.category === topic.category);
    const avgScore = categoryHistory.length > 0 
      ? categoryHistory.reduce((sum, h) => sum + h.score, 0) / categoryHistory.length 
      : 0;

    if (topic.prerequisites.length > 0) {
      return `Perfect next step after completing ${topic.prerequisites.join(', ')}. Your ${avgScore.toFixed(0)}% average in ${topic.category} shows you're ready for this ${topic.difficulty} level topic.`;
    }

    if (confidence > 0.8) {
      return `Highly recommended based on your strong performance in ${topic.category}. This ${topic.difficulty} topic aligns perfectly with your learning pattern.`;
    }

    if (categoryHistory.length === 0) {
      return `Great opportunity to explore ${topic.category}! This ${topic.difficulty} topic is an excellent starting point for expanding your skills.`;
    }

    return `Recommended to build upon your ${topic.category} knowledge. Your progress suggests you're ready for this ${topic.difficulty} challenge.`;
  }

  async recommend(request: RecommendationRequest): Promise<TopicRecommendation[]> {
    try {
      const { topicHistory, skillLevel, preferredTopics } = request;
      
      // Get completed topic IDs
      const completedTopicIds = topicHistory.map(h => {
        // Map topic names to IDs (simplified mapping)
        const name = h.topicName.toLowerCase();
        if (name.includes('javascript') && name.includes('basic')) return 'javascript-basics';
        if (name.includes('dom')) return 'javascript-dom';
        if (name.includes('async') || name.includes('promise')) return 'javascript-async';
        if (name.includes('es6')) return 'javascript-es6';
        if (name.includes('react') && name.includes('basic')) return 'react-basics';
        if (name.includes('hook')) return 'react-hooks';
        if (name.includes('state')) return 'react-state';
        if (name.includes('css') && name.includes('basic')) return 'css-basics';
        if (name.includes('flexbox')) return 'css-flexbox';
        if (name.includes('grid')) return 'css-grid';
        if (name.includes('typescript')) return 'typescript-basics';
        if (name.includes('node')) return 'node-basics';
        return null;
      }).filter(Boolean) as string[];

      // Create user embedding
      const userEmbedding = this.createUserEmbedding(topicHistory, skillLevel, preferredTopics);

      // Calculate recommendations
      const recommendations: Array<{topicId: string, confidence: number}> = [];
      
      for (const [topicId, topicEmbedding] of this.topicEmbeddings.entries()) {
        // Skip already completed topics
        if (completedTopicIds.includes(topicId)) continue;
        
        // Check prerequisites
        if (!this.checkPrerequisites(topicId, completedTopicIds)) continue;
        
        // Calculate similarity score
        const similarity = this.calculateSimilarity(userEmbedding, topicEmbedding);
        
        // Add some randomness for exploration vs exploitation
        const explorationBonus = Math.random() * 0.1;
        const confidence = Math.min(similarity + explorationBonus, 1);
        
        recommendations.push({ topicId, confidence });
      }

      // Sort by confidence and take top 3
      recommendations.sort((a, b) => b.confidence - a.confidence);
      const topRecommendations = recommendations.slice(0, 3);

      // Convert to full recommendation objects
      return topRecommendations.map(rec => {
        const topic = TOPIC_KNOWLEDGE_GRAPH[rec.topicId as keyof typeof TOPIC_KNOWLEDGE_GRAPH];
        return {
          topicId: rec.topicId,
          topicName: topic.name,
          category: topic.category,
          difficulty: topic.difficulty,
          estimatedTime: topic.estimatedTime,
          confidence: rec.confidence,
          reasoning: this.generateReasoning(rec.topicId, topicHistory, rec.confidence),
          prerequisites: topic.prerequisites
        };
      });

    } catch (error) {
      console.error('Recommendation error:', error);
      
      // Fallback recommendations based on skill level
      const fallbackTopics = skillLevel === 'beginner' 
        ? ['javascript-basics', 'css-basics', 'javascript-dom']
        : skillLevel === 'intermediate'
        ? ['react-basics', 'javascript-async', 'css-flexbox']
        : ['typescript-basics', 'react-hooks', 'node-basics'];

      return fallbackTopics.map(topicId => {
        const topic = TOPIC_KNOWLEDGE_GRAPH[topicId as keyof typeof TOPIC_KNOWLEDGE_GRAPH];
        return {
          topicId,
          topicName: topic.name,
          category: topic.category,
          difficulty: topic.difficulty,
          estimatedTime: topic.estimatedTime,
          confidence: 0.7,
          reasoning: `Recommended for ${skillLevel} level learners.`,
          prerequisites: topic.prerequisites
        };
      });
    }
  }
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

    // Initialize TensorFlow recommender
    const recommender = new TensorFlowRecommender();
    
    // Get recommendations
    const recommendations = await recommender.recommend({
      userId,
      topicHistory,
      skillLevel: skillLevel || 'beginner',
      preferredTopics: preferredTopics || []
    });

    console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations,
        timestamp: new Date().toISOString(),
        model_version: '1.0.0'
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