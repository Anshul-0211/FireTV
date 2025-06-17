# FireTV Backend API

A Node.js/Express backend API for the FireTV UI application with PostgreSQL database integration.

## Features

- **User Management**: CRUD operations for user profiles
- **Mood Tracking**: Track user mood selections with timestamps
- **Watched Movies**: Store and manage watched movie data with ratings
- **PostgreSQL Integration**: Robust database with proper indexing and relationships
- **TypeScript**: Full type safety and modern development experience
- **RESTful API**: Clean, well-documented API endpoints
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Helmet, CORS, and input validation

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with pg driver
- **Security**: Helmet, CORS, bcryptjs, jsonwebtoken
- **Development**: nodemon, TypeScript compiler
- **Logging**: Morgan

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**:
   ```sql
   CREATE DATABASE firetv_db;
   CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE firetv_db TO your_username;
   ```

4. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=firetv_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

5. **Build and start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Database Schema

The application automatically creates the following tables:

### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Mood Selections
```sql
CREATE TABLE mood_selections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood mood_type NOT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    page VARCHAR(50) NOT NULL DEFAULT 'main',
    UNIQUE(user_id, page, DATE(selected_at))
);
```

### Watched Movies
```sql
CREATE TABLE watched_movies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    tmdb_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rating movie_rating NOT NULL,
    current_mood mood_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id)
);
```

## API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Health Check
- `GET /api/health` - Server health check

### Users API

#### Get all users
- `GET /api/users`
- Response: Array of user objects

#### Get user by ID
- `GET /api/users/:id`
- Response: User object

#### Get user by username
- `GET /api/users/username/:username`
- Response: User object

#### Create user
- `POST /api/users`
- Body:
  ```json
  {
    "username": "string",
    "display_name": "string",
    "email": "string (optional)",
    "avatar_url": "string (optional)",
    "preferences": {
      "favorite_genres": ["string"],
      "theme_color": "string"
    }
  }
  ```

#### Update user
- `PUT /api/users/:id`
- Body: Partial user object

#### Delete user
- `DELETE /api/users/:id`

#### Check username availability
- `GET /api/users/check/username/:username`
- Response: `{ "exists": boolean }`

### Moods API

#### Get user mood selections
- `GET /api/moods/user/:userId?limit=10`
- Response: Array of mood selections

#### Get latest mood selection
- `GET /api/moods/user/:userId/latest?page=main`
- Response: Latest mood selection or null

#### Create/Update mood selection
- `POST /api/moods/user/:userId`
- Body:
  ```json
  {
    "mood": "sad|just_fine|neutral|cheerful|very_happy",
    "page": "string"
  }
  ```

#### Get mood statistics
- `GET /api/moods/user/:userId/stats?days=30`
- Response: Mood statistics grouped by type

#### Check if should show mood selector
- `GET /api/moods/user/:userId/should-show?page=main`
- Response: `{ "shouldShow": boolean }`

### Watched Movies API

#### Get user watched movies
- `GET /api/watched-movies/user/:userId?limit=10&offset=0`
- Response: Array of watched movies

#### Get watched status for specific movie
- `GET /api/watched-movies/user/:userId/status/:tmdbId`
- Response: Watched movie object or null

#### Mark movie as watched
- `POST /api/watched-movies/user/:userId`
- Body:
  ```json
  {
    "movie_id": "number",
    "tmdb_id": "number",
    "title": "string",
    "rating": "disliked|good|loved",
    "current_mood": "sad|just_fine|neutral|cheerful|very_happy (optional)"
  }
  ```

#### Update watched movie
- `PUT /api/watched-movies/user/:userId/:tmdbId`
- Body:
  ```json
  {
    "rating": "disliked|good|loved (optional)",
    "current_mood": "mood_type (optional)"
  }
  ```

#### Remove from watched list
- `DELETE /api/watched-movies/user/:userId/:tmdbId`

#### Get user movie statistics
- `GET /api/watched-movies/user/:userId/stats`
- Response: Movie statistics (total, by rating, average)

#### Get movies by rating
- `GET /api/watched-movies/user/:userId/rating/:rating`
- Response: Array of watched movies with specific rating

#### Get movies by mood
- `GET /api/watched-movies/user/:userId/mood/:mood`
- Response: Array of watched movies watched in specific mood

## Response Format

All API endpoints return responses in the following format:

```json
{
  "success": true,
  "data": "response_data",
  "message": "optional_message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "error_message"
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Database Management

The application includes utilities for database management:

```typescript
import { DatabaseInitializer } from './database/init';

// Initialize database tables
await DatabaseInitializer.initializeDatabase();

// Reset database (drop and recreate)
await DatabaseInitializer.resetDatabase();

// Seed test data
await DatabaseInitializer.seedTestData();

// Get database statistics
const stats = await DatabaseInitializer.getDatabaseStats();
```

### Environment Variables

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: firetv_db)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT secret key
- `ALLOWED_ORIGINS` - CORS allowed origins

## Frontend Integration

To integrate with the frontend, update the frontend's backend service configuration:

```typescript
// firetv-ui/src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  // ... other config
};
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL instance
3. Set secure JWT_SECRET
4. Configure proper CORS origins
5. Use a process manager like PM2
6. Set up reverse proxy with nginx
7. Enable SSL/HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 