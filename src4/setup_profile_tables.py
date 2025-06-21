#!/usr/bin/env python3
"""
Setup script to initialize Fire TV profile tables with seed movie data
Run this after setting up the recommendation schema
"""

import psycopg2
import psycopg2.extras
import requests
import os
import random
from typing import List, Dict

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '5432')),
            database=os.getenv('DB_NAME', 'firetv_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def fetch_popular_movies_by_genre(genre_id: int, api_key: str, count: int = 10) -> List[Dict]:
    """Fetch popular movies for a specific genre from TMDB"""
    movies = []
    
    try:
        url = "https://api.themoviedb.org/3/discover/movie"
        params = {
            'api_key': api_key,
            'with_genres': genre_id,
            'sort_by': 'popularity.desc',
            'vote_count.gte': 100,
            'page': 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            movie_list = data.get('results', [])
            
            for movie in movie_list[:count]:
                # Fetch detailed information
                detail_url = f"https://api.themoviedb.org/3/movie/{movie['id']}"
                detail_params = {'api_key': api_key}
                
                detail_response = requests.get(detail_url, params=detail_params, timeout=10)
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    
                    movies.append({
                        'tmdb_id': detail_data['id'],
                        'title': detail_data['title'],
                        'overview': detail_data.get('overview', ''),
                        'vote_average': detail_data.get('vote_average', 0.0),
                        'popularity': detail_data.get('popularity', 0.0),
                        'poster_path': detail_data.get('poster_path', ''),
                        'genres': [genre['name'] for genre in detail_data.get('genres', [])]
                    })
                    
    except Exception as e:
        print(f"Error fetching movies for genre {genre_id}: {e}")
    
    return movies

def setup_profile_table(profile_name: str, table_name: str, preferred_genres: List[str], api_key: str):
    """Setup a specific profile table with seed data"""
    
    # Genre ID mapping
    genre_id_map = {
        'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
        'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
        'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
        'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
        'Thriller': 53, 'War': 10752, 'Western': 37
    }
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table_name,))
        
        if not cursor.fetchone()[0]:
            print(f"❌ Table {table_name} does not exist. Run recommendation_schema.sql first.")
            return False
        
        # Clear existing data
        cursor.execute(f"DELETE FROM {table_name}")
        print(f"🧹 Cleared existing data from {table_name}")
        
        # Collect movies from preferred genres
        all_movies = []
        
        for genre in preferred_genres:
            genre_id = genre_id_map.get(genre)
            if genre_id:
                print(f"📥 Fetching {genre} movies for {profile_name}...")
                genre_movies = fetch_popular_movies_by_genre(genre_id, api_key, 8)
                all_movies.extend(genre_movies)
        
        # Add some popular trending movies
        try:
            print(f"📥 Fetching trending movies for {profile_name}...")
            trending_url = "https://api.themoviedb.org/3/trending/movie/week"
            trending_params = {'api_key': api_key}
            
            response = requests.get(trending_url, params=trending_params, timeout=10)
            if response.status_code == 200:
                trending_data = response.json()
                trending_movies = trending_data.get('results', [])
                
                for movie in trending_movies[:10]:
                    # Fetch detailed information
                    detail_url = f"https://api.themoviedb.org/3/movie/{movie['id']}"
                    detail_params = {'api_key': api_key}
                    
                    detail_response = requests.get(detail_url, params=detail_params, timeout=10)
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        
                        all_movies.append({
                            'tmdb_id': detail_data['id'],
                            'title': detail_data['title'],
                            'overview': detail_data.get('overview', ''),
                            'vote_average': detail_data.get('vote_average', 0.0),
                            'popularity': detail_data.get('popularity', 0.0),
                            'poster_path': detail_data.get('poster_path', ''),
                            'genres': [genre['name'] for genre in detail_data.get('genres', [])]
                        })
                        
        except Exception as e:
            print(f"Warning: Failed to fetch trending movies: {e}")
        
        # Remove duplicates and limit to 30
        unique_movies = {}
        for movie in all_movies:
            if movie['tmdb_id'] not in unique_movies:
                unique_movies[movie['tmdb_id']] = movie
        
        movies_to_insert = list(unique_movies.values())[:30]
        
        # Insert movies into profile table
        insert_query = f"""
            INSERT INTO {table_name} 
            (tmdb_id, title, genres, vote_average, popularity, overview, 
             poster_path, similarity_score, recommendation_reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for movie in movies_to_insert:
            # Calculate a simple similarity score based on popularity and rating
            similarity_score = min((movie['vote_average'] / 10.0 * 0.6) + 
                                 (min(movie['popularity'], 100) / 100.0 * 0.4), 1.0)
            
            cursor.execute(insert_query, (
                movie['tmdb_id'],
                movie['title'],
                movie['genres'],
                movie['vote_average'],
                movie['popularity'],
                movie['overview'],
                movie['poster_path'],
                round(similarity_score, 4),
                f"Initial seed - popular {', '.join(preferred_genres)} movies"
            ))
        
        conn.commit()
        print(f"✅ Successfully seeded {len(movies_to_insert)} movies for {profile_name}")
        return True
        
    except Exception as e:
        print(f"❌ Error setting up {profile_name} table: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def main():
    """Main setup function"""
    
    # Get TMDB API key
    api_key = os.getenv('TMDB_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        print("❌ TMDB_API_KEY environment variable not set")
        print("Please set your TMDB API key: export TMDB_API_KEY='your_key_here'")
        return
    
    print("🚀 Setting up Fire TV profile tables with seed data...")
    
    # Profile configurations
    profiles = {
        'anshul': {
            'table_name': 'anshul_dash',
            'preferred_genres': ['Action', 'Thriller', 'Science Fiction', 'Adventure']
        },
        'shikhar': {
            'table_name': 'shikhar_dash',
            'preferred_genres': ['Comedy', 'Drama', 'Romance', 'Family']
        },
        'priyanshu': {
            'table_name': 'priyanshu_dash',
            'preferred_genres': ['Horror', 'Mystery', 'Adventure', 'Thriller']
        },
        'shaurya': {
            'table_name': 'shaurya_dash',
            'preferred_genres': ['Animation', 'Family', 'Fantasy', 'Adventure']
        }
    }
    
    success_count = 0
    
    for profile_name, config in profiles.items():
        print(f"\n📋 Setting up {profile_name}'s profile...")
        success = setup_profile_table(
            profile_name, 
            config['table_name'], 
            config['preferred_genres'], 
            api_key
        )
        if success:
            success_count += 1
    
    print(f"\n🎉 Setup completed! {success_count}/{len(profiles)} profiles initialized successfully.")
    
    if success_count == len(profiles):
        print("\n✅ All profile tables are ready!")
        print("You can now use the recommendation system.")
    else:
        print(f"\n⚠️  {len(profiles) - success_count} profiles failed to initialize.")
        print("Check the error messages above and ensure:")
        print("1. Database is running and accessible")
        print("2. recommendation_schema.sql has been executed")
        print("3. TMDB API key is valid")

if __name__ == "__main__":
    main() 