import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface PineconeVector {
  id: string;
  values: number[];
  metadata: {
    userId: string;
    question: string;
    topic: string;
    response: string;
    timestamp: string;
    skillLevel: string;
    category: string;
    sentiment?: string;
    difficulty?: string;
  };
}

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

interface RetrieveMemoryRequest {
  userId: string;
  currentQuestion: string;
  topic: string;
  topK?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Mistral AI embedding function
async function createMistralEmbedding(text: string): Promise<number[]> {
  const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
  
  if (!mistralApiKey) {
    console.log('Mistral API key not found, using simple embedding');
    return createSimpleEmbedding(text);
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text],
      }),
    });

    if (!response.ok) {
      console.error('Mistral embedding API error:', await response.text());
      return createSimpleEmbedding(text);
    }

    const data = await response.json();
    return data.data[0]?.embedding || createSimpleEmbedding(text);
  } catch (error) {
    console.error('Error calling Mistral embedding API:', error);
    return createSimpleEmbedding(text);
  }
}

// Fallback simple embedding function
function createSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384-dimensional embedding
  
  // Simple word-based embedding with semantic features
  const semanticKeywords = {
    'react': [0, 50, 100],
    'javascript': [1, 51, 101],
    'css': [2, 52, 102],
    'typescript': [3, 53, 103],
    'node': [4, 54, 104],
    'hooks': [5, 55, 105],
    'state': [6, 56, 106],
    'component': [7, 57, 107],
    'function': [8, 58, 108],
    'async': [9, 59, 109],
    'promise': [10, 60, 110],
    'api': [11, 61, 111],
    'database': [12, 62, 112],
    'error': [13, 63, 113],
    'debug': [14, 64, 114],
    'performance': [15, 65, 115],
    'optimization': [16, 66, 116],
    'testing': [17, 67, 117],
    'deployment': [18, 68, 118],
    'security': [19, 69, 119]
  };

  // Difficulty indicators
  const difficultyKeywords = {
    'basic': [200, 250],
    'beginner': [200, 250],
    'simple': [200, 250],
    'advanced': [201, 251],
    'complex': [201, 251],
    'difficult': [201, 251],
    'intermediate': [202, 252],
    'moderate': [202, 252]
  };

  // Question type indicators
  const questionTypes = {
    'how': [300],
    'what': [301],
    'why': [302],
    'when': [303],
    'where': [304],
    'explain': [305],
    'help': [306],
    'error': [307],
    'problem': [308],
    'issue': [309]
  };

  // Sentiment indicators
  const sentimentKeywords = {
    'confused': [350],
    'stuck': [351],
    'frustrated': [352],
    'excited': [353],
    'interested': [354],
    'motivated': [355]
  };

  words.forEach((word, index) => {
    // Basic word frequency
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const pos = Math.abs(hash) % 100;
    embedding[pos] += 1;

    // Semantic features
    if (semanticKeywords[word as keyof typeof semanticKeywords]) {
      semanticKeywords[word as keyof typeof semanticKeywords].forEach(idx => {
        embedding[idx] += 2;
      });
    }

    // Difficulty features
    if (difficultyKeywords[word as keyof typeof difficultyKeywords]) {
      difficultyKeywords[word as keyof typeof difficultyKeywords].forEach(idx => {
        embedding[idx] += 1.5;
      });
    }

    // Question type features
    if (questionTypes[word as keyof typeof questionTypes]) {
      questionTypes[word as keyof typeof questionTypes].forEach(idx => {
        embedding[idx] += 1;
      });
    }

    // Sentiment features
    if (sentimentKeywords[word as keyof typeof sentimentKeywords]) {
      sentimentKeywords[word as keyof typeof sentimentKeywords].forEach(idx => {
        embedding[idx] += 1;
      });
    }

    // Position-based features (early words are more important)
    const positionWeight = Math.max(0.1, 1 - (index / words.length));
    const positionIdx = 120 + (index % 50);
    embedding[positionIdx] += positionWeight;
  });

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }
  
  return embedding;
}

async function storeToPinecone(vector: PineconeVector): Promise<boolean> {
  try {
    const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');
    const pineconeEnvironment = Deno.env.get('PINECONE_ENVIRONMENT') || 'us-east1-gcp';
    const pineconeIndexName = Deno.env.get('PINECONE_INDEX_NAME') || 'ai-tutor-memory';

    if (!pineconeApiKey) {
      console.log('Pinecone API key not found, using local storage simulation');
      return true; // Simulate success for development
    }

    const pineconeUrl = `https://${pineconeIndexName}-${pineconeEnvironment}.pinecone.io/vectors/upsert`;

    const response = await fetch(pineconeUrl, {
      method: 'POST',
      headers: {
        'Api-Key': pineconeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [vector],
        namespace: `user-${vector.metadata.userId}`
      }),
    });

    if (!response.ok) {
      console.error('Pinecone upsert failed:', await response.text());
      return false;
    }

    console.log('Successfully stored vector to Pinecone');
    return true;
  } catch (error) {
    console.error('Error storing to Pinecone:', error);
    return false;
  }
}

async function retrieveFromPinecone(request: RetrieveMemoryRequest): Promise<PineconeVector[]> {
  try {
    const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');
    const pineconeEnvironment = Deno.env.get('PINECONE_ENVIRONMENT') || 'us-east1-gcp';
    const pineconeIndexName = Deno.env.get('PINECONE_INDEX_NAME') || 'ai-tutor-memory';

    if (!pineconeApiKey) {
      console.log('Pinecone API key not found, returning mock data');
      // Return mock similar interactions for development
      return [
        {
          id: 'mock-1',
          values: [],
          metadata: {
            userId: request.userId,
            question: 'How do React hooks work?',
            topic: 'React',
            response: 'React hooks allow you to use state and lifecycle features in functional components...',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            skillLevel: 'beginner',
            category: 'React',
            sentiment: 'curious'
          }
        }
      ];
    }

    const queryEmbedding = await createMistralEmbedding(`${request.currentQuestion} ${request.topic}`);
    const pineconeUrl = `https://${pineconeIndexName}-${pineconeEnvironment}.pinecone.io/query`;

    const response = await fetch(pineconeUrl, {
      method: 'POST',
      headers: {
        'Api-Key': pineconeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: queryEmbedding,
        topK: request.topK || 5,
        includeMetadata: true,
        namespace: `user-${request.userId}`,
        filter: {
          userId: request.userId
        }
      }),
    });

    if (!response.ok) {
      console.error('Pinecone query failed:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error retrieving from Pinecone:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();

  try {
    if (action === 'store' && req.method === 'POST') {
      const memoryEvent: MemoryEvent = await req.json();

      // Create embedding for the question + topic using Mistral AI
      const textToEmbed = `${memoryEvent.question} ${memoryEvent.topic} ${memoryEvent.response}`;
      const embedding = await createMistralEmbedding(textToEmbed);

      // Create vector for Pinecone
      const vector: PineconeVector = {
        id: `${memoryEvent.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        values: embedding,
        metadata: {
          userId: memoryEvent.userId,
          question: memoryEvent.question,
          topic: memoryEvent.topic,
          response: memoryEvent.response,
          timestamp: new Date().toISOString(),
          skillLevel: memoryEvent.skillLevel,
          category: memoryEvent.category,
          sentiment: memoryEvent.sentiment,
          difficulty: memoryEvent.difficulty
        }
      };

      const success = await storeToPinecone(vector);

      return new Response(
        JSON.stringify({ 
          success, 
          vectorId: vector.id,
          message: success ? 'Memory stored successfully' : 'Failed to store memory',
          embeddingSource: Deno.env.get('MISTRAL_API_KEY') ? 'mistral' : 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'retrieve' && req.method === 'POST') {
      const retrieveRequest: RetrieveMemoryRequest = await req.json();
      
      const similarMemories = await retrieveFromPinecone(retrieveRequest);

      // Format memories for context
      const contextMemories = similarMemories.map(memory => ({
        question: memory.metadata.question,
        topic: memory.metadata.topic,
        response: memory.metadata.response,
        timestamp: memory.metadata.timestamp,
        skillLevel: memory.metadata.skillLevel,
        category: memory.metadata.category,
        sentiment: memory.metadata.sentiment,
        similarity: memory.score || 0
      }));

      return new Response(
        JSON.stringify({ 
          success: true, 
          memories: contextMemories,
          count: contextMemories.length,
          embeddingSource: Deno.env.get('MISTRAL_API_KEY') ? 'mistral' : 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint or method' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});