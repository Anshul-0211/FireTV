#!/usr/bin/env python3
"""
FireTV Integrated Movie Recommendation Service
Connects to the existing PostgreSQL backend and provides recommendations
"""

import psycopg2
import psycopg2.extras
import requests
import json
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FireTVRecommendationService:
    """
    Integrated recommendation service for Fire TV application
    Architecture: Backend DB -> Recommendation Engine -> Profile Tables
    """
    
    def __init__(self, db_config: Dict, tmdb_api_key: str):
        self.db_config = db_config
        self.tmdb_api_key = tmdb_api_key
        self.tmdb_base_url = "https://api.themoviedb.org/3"
        
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
        
        logger.info("🎬 FireTV Recommendation Service initialized")
    
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(**self.db_config)
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
            
            return {
                'user_id': user_id,
                'username': username,
                'user_history': user_history,
                'ratings': ratings,
                'favourite_genres': favorite_genres,
                'mood': current_mood,
                'time_watched': 'day',
                'count': 30,
                'total_watched': len(watched_movies),
                'profile_config': profile_config
            }
            
        except Exception as e:
            logger.error(f"Error fetching user data: {e}")
            return {}
        finally:
            conn.close()
    
    def get_candidate_movies(self, user_data: Dict) -> List[Dict]:
        """Get candidate movies from TMDB based on user preferences"""
        user_history = set(user_data['user_history'])
        favorite_genres = user_data['favourite_genres']
        
        candidate_ids = set()
        
        # Genre ID mapping for TMDB
        genre_id_map = {
            'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
            'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
            'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
            'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
            'Thriller': 53, 'War': 10752, 'Western': 37
        }
        
        # Get movies by preferred genres
        for genre in favorite_genres:
            genre_id = genre_id_map.get(genre)
            if not genre_id:
                continue
            
            try:
                url = f"{self.tmdb_base_url}/discover/movie"
                params = {
                    'api_key': self.tmdb_api_key,
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
            url = f"{self.tmdb_base_url}/trending/movie/week"
            params = {'api_key': self.tmdb_api_key}
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                trending = response.json().get('results', [])
                for movie in trending[:20]:
                    if movie['id'] not in user_history:
                        candidate_ids.add(movie['id'])
                        
        except Exception as e:
            logger.warning(f"Failed to fetch trending movies: {e}")
        
        # Fetch detailed information for candidates
        candidate_movies = []
        for movie_id in list(candidate_ids)[:50]:  # Limit to 50 candidates
            try:
                url = f"{self.tmdb_base_url}/movie/{movie_id}"
                params = {'api_key': self.tmdb_api_key}
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    movie_data = response.json()
                    
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
                    candidate_movies.append(movie)
                    
            except Exception as e:
                logger.warning(f"Failed to fetch movie {movie_id}: {e}")
                continue
        
        return candidate_movies
    
    def generate_recommendations(self, user_data: Dict) -> List[Dict]:
        """Generate recommendations using content-based filtering"""
        candidates = self.get_candidate_movies(user_data)
        if not candidates:
            return []
        
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
                'recommendation_reason': f"Matches {genre_overlap} preferred genres, mood: {mood}"
            })
        
        # Sort by similarity score
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        return recommendations[:30]  # Return top 30
    
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
        
        # Step 1: Get user data from backend
        user_data = self.get_user_data_from_backend(username)
        if not user_data:
            logger.error(f"No user data found for {username}")
            return False
        
        # Step 2: Generate recommendations
        recommendations = self.generate_recommendations(user_data)
        
        if not recommendations:
            logger.warning(f"No recommendations generated for {username}")
            return False
        
        # Step 3: Store to profile table
        success = self.store_recommendations_to_profile(username, recommendations)
        
        if success:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"🎉 Successfully refreshed recommendations for {username} in {processing_time:.0f}ms")
        
        return success
    
    def refresh_all_profiles(self) -> Dict[str, bool]:
        """Refresh recommendations for all profiles"""
        results = {}
        
        for profile in self.profile_configs.keys():
            results[profile] = self.refresh_recommendations_for_profile(profile)
        
        return results


def main():
    """Main entry point with command line argument support"""
    import sys
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'firetv_db'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'password')
    }
    
    tmdb_api_key = os.getenv('TMDB_API_KEY', 'your_api_key_here')
    
    # Initialize service
    service = FireTVRecommendationService(db_config, tmdb_api_key)
    
    # Handle command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'refresh' and len(sys.argv) > 2:
            # Refresh recommendations for specific profile
            profile = sys.argv[2]
            print(f"🔄 Refreshing recommendations for {profile}")
            success = service.refresh_recommendations_for_profile(profile)
            if success:
                print(f"✅ Successfully refreshed recommendations for {profile}")
                sys.exit(0)
            else:
                print(f"❌ Failed to refresh recommendations for {profile}")
                sys.exit(1)
                
        elif command == 'refresh-all':
            # Refresh recommendations for all profiles
            print("🔄 Refreshing recommendations for all profiles")
            results = service.refresh_all_profiles()
            
            all_success = True
            for profile, success in results.items():
                if success:
                    print(f"✅ Successfully refreshed recommendations for {profile}")
                else:
                    print(f"❌ Failed to refresh recommendations for {profile}")
                    all_success = False
            
            sys.exit(0 if all_success else 1)
            
        elif command == 'get' and len(sys.argv) > 2:
            # Get recommendations for specific profile
            profile = sys.argv[2]
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            
            recs = service.get_profile_recommendations(profile, limit)
            print(f"📋 {len(recs)} recommendations for {profile}:")
            for i, rec in enumerate(recs, 1):
                print(f"  {i}. {rec['title']} (Score: {rec['similarity_score']})")
            
            sys.exit(0)
        
        else:
            print("Usage:")
            print("  python firetv_integration.py refresh <profile>")
            print("  python firetv_integration.py refresh-all")
            print("  python firetv_integration.py get <profile> [limit]")
            sys.exit(1)
    
    else:
        # Default behavior - test all profiles
        profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya']
        
        for profile in profiles:
            print(f"\n🎬 Testing recommendations for {profile}")
            success = service.refresh_recommendations_for_profile(profile)
            
            if success:
                recs = service.get_profile_recommendations(profile, 5)
                print(f"✅ Got {len(recs)} recommendations:")
                for i, rec in enumerate(recs[:3], 1):
                    print(f"  {i}. {rec['title']} (Score: {rec['similarity_score']})")
            else:
                print(f"❌ Failed to generate recommendations for {profile}")


if __name__ == "__main__":
    main() 