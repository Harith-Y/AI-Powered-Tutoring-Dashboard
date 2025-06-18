# AI-Powered Tutoring Dashboard

A comprehensive AI-powered learning platform with personalized tutoring, intelligent scheduling, and adaptive learning paths.

## Features

- **AI Mentor Chat**: Memory-enhanced conversational AI with RAG-powered resource recommendations
- **Intelligent Weekly Planner**: AI-powered topic recommendations and automated scheduling
- **Progress Analytics**: Comprehensive learning analytics and achievement tracking
- **Adaptive Learning**: Content difficulty adapts to user skill level and performance
- **Resource Recommendations**: Curated learning materials from GitHub, Stack Overflow, and educational content

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **AI/ML**: Mistral AI, Pinecone Vector Database
- **Edge Functions**: Supabase Edge Functions
- **Deployment**: Netlify

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables:

### Firebase Configuration
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Supabase Configuration (for Edge Functions)
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Mistral AI Configuration
```env
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-large-latest
```

### Pinecone Configuration (for Memory Service)
```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=ai-tutor-memory
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Firebase**:
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your config to `.env`

3. **Set up Mistral AI**:
   - Create a Mistral AI account at [console.mistral.ai](https://console.mistral.ai)
   - Generate an API key
   - Add your API key to `.env`

4. **Set up Supabase** (optional, for advanced AI features):
   - Create a Supabase project
   - Deploy the edge functions in `/supabase/functions/`
   - Copy your config to `.env`

5. **Set up Pinecone** (optional, for memory-enhanced chat):
   - Create a Pinecone account
   - Create an index named `ai-tutor-memory`
   - Copy your API key to `.env`

6. **Start development server**:
   ```bash
   npm run dev
   ```

## Deployment

The application is configured for Netlify deployment:

```bash
npm run build
```

## Architecture

### AI Features

1. **Memory-Enhanced Chat**: Uses Pinecone vector database to store and retrieve conversation context
2. **Topic Recommendations**: Mistral AI analyzes learning patterns to suggest next topics
3. **RAG-Powered Resources**: Retrieval-augmented generation finds relevant learning materials
4. **Adaptive Difficulty**: Content difficulty adjusts based on user performance and skill level

### Data Flow

1. User interactions → Firebase Firestore
2. Chat conversations → Pinecone vector storage (with Mistral AI embeddings)
3. Learning analytics → Real-time dashboard updates
4. AI recommendations → Personalized learning paths (powered by Mistral AI)

## Mistral AI Integration

This application uses Mistral AI for:

- **Conversational AI**: Personalized tutoring responses adapted to user skill level
- **Topic Recommendations**: Intelligent analysis of learning history to suggest next topics
- **Text Embeddings**: High-quality embeddings for memory storage and retrieval
- **Content Generation**: Dynamic explanations and learning guidance

### Mistral AI Models Used

- **mistral-large-latest**: For conversational AI and topic recommendations
- **mistral-embed**: For generating text embeddings for memory storage

### Cost Optimization

- Fallback mechanisms when API is unavailable
- Smart caching of responses
- Efficient prompt engineering to minimize token usage
- Local embeddings as fallback for development

## Security

- All sensitive credentials are stored in environment variables
- Firebase security rules protect user data
- Supabase RLS policies secure edge functions
- Mistral AI API keys are server-side only
- Client-side validation with server-side verification

## Development

### Project Structure
```
src/
├── components/          # React components
├── context/            # React context providers
├── services/           # API and database services
│   ├── mistralService.ts    # Mistral AI integration
│   ├── memoryService.ts     # Memory management
│   └── firestore.ts         # Database operations
├── types/              # TypeScript type definitions
└── firebase/           # Firebase configuration

supabase/
└── functions/          # Edge functions for AI features
    ├── pinecone-memory/     # Memory storage with Mistral embeddings
    └── topic-recommendations/ # AI-powered recommendations
```

### Key Services

- `mistralService.ts`: Mistral AI integration for chat and recommendations
- `memoryService.ts`: AI memory management with Pinecone
- `firestore.ts`: Database operations
- `AuthContext.tsx`: Authentication state management

## API Costs

### Mistral AI Pricing (as of 2024)
- **mistral-large-latest**: ~$8 per 1M tokens
- **mistral-embed**: ~$0.1 per 1M tokens

### Cost Optimization Features
- Intelligent caching to reduce API calls
- Fallback to local algorithms when API is unavailable
- Efficient prompt engineering
- User-based rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues related to:
- **Mistral AI**: Check [Mistral AI Documentation](https://docs.mistral.ai/)
- **Firebase**: Check [Firebase Documentation](https://firebase.google.com/docs)
- **Pinecone**: Check [Pinecone Documentation](https://docs.pinecone.io/)
- **Application**: Create an issue in this repository