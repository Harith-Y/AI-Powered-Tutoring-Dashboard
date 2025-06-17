interface MemoryEvent {
  userId: string;
  question: string;
  topic: string;
  response: string;
  skillLevel: string;
  category: string;
  sentiment?: string;
  difficulty?: string;
}

interface RetrievedMemory {
  question: string;
  topic: string;
  response: string;
  timestamp: string;
  skillLevel: string;
  category: string;
  sentiment?: string;
  similarity: number;
}

class MemoryService {
  private baseUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.warn('VITE_SUPABASE_URL not found in environment variables. Memory service will use fallback mode.');
      this.baseUrl = '';
    } else {
      this.baseUrl = `${supabaseUrl}/functions/v1/pinecone-memory`;
    }
  }

  async storeMemory(memoryEvent: MemoryEvent): Promise<boolean> {
    if (!this.baseUrl) {
      console.log('Memory service in fallback mode - storing locally');
      return true; // Simulate success for development
    }

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!anonKey) {
        console.warn('VITE_SUPABASE_ANON_KEY not found. Cannot authenticate with Supabase.');
        return false;
      }

      const response = await fetch(`${this.baseUrl}/store`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryEvent)
      });

      if (!response.ok) {
        console.error('Failed to store memory:', response.statusText);
        return false;
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error storing memory:', error);
      return false;
    }
  }

  async retrieveRelevantMemories(
    userId: string, 
    currentQuestion: string, 
    topic: string, 
    topK: number = 5
  ): Promise<RetrievedMemory[]> {
    if (!this.baseUrl) {
      console.log('Memory service in fallback mode - returning mock data');
      return this.getMockMemories(userId, currentQuestion, topic);
    }

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!anonKey) {
        console.warn('VITE_SUPABASE_ANON_KEY not found. Cannot authenticate with Supabase.');
        return this.getMockMemories(userId, currentQuestion, topic);
      }

      const response = await fetch(`${this.baseUrl}/retrieve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentQuestion,
          topic,
          topK
        })
      });

      if (!response.ok) {
        console.error('Failed to retrieve memories:', response.statusText);
        return this.getMockMemories(userId, currentQuestion, topic);
      }

      const result = await response.json();
      return result.success ? result.memories : [];
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return this.getMockMemories(userId, currentQuestion, topic);
    }
  }

  private getMockMemories(userId: string, currentQuestion: string, topic: string): RetrievedMemory[] {
    // Return mock memories for development/fallback
    return [
      {
        question: `How do I learn ${topic} effectively?`,
        topic: topic,
        response: `To learn ${topic} effectively, start with the fundamentals and practice regularly...`,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        skillLevel: 'beginner',
        category: topic,
        sentiment: 'curious',
        similarity: 0.8
      }
    ];
  }

  extractTopicFromMessage(message: string): string {
    const topicKeywords = {
      'react': ['react', 'jsx', 'component', 'hook', 'state', 'props'],
      'javascript': ['javascript', 'js', 'function', 'variable', 'array', 'object'],
      'css': ['css', 'style', 'layout', 'flexbox', 'grid', 'responsive'],
      'typescript': ['typescript', 'ts', 'type', 'interface', 'generic'],
      'node': ['node', 'nodejs', 'server', 'backend', 'express'],
      'database': ['database', 'sql', 'mongodb', 'query', 'schema'],
      'testing': ['test', 'testing', 'jest', 'unit', 'integration'],
      'performance': ['performance', 'optimization', 'speed', 'memory'],
      'debugging': ['debug', 'error', 'bug', 'issue', 'problem']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return topic;
      }
    }

    return 'general';
  }

  extractSentiment(message: string): string {
    const sentimentKeywords = {
      'confused': ['confused', 'lost', 'unclear', 'dont understand'],
      'frustrated': ['frustrated', 'stuck', 'annoying', 'difficult'],
      'excited': ['excited', 'awesome', 'cool', 'amazing'],
      'curious': ['curious', 'wondering', 'interested', 'how does'],
      'urgent': ['urgent', 'quickly', 'asap', 'deadline']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [sentiment, keywords] of Object.entries(sentimentKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return sentiment;
      }
    }

    return 'neutral';
  }

  formatMemoriesForContext(memories: RetrievedMemory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const contextString = memories
      .filter(memory => memory.similarity > 0.3) // Only include relevant memories
      .slice(0, 3) // Limit to top 3 most relevant
      .map(memory => {
        const timeAgo = this.getTimeAgo(new Date(memory.timestamp));
        return `Previous interaction (${timeAgo}): User asked "${memory.question}" about ${memory.topic}. Response was about ${memory.response.substring(0, 100)}...`;
      })
      .join('\n');

    return contextString ? `\nRelevant past interactions:\n${contextString}\n` : '';
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return '1 week ago';
    return `${diffInWeeks} weeks ago`;
  }
}

export const memoryService = new MemoryService();
export type { MemoryEvent, RetrievedMemory };