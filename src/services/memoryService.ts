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
  private isConfigured: boolean;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    this.isConfigured = !!(supabaseUrl && anonKey);
    
    if (!this.isConfigured) {
      console.warn('Supabase configuration missing. Memory service will use fallback mode.');
      this.baseUrl = '';
    } else {
      this.baseUrl = `${supabaseUrl}/functions/v1/pinecone-memory`;
    }
  }

  async storeMemory(memoryEvent: MemoryEvent): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Memory service in fallback mode - storing locally');
      this.storeMemoryLocally(memoryEvent);
      return true;
    }

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${this.baseUrl}/store`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryEvent),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Failed to store memory:', response.status, response.statusText);
        // Fallback to local storage
        this.storeMemoryLocally(memoryEvent);
        return true; // Still return success since we have fallback
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error storing memory:', error);
      // Fallback to local storage
      this.storeMemoryLocally(memoryEvent);
      return true; // Still return success since we have fallback
    }
  }

  async retrieveRelevantMemories(
    userId: string, 
    currentQuestion: string, 
    topic: string, 
    topK: number = 5
  ): Promise<RetrievedMemory[]> {
    if (!this.isConfigured) {
      console.log('Memory service in fallback mode - retrieving from local storage');
      return this.getLocalMemories(userId, currentQuestion, topic, topK);
    }

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Failed to retrieve memories:', response.status, response.statusText);
        return this.getLocalMemories(userId, currentQuestion, topic, topK);
      }

      const result = await response.json();
      return result.success ? result.memories : this.getLocalMemories(userId, currentQuestion, topic, topK);
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return this.getLocalMemories(userId, currentQuestion, topic, topK);
    }
  }

  private storeMemoryLocally(memoryEvent: MemoryEvent): void {
    try {
      const storageKey = `ai_tutor_memories_${memoryEvent.userId}`;
      const existingMemories = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const newMemory = {
        ...memoryEvent,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      existingMemories.push(newMemory);
      
      // Keep only the last 50 memories to avoid storage bloat
      if (existingMemories.length > 50) {
        existingMemories.splice(0, existingMemories.length - 50);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingMemories));
    } catch (error) {
      console.error('Error storing memory locally:', error);
    }
  }

  private getLocalMemories(userId: string, currentQuestion: string, topic: string, topK: number): RetrievedMemory[] {
    try {
      const storageKey = `ai_tutor_memories_${userId}`;
      const existingMemories = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (existingMemories.length === 0) {
        return this.getMockMemories(userId, currentQuestion, topic);
      }
      
      // Simple relevance scoring based on topic and question similarity
      const scoredMemories = existingMemories.map((memory: any) => {
        let similarity = 0;
        
        // Topic match
        if (memory.topic.toLowerCase() === topic.toLowerCase()) {
          similarity += 0.5;
        } else if (memory.category && memory.category.toLowerCase() === topic.toLowerCase()) {
          similarity += 0.3;
        }
        
        // Question similarity (simple keyword matching)
        const currentWords = currentQuestion.toLowerCase().split(' ');
        const memoryWords = memory.question.toLowerCase().split(' ');
        const commonWords = currentWords.filter(word => memoryWords.includes(word) && word.length > 3);
        similarity += (commonWords.length / Math.max(currentWords.length, memoryWords.length)) * 0.5;
        
        return {
          question: memory.question,
          topic: memory.topic,
          response: memory.response,
          timestamp: memory.timestamp,
          skillLevel: memory.skillLevel,
          category: memory.category,
          sentiment: memory.sentiment,
          similarity
        };
      });
      
      // Sort by similarity and return top K
      return scoredMemories
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
        
    } catch (error) {
      console.error('Error retrieving local memories:', error);
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

  // Method to check if the service is properly configured
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  // Method to get configuration status for debugging
  getConfigurationStatus(): { configured: boolean; hasUrl: boolean; hasKey: boolean } {
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return {
      configured: this.isConfigured,
      hasUrl,
      hasKey
    };
  }
}

export const memoryService = new MemoryService();
export type { MemoryEvent, RetrievedMemory };