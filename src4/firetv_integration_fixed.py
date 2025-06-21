#!/usr/bin/env python3
"""
FireTV Recommendation System Integration - Windows Compatible Version
Connects to backend database and provides movie recommendations for each profile
"""

import os
import sys
import json
import psycopg2
import psycopg2.extras
import requests
import logging
import random
from datetime import datetime
from typing import Dict, List, Optional

# Set UTF-8 encoding for Windows console
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

class FireTVRecommendationService:
    def __init__(self, db_config: Dict, tmdb_api_key: str):
        """Initialize the recommendation service"""
        
        # Remove emoji characters for Windows compatibility
        print("FireTV Recommendation Service initialized")
        self.setup_logging()
        
        # Database configuration
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'firetv_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', '263153'),  # Updated default password
            'port': int(os.getenv('DB_PORT', 5432))
        }
        
        # Override with provided config
        self.db_config.update(db_config)
        
        # TMDB configuration
        self.tmdb_api_key = tmdb_api_key
        self.tmdb_base_url = "https://api.themoviedb.org/3"
        
        # Profile configurations
        self.profile_configs = {
            'anshul': {
                'table_name': 'anshul_dash',
                'preferred_genres': ['Action', 'Thriller', 'Science Fiction', 'Adventure'],
                'mood_weights': {
                    'happy': 1.2, 'sad': 0.8, 'excited': 1.3, 'calm': 1.0,
                    'angry': 1.1, 'romantic': 0.9, 'adventurous': 1.4, 'nostalgic': 1.0
                }
            },
            'shikhar': {
                'table_name': 'shikhar_dash',
                'preferred_genres': ['Comedy', 'Drama', 'Romance', 'Family'],
                'mood_weights': {
                    'happy': 1.3, 'sad': 1.1, 'excited': 1.0, 'calm': 1.2,
                    'angry': 0.7, 'romantic': 1.4, 'adventurous': 0.9, 'nostalgic': 1.2
                }
            },
            'priyanshu': {
                'table_name': 'priyanshu_dash',
                'preferred_genres': ['Horror', 'Mystery', 'Adventure', 'Thriller'],
                'mood_weights': {
                    'happy': 1.0, 'sad': 1.0, 'excited': 1.3, 'calm': 0.8,
                    'angry': 1.2, 'romantic': 0.8, 'adventurous': 1.4, 'nostalgic': 0.9
                }
            },
            'shaurya': {
                'table_name': 'shaurya_dash',
                'preferred_genres': ['Animation', 'Family', 'Fantasy', 'Adventure'],
                'mood_weights': {
                    'happy': 1.4, 'sad': 0.9, 'excited': 1.2, 'calm': 1.1,
                    'angry': 0.8, 'romantic': 1.0, 'adventurous': 1.3, 'nostalgic': 1.1
                }
            }
        }
    
    def setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            raise
    
    def get_user_data_from_backend(self, username: str) -> Dict:
        """Get user data from the backend database"""
        conn = self.get_db_connection()
        if not conn:
            return {}
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get user ID from username (simplified mapping)
            user_id_map = {'anshul': 1, 'shikhar': 2, 'priyanshu': 3, 'shaurya': 4}
            user_id = user_id_map.get(username, 1)
            
            # Get watched movies
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
            self.logger.error(f"Error fetching user data: {e}")
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
        
        # Get movies by preferred genres - fetch multiple pages
        for genre in favorite_genres:
            genre_id = genre_id_map.get(genre)
            if not genre_id:
                continue
            
            # Fetch from multiple pages to get more variety
            for page in range(1, 4):  # Pages 1-3 for each genre
                try:
                    url = f"{self.tmdb_base_url}/discover/movie"
                    params = {
                        'api_key': self.tmdb_api_key,
                        'with_genres': genre_id,
                        'sort_by': 'popularity.desc',
                        'vote_count.gte': 100,
                        'page': page
                    }
                    
                    response = requests.get(url, params=params, timeout=10)
                    if response.status_code == 200:
                        movies = response.json().get('results', [])
                        for movie in movies[:50]:  # Top 50 per genre (increased from 10)
                            if movie['id'] not in user_history:
                                candidate_ids.add(movie['id'])
                                
                except Exception as e:
                    self.logger.warning(f"Failed to fetch {genre} movies page {page}: {e}")
        
        # Add multiple trending sources for more variety
        trending_endpoints = [
            ('trending/movie/week', 'weekly trending'),
            ('trending/movie/day', 'daily trending'),
            ('movie/popular', 'popular movies'),
            ('movie/top_rated', 'top rated movies')
        ]
        
        for endpoint, description in trending_endpoints:
            try:
                url = f"{self.tmdb_base_url}/{endpoint}"
                params = {'api_key': self.tmdb_api_key}
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    movies = response.json().get('results', [])
                    for movie in movies[:100]:  # Top 100 from each source
                        if movie['id'] not in user_history:
                            candidate_ids.add(movie['id'])
                            
            except Exception as e:
                self.logger.warning(f"Failed to fetch {description}: {e}")
        
        # Fetch detailed information for candidates
        candidate_movies = []
        for movie_id in list(candidate_ids)[:500]:  # Limit to 500 candidates (increased from 300)
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
                self.logger.warning(f"Failed to fetch movie {movie_id}: {e}")
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
        
        # Log sample size information
        self.logger.info(f"Generated recommendations from {len(candidates)} candidate movies")
        
        return recommendations[:50]  # Return top 50 (increased from 30)
    
    def store_recommendations_to_profile(self, username: str, recommendations: List[Dict]) -> bool:
        """Store recommendations to the profile-specific table"""
        if username not in self.profile_configs:
            self.logger.error(f"Unknown profile: {username}")
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
            self.logger.info(f"Stored {len(recommendations)} recommendations for {username}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error storing recommendations: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def get_profile_recommendations(self, username: str, limit: int = 50, shuffle: bool = True) -> List[Dict]:
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
            
            recommendations = [dict(rec) for rec in cursor.fetchall()]
            
            # Shuffle recommendations for random display if requested
            if shuffle and recommendations:
                random.shuffle(recommendations)
                self.logger.info(f"Shuffled {len(recommendations)} recommendations for random display")
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error fetching recommendations for {username}: {e}")
            return []
        finally:
            conn.close()
    
    def refresh_recommendations_for_profile(self, username: str) -> bool:
        """
        Main function to refresh recommendations for a profile
        This is triggered when user's watch history is updated
        """
        self.logger.info(f"Refreshing recommendations for {username}")
        
        start_time = datetime.now()
        
        # Step 1: Get user data from backend
        user_data = self.get_user_data_from_backend(username)
        if not user_data:
            self.logger.error(f"No user data found for {username}")
            return False
        
        # Step 2: Generate recommendations
        recommendations = self.generate_recommendations(user_data)
        
        if not recommendations:
            self.logger.warning(f"No recommendations generated for {username}")
            return False
        
        # Step 3: Store to profile table
        success = self.store_recommendations_to_profile(username, recommendations)
        
        if success:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.logger.info(f"Successfully refreshed recommendations for {username} in {processing_time:.0f}ms")
        
        return success
    
    def refresh_all_profiles(self) -> Dict[str, bool]:
        """Refresh recommendations for all profiles"""
        results = {}
        
        for profile in self.profile_configs.keys():
            results[profile] = self.refresh_recommendations_for_profile(profile)
        
        return results
    
    def add_incremental_recommendations(self, username: str, count: int = 10) -> bool:
        """
        Generate and add NEW recommendations when user watches a movie
        This adds to existing recommendations rather than replacing them
        """
        self.logger.info(f"Adding {count} incremental recommendations for {username}")
        
        start_time = datetime.now()
        
        # Step 1: Get user data from backend
        user_data = self.get_user_data_from_backend(username)
        if not user_data:
            self.logger.error(f"No user data found for {username}")
            return False
        
        # Step 2: Get existing recommendations to avoid duplicates
        existing_recs = self.get_profile_recommendations(username, limit=1000)
        existing_tmdb_ids = {rec['tmdb_id'] for rec in existing_recs}
        
        # Step 3: Temporarily override count for generation
        user_data['count'] = count * 3  # Generate more to account for duplicates
        
        # Step 4: Generate new recommendations
        new_recommendations = self.generate_recommendations(user_data)
        
        if not new_recommendations:
            self.logger.warning(f"No new recommendations generated for {username}")
            return False
        
        # Step 5: Filter out existing movies and limit to desired count
        filtered_recs = []
        for rec in new_recommendations:
            if rec['tmdb_id'] not in existing_tmdb_ids and len(filtered_recs) < count:
                filtered_recs.append(rec)
        
        if not filtered_recs:
            self.logger.warning(f"No new unique recommendations found for {username}")
            return False
        
        # Step 6: Add to database (without clearing existing)
        success = self.add_recommendations_to_profile(username, filtered_recs)
        
        if success:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.logger.info(f"Successfully added {len(filtered_recs)} new recommendations for {username} in {processing_time:.0f}ms")
        
        return success
    
    def add_recommendations_to_profile(self, username: str, recommendations: List[Dict]) -> bool:
        """
        Add new recommendations to profile table WITHOUT clearing existing ones
        """
        if username not in self.profile_configs:
            self.logger.error(f"Unknown profile: {username}")
            return False
        
        table_name = self.profile_configs[username]['table_name']
        
        conn = self.get_db_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            # Insert new recommendations (don't clear existing)
            insert_query = f"""
                INSERT INTO {table_name} 
                (tmdb_id, title, genres, vote_average, popularity, overview, 
                 poster_path, similarity_score, recommendation_reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (tmdb_id) DO UPDATE SET
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
                    rec.get('recommendation_reason', 'Added after watching movie')
                ))
            
            conn.commit()
            self.logger.info(f"Added {len(recommendations)} new recommendations for {username}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error adding recommendations: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def handle_movie_dislike(self, username: str, tmdb_id: int) -> bool:
        """
        Remove or deprioritize a disliked movie from recommendations
        """
        if username not in self.profile_configs:
            self.logger.error(f"Unknown profile: {username}")
            return False
        
        table_name = self.profile_configs[username]['table_name']
        
        conn = self.get_db_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            # Option 1: Remove completely
            cursor.execute(f"UPDATE {table_name} SET is_active = FALSE WHERE tmdb_id = %s", (tmdb_id,))
            
            # Option 2: Also reduce similarity scores for similar movies (same genre)
            cursor.execute(f"""
                UPDATE {table_name} 
                SET similarity_score = similarity_score * 0.7,
                    recommendation_reason = recommendation_reason || ' (Reduced due to dislike)'
                WHERE tmdb_id != %s 
                AND genres && (SELECT genres FROM {table_name} WHERE tmdb_id = %s LIMIT 1)
                AND is_active = TRUE
            """, (tmdb_id, tmdb_id))
            
            conn.commit()
            self.logger.info(f"Handled dislike for movie {tmdb_id} in {username}'s profile")
            return True
            
        except Exception as e:
            self.logger.error(f"Error handling dislike: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def get_profile_stats(self, username: str) -> Dict:
        """Get statistics about a profile's recommendations"""
        if username not in self.profile_configs:
            return {}
        
        table_name = self.profile_configs[username]['table_name']
        
        conn = self.get_db_connection()
        if not conn:
            return {}
        
        try:
            cursor = conn.cursor()
            
            # Get recommendation count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name} WHERE is_active = TRUE")
            active_count = cursor.fetchone()[0]
            
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_count = cursor.fetchone()[0]
            
            # Get average similarity score
            cursor.execute(f"SELECT AVG(similarity_score) FROM {table_name} WHERE is_active = TRUE")
            avg_score = cursor.fetchone()[0] or 0
            
            return {
                'active_recommendations': active_count,
                'total_recommendations': total_count,
                'average_similarity_score': float(avg_score),
                'growth': active_count - 30  # Assuming started with 30
            }
            
        except Exception as e:
            self.logger.error(f"Error getting profile stats: {e}")
            return {}
        finally:
            conn.close()


def main():
    """Main entry point with command line argument support"""
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'firetv_db'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '263153')  # Updated default password
    }
    
    tmdb_api_key = os.getenv('TMDB_API_KEY', '6bd9c6be12f52c21691a2cc2d4187047')
    
    # Initialize service
    service = FireTVRecommendationService(db_config, tmdb_api_key)
    
    # Handle command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'refresh' and len(sys.argv) > 2:
            # Refresh recommendations for specific profile
            profile = sys.argv[2]
            print(f"Refreshing recommendations for {profile}")
            success = service.refresh_recommendations_for_profile(profile)
            if success:
                print(f"Successfully refreshed recommendations for {profile}")
                sys.exit(0)
            else:
                print(f"Failed to refresh recommendations for {profile}")
                sys.exit(1)
                
        elif command == 'refresh-all':
            # Refresh recommendations for all profiles
            print("Refreshing recommendations for all profiles")
            results = service.refresh_all_profiles()
            
            all_success = True
            for profile, success in results.items():
                if success:
                    print(f"Successfully refreshed recommendations for {profile}")
                else:
                    print(f"Failed to refresh recommendations for {profile}")
                    all_success = False
            
            sys.exit(0 if all_success else 1)
            
        elif command == 'get' and len(sys.argv) > 2:
            # Get recommendations for specific profile
            profile = sys.argv[2]
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            
            recs = service.get_profile_recommendations(profile, limit)
            print(f"{len(recs)} recommendations for {profile}:")
            for i, rec in enumerate(recs, 1):
                print(f"  {i}. {rec['title']} (Score: {rec['similarity_score']})")
            
            sys.exit(0)
        
        elif command == 'add' and len(sys.argv) > 2:
            # Add incremental recommendations after user watches a movie
            profile = sys.argv[2]
            count = int(sys.argv[3]) if len(sys.argv) > 3 else 5
            
            print(f"Adding {count} new recommendations for {profile}")
            success = service.add_incremental_recommendations(profile, count)
            if success:
                # Show updated stats
                stats = service.get_profile_stats(profile)
                print(f"Successfully added recommendations! Profile now has {stats.get('active_recommendations', 0)} movies")
                sys.exit(0)
            else:
                print(f"Failed to add recommendations for {profile}")
                sys.exit(1)
        
        elif command == 'dislike' and len(sys.argv) > 3:
            # Handle movie dislike
            profile = sys.argv[2]
            tmdb_id = int(sys.argv[3])
            
            print(f"Processing dislike for movie {tmdb_id} in {profile}'s profile")
            success = service.handle_movie_dislike(profile, tmdb_id)
            if success:
                print(f"Successfully processed dislike for movie {tmdb_id}")
                sys.exit(0)
            else:
                print(f"Failed to process dislike for movie {tmdb_id}")
                sys.exit(1)
        
        elif command == 'stats' and len(sys.argv) > 2:
            # Get profile statistics
            profile = sys.argv[2]
            stats = service.get_profile_stats(profile)
            
            if stats:
                print(f"Profile Statistics for {profile}:")
                print(f"  Active Recommendations: {stats['active_recommendations']}")
                print(f"  Total Recommendations: {stats['total_recommendations']}")
                print(f"  Average Similarity Score: {stats['average_similarity_score']:.3f}")
                print(f"  Growth from Initial: +{stats['growth']} movies")
            else:
                print(f"Could not get statistics for {profile}")
            
            sys.exit(0)
        
        else:
            print("Usage:")
            print("  python firetv_integration_fixed.py refresh <profile>")
            print("  python firetv_integration_fixed.py refresh-all")
            print("  python firetv_integration_fixed.py get <profile> [limit]")
            print("  python firetv_integration_fixed.py add <profile> [count]")
            print("  python firetv_integration_fixed.py dislike <profile> <tmdb_id>")
            print("  python firetv_integration_fixed.py stats <profile>")
            sys.exit(1)
    
    else:
        # Default behavior - test all profiles
        profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya']
        
        for profile in profiles:
            print(f"\nTesting recommendations for {profile}")
            success = service.refresh_recommendations_for_profile(profile)
            
            if success:
                recs = service.get_profile_recommendations(profile, 5)
                print(f"Got {len(recs)} recommendations:")
                for i, rec in enumerate(recs[:3], 1):
                    print(f"  {i}. {rec['title']} (Score: {rec['similarity_score']})")
            else:
                print(f"Failed to generate recommendations for {profile}")


if __name__ == "__main__":
    main() 