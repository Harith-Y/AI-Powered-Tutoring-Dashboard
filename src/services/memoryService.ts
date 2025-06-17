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
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pinecone-memory`;
  }

  async storeMemory(memoryEvent: MemoryEvent): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/store`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
    try {
      const response = await fetch(`${this.baseUrl}/retrieve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
        return [];
      }

      const result = await response.json();
      return result.success ? result.memories : [];
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
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