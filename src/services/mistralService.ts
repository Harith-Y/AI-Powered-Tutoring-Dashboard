interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface EmbeddingResponse {
  id: string;
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

class MistralService {
  private apiKey: string;
  private baseUrl: string = 'https://api.mistral.ai/v1';
  private model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_MISTRAL_API_KEY || '';
    this.model = import.meta.env.VITE_MISTRAL_MODEL || 'mistral-large-latest';
    
    if (!this.apiKey) {
      console.warn('Mistral API key not found. AI features will use fallback responses.');
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Mistral API key not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async generateChatResponse(
    messages: MistralMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    try {
      const response: MistralResponse = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        top_p: options.topP || 1,
        stream: false,
      });

      return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('Error generating chat response:', error);
      return this.getFallbackResponse(messages);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response: EmbeddingResponse = await this.makeRequest('/embeddings', {
        model: 'mistral-embed',
        input: [text],
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error generating embedding:', error);
      return this.createSimpleEmbedding(text);
    }
  }

  private getFallbackResponse(messages: MistralMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.toLowerCase() || '';

    // Simple keyword-based responses
    if (userMessage.includes('react')) {
      return "React is a powerful JavaScript library for building user interfaces. It uses components to create reusable UI elements and manages state efficiently. Would you like me to explain any specific React concepts?";
    }
    
    if (userMessage.includes('javascript')) {
      return "JavaScript is a versatile programming language that powers the web. It handles everything from DOM manipulation to server-side development. What specific JavaScript topic would you like to explore?";
    }
    
    if (userMessage.includes('css')) {
      return "CSS is essential for styling web pages. It controls layout, colors, fonts, and responsive design. Modern CSS includes powerful features like Grid and Flexbox. What CSS topic interests you?";
    }
    
    if (userMessage.includes('help') || userMessage.includes('explain')) {
      return "I'm here to help you learn! I can explain programming concepts, provide examples, and guide you through your learning journey. What specific topic would you like assistance with?";
    }

    return "I understand you're looking for help with your learning. Could you please be more specific about what topic or concept you'd like me to explain? I'm here to provide personalized guidance based on your skill level.";
  }

  private createSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const pos = Math.abs(hash) % 384;
      embedding[pos] += 1 / (index + 1); // Weight by position
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  async generatePersonalizedResponse(
    userMessage: string,
    context: {
      skillLevel: string;
      completedTopics: string[];
      averageScore: number;
      memoryContext?: string;
    }
  ): Promise<string> {
    const systemPrompt = `You are an AI tutor specialized in programming and web development. 

User Context:
- Skill Level: ${context.skillLevel}
- Completed Topics: ${context.completedTopics.length} (${context.completedTopics.slice(0, 3).join(', ')})
- Average Score: ${Math.round(context.averageScore)}%
${context.memoryContext ? `- Previous Context: ${context.memoryContext}` : ''}

Guidelines:
- Adapt explanations to the user's ${context.skillLevel} level
- Reference their progress when relevant
- Provide practical examples and next steps
- Be encouraging and supportive
- Keep responses concise but informative`;

    const messages: MistralMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    return this.generateChatResponse(messages, {
      temperature: 0.7,
      maxTokens: 800
    });
  }

  async generateTopicRecommendations(
    userHistory: Array<{
      topicName: string;
      category: string;
      score: number;
      difficulty: string;
    }>,
    skillLevel: string,
    preferredTopics: string[]
  ): Promise<Array<{
    topicName: string;
    category: string;
    difficulty: string;
    reasoning: string;
    confidence: number;
  }>> {
    try {
      const systemPrompt = `You are an AI learning advisor. Based on the user's learning history, recommend 3 next topics.

User Profile:
- Skill Level: ${skillLevel}
- Preferred Topics: ${preferredTopics.join(', ')}
- Completed Topics: ${userHistory.length}

Learning History:
${userHistory.map(h => `- ${h.topicName} (${h.category}, ${h.difficulty}): ${h.score}%`).join('\n')}

Provide exactly 3 recommendations in this JSON format:
[
  {
    "topicName": "Topic Name",
    "category": "Category",
    "difficulty": "beginner|intermediate|advanced",
    "reasoning": "Why this topic is recommended",
    "confidence": 0.85
  }
]`;

      const response = await this.generateChatResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please provide 3 topic recommendations based on my learning history.' }
      ], {
        temperature: 0.3,
        maxTokens: 1000
      });

      // Try to parse JSON response
      try {
        const recommendations = JSON.parse(response);
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          return recommendations.slice(0, 3);
        }
      } catch (parseError) {
        console.warn('Could not parse recommendations JSON, using fallback');
      }
    } catch (error) {
      console.error('Error generating topic recommendations:', error);
    }

    // Fallback recommendations
    return this.getFallbackRecommendations(skillLevel, preferredTopics, userHistory);
  }

  private getFallbackRecommendations(
    skillLevel: string,
    preferredTopics: string[],
    userHistory: any[]
  ): Array<{
    topicName: string;
    category: string;
    difficulty: string;
    reasoning: string;
    confidence: number;
  }> {
    const completedCategories = new Set(userHistory.map(h => h.category));
    
    const recommendations = [
      {
        topicName: 'React Hooks Deep Dive',
        category: 'React',
        difficulty: skillLevel === 'beginner' ? 'intermediate' : skillLevel,
        reasoning: 'Essential for modern React development and builds on your existing knowledge.',
        confidence: 0.85
      },
      {
        topicName: 'Async JavaScript & Promises',
        category: 'JavaScript',
        difficulty: skillLevel === 'beginner' ? 'intermediate' : skillLevel,
        reasoning: 'Critical for handling API calls and asynchronous operations in web development.',
        confidence: 0.80
      },
      {
        topicName: 'CSS Grid Layout',
        category: 'CSS',
        difficulty: skillLevel === 'advanced' ? 'intermediate' : skillLevel,
        reasoning: 'Modern layout system that complements Flexbox for complex designs.',
        confidence: 0.75
      }
    ];

    // Filter based on preferred topics and completed work
    return recommendations.filter(rec => 
      preferredTopics.some(topic => 
        rec.category.toLowerCase().includes(topic.toLowerCase()) ||
        rec.topicName.toLowerCase().includes(topic.toLowerCase())
      )
    ).slice(0, 3);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getModel(): string {
    return this.model;
  }
}

export const mistralService = new MistralService();
export type { MistralMessage };