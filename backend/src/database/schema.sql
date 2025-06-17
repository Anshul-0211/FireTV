-- FireTV Database Schema

-- Create database (run this manually)
-- CREATE DATABASE firetv_db;

-- Use the database
-- \c firetv_db;

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom ENUM types
CREATE TYPE mood_type AS ENUM ('sad', 'just_fine', 'neutral', 'cheerful', 'very_happy');
CREATE TYPE movie_rating AS ENUM ('disliked', 'good', 'loved');

-- Users table
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

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Mood selections table
CREATE TABLE mood_selections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood mood_type NOT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    page VARCHAR(50) NOT NULL DEFAULT 'main',
    -- Unique constraint for single row per user/page
    UNIQUE(user_id, page)
);

-- Create indexes for mood selections
CREATE INDEX idx_mood_selections_user_id ON mood_selections(user_id);
CREATE INDEX idx_mood_selections_selected_at ON mood_selections(selected_at);
CREATE INDEX idx_mood_selections_page ON mood_selections(page);

-- Note: Daily uniqueness will be enforced in application logic
-- PostgreSQL doesn't allow non-immutable functions in unique indexes

-- Watched movies table
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
    UNIQUE(user_id, tmdb_id) -- One record per user per movie
);

-- Create indexes for watched movies
CREATE INDEX idx_watched_movies_user_id ON watched_movies(user_id);
CREATE INDEX idx_watched_movies_tmdb_id ON watched_movies(tmdb_id);
CREATE INDEX idx_watched_movies_watched_at ON watched_movies(watched_at);
CREATE INDEX idx_watched_movies_rating ON watched_movies(rating);
CREATE INDEX idx_watched_movies_current_mood ON watched_movies(current_mood);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watched_movies_updated_at BEFORE UPDATE ON watched_movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default users (matching frontend profiles)
INSERT INTO users (username, display_name, preferences) VALUES
('anshul', 'Anshul', '{"favorite_genres": ["Action", "Thriller", "Sci-Fi"], "theme_color": "blue"}'),
('shikhar', 'Shikhar', '{"favorite_genres": ["Comedy", "Drama", "Romance"], "theme_color": "green"}'),
('priyanshu', 'Priyanshu', '{"favorite_genres": ["Horror", "Mystery", "Adventure"], "theme_color": "red"}'),
('shaurya', 'Shaurya', '{"favorite_genres": ["Animation", "Family", "Fantasy"], "theme_color": "purple"}');

-- Create views for common queries
CREATE VIEW user_mood_history AS
SELECT 
    u.username,
    u.display_name,
    ms.mood,
    ms.selected_at,
    ms.page
FROM users u
JOIN mood_selections ms ON u.id = ms.user_id
ORDER BY ms.selected_at DESC;

CREATE VIEW user_watched_movies AS
SELECT 
    u.username,
    u.display_name,
    wm.title,
    wm.tmdb_id,
    wm.rating,
    wm.current_mood,
    wm.watched_at
FROM users u
JOIN watched_movies wm ON u.id = wm.user_id
ORDER BY wm.watched_at DESC;

-- Create view for user statistics
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    COUNT(wm.id) as total_movies_watched,
    COUNT(CASE WHEN wm.rating = 'loved' THEN 1 END) as loved_movies,
    COUNT(CASE WHEN wm.rating = 'good' THEN 1 END) as good_movies,
    COUNT(CASE WHEN wm.rating = 'disliked' THEN 1 END) as disliked_movies,
    COUNT(ms.id) as total_mood_selections,
    u.created_at
FROM users u
LEFT JOIN watched_movies wm ON u.id = wm.user_id
LEFT JOIN mood_selections ms ON u.id = ms.user_id
GROUP BY u.id, u.username, u.display_name, u.created_at; 