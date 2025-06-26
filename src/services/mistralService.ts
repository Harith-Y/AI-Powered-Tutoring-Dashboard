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
    // Check multiple possible environment variable names
    this.apiKey = import.meta.env.VITE_MISTRAL_API_KEY || 
                  import.meta.env.MISTRAL_API_KEY || 
                  '';
    
    this.model = import.meta.env.VITE_MISTRAL_MODEL || 
                 import.meta.env.MISTRAL_MODEL || 
                 'mistral-large-latest';
    
    // Debug logging for development
    if (import.meta.env.DEV) {
      console.log('Mistral Service Configuration:', {
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
        model: this.model,
        envVars: {
          VITE_MISTRAL_API_KEY: !!import.meta.env.VITE_MISTRAL_API_KEY,
          MISTRAL_API_KEY: !!import.meta.env.MISTRAL_API_KEY,
        }
      });
    }
    
    if (!this.apiKey) {
      console.warn('Mistral API key not found. Please check your .env file and ensure VITE_MISTRAL_API_KEY is set. AI features will use fallback responses.');
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Mistral API key not configured. Please add VITE_MISTRAL_API_KEY to your .env file.');
    }

    try {
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
        console.error('Mistral API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Mistral API Request Failed:', error);
      throw error;
    }
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

    // Enhanced keyword-based responses with more context
    if (userMessage.includes('react')) {
      return "React is a powerful JavaScript library for building user interfaces. It uses components to create reusable UI elements and manages state efficiently. Key concepts include:\n\n• Components and JSX\n• State and Props\n• Hooks (useState, useEffect)\n• Event handling\n• Conditional rendering\n\nWould you like me to explain any specific React concepts in more detail?";
    }
    
    if (userMessage.includes('javascript')) {
      return "JavaScript is a versatile programming language that powers the web. It handles everything from DOM manipulation to server-side development. Core topics include:\n\n• Variables and data types\n• Functions and scope\n• Objects and arrays\n• Async programming (Promises, async/await)\n• DOM manipulation\n• ES6+ features\n\nWhat specific JavaScript topic would you like to explore?";
    }
    
    if (userMessage.includes('css')) {
      return "CSS is essential for styling web pages. It controls layout, colors, fonts, and responsive design. Modern CSS includes:\n\n• Selectors and properties\n• Flexbox and Grid layouts\n• Responsive design\n• Animations and transitions\n• CSS variables\n• Preprocessors (Sass, Less)\n\nWhat CSS topic interests you most?";
    }

    if (userMessage.includes('typescript')) {
      return "TypeScript adds static typing to JavaScript, improving code quality and developer experience. Key features include:\n\n• Type annotations\n• Interfaces and types\n• Generics\n• Enums\n• Advanced types\n• Better IDE support\n\nWould you like to learn about specific TypeScript features?";
    }

    if (userMessage.includes('node')) {
      return "Node.js enables JavaScript on the server-side. It's great for building APIs and full-stack applications. Topics include:\n\n• Express.js framework\n• File system operations\n• HTTP requests and responses\n• Database integration\n• Authentication\n• Deployment\n\nWhat aspect of Node.js interests you?";
    }
    
    if (userMessage.includes('help') || userMessage.includes('explain') || userMessage.includes('learn')) {
      return "I'm here to help you learn programming! I can explain concepts, provide examples, and guide you through your learning journey. I specialize in:\n\n• Web development (HTML, CSS, JavaScript)\n• Frontend frameworks (React, Vue, Angular)\n• Backend development (Node.js, APIs)\n• Programming fundamentals\n• Best practices and debugging\n\nWhat specific topic would you like assistance with?";
    }

    if (userMessage.includes('error') || userMessage.includes('debug') || userMessage.includes('problem')) {
      return "Debugging is an essential skill! Here are some general debugging strategies:\n\n• Read error messages carefully\n• Use console.log() to trace values\n• Check the browser's developer tools\n• Break down complex problems\n• Use debugging tools and breakpoints\n• Search for similar issues online\n\nCan you share the specific error or problem you're encountering?";
    }

    // Default response with helpful suggestions
    return "I understand you're looking for help with your learning. I'm here to provide personalized guidance! I can help with:\n\n• **Programming concepts** - Explain how things work\n• **Code examples** - Show practical implementations\n• **Debugging help** - Solve problems together\n• **Learning paths** - Suggest what to study next\n• **Best practices** - Share industry standards\n\nCould you please be more specific about what topic or concept you'd like me to explain? For example:\n- 'Explain React hooks'\n- 'How do I center a div with CSS?'\n- 'What is async/await in JavaScript?'\n\nThe more specific your question, the better I can help! 🚀";
  }

  private createSimpleEmbedding(text: string): number[] {
    // Enhanced hash-based embedding for fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    // Semantic keyword mapping for better relevance
    const semanticKeywords = {
      'react': [0, 50, 100, 150],
      'javascript': [1, 51, 101, 151],
      'css': [2, 52, 102, 152],
      'typescript': [3, 53, 103, 153],
      'node': [4, 54, 104, 154],
      'hooks': [5, 55, 105, 155],
      'state': [6, 56, 106, 156],
      'component': [7, 57, 107, 157],
      'function': [8, 58, 108, 158],
      'async': [9, 59, 109, 159],
      'promise': [10, 60, 110, 160],
      'api': [11, 61, 111, 161],
      'database': [12, 62, 112, 162],
      'error': [13, 63, 113, 163],
      'debug': [14, 64, 114, 164],
      'performance': [15, 65, 115, 165],
      'optimization': [16, 66, 116, 166],
      'testing': [17, 67, 117, 167],
      'deployment': [18, 68, 118, 168],
      'security': [19, 69, 119, 169]
    };
    
    words.forEach((word, index) => {
      // Basic word frequency
      const hash = this.simpleHash(word);
      const pos = Math.abs(hash) % 100;
      embedding[pos] += 1 / (index + 1); // Weight by position
      
      // Semantic features
      if (semanticKeywords[word as keyof typeof semanticKeywords]) {
        semanticKeywords[word as keyof typeof semanticKeywords].forEach(idx => {
          embedding[idx] += 2;
        });
      }
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
    // If API key is not configured, use enhanced fallback
    if (!this.apiKey) {
      console.log('Using enhanced fallback response due to missing API key');
      return this.getEnhancedFallbackResponse(userMessage, context);
    }

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

  private getEnhancedFallbackResponse(
    userMessage: string,
    context: {
      skillLevel: string;
      completedTopics: string[];
      averageScore: number;
      memoryContext?: string;
    }
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    const { skillLevel, completedTopics, averageScore } = context;

    // Personalized greeting based on context
    let response = `Based on your ${skillLevel} level and ${completedTopics.length} completed topics (${Math.round(averageScore)}% average score), `;

    // Topic-specific responses
    if (lowerMessage.includes('react')) {
      if (skillLevel === 'beginner') {
        response += "let me explain React in simple terms. React is like building with LEGO blocks - each component is a reusable piece that you can combine to create complex UIs. Start with understanding JSX, props, and state.";
      } else if (skillLevel === 'intermediate') {
        response += "you're ready for more advanced React concepts! Focus on hooks like useEffect for side effects, custom hooks for reusable logic, and state management patterns.";
      } else {
        response += "let's dive into advanced React patterns like render props, higher-order components, and performance optimization techniques like React.memo and useMemo.";
      }
    } else if (lowerMessage.includes('javascript')) {
      if (skillLevel === 'beginner') {
        response += "JavaScript fundamentals are crucial. Focus on variables, functions, objects, and arrays. Practice with simple exercises before moving to DOM manipulation.";
      } else if (skillLevel === 'intermediate') {
        response += "you should explore async JavaScript (Promises, async/await), ES6+ features, and functional programming concepts like map, filter, and reduce.";
      } else {
        response += "consider advanced topics like closures, prototypal inheritance, design patterns, and performance optimization techniques.";
      }
    } else if (lowerMessage.includes('css')) {
      if (skillLevel === 'beginner') {
        response += "start with CSS basics: selectors, properties, and the box model. Then learn Flexbox for one-dimensional layouts.";
      } else {
        response += "explore CSS Grid for complex layouts, CSS variables for maintainable code, and animations for better user experience.";
      }
    } else {
      response += "I'm here to help with your programming journey! ";
      
      if (averageScore >= 80) {
        response += "Your high scores show you're doing excellent work. Consider tackling more challenging topics or building projects to apply your knowledge.";
      } else if (averageScore >= 60) {
        response += "You're making good progress. Focus on practicing the concepts you've learned and don't hesitate to review topics where you scored lower.";
      } else {
        response += "Let's strengthen your foundation. Review the basics and practice with simple exercises before moving to advanced topics.";
      }
    }

    // Add memory context if available
    if (context.memoryContext) {
      response += "\n\n🧠 **Building on our previous conversations:** I remember we've discussed similar topics before, which helps me provide more consistent guidance tailored to your learning journey.";
    }

    response += "\n\n💡 **Note:** I'm currently using smart fallback responses. For even more personalized AI assistance, please ensure your Mistral API key is properly configured in your environment variables.";

    return response;
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
      if (!this.apiKey) {
        console.log('Using fallback topic recommendations due to missing API key');
        return this.getFallbackRecommendations(skillLevel, preferredTopics, userHistory);
      }

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
      },
      {
        topicName: 'TypeScript Fundamentals',
        category: 'TypeScript',
        difficulty: 'intermediate',
        reasoning: 'Add type safety to your JavaScript projects and improve code quality.',
        confidence: 0.78
      },
      {
        topicName: 'Node.js & Express',
        category: 'Backend',
        difficulty: 'intermediate',
        reasoning: 'Learn server-side development to build full-stack applications.',
        confidence: 0.72
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

  // Method to get configuration status for debugging
  getConfigurationStatus(): { 
    configured: boolean; 
    hasApiKey: boolean; 
    model: string;
    apiKeyLength: number;
  } {
    return {
      configured: this.isConfigured(),
      hasApiKey: !!this.apiKey,
      model: this.model,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0
    };
  }
}

export const mistralService = new MistralService();
export type { MistralMessage };