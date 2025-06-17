# AI-Powered Tutoring Dashboard

A comprehensive AI-powered learning platform with personalized tutoring, intelligent scheduling, and adaptive learning paths.

## Features

- **AI Mentor Chat**: Memory-enhanced conversational AI with RAG-powered resource recommendations
- **Intelligent Weekly Planner**: TensorFlow-powered topic recommendations and automated scheduling
- **Progress Analytics**: Comprehensive learning analytics and achievement tracking
- **Adaptive Learning**: Content difficulty adapts to user skill level and performance
- **Resource Recommendations**: Curated learning materials from GitHub, Stack Overflow, and educational content

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **AI/ML**: TensorFlow.js, Pinecone Vector Database
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

### Pinecone Configuration (for Memory Service)
```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=ai-tutor-memory
```

### Optional: OpenAI Configuration
```env
OPENAI_API_KEY=your-openai-api-key
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

3. **Set up Supabase** (optional, for advanced AI features):
   - Create a Supabase project
   - Deploy the edge functions in `/supabase/functions/`
   - Copy your config to `.env`

4. **Set up Pinecone** (optional, for memory-enhanced chat):
   - Create a Pinecone account
   - Create an index named `ai-tutor-memory`
   - Copy your API key to `.env`

5. **Start development server**:
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
2. **Topic Recommendations**: TensorFlow.js models analyze learning patterns to suggest next topics
3. **RAG-Powered Resources**: Retrieval-augmented generation finds relevant learning materials
4. **Adaptive Difficulty**: Content difficulty adjusts based on user performance and skill level

### Data Flow

1. User interactions → Firebase Firestore
2. Chat conversations → Pinecone vector storage
3. Learning analytics → Real-time dashboard updates
4. AI recommendations → Personalized learning paths

## Security

- All sensitive credentials are stored in environment variables
- Firebase security rules protect user data
- Supabase RLS policies secure edge functions
- Client-side validation with server-side verification

## Development

### Project Structure
```
src/
├── components/          # React components
├── context/            # React context providers
├── services/           # API and database services
├── types/              # TypeScript type definitions
└── firebase/           # Firebase configuration

supabase/
└── functions/          # Edge functions for AI features
```

### Key Services

- `firestore.ts`: Database operations
- `memoryService.ts`: AI memory management
- `AuthContext.tsx`: Authentication state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details