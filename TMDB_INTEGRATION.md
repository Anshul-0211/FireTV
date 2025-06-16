# TMDB Integration & Backend Architecture

## 🎯 Overview

This Fire TV UI application has been architected with a modular design that seamlessly integrates with TMDB API while being fully prepared for your future backend recommendation and mood analysis system.

## 🏗️ Architecture Components

### 1. **Type System** (`src/types/movie.ts`)
- **TMDB Types**: Direct mapping to TMDB API responses
- **Internal Types**: Normalized movie data structure
- **Backend Types**: Ready for mood/recommendation APIs
- **Future-proof**: Easily extensible for new features

### 2. **Configuration Layer** (`src/config/api.ts`)
- **TMDB Config**: API endpoints and image URLs
- **Backend Config**: Your future API endpoints
- **Environment Variables**: Secure API key management

### 3. **Service Layer**
#### TMDB Service (`src/services/tmdb.service.ts`)
- Complete TMDB API integration
- Error handling and data transformation
- Image URL generation utilities
- Singleton pattern for efficiency

#### Backend Service (`src/services/backend.service.ts`)
- **Ready for your APIs**: Mood analysis, recommendations
- **Service Factory**: Easy switching between TMDB/Backend
- **Interface-based**: Consistent API regardless of data source

### 4. **Data Transformation** (`src/utils/movie.utils.ts`)
- **TMDB → Internal**: Clean data normalization
- **Genre Mapping**: TMDB IDs to readable names
- **Rating System**: Vote averages to TV ratings
- **Utility Functions**: Filtering, sorting, formatting

### 5. **React Integration** (`src/hooks/useMovieData.ts`)
- **Custom Hook**: Clean data fetching with React
- **Loading States**: Elegant UX during API calls
- **Error Handling**: User-friendly error messages
- **Backend Toggle**: One flag to switch data sources

## 🔄 Backend Integration Path

### Step 1: Set Environment Variable
```env
NEXT_PUBLIC_BACKEND_URL=your-backend-url
```

### Step 2: Toggle Data Source
```typescript
// In src/app/page.tsx
const { ... } = useMovieData(true); // true = use backend
```

### Step 3: Your Backend Endpoints
```
POST /api/recommendations
{
  "userId": "string",
  "mood": { "mood": "happy", "intensity": 8 },
  "genres": ["Action", "Comedy"],
  "limit": 20
}

POST /api/mood-analysis
{
  "text": "I'm feeling excited today!",
  "context": { ... },
  "userId": "string"
}

GET /api/trending?limit=20
```

### Step 4: Response Format
Your backend should return data in this format:
```typescript
{
  "data": [
    {
      "id": 123,
      "title": "Movie Title",
      "description": "Plot summary...",
      "image": "poster-url",
      "backdropImage": "backdrop-url",
      "rating": "PG-13",
      "genre": "Action",
      "voteAverage": 8.5,
      "isAdult": false,
      "releaseDate": "2024-01-01"
    }
  ],
  "success": true,
  "mood_analysis": {
    "detected_mood": "excited",
    "confidence": 0.95
  }
}
```

## 🎭 Mood-Based Features Ready

### Mood Analysis Integration
```typescript
// Already implemented in backend.service.ts
const moodResult = await backendService.analyzeMood({
  text: "User input or context",
  userId: "user123"
});
```

### Recommendation Engine
```typescript
// Ready for your recommendation logic
const recommendations = await backendService.getMoodRecommendations({
  userId: "user123",
  mood: { mood: "happy", intensity: 7 },
  genres: ["Comedy", "Romance"],
  limit: 20
});
```

## 🚦 Current State

### ✅ Implemented
- Full TMDB API integration
- Real movie data (trending, popular, top-rated, now playing)
- Dynamic hero carousel with real backdrops
- Movie cards with ratings, genres, vote averages
- Loading states and error handling
- Modular architecture for easy backend switching

### 🔄 Ready for Backend
- Service layer prepared for your APIs
- Data transformation utilities
- Type definitions for mood/recommendation features
- Error handling and API response wrappers
- Easy toggle between TMDB and backend data

### 🎯 Backend Features to Implement
- User mood analysis from text/context
- Personalized movie recommendations
- Watch history tracking
- User preference learning
- Context-aware search

## 📊 Data Flow

```
User Interaction → React Hook → Service Factory → 
  ↓
TMDB Service OR Backend Service → Data Transformation → 
  ↓  
React Components → Fire TV UI
```

## 🔧 Development Workflow

1. **Current**: Test with TMDB data
2. **Backend Development**: Build your APIs
3. **Integration**: Change one flag to switch
4. **Enhancement**: Add mood-specific features
5. **Production**: Full backend integration

## 🛡️ Error Handling Strategy

- **API Key Missing**: Clear setup instructions
- **Network Errors**: Retry mechanisms
- **Backend Unavailable**: Fallback to TMDB
- **Image Loading**: Placeholder generation
- **Graceful Degradation**: App works in all states

## 📝 Next Steps for Backend Integration

1. **Create your backend APIs** following the interface
2. **Update `NEXT_PUBLIC_BACKEND_URL`** in environment
3. **Set `useMovieData(true)`** in the main component  
4. **Test the integration** with your endpoints
5. **Add mood-specific UI features** as needed

## 🎉 Benefits of This Architecture

- **Modular**: Easy to maintain and extend
- **Type-Safe**: Full TypeScript coverage
- **Flexible**: Switch between data sources easily
- **Scalable**: Ready for complex backend features
- **User-Friendly**: Elegant loading and error states
- **Production-Ready**: Proper error handling and fallbacks

Your Fire TV UI is now ready to seamlessly connect to your recommendation and mood analysis backend while maintaining the polished user experience! 