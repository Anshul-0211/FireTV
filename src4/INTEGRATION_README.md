# Fire TV Recommendation System Integration

This directory contains the integrated recommendation system for the Fire TV application, following the architecture described in your diagram.

## 🎯 Architecture Overview

The system follows this data flow:
1. **Web App** → **Database** (Backend PostgreSQL)
2. **Database** → **Recommendation Engine** (Python)
3. **Recommendation Engine** → **TMDB API** (Movie data)
4. **Recommendation Engine** → **Profile Tables** (anshul_dash, shikhar_dash, etc.)

## 📁 Files Overview

### Core Files
- `firetv_integration.py` - Main recommendation service that integrates with your backend
- `recommendation_schema.sql` - Database schema for profile tables and functions
- `setup_profile_tables.py` - Script to initialize profile tables with seed data

### Backend Integration
- `backend/src/controllers/recommendationController.ts` - API endpoints for recommendations
- `backend/src/routes/recommendationRoutes.ts` - Routes for recommendation endpoints
- Updated `backend/src/controllers/watchedMovieController.ts` - Triggers recommendations on movie watch

### Original Files (Reference)
- `main.py` - Advanced hybrid recommendation engine (for reference)
- `test.py` - Testing framework with PostgreSQL
- `test2.py` - Simplified Flask API example

## 🚀 Setup Instructions

### 1. Database Setup

First, ensure your Fire TV backend database is running, then add the recommendation tables:

```bash
# Navigate to your backend directory
cd backend

# Run the recommendation schema (after your main schema)
psql -h localhost -U postgres -d firetv_db -f ../src4/recommendation_schema.sql
```

### 2. Environment Variables

Set up your environment variables:

```bash
# Database connection
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=firetv_db
export DB_USER=postgres
export DB_PASSWORD=your_password

# TMDB API (get from https://www.themoviedb.org/settings/api)
export TMDB_API_KEY=your_tmdb_api_key_here
```

### 3. Python Dependencies

Install required Python packages:

```bash
cd src4
pip install psycopg2-binary requests numpy
```

### 4. Initialize Profile Tables

Run the setup script to populate profile tables with initial movie data:

```bash
cd src4
python setup_profile_tables.py
```

This will:
- Create 30 initial movies for each profile (anshul, shikhar, priyanshu, shaurya)
- Fetch movies based on each profile's preferred genres
- Add popular/trending movies as fallbacks

### 5. Backend Integration

The backend is already updated with:
- ✅ Recommendation controller and routes
- ✅ Auto-trigger when movies are marked as watched
- ✅ API endpoints for getting/refreshing recommendations

## 📡 API Endpoints

Your Fire TV backend now includes these new endpoints:

### Get Recommendations
```http
GET /api/recommendations/:username?limit=30
```
Returns current recommendations for a profile.

**Example:**
```bash
curl http://localhost:3000/api/recommendations/anshul?limit=10
```

### Refresh Recommendations
```http
POST /api/recommendations/:username/refresh
```
Manually refresh recommendations for a profile.

**Example:**
```bash
curl -X POST http://localhost:3000/api/recommendations/anshul/refresh
```

### Refresh All Profiles
```http
POST /api/recommendations/refresh-all
```
Refresh recommendations for all profiles.

### Get Statistics
```http
GET /api/recommendations/:username/stats
```
Get recommendation statistics and user watch history.

### Auto-Trigger (Internal)
```http
POST /api/recommendations/trigger-on-watch
```
Automatically called when a user marks a movie as watched.

## 🔄 How It Works

### 1. Initial State
- Each profile table (`anshul_dash`, etc.) contains 30 seed movies
- Movies are selected based on profile preferences:
  - **Anshul**: Action, Thriller, Sci-Fi, Adventure
  - **Shikhar**: Comedy, Drama, Romance, Family
  - **Priyanshu**: Horror, Mystery, Adventure, Thriller
  - **Shaurya**: Animation, Family, Fantasy, Adventure

### 2. User Watches Movie
1. User marks movie as watched in Fire TV app
2. Backend saves to `watched_movies` table
3. Backend automatically triggers `triggerRecommendationRefresh()`
4. Python recommendation service runs
5. New recommendations stored in profile table
6. Frontend gets updated recommendations

### 3. Recommendation Algorithm
The system uses **content-based filtering** that considers:
- **Genre preferences** (30% weight)
- **TMDB vote average** (40% weight)
- **Popularity score** (30% weight)
- **Mood adjustments** (multiplier based on current mood)
- **User rating history** (avoids movies user disliked)

### 4. Data Flow Example
```
User 'anshul' watches 'The Matrix' (rated 'loved')
↓
Backend saves to watched_movies table
↓
Triggers: python firetv_integration.py refresh anshul
↓
Python fetches:
  - anshul's watch history
  - anshul's current mood
  - anshul's preferred genres (Action, Thriller, Sci-Fi)
↓
Fetches candidate movies from TMDB
↓
Scores movies based on preferences
↓
Stores top 30 recommendations in anshul_dash table
↓
Frontend fetches updated recommendations
```

## 🧪 Testing

### Test Individual Profile
```bash
cd src4
python firetv_integration.py refresh anshul
```

### Test All Profiles
```bash
python firetv_integration.py refresh-all
```

### Get Current Recommendations
```bash
python firetv_integration.py get anshul 10
```

### Test API Endpoints
```bash
# Get recommendations
curl http://localhost:3000/api/recommendations/anshul

# Refresh recommendations
curl -X POST http://localhost:3000/api/recommendations/anshul/refresh

# Get stats
curl http://localhost:3000/api/recommendations/anshul/stats
```

## 🔧 Configuration

### Profile Configurations
Each profile has specific settings in `firetv_integration.py`:

```python
profile_configs = {
    'anshul': {
        'table_name': 'anshul_dash',
        'preferred_genres': ['Action', 'Thriller', 'Science Fiction', 'Adventure'],
        'mood_weights': {'excited': 1.3, 'neutral': 1.0, 'sad': 0.8}
    },
    # ... other profiles
}
```

### Mood Weights
- **excited**: 1.3x multiplier for action/adventure movies
- **neutral**: 1.0x (no change)
- **sad**: 0.8x for heavy content

### Database Tables
- `anshul_dash` - Anshul's recommendations
- `shikhar_dash` - Shikhar's recommendations  
- `priyanshu_dash` - Priyanshu's recommendations
- `shaurya_dash` - Shaurya's recommendations
- `recommendation_sessions` - Analytics/tracking

## 🚨 Troubleshooting

### Common Issues

1. **"Table does not exist"**
   ```bash
   # Run the schema file
   psql -h localhost -U postgres -d firetv_db -f recommendation_schema.sql
   ```

2. **"TMDB API key error"**
   ```bash
   # Set your API key
   export TMDB_API_KEY=your_actual_key_here
   ```

3. **"Database connection failed"**
   ```bash
   # Check your database credentials
   export DB_HOST=localhost
   export DB_USER=postgres
   export DB_PASSWORD=your_password
   ```

4. **"Python process failed"**
   ```bash
   # Check Python dependencies
   pip install psycopg2-binary requests numpy
   ```

### Logs
- Backend logs: Check Node.js console for recommendation triggers
- Python logs: Check recommendation service output
- Database logs: Check PostgreSQL logs for query issues

## 🔮 Future Enhancements

The system is designed to be easily upgradeable:

1. **Collaborative Filtering**: When enough users have watch history, switch to `main.py` hybrid approach
2. **Real-time Updates**: WebSocket integration for instant recommendation updates
3. **A/B Testing**: Multiple recommendation algorithms running in parallel
4. **Advanced Analytics**: User behavior tracking and recommendation effectiveness
5. **Machine Learning**: Integration with TensorFlow/PyTorch for deep learning recommendations

## 🤝 Integration with Fire TV Frontend

Your Fire TV frontend can now:

1. **Fetch recommendations** for any profile using the API
2. **Display recommendations** in the carousel/grid
3. **Automatically update** when users watch movies
4. **Show stats** and analytics to users

The recommendations will automatically refresh based on user behavior, creating a personalized experience for each profile. 