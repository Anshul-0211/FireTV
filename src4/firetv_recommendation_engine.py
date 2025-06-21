#!/usr/bin/env python3
"""
FireTV Integrated Movie Recommendation Engine
Connects to PostgreSQL backend and provides recommendations for Fire TV profiles
"""

import psycopg2
import psycopg2.extras
import requests
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import Counter, defaultdict
import logging
import os
from dataclasses import dataclass

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TMDBConfig:
    api_key: str
    base_url: str = "https://api.themoviedb.org/3"
    image_base_url: str = "https://image.tmdb.org/t/p/w500"

@dataclass
class DatabaseConfig:
    host: str = "localhost"
    port: int = 5432
    database: str = "firetv_db"
    user: str = "postgres"
    password: str = "password"

class FireTVRecommendationEngine:
    """
    Integrated recommendation engine for Fire TV application
    Follows the architecture: Backend DB -> Recommendation Engine -> Profile Tables
    """
    
    def __init__(self, db_config: DatabaseConfig, tmdb_config: TMDBConfig):
        self.db_config = db_config
        self.tmdb_config = tmdb_config
        
        # Profile configurations matching Fire TV app
        self.profile_configs = {
            'anshul': {
                'table_name': 'anshul_dash',
                'preferred_genres': ['Action', 'Thriller', 'Science Fiction', 'Adventure'],
                'mood_weights': {'excited': 1.3, 'neutral': 1.0, 'sad': 0.8}
            },
            'shikhar': {
                'table_name': 'shikhar_dash', 
                'preferred_genres': ['Comedy', 'Drama', 'Romance', 'Family'],
                'mood_weights': {'cheerful': 1.3, 'very_happy': 1.4, 'neutral': 1.0}
            },
            'priyanshu': {
                'table_name': 'priyanshu_dash',
                'preferred_genres': ['Horror', 'Mystery', 'Adventure', 'Thriller'],
                'mood_weights': {'excited': 1.2, 'neutral': 1.0, 'sad': 1.1}
            },
            'shaurya': {
                'table_name': 'shaurya_dash',
                'preferred_genres': ['Animation', 'Family', 'Fantasy', 'Adventure'],
                'mood_weights': {'very_happy': 1.4, 'cheerful': 1.3, 'neutral': 1.0}
            }
        }
        
        logger.info("🎬 FireTV Recommendation Engine initialized")
    
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(
                host=self.db_config.host,
                port=self.db_config.port,
                database=self.db_config.database,
                user=self.db_config.user,
                password=self.db_config.password
            )
            return conn
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return None
    
    def get_user_data_from_backend(self, username: str) -> Dict:
        """
        Fetch user data from backend database
        Returns formatted data for recommendation engine
        """
        conn = self.get_db_connection()
        if not conn:
            return {}
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get user info
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            
            if not user:
                logger.warning(f"User {username} not found")
                return {}
            
            user_id = user['id']
            
            # Get watched movies with ratings
            cursor.execute("""
                SELECT tmdb_id, title, rating, current_mood, watched_at
                FROM watched_movies 
                WHERE user_id = %s 
                ORDER BY watched_at DESC
            """, (user_id,))
            
            watched_movies = cursor.fetchall()
            
            # Convert rating enum to numeric
            rating_map = {'disliked': 3.0, 'good': 7.0, 'loved': 9.0}
            user_history = [movie['tmdb_id'] for movie in watched_movies]
            ratings = {
                str(movie['tmdb_id']): rating_map.get(movie['rating'], 5.0) 
                for movie in watched_movies if movie['rating']
            }
            
            # Get latest mood
            cursor.execute("""
                SELECT mood FROM mood_selections 
                WHERE user_id = %s 
                ORDER BY selected_at DESC 
                LIMIT 1
            """, (user_id,))
            
            mood_result = cursor.fetchone()
            current_mood = mood_result['mood'] if mood_result else 'neutral'
            
            # Get user preferences from profile
            profile_config = self.profile_configs.get(username, {})
            favorite_genres = profile_config.get('preferred_genres', [])
            
            conn.close()
            
            return {
                'user_id': user_id,
                'username': username,
                'user_history': user_history,
                'ratings': ratings,
                'favourite_genres': favorite_genres,
                'mood': current_mood,
                'time_watched': 'day',  # Default for Fire TV
                'count': 30,
                'total_watched': len(watched_movies),
                'profile_config': profile_config
            }
            
        except Exception as e:
            logger.error(f"Error fetching user data: {e}")
            return {}
        finally:
            if conn:
                conn.close()
    
    def get_all_users_data(self) -> List[Dict]:
        """Get all users data for collaborative filtering"""
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get all users with their watched movies
            cursor.execute("""
                SELECT 
                    u.id, u.username,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'tmdb_id', wm.tmdb_id,
                                'rating', wm.rating,
                                'watched_at', wm.watched_at
                            ) ORDER BY wm.watched_at DESC
                        ) FILTER (WHERE wm.tmdb_id IS NOT NULL), 
                        '[]'::json
                    ) as movies
                FROM users u
                LEFT JOIN watched_movies wm ON u.id = wm.user_id
                GROUP BY u.id, u.username
            """)
            
            users_data = cursor.fetchall()
            
            all_users = []
            rating_map = {'disliked': 3.0, 'good': 7.0, 'loved': 9.0}
            
            for user_row in users_data:
                movies = json.loads(user_row['movies']) if user_row['movies'] else []
                
                if not movies:  # Skip users with no watch history
                    continue
                
                user_history = [movie['tmdb_id'] for movie in movies]
                ratings = {
                    str(movie['tmdb_id']): rating_map.get(movie['rating'], 5.0)
                    for movie in movies if movie['rating']
                }
                
                profile_config = self.profile_configs.get(user_row['username'], {})
                
                all_users.append({
                    'user_id': user_row['id'],
                    'username': user_row['username'],
                    'user_history': user_history,
                    'ratings': ratings,
                    'favourite_genres': profile_config.get('preferred_genres', []),
                    'mood': 'neutral',  # Default
                    'time_watched': 'day'
                })
            
            conn.close()
            logger.info(f"✅ Fetched data for {len(all_users)} users")
            return all_users
            
        except Exception as e:
            logger.error(f"Error fetching all users data: {e}")
            return []
        finally:
            if conn:
                conn.close()
    
    def fetch_movie_details_from_tmdb(self, movie_ids: List[int]) -> List[Dict]:
        """Fetch movie details from TMDB API"""
        movies = []
        
        for movie_id in movie_ids:
            try:
                url = f"{self.tmdb_config.base_url}/movie/{movie_id}"
                params = {'api_key': self.tmdb_config.api_key}
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    movie_data = response.json()
                    
                    # Transform TMDB data to our format
                    movie = {
                        'tmdb_id': movie_data['id'],
                        'title': movie_data['title'],
                        'overview': movie_data.get('overview', ''),
                        'vote_average': movie_data.get('vote_average', 0.0),
                        'popularity': movie_data.get('popularity', 0.0),
                        'release_date': movie_data.get('release_date', ''),
                        'poster_path': movie_data.get('poster_path', ''),
                        'genres': [genre['name'] for genre in movie_data.get('genres', [])],
                        'runtime': movie_data.get('runtime', 0)
                    }
                    movies.append(movie)
                    
            except Exception as e:
                logger.warning(f"Failed to fetch movie {movie_id}: {e}")
                continue
        
        return movies
    
    def generate_recommendations_for_profile(self, username: str) -> List[Dict]:
        """
        Generate recommendations for a specific profile
        This is the core recommendation logic
        """
        logger.info(f"🎯 Generating recommendations for {username}")
        
        # Step 1: Get user data from backend
        user_data = self.get_user_data_from_backend(username)
        if not user_data:
            logger.error(f"No user data found for {username}")
            return []
        
        # Step 2: Check if we have enough data for collaborative filtering
        all_users_data = self.get_all_users_data()
        
        # Step 3: Generate candidate movies (mix of popular + genre-based)
        candidate_movies = self.get_candidate_movies(user_data)
        
        # Step 4: Apply recommendation algorithm
        if len(all_users_data) >= 5 and user_data['total_watched'] >= 3:
            # Use collaborative filtering + content-based hybrid
            recommendations = self.hybrid_recommendations(
                user_data, all_users_data, candidate_movies
            )
            method = 'hybrid'
        else:
            # Use content-based only (cold start)
            recommendations = self.content_based_recommendations(
                user_data, candidate_movies
            )
            method = 'content_based'
        
        # Step 5: Add recommendation metadata
        for rec in recommendations:
            rec['recommendation_method'] = method
            rec['generated_at'] = datetime.now().isoformat()
        
        logger.info(f"✅ Generated {len(recommendations)} recommendations using {method}")
        return recommendations[:30]  # Limit to 30 recommendations
    
    def get_candidate_movies(self, user_data: Dict) -> List[Dict]:
        """Get candidate movies from various sources"""
        user_history = set(user_data['user_history'])
        favorite_genres = user_data['favourite_genres']
        
        candidate_ids = set()
        
        # Popular movies by genre
        for genre in favorite_genres:
            try:
                genre_id_map = {
                    'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
                    'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
                    'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
                    'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
                    'Thriller': 53, 'War': 10752, 'Western': 37
                }
                
                genre_id = genre_id_map.get(genre)
                if not genre_id:
                    continue
                
                url = f"{self.tmdb_config.base_url}/discover/movie"
                params = {
                    'api_key': self.tmdb_config.api_key,
                    'with_genres': genre_id,
                    'sort_by': 'popularity.desc',
                    'vote_count.gte': 100,
                    'page': 1
                }
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    movies = response.json().get('results', [])
                    for movie in movies[:10]:  # Top 10 per genre
                        if movie['id'] not in user_history:
                            candidate_ids.add(movie['id'])
                            
            except Exception as e:
                logger.warning(f"Failed to fetch {genre} movies: {e}")
        
        # Add trending movies
        try:
            url = f"{self.tmdb_config.base_url}/trending/movie/week"
            params = {'api_key': self.tmdb_config.api_key}
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                trending = response.json().get('results', [])
                for movie in trending[:20]:
                    if movie['id'] not in user_history:
                        candidate_ids.add(movie['id'])
                        
        except Exception as e:
            logger.warning(f"Failed to fetch trending movies: {e}")
        
        # Fetch detailed information for candidates
        candidate_movies = self.fetch_movie_details_from_tmdb(list(candidate_ids))
        return candidate_movies
    
    def content_based_recommendations(self, user_data: Dict, candidates: List[Dict]) -> List[Dict]:
        """Content-based recommendation algorithm"""
        recommendations = []
        favorite_genres = set(user_data['favourite_genres'])
        mood = user_data['mood']
        profile_config = user_data.get('profile_config', {})
        
        for movie in candidates:
            if movie['tmdb_id'] in user_data['user_history']:
                continue
            
            # Base score from TMDB metrics
            score = 0.0
            
            # Vote average score (0-1)
            if movie['vote_average'] > 0:
                score += (movie['vote_average'] / 10.0) * 0.4
            
            # Popularity score (0-1, capped)
            if movie['popularity'] > 0:
                popularity_score = min(movie['popularity'] / 100.0, 1.0)
                score += popularity_score * 0.3
            
            # Genre matching score
            movie_genres = set(movie.get('genres', []))
            genre_overlap = len(movie_genres & favorite_genres)
            if favorite_genres:
                genre_score = genre_overlap / len(favorite_genres)
                score += genre_score * 0.3
            
            # Mood adjustment
            mood_weights = profile_config.get('mood_weights', {})
            mood_multiplier = mood_weights.get(mood, 1.0)
            score *= mood_multiplier
            
            recommendations.append({
                'tmdb_id': movie['tmdb_id'],
                'title': movie['title'],
                'vote_average': movie['vote_average'],
                'popularity': movie['popularity'],
                'genres': movie['genres'],
                'overview': movie['overview'],
                'poster_path': movie['poster_path'],
                'release_date': movie['release_date'],
                'similarity_score': round(min(score, 1.0), 4),
                'recommendation_reason': f"Matches {genre_overlap} preferred genres"
            })
        
        # Sort by similarity score
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        return recommendations
    
    def hybrid_recommendations(self, user_data: Dict, all_users: List[Dict], candidates: List[Dict]) -> List[Dict]:
        """Hybrid recommendation combining collaborative filtering and content-based"""
        
        # Get content-based recommendations
        content_recs = self.content_based_recommendations(user_data, candidates)
        content_scores = {rec['tmdb_id']: rec['similarity_score'] for rec in content_recs}
        
        # Simple collaborative filtering
        cf_scores = self.simple_collaborative_filtering(user_data, all_users, candidates)
        
        # Combine scores (70% content, 30% collaborative)
        hybrid_recs = []
        for rec in content_recs:
            tmdb_id = rec['tmdb_id']
            content_score = content_scores.get(tmdb_id, 0.0)
            cf_score = cf_scores.get(tmdb_id, 0.0)
            
            # Weighted combination
            hybrid_score = (content_score * 0.7) + (cf_score * 0.3)
            
            rec['similarity_score'] = round(hybrid_score, 4)
            rec['recommendation_reason'] = f"Hybrid: content ({content_score:.3f}) + collaborative ({cf_score:.3f})"
            hybrid_recs.append(rec)
        
        # Sort by hybrid score
        hybrid_recs.sort(key=lambda x: x['similarity_score'], reverse=True)
        return hybrid_recs
    
    def simple_collaborative_filtering(self, user_data: Dict, all_users: List[Dict], candidates: List[Dict]) -> Dict[int, float]:
        """Simple user-based collaborative filtering"""
        user_ratings = user_data['ratings']
        cf_scores = {}
        
        # Find similar users
        similarities = []
        for other_user in all_users:
            if other_user['user_id'] == user_data['user_id']:
                continue
            
            # Calculate similarity based on common ratings
            common_movies = set(user_ratings.keys()) & set(other_user['ratings'].keys())
            if len(common_movies) < 2:
                continue
            
            # Simple correlation
            user_common = [float(user_ratings[str(m)]) for m in common_movies]
            other_common = [float(other_user['ratings'][str(m)]) for m in common_movies]
            
            if len(user_common) > 0:
                # Pearson correlation approximation
                user_mean = np.mean(user_common)
                other_mean = np.mean(other_common)
                
                numerator = sum((u - user_mean) * (o - other_mean) for u, o in zip(user_common, other_common))
                user_std = np.sqrt(sum((u - user_mean) ** 2 for u in user_common))
                other_std = np.sqrt(sum((o - other_mean) ** 2 for o in other_common))
                
                if user_std > 0 and other_std > 0:
                    correlation = numerator / (user_std * other_std)
                    if correlation > 0.3:  # Only consider positively correlated users
                        similarities.append((other_user, correlation))
        
        # Generate predictions for candidates
        for candidate in candidates:
            tmdb_id = candidate['tmdb_id']
            if str(tmdb_id) in user_ratings:  # Skip already rated
                continue
            
            weighted_sum = 0.0
            similarity_sum = 0.0
            
            for similar_user, similarity in similarities:
                if str(tmdb_id) in similar_user['ratings']:
                    rating = float(similar_user['ratings'][str(tmdb_id)])
                    weighted_sum += similarity * rating
                    similarity_sum += abs(similarity)
            
            if similarity_sum > 0:
                predicted_rating = weighted_sum / similarity_sum
                cf_scores[tmdb_id] = min(predicted_rating / 10.0, 1.0)  # Normalize to 0-1
        
        return cf_scores
    
    def store_recommendations_to_profile(self, username: str, recommendations: List[Dict]) -> bool:
        """Store recommendations to the profile-specific table"""
        if username not in self.profile_configs:
            logger.error(f"Unknown profile: {username}")
            return False
        
        table_name = self.profile_configs[username]['table_name']
        
        conn = self.get_db_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            # Clear existing recommendations
            cursor.execute(f"DELETE FROM {table_name} WHERE is_active = TRUE")
            
            # Insert new recommendations
            insert_query = f"""
                INSERT INTO {table_name} 
                (tmdb_id, title, genres, vote_average, popularity, overview, 
                 poster_path, similarity_score, recommendation_reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (tmdb_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    similarity_score = EXCLUDED.similarity_score,
                    recommendation_reason = EXCLUDED.recommendation_reason,
                    added_at = CURRENT_TIMESTAMP,
                    is_active = TRUE
            """
            
            for rec in recommendations:
                cursor.execute(insert_query, (
                    rec['tmdb_id'],
                    rec['title'],
                    rec.get('genres', []),
                    rec.get('vote_average'),
                    rec.get('popularity'),
                    rec.get('overview', ''),
                    rec.get('poster_path', ''),
                    rec.get('similarity_score', 0.5),
                    rec.get('recommendation_reason', 'Generated recommendation')
                ))
            
            conn.commit()
            logger.info(f"✅ Stored {len(recommendations)} recommendations for {username}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing recommendations: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def get_profile_recommendations(self, username: str, limit: int = 30) -> List[Dict]:
        """Get current recommendations for a profile from database"""
        if username not in self.profile_configs:
            return []
        
        table_name = self.profile_configs[username]['table_name']
        
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute(f"""
                SELECT tmdb_id, title, genres, vote_average, popularity, 
                       overview, poster_path, similarity_score, added_at
                FROM {table_name} 
                WHERE is_active = TRUE 
                ORDER BY similarity_score DESC, added_at DESC 
                LIMIT %s
            """, (limit,))
            
            recommendations = cursor.fetchall()
            return [dict(rec) for rec in recommendations]
            
        except Exception as e:
            logger.error(f"Error fetching recommendations for {username}: {e}")
            return []
        finally:
            conn.close()
    
    def refresh_recommendations_for_profile(self, username: str) -> bool:
        """
        Main function to refresh recommendations for a profile
        This is triggered when user's watch history is updated
        """
        logger.info(f"🔄 Refreshing recommendations for {username}")
        
        start_time = datetime.now()
        
        # Generate new recommendations
        recommendations = self.generate_recommendations_for_profile(username)
        
        if not recommendations:
            logger.warning(f"No recommendations generated for {username}")
            return False
        
        # Store to profile table
        success = self.store_recommendations_to_profile(username, recommendations)
        
        if success:
            # Log session info
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.log_recommendation_session(username, len(recommendations), processing_time)
            
            logger.info(f"🎉 Successfully refreshed recommendations for {username} in {processing_time:.0f}ms")
        
        return success
    
    def log_recommendation_session(self, username: str, count: int, processing_time: float):
        """Log recommendation session for analytics"""
        conn = self.get_db_connection()
        if not conn:
            return
        
        try:
            cursor = conn.cursor()
            
            # Get user ID
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user_result = cursor.fetchone()
            if not user_result:
                return
            
            user_id = user_result[0]
            
            # Get current mood
            cursor.execute("""
                SELECT mood FROM mood_selections 
                WHERE user_id = %s 
                ORDER BY selected_at DESC 
                LIMIT 1
            """, (user_id,))
            
            mood_result = cursor.fetchone()
            current_mood = mood_result[0] if mood_result else None
            
            # Insert session log
            cursor.execute("""
                INSERT INTO recommendation_sessions 
                (user_id, profile_name, session_mood, movies_count, processing_time_ms, recommendation_method)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, username, current_mood, count, int(processing_time), 'hybrid'))
            
            conn.commit()
            
        except Exception as e:
            logger.error(f"Error logging session: {e}")
        finally:
            conn.close()


def main():
    """Example usage"""
    
    # Configuration (use environment variables in production)
    db_config = DatabaseConfig(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '5432')),
        database=os.getenv('DB_NAME', 'firetv_db'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )
    
    tmdb_config = TMDBConfig(
        api_key=os.getenv('TMDB_API_KEY', 'your_api_key_here')
    )
    
    # Initialize engine
    engine = FireTVRecommendationEngine(db_config, tmdb_config)
    
    # Test recommendation generation
    profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya']
    
    for profile in profiles:
        print(f"\n🎬 Testing recommendations for {profile}")
        success = engine.refresh_recommendations_for_profile(profile)
        
        if success:
            recs = engine.get_profile_recommendations(profile, 5)
            print(f"✅ Got {len(recs)} recommendations:")
            for i, rec in enumerate(recs[:3], 1):
                print(f"  {i}. {rec['title']} (Score: {rec['similarity_score']})")
        else:
            print(f"❌ Failed to generate recommendations for {profile}")


if __name__ == "__main__":
    main() 