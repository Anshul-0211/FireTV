# Fire TV UI Clone with Real Movie Data

A Next.js web application that replicates the Amazon Fire TV user interface, built with modern web technologies and integrated with The Movie Database (TMDB) API for real movie data.

## 🚀 Features

- **Fire TV Header**: Fire TV logo with transparent background
- **Hero Section**: Dynamic carousel with real movie data from TMDB
- **Navigation Bar**: Profile, Home, Search, and Voice Search icons
- **Streaming Apps**: Grid of popular streaming service apps
- **Real Movie Data**: 
  - Trending movies
  - Popular movies  
  - Top-rated movies
  - Now playing movies
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Fire TV-style dark interface
- **Interactive Elements**: Hover effects and transitions
- **Modular Architecture**: Ready for backend integration

## 🛠 Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **TMDB API** - Real movie data

## 📋 Prerequisites

1. **TMDB API Key**: Get your free API key from [The Movie Database](https://www.themoviedb.org/settings/api)
2. **Node.js 18+**: Make sure you have Node.js installed

## 🚀 Getting Started

### 1. Clone and Install
```bash
git clone <your-repo>
cd firetv-ui
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# TMDB API Configuration
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key-here

# Future Backend Configuration (optional)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Architecture Overview

The application follows a modular architecture designed for easy backend integration:

### Core Structure
```
src/
├── types/           # TypeScript interfaces
│   └── movie.ts     # Movie, TMDB, and Backend types
├── config/          # Configuration files
│   └── api.ts       # API endpoints and settings
├── services/        # API service classes
│   ├── tmdb.service.ts     # TMDB API integration
│   └── backend.service.ts  # Future backend integration
├── utils/           # Utility functions
│   └── movie.utils.ts      # Data transformation utilities
├── hooks/           # Custom React hooks
│   └── useMovieData.ts     # Movie data fetching hook
└── app/             # Next.js app directory
    └── page.tsx     # Main Fire TV interface
```

### Service Layer
- **TMDB Service**: Handles all TMDB API calls
- **Backend Service**: Ready for your recommendation/mood API
- **Content Service Factory**: Easy switching between data sources

## 🔄 Backend Integration

The app is designed for easy backend integration. To switch to your backend:

### 1. Update the main component:
```typescript
// In src/app/page.tsx
const { ... } = useMovieData(true); // Set to true for backend
```

### 2. Implement your backend endpoints:
- `/api/recommendations` - Mood-based recommendations
- `/api/mood-analysis` - Mood detection
- `/api/trending` - Your trending content
- `/api/search` - Search with mood context

### 3. Update backend configuration:
```typescript
// In src/config/api.ts
export const BACKEND_CONFIG = {
  BASE_URL: 'your-backend-url',
  // ... endpoints
};
```

## 🎭 Future Backend Features

The architecture supports these planned features:

- **Mood-based Recommendations**: AI-powered content suggestions
- **User Preferences**: Personalized experience
- **Watch History**: Continue watching functionality
- **Smart Search**: Context-aware search results

## 🎨 Components

- **Hero Section**: Dynamic carousel with real movie backdrops
- **Movie Cards**: Rich cards with ratings, genres, and images
- **App Grid**: Streaming service app icons
- **Loading States**: Elegant loading animations
- **Error Handling**: User-friendly error messages

## 🔧 Customization

### Adding New Movie Categories
```typescript
// In src/hooks/useMovieData.ts
const newCategoryResult = await tmdbService.getYourNewCategory();
```

### Switching Data Sources
```typescript
// Use TMDB
const contentService = createContentService(false);

// Use your backend
const contentService = createContentService(true);
```

## 📊 API Integration

### TMDB Endpoints Used
- `/trending/movie/week` - Trending movies
- `/movie/popular` - Popular movies
- `/movie/top_rated` - Top-rated movies  
- `/movie/now_playing` - Currently playing

### Data Transformation
Raw TMDB data is transformed to internal format:
```typescript
interface Movie {
  id: number;
  title: string;
  description: string;
  image: string; // Poster URL
  backdropImage: string; // Background URL
  rating: string; // TV rating (TV-MA, PG-13, etc.)
  genre: string;
  voteAverage: number;
  // ...
}
```

## 🚦 Status Indicators

The app shows different states:
- **Loading**: Spinner with "Loading amazing content..."
- **Error**: Instructions for API key setup
- **Success**: Rich movie content with real data

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_TMDB_API_KEY` | Your TMDB API key | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Your backend URL | No |

## 🔍 Error Handling

- **API Key Missing**: Clear instructions shown
- **Network Errors**: Retry button provided
- **Image Loading**: Fallback placeholder images
- **Graceful Degradation**: App works even with API issues

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is for educational and demonstration purposes only.

## 🙏 Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie data
- [Shadcn/ui](https://ui.shadcn.com/) for components
- [Lucide](https://lucide.dev/) for icons
