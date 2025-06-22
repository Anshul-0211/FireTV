#!/usr/bin/env python3

"""
Enhanced FireTV Recommendation System Integration - Hybrid CF + Content-Based with Caching
Connects to backend database and provides advanced movie recommendations for each profile
Features: Collaborative Filtering, SentenceTransformer embeddings, CUDA support, Hybrid approach, Comprehensive Caching
"""

import os
import sys
import json
import psycopg2
import psycopg2.extras
import requests
import logging
import random
import time
import pickle
import hashlib
from pathlib import Path
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import Counter, defaultdict
from scipy.stats import pearsonr
from sklearn.metrics.pairwise import cosine_similarity
import torch

# Enhanced imports for advanced recommendations
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("⚠️  SentenceTransformers not available. Install with: pip install sentence-transformers")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️  PyTorch not available. Install with: pip install torch")

# Set UTF-8 encoding for Windows console
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

class CacheManager:
    """Comprehensive caching system for faster computation"""
    
    def __init__(self, cache_dir: str = "cache", ttl_hours: int = 24):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.ttl = timedelta(hours=ttl_hours)
        
        # In-memory caches for frequently accessed data
        self.memory_cache = {}
        self.tmdb_cache = {}
        self.embedding_cache = {}
        self.similarity_cache = {}
        self.user_data_cache = {}
        
        # Cache file paths
        self.tmdb_cache_file = self.cache_dir / "tmdb_cache.pkl"
        self.embedding_cache_file = self.cache_dir / "embedding_cache.pkl"
        self.similarity_cache_file = self.cache_dir / "similarity_cache.pkl"
        self.user_data_cache_file = self.cache_dir / "user_data_cache.pkl"
        
        # Load existing caches
        self._load_caches()
        
        print(f"💾 Cache Manager initialized with TTL: {ttl_hours}h")
    
    def _load_caches(self):
        """Load caches from disk"""
        try:
            if self.tmdb_cache_file.exists():
                with open(self.tmdb_cache_file, 'rb') as f:
                    self.tmdb_cache = pickle.load(f)
                print(f"📁 Loaded {len(self.tmdb_cache)} TMDB cache entries")
            
            if self.embedding_cache_file.exists():
                with open(self.embedding_cache_file, 'rb') as f:
                    self.embedding_cache = pickle.load(f)
                print(f"🧠 Loaded {len(self.embedding_cache)} embedding cache entries")
            
            if self.similarity_cache_file.exists():
                with open(self.similarity_cache_file, 'rb') as f:
                    self.similarity_cache = pickle.load(f)
                print(f"🔗 Loaded {len(self.similarity_cache)} similarity cache entries")
            
            if self.user_data_cache_file.exists():
                with open(self.user_data_cache_file, 'rb') as f:
                    self.user_data_cache = pickle.load(f)
                print(f"👤 Loaded {len(self.user_data_cache)} user data cache entries")
                
        except Exception as e:
            print(f"⚠️ Error loading caches: {e}")
    
    def _save_caches(self):
        """Save caches to disk"""
        try:
            with open(self.tmdb_cache_file, 'wb') as f:
                pickle.dump(self.tmdb_cache, f)
            
            with open(self.embedding_cache_file, 'wb') as f:
                pickle.dump(self.embedding_cache, f)
            
            with open(self.similarity_cache_file, 'wb') as f:
                pickle.dump(self.similarity_cache, f)
            
            with open(self.user_data_cache_file, 'wb') as f:
                pickle.dump(self.user_data_cache, f)
                
        except Exception as e:
            print(f"⚠️ Error saving caches: {e}")
    
    def _is_cache_valid(self, timestamp: datetime) -> bool:
        """Check if cache entry is still valid"""
        return datetime.now() - timestamp < self.ttl
    
    def _generate_key(self, *args) -> str:
        """Generate cache key from arguments"""
        key_string = str(args)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get_tmdb_movie(self, movie_id: int, api_key: str) -> Optional[Dict]:
        """Get movie from TMDB with caching"""
        cache_key = f"movie_{movie_id}"
        
        if cache_key in self.tmdb_cache:
            entry = self.tmdb_cache[cache_key]
            if self._is_cache_valid(entry['timestamp']):
                return entry['data']
        
        # Cache miss - fetch from API
        try:
            url = f"https://api.themoviedb.org/3/movie/{movie_id}"
            params = {'api_key': api_key}
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                movie_data = response.json()
                
                # Cache the result
                self.tmdb_cache[cache_key] = {
                    'data': movie_data,
                    'timestamp': datetime.now()
                }
                
                return movie_data
        except Exception as e:
            print(f"⚠️ TMDB API error for movie {movie_id}: {e}")
        
        return None
    
    def get_tmdb_page(self, endpoint: str, page: int, api_key: str, params: Dict = None) -> Optional[Dict]:
        """Get TMDB page with caching"""
        cache_key = f"page_{endpoint}_{page}_{hash(str(params))}"
        
        if cache_key in self.tmdb_cache:
            entry = self.tmdb_cache[cache_key]
            if self._is_cache_valid(entry['timestamp']):
                return entry['data']
        
        # Cache miss - fetch from API
        try:
            url = f"https://api.themoviedb.org/3/{endpoint}"
            request_params = {'api_key': api_key, 'page': page}
            if params:
                request_params.update(params)
            
            response = requests.get(url, params=request_params, timeout=5)
            
            if response.status_code == 200:
                page_data = response.json()
                
                # Cache the result
                self.tmdb_cache[cache_key] = {
                    'data': page_data,
                    'timestamp': datetime.now()
                }
                
                return page_data
        except Exception as e:
            print(f"⚠️ TMDB API error for {endpoint} page {page}: {e}")
        
        return None
    
    def get_embedding(self, text: str, model) -> Optional[np.ndarray]:
        """Get text embedding with caching"""
        cache_key = self._generate_key(text)
        
        if cache_key in self.embedding_cache:
            entry = self.embedding_cache[cache_key]
            if self._is_cache_valid(entry['timestamp']):
                return entry['data']
        
        # Cache miss - compute embedding
        try:
            if model is None:
                return None
            
            embedding = model.encode([text], convert_to_tensor=True)[0]
            if torch.is_tensor(embedding):
                embedding = embedding.cpu().numpy()
            
            # Cache the result
            self.embedding_cache[cache_key] = {
                'data': embedding,
                'timestamp': datetime.now()
            }
            
            return embedding
        except Exception as e:
            print(f"⚠️ Embedding error: {e}")
        
        return None
    
    def get_user_embeddings(self, user_id: int, movie_texts: List[str], model) -> Optional[np.ndarray]:
        """Get user content preferences with caching"""
        cache_key = f"user_emb_{user_id}_{self._generate_key(*movie_texts)}"
        
        if cache_key in self.embedding_cache:
            entry = self.embedding_cache[cache_key]
            if self._is_cache_valid(entry['timestamp']):
                return entry['data']
        
        # Cache miss - compute user embeddings
        try:
            if model is None or not movie_texts:
                return None
            
            embeddings = model.encode(movie_texts, convert_to_tensor=True)
            if torch.is_tensor(embeddings):
                embeddings = embeddings.cpu().numpy()
            
            user_embedding = np.mean(embeddings, axis=0)
            
            # Cache the result
            self.embedding_cache[cache_key] = {
                'data': user_embedding,
                'timestamp': datetime.now()
            }
            
            return user_embedding
        except Exception as e:
            print(f"⚠️ User embedding error: {e}")
        
        return None
    
    def get_similarity(self, key1: str, key2: str, compute_func) -> float:
        """Get similarity with caching"""
        cache_key = f"sim_{min(key1, key2)}_{max(key1, key2)}"
        
        if cache_key in self.similarity_cache:
            entry = self.similarity_cache[cache_key]
            if self._is_cache_valid(entry['timestamp']):
                return entry['data']
        
        # Cache miss - compute similarity
        try:
            similarity = compute_func()
            
            # Cache the result
            self.similarity_cache[cache_key] = {
                'data': similarity,
                'timestamp': datetime.now()
            }
            
            return similarity
        except Exception as e:
            print(f"⚠️ Similarity computation error: {e}")
            return 0.0
    
    def get_user_data(self, username: str, fetch_func) -> Optional[Dict]:
        """Get user data with caching"""
        cache_key = f"user_{username}"
        
        if cache_key in self.user_data_cache:
            entry = self.user_data_cache[cache_key]
            # Shorter TTL for user data (1 hour)
            if datetime.now() - entry['timestamp'] < timedelta(hours=1):
                return entry['data']
        
        # Cache miss - fetch user data
        try:
            user_data = fetch_func()
            
            if user_data:
                # Cache the result
                self.user_data_cache[cache_key] = {
                    'data': user_data,
                    'timestamp': datetime.now()
                }
            
            return user_data
        except Exception as e:
            print(f"⚠️ User data fetch error: {e}")
        
        return None
    
    def invalidate_user_cache(self, username: str):
        """Invalidate user-specific caches when user watches new movie"""
        cache_key = f"user_{username}"
        if cache_key in self.user_data_cache:
            del self.user_data_cache[cache_key]
        
        # Also invalidate user embeddings
        keys_to_remove = [k for k in self.embedding_cache.keys() if f"user_emb_{username}" in k]
        for key in keys_to_remove:
            del self.embedding_cache[key]
    
    def cleanup_expired(self):
        """Remove expired cache entries"""
        now = datetime.now()
        
        # Clean TMDB cache
        expired_keys = [k for k, v in self.tmdb_cache.items() 
                       if now - v['timestamp'] > self.ttl]
        for key in expired_keys:
            del self.tmdb_cache[key]
        
        # Clean embedding cache
        expired_keys = [k for k, v in self.embedding_cache.items() 
                       if now - v['timestamp'] > self.ttl]
        for key in expired_keys:
            del self.embedding_cache[key]
        
        # Clean similarity cache
        expired_keys = [k for k, v in self.similarity_cache.items() 
                       if now - v['timestamp'] > self.ttl]
        for key in expired_keys:
            del self.similarity_cache[key]
        
        # Clean user data cache (shorter TTL)
        expired_keys = [k for k, v in self.user_data_cache.items() 
                       if now - v['timestamp'] > timedelta(hours=1)]
        for key in expired_keys:
            del self.user_data_cache[key]
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            'tmdb_entries': len(self.tmdb_cache),
            'embedding_entries': len(self.embedding_cache),
            'similarity_entries': len(self.similarity_cache),
            'user_data_entries': len(self.user_data_cache),
            'cache_dir': str(self.cache_dir),
            'ttl_hours': self.ttl.total_seconds() / 3600
        }
    
    def save_and_cleanup(self):
        """Save caches and cleanup expired entries"""
        self.cleanup_expired()
        self._save_caches()
        print("💾 Caches saved and cleaned up")
    
    def __del__(self):
        """Save caches when object is destroyed"""
        try:
            self._save_caches()
        except:
            pass

class CollaborativeFilteringEngine:
    """Implements User-User and Item-Item Collaborative Filtering with current database schema"""
    
    def __init__(self, min_common_items: int = 3, min_common_users: int = 3):
        self.min_common_items = min_common_items
        self.min_common_users = min_common_users
        self.user_similarity_cache = {}
        self.item_similarity_cache = {}
        
    def build_rating_matrix_from_db(self, conn) -> Tuple[pd.DataFrame, Dict, Dict]:
        """Build user-item rating matrix from current database schema"""
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Fetch all ratings from watched_movies table
            cursor.execute("""
                SELECT user_id, tmdb_id, rating 
                FROM watched_movies 
                WHERE rating IS NOT NULL
            """)
            
            ratings_data = cursor.fetchall()
            
            if not ratings_data:
                return pd.DataFrame(), {}, {}
            
            # Convert rating enum to numeric (same as existing mapping)
            rating_map = {'disliked': 3.0, 'good': 7.0, 'loved': 9.0}
            
            # Build ratings list
            processed_ratings = []
            for row in ratings_data:
                numeric_rating = rating_map.get(row['rating'], 5.0)
                processed_ratings.append({
                    'user_id': row['user_id'],
                    'movie_id': row['tmdb_id'],
                    'rating': numeric_rating
                })
            
            if not processed_ratings:
                return pd.DataFrame(), {}, {}
            
            # Create rating matrix
            rating_df = pd.DataFrame(processed_ratings)
            rating_matrix = rating_df.pivot(index='user_id', columns='movie_id', values='rating')
            rating_matrix = rating_matrix.fillna(0)  # Fill NaN with 0
            
            # Create mappings
            user_to_idx = {user_id: idx for idx, user_id in enumerate(rating_matrix.index)}
            item_to_idx = {movie_id: idx for idx, movie_id in enumerate(rating_matrix.columns)}
            
            return rating_matrix, user_to_idx, item_to_idx
            
        except Exception as e:
            print(f"Error building rating matrix: {e}")
            return pd.DataFrame(), {}, {}
    
    def calculate_user_similarity(self, rating_matrix: pd.DataFrame, user_id: int, target_user_id: int) -> float:
        """Calculate similarity between two users using Pearson correlation"""
        if user_id == target_user_id:
            return 1.0
        
        if user_id not in rating_matrix.index or target_user_id not in rating_matrix.index:
            return 0.0
        
        user1_ratings = rating_matrix.loc[user_id]
        user2_ratings = rating_matrix.loc[target_user_id]
        
        # Find commonly rated items
        common_items = (user1_ratings > 0) & (user2_ratings > 0)
        
        if common_items.sum() < self.min_common_items:
            return 0.0
        
        user1_common = user1_ratings[common_items]
        user2_common = user2_ratings[common_items]
        
        try:
            correlation, _ = pearsonr(user1_common, user2_common)
            return correlation if not np.isnan(correlation) else 0.0
        except:
            return 0.0
    
    def calculate_item_similarity(self, rating_matrix: pd.DataFrame, item_id: int, target_item_id: int) -> float:
        """Calculate similarity between two items using cosine similarity"""
        if item_id == target_item_id:
            return 1.0
        
        if item_id not in rating_matrix.columns or target_item_id not in rating_matrix.columns:
            return 0.0
        
        item1_ratings = rating_matrix[item_id]
        item2_ratings = rating_matrix[target_item_id]
        
        # Find users who rated both items
        common_users = (item1_ratings > 0) & (item2_ratings > 0)
        
        if common_users.sum() < self.min_common_users:
            return 0.0
        
        item1_common = item1_ratings[common_users].values.reshape(1, -1)
        item2_common = item2_ratings[common_users].values.reshape(1, -1)
        
        try:
            similarity = cosine_similarity(item1_common, item2_common)[0][0]
            return similarity if not np.isnan(similarity) else 0.0
        except:
            return 0.0
    
    def get_user_based_recommendations(self, rating_matrix: pd.DataFrame, user_id: int,
                                     candidate_movies: List[int], k_neighbors: int = 15) -> Dict[int, float]:
        """Generate recommendations using User-User Collaborative Filtering"""
        if user_id not in rating_matrix.index:
            return {}
        
        # Find similar users
        user_similarities = []
        target_user_ratings = rating_matrix.loc[user_id]
        
        for other_user_id in rating_matrix.index:
            if other_user_id != user_id:
                similarity = self.calculate_user_similarity(rating_matrix, user_id, other_user_id)
                if similarity > 0:
                    user_similarities.append((other_user_id, similarity))
        
        # Sort by similarity and take top k
        user_similarities.sort(key=lambda x: x[1], reverse=True)
        top_similar_users = user_similarities[:k_neighbors]
        
        if not top_similar_users:
            return {}
        
        # Calculate predicted ratings for candidate movies
        predictions = {}
        for movie_id in candidate_movies:
            if movie_id in rating_matrix.columns and target_user_ratings[movie_id] == 0:
                numerator = 0
                denominator = 0
                
                for similar_user_id, similarity in top_similar_users:
                    similar_user_rating = rating_matrix.loc[similar_user_id, movie_id]
                    if similar_user_rating > 0:
                        # Use mean-centered ratings
                        similar_user_mean = rating_matrix.loc[similar_user_id][rating_matrix.loc[similar_user_id] > 0].mean()
                        numerator += similarity * (similar_user_rating - similar_user_mean)
                        denominator += abs(similarity)
                
                if denominator > 0:
                    user_mean = target_user_ratings[target_user_ratings > 0].mean()
                    predicted_rating = user_mean + (numerator / denominator)
                    predictions[movie_id] = max(0, min(10, predicted_rating))
        
        return predictions
    
    def get_item_based_recommendations(self, rating_matrix: pd.DataFrame, user_id: int,
                                     candidate_movies: List[int], k_neighbors: int = 15) -> Dict[int, float]:
        """Generate recommendations using Item-Item Collaborative Filtering"""
        if user_id not in rating_matrix.index:
            return {}
        
        user_ratings = rating_matrix.loc[user_id]
        rated_movies = user_ratings[user_ratings > 0].index.tolist()
        
        if not rated_movies:
            return {}
        
        predictions = {}
        for movie_id in candidate_movies:
            if movie_id not in rating_matrix.columns or user_ratings[movie_id] > 0:
                continue
            
            # Find similar items to this movie
            item_similarities = []
            for rated_movie_id in rated_movies:
                similarity = self.calculate_item_similarity(rating_matrix, movie_id, rated_movie_id)
                if similarity > 0:
                    item_similarities.append((rated_movie_id, similarity))
            
            # Sort by similarity and take top k
            item_similarities.sort(key=lambda x: x[1], reverse=True)
            top_similar_items = item_similarities[:k_neighbors]
            
            if not top_similar_items:
                continue
            
            # Calculate predicted rating
            numerator = 0
            denominator = 0
            for similar_item_id, similarity in top_similar_items:
                user_rating_for_similar_item = user_ratings[similar_item_id]
                numerator += similarity * user_rating_for_similar_item
                denominator += abs(similarity)
            
            if denominator > 0:
                predicted_rating = numerator / denominator
                predictions[movie_id] = max(0, min(10, predicted_rating))
        
        return predictions

class FireTVRecommendationService:

    def __init__(self, db_config: Dict, tmdb_api_key: str):
        """Initialize the enhanced recommendation service with comprehensive caching"""
        print("🚀 Enhanced FireTV Recommendation Service initializing...")
        self.setup_logging()
        
        # Database configuration (same as before)
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'firetv_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', '263153'),
            'port': int(os.getenv('DB_PORT', 5432))
        }
        self.db_config.update(db_config)
        
        # TMDB configuration
        self.tmdb_api_key = tmdb_api_key
        self.tmdb_base_url = "https://api.themoviedb.org/3"
        
        # Initialize cache manager FIRST
        self.cache_manager = CacheManager()
        
        # Initialize advanced features
        self._initialize_advanced_features()
        
        # Initialize collaborative filtering with caching
        self.cf_engine = CollaborativeFilteringEngine()
        
        # Cold start thresholds
        self.min_users_for_cf = 4  # Reduced threshold
        self.min_ratings_per_user = 3  # Reduced threshold
        self.min_total_ratings = 15  # Reduced threshold
        
        # Profile configurations (enhanced with quality thresholds)
        self.profile_configs = {
            'anshul': {
                'table_name': 'anshul_dash',
                'preferred_genres': ['Action', 'Thriller', 'Science Fiction', 'Adventure'],
                'mood_weights': {
                    'happy': 1.2, 'sad': 0.8, 'excited': 1.3, 'calm': 1.0,
                    'angry': 1.1, 'romantic': 0.9, 'adventurous': 1.4, 'nostalgic': 1.0
                },
                'quality_threshold': 7.0,
                'popularity_preference': 0.6
            },
            'shikhar': {
                'table_name': 'shikhar_dash',
                'preferred_genres': ['Comedy', 'Drama', 'Romance', 'Family'],
                'mood_weights': {
                    'happy': 1.3, 'sad': 1.1, 'excited': 1.0, 'calm': 1.2,
                    'angry': 0.7, 'romantic': 1.4, 'adventurous': 0.9, 'nostalgic': 1.2
                },
                'quality_threshold': 6.5,
                'popularity_preference': 0.5
            },
            'priyanshu': {
                'table_name': 'priyanshu_dash',
                'preferred_genres': ['Horror', 'Mystery', 'Adventure', 'Thriller'],
                'mood_weights': {
                    'happy': 1.0, 'sad': 1.0, 'excited': 1.3, 'calm': 0.8,
                    'angry': 1.2, 'romantic': 0.8, 'adventurous': 1.4, 'nostalgic': 0.9
                },
                'quality_threshold': 6.8,
                'popularity_preference': 0.4
            },
            'shaurya': {
                'table_name': 'shaurya_dash',
                'preferred_genres': ['Animation', 'Family', 'Fantasy', 'Adventure'],
                'mood_weights': {
                    'happy': 1.4, 'sad': 0.9, 'excited': 1.2, 'calm': 1.1,
                    'angry': 0.8, 'romantic': 1.0, 'adventurous': 1.3, 'nostalgic': 1.1
                },
                'quality_threshold': 7.2,
                'popularity_preference': 0.7
            }
        }
        
        print("✅ Enhanced FireTV Recommendation Service with Caching initialized")

    def _initialize_advanced_features(self):
        """Initialize advanced ML features"""
        # Initialize CUDA device
        if TORCH_AVAILABLE:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            print(f"🚀 Using device: {self.device}")
        else:
            self.device = "cpu"
            print("🚀 Using device: cpu (PyTorch not available)")
        
        # Initialize SentenceTransformer
        if SENTENCE_TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE:
            try:
                self.content_model = SentenceTransformer("all-MiniLM-L6-v2", device=str(self.device))
                print(f"📱 SentenceTransformer loaded on: {self.device}")
                self.enhanced_content_similarity = True
            except Exception as e:
                print(f"⚠️  Failed to load SentenceTransformer: {e}")
                self.content_model = None
                self.enhanced_content_similarity = False
        else:
            self.content_model = None
            self.enhanced_content_similarity = False
            print("📱 Using basic content similarity (SentenceTransformer not available)")

    def setup_logging(self):
        """Configure logging (same as before)"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler(sys.stdout)]
        )
        self.logger = logging.getLogger(__name__)

    def get_db_connection(self):
        """Get database connection (same as before)"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            raise

    def get_user_data_from_backend(self, username: str) -> Dict:
        """Get user data from the backend database with caching"""
        
        def fetch_user_data():
            """Internal function to fetch user data from database"""
            conn = self.get_db_connection()
            if not conn:
                return {}
            
            try:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                # Get user ID from username
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
        
        # Use cache manager to get user data
        return self.cache_manager.get_user_data(username, fetch_user_data) or {}

    def _get_fallback_movies_by_genre(self, genre: str, user_history: set, limit: int = 20) -> List[Dict]:
        """Get high-quality fallback movies for a specific genre"""
        fallback_data = {
            'Action': [
                {'tmdb_id': 550, 'title': 'Fight Club', 'genres': ['Action', 'Drama'], 'vote_average': 8.4, 'popularity': 95.2, 'overview': 'An insomniac office worker and a soap salesman form an underground fight club.', 'release_date': '1999-10-15', 'poster_path': '/a26cQPRhJPX6GbWfQbvZdrrp9j9.jpg', 'runtime': 139},
                {'tmdb_id': 155, 'title': 'The Dark Knight', 'genres': ['Action', 'Crime', 'Drama'], 'vote_average': 9.0, 'popularity': 98.5, 'overview': 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests.', 'release_date': '2008-07-18', 'poster_path': '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'runtime': 152},
                {'tmdb_id': 603, 'title': 'The Matrix', 'genres': ['Action', 'Science Fiction'], 'vote_average': 8.7, 'popularity': 93.8, 'overview': 'A computer hacker learns from mysterious rebels about the true nature of his reality.', 'release_date': '1999-03-30', 'poster_path': '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'runtime': 136},
                {'tmdb_id': 680, 'title': 'Pulp Fiction', 'genres': ['Crime', 'Drama'], 'vote_average': 8.5, 'popularity': 92.1, 'overview': 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', 'release_date': '1994-10-14', 'poster_path': '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'runtime': 154},
                {'tmdb_id': 27205, 'title': 'Inception', 'genres': ['Action', 'Science Fiction', 'Thriller'], 'vote_average': 8.4, 'popularity': 87.9, 'overview': 'Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction.', 'release_date': '2010-07-16', 'poster_path': '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'runtime': 148}
            ],
            'Comedy': [
                {'tmdb_id': 13, 'title': 'Forrest Gump', 'genres': ['Comedy', 'Drama'], 'vote_average': 8.5, 'popularity': 89.3, 'overview': 'The presidencies of Kennedy and Johnson, Vietnam, Watergate, and other history unfold through the perspective of an Alabama man.', 'release_date': '1994-07-06', 'poster_path': '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'runtime': 142},
                {'tmdb_id': 19995, 'title': 'Avatar', 'genres': ['Action', 'Adventure', 'Fantasy'], 'vote_average': 7.6, 'popularity': 87.4, 'overview': 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission.', 'release_date': '2009-12-18', 'poster_path': '/6EiRUJpuoeQPghrs3YNktfnqOVh.jpg', 'runtime': 162}
            ],
            'Horror': [
                {'tmdb_id': 694, 'title': 'The Shining', 'genres': ['Horror', 'Thriller'], 'vote_average': 8.2, 'popularity': 78.9, 'overview': 'A family heads to an isolated hotel for the winter where an evil presence influences the father.', 'release_date': '1980-05-23', 'poster_path': '/b6ko0IKC8MdYBBPkkA1aBPLe2yz.jpg', 'runtime': 146},
                {'tmdb_id': 539, 'title': 'Psycho', 'genres': ['Horror', 'Mystery', 'Thriller'], 'vote_average': 8.4, 'popularity': 75.2, 'overview': 'A Phoenix secretary embezzles money and goes on the run.', 'release_date': '1960-09-08', 'poster_path': '/yz4QVqPx3h1hD1DfqqQkCq3rmxW.jpg', 'runtime': 109}
            ],
            'Science Fiction': [
                {'tmdb_id': 11, 'title': 'Star Wars', 'genres': ['Adventure', 'Action', 'Science Fiction'], 'vote_average': 8.6, 'popularity': 89.1, 'overview': 'Luke Skywalker joins forces with a Jedi Knight to rescue Princess Leia from the evil Galactic Empire.', 'release_date': '1977-05-25', 'poster_path': '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', 'runtime': 121}
            ],
            'Drama': [
                {'tmdb_id': 278, 'title': 'The Shawshank Redemption', 'genres': ['Drama'], 'vote_average': 9.3, 'popularity': 96.7, 'overview': 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.', 'release_date': '1994-09-23', 'poster_path': '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'runtime': 142},
                {'tmdb_id': 238, 'title': 'The Godfather', 'genres': ['Crime', 'Drama'], 'vote_average': 9.2, 'popularity': 91.7, 'overview': 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', 'release_date': '1972-03-14', 'poster_path': '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'runtime': 175},
                {'tmdb_id': 240, 'title': 'The Godfather: Part II', 'genres': ['Crime', 'Drama'], 'vote_average': 9.0, 'popularity': 88.9, 'overview': 'The early life and career of Vito Corleone in 1920s New York City is portrayed.', 'release_date': '1974-12-20', 'poster_path': '/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg', 'runtime': 202}
            ]
        }
        
        movies = fallback_data.get(genre, [])
        # Filter out already watched movies
        filtered = [m for m in movies if m['tmdb_id'] not in user_history]
        return filtered[:limit]

    def get_candidate_movies(self, user_data: Dict) -> List[Dict]:
        """Get candidate movies - enhanced with robust fallback system and multi-page TMDB fetching"""
        user_history = set(user_data['user_history'])
        favorite_genres = user_data['favourite_genres']
        
        # Always start with local fallback to guarantee we have movies
        candidates = []
        
        # Add curated movies by preferred genres
        for genre in favorite_genres:
            genre_movies = self._get_fallback_movies_by_genre(genre, user_history, limit=15)
            candidates.extend(genre_movies)
        
        # Add some general high-quality movies
        general_movies = self._get_fallback_movies_by_genre('Drama', user_history, limit=10)
        candidates.extend(general_movies)
        
        self.logger.info(f"✅ Got {len(candidates)} fallback candidates")
        
        # Try to supplement with TMDB multi-page fetch (but don't fail if it's not working)
        try:
            self.logger.info(f"🚀 Starting multi-page TMDB fetch for genres: {favorite_genres}")
            tmdb_candidates = self._try_fetch_tmdb_candidates(favorite_genres, user_history)
            if tmdb_candidates:
                # Merge without duplicates
                existing_ids = {movie['tmdb_id'] for movie in candidates}
                new_candidates = []
                for movie in tmdb_candidates:
                    if movie['tmdb_id'] not in existing_ids:
                        new_candidates.append(movie)
                        existing_ids.add(movie['tmdb_id'])
                
                candidates.extend(new_candidates)
                self.logger.info(f"✅ Added {len(new_candidates)} unique TMDB candidates (total fetched: {len(tmdb_candidates)})")
            else:
                self.logger.warning("⚠️ No TMDB candidates returned")
        except Exception as e:
            self.logger.warning(f"⚠️ TMDB multi-page fetch failed, using fallback only: {e}")
        
        # Remove any remaining duplicates and limit total candidates for performance
        final_candidates = []
        seen_ids = set()
        for movie in candidates:
            if movie['tmdb_id'] not in seen_ids:
                final_candidates.append(movie)
                seen_ids.add(movie['tmdb_id'])
                
                # Limit to reasonable number for processing performance
                if len(final_candidates) >= 1000:  # Increased from 800 to 1000
                    break
        
        self.logger.info(f"📊 Final candidate count: {len(final_candidates)} movies (from {len(candidates)} total before deduplication)")
        return final_candidates

    def _try_fetch_tmdb_candidates(self, favorite_genres: List[str], user_history: set, max_attempts: int = 3) -> List[Dict]:
        """Try to fetch from TMDB with multiple pages and endpoints using comprehensive caching"""
        candidates = []
        
        # Genre ID mapping
        genre_id_map = {
            'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
            'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
            'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
            'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
            'Thriller': 53, 'War': 10752, 'Western': 37
        }
        
        # Multiple endpoints to fetch from for maximum variety
        endpoints_to_fetch = [
            ('movie/popular', 'Popular Movies'),
            ('movie/top_rated', 'Top Rated Movies'),
            ('movie/now_playing', 'Now Playing Movies'),
            ('movie/upcoming', 'Upcoming Movies'),
            ('trending/movie/week', 'Trending This Week'),
            ('trending/movie/day', 'Trending Today')
        ]
        
        # Fetch multiple pages from each endpoint using cache
        for endpoint, description in endpoints_to_fetch:
            for page in range(1, 3):  # Fetch 2 pages from each endpoint
                page_data = self.cache_manager.get_tmdb_page(endpoint, page, self.tmdb_api_key)
                
                if page_data:
                    movies = page_data.get('results', [])
                    self.logger.info(f"📡 Got {len(movies)} movies from {description} page {page} (cached: {page in self.cache_manager.tmdb_cache})")
                    
                    for movie in movies:  # Process all movies from each page
                        if movie['id'] not in user_history:
                            # Get detailed info using cache
                            movie_data = self.cache_manager.get_tmdb_movie(movie['id'], self.tmdb_api_key)
                            
                            if movie_data:
                                candidates.append({
                                    'tmdb_id': movie_data['id'],
                                    'title': movie_data['title'],
                                    'overview': movie_data.get('overview', ''),
                                    'vote_average': movie_data.get('vote_average', 0.0),
                                    'popularity': movie_data.get('popularity', 0.0),
                                    'release_date': movie_data.get('release_date', ''),
                                    'poster_path': movie_data.get('poster_path', ''),
                                    'genres': [genre['name'] for genre in movie_data.get('genres', [])],
                                    'runtime': movie_data.get('runtime', 0)
                                })
                else:
                    self.logger.warning(f"Failed to fetch {description} page {page}")
        
        # Also fetch movies by preferred genres with multiple pages using cache
        for genre in favorite_genres:
            genre_id = genre_id_map.get(genre)
            if not genre_id:
                continue
                
            # Fetch multiple pages for each preferred genre
            for page in range(2, 5):  # Fetch pages 2-4 per genre for variety
                params = {
                    'with_genres': genre_id,
                    'sort_by': 'popularity.desc',
                    'vote_count.gte': 50,  # Movies with at least 50 votes
                }
                
                page_data = self.cache_manager.get_tmdb_page('discover/movie', page, self.tmdb_api_key, params)
                
                if page_data:
                    movies = page_data.get('results', [])
                    self.logger.info(f"🎭 Got {len(movies)} {genre} movies from page {page} (cached)")
                    
                    for movie in movies:
                        if movie['id'] not in user_history:
                            # Get detailed info using cache
                            movie_data = self.cache_manager.get_tmdb_movie(movie['id'], self.tmdb_api_key)
                            
                            if movie_data:
                                candidates.append({
                                    'tmdb_id': movie_data['id'],
                                    'title': movie_data['title'],
                                    'overview': movie_data.get('overview', ''),
                                    'vote_average': movie_data.get('vote_average', 0.0),
                                    'popularity': movie_data.get('popularity', 0.0),
                                    'release_date': movie_data.get('release_date', ''),
                                    'poster_path': movie_data.get('poster_path', ''),
                                    'genres': [genre['name'] for genre in movie_data.get('genres', [])],
                                    'runtime': movie_data.get('runtime', 0)
                                })
                else:
                    self.logger.warning(f"Failed to fetch {genre} page {page}")
        
        # Remove duplicates based on tmdb_id
        unique_candidates = []
        seen_ids = set()
        for movie in candidates:
            if movie['tmdb_id'] not in seen_ids:
                unique_candidates.append(movie)
                seen_ids.add(movie['tmdb_id'])
        
        self.logger.info(f"🎬 Total unique TMDB candidates after deduplication: {len(unique_candidates)}")
        return unique_candidates

    def generate_collaborative_recommendations(self, user_data: Dict, candidates: List[Dict]) -> List[Dict]:
        """Generate recommendations using collaborative filtering"""
        conn = self.get_db_connection()
        if not conn:
            return []
        
        try:
            # Build rating matrix from current database
            rating_matrix, user_to_idx, item_to_idx = self.cf_engine.build_rating_matrix_from_db(conn)
            
            if rating_matrix.empty:
                self.logger.warning("Empty rating matrix, falling back to content-based")
                return []
            
            user_id = user_data['user_id']
            candidate_movie_ids = [movie['tmdb_id'] for movie in candidates]
            
            # Get predictions from both approaches
            user_based_predictions = self.cf_engine.get_user_based_recommendations(
                rating_matrix, user_id, candidate_movie_ids, k_neighbors=15
            )
            
            item_based_predictions = self.cf_engine.get_item_based_recommendations(
                rating_matrix, user_id, candidate_movie_ids, k_neighbors=15
            )
            
            # Combine predictions (weighted average: 60% user-based, 40% item-based)
            combined_predictions = {}
            all_predicted_items = set(user_based_predictions.keys()) | set(item_based_predictions.keys())
            
            for movie_id in all_predicted_items:
                user_score = user_based_predictions.get(movie_id, 0)
                item_score = item_based_predictions.get(movie_id, 0)
                
                if user_score > 0 and item_score > 0:
                    combined_score = 0.6 * user_score + 0.4 * item_score
                elif user_score > 0:
                    combined_score = user_score * 0.8
                elif item_score > 0:
                    combined_score = item_score * 0.8
                else:
                    combined_score = 0
                
                combined_predictions[movie_id] = combined_score
            
            # Sort by predicted rating
            sorted_predictions = sorted(combined_predictions.items(), key=lambda x: x[1], reverse=True)
            
            # Build recommendation list
            recommendations = []
            watched_movies = set(user_data.get('user_history', []))
            
            for movie_id, predicted_rating in sorted_predictions:
                if movie_id not in watched_movies and len(recommendations) < 50:
                    movie_details = next((m for m in candidates if m['tmdb_id'] == movie_id), None)
                    if movie_details:
                        recommendation = {
                            'tmdb_id': movie_details['tmdb_id'],
                            'title': movie_details['title'],
                            'vote_average': movie_details.get('vote_average', 0.0),
                            'popularity': movie_details.get('popularity', 0.0),
                            'genres': movie_details.get('genres', []),
                            'overview': movie_details.get('overview', ''),
                            'poster_path': movie_details.get('poster_path', ''),
                            'release_date': movie_details.get('release_date', ''),
                            'similarity_score': round(predicted_rating / 10.0, 4),  # Normalize to 0-1
                            'recommendation_reason': f"Collaborative filtering (predicted rating: {predicted_rating:.1f})"
                        }
                        recommendations.append(recommendation)
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error in collaborative filtering: {e}")
            return []
        finally:
            conn.close()

    def generate_enhanced_content_recommendations(self, user_data: Dict, candidates: List[Dict]) -> List[Dict]:
        """Generate recommendations using enhanced content-based filtering"""
        recommendations = []
        favorite_genres = set(user_data['favourite_genres'])
        mood = user_data['mood']
        profile_config = user_data.get('profile_config', {})
        
        # Get user's content preferences if enhanced similarity is available
        user_content_embedding = None
        if self.enhanced_content_similarity and user_data.get('user_history'):
            user_content_embedding = self._get_user_content_preferences(user_data)
        
        for movie in candidates:
            if movie['tmdb_id'] in user_data['user_history']:
                continue

            # Enhanced scoring
            score = self._calculate_enhanced_movie_score(movie, user_data, user_content_embedding)
            
            # Genre matching score
            movie_genres = set(movie.get('genres', []))
            genre_overlap = len(movie_genres & favorite_genres)
            if favorite_genres:
                genre_score = genre_overlap / len(favorite_genres)
                score += genre_score * 0.2  # Reduced weight due to enhanced features

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
                'recommendation_reason': f"Enhanced content-based: {genre_overlap} genre matches, mood: {mood}"
            })

        # Sort by similarity score
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        return recommendations[:50]

    def _get_user_content_preferences(self, user_data: Dict) -> Optional[np.ndarray]:
        """Get user's content preferences using SentenceTransformer with caching"""
        if not self.content_model:
            return None
        
        try:
            # Get details of user's watched movies with caching
            user_texts = []
            for movie_id in user_data['user_history'][:20]:  # Limit to recent 20 movies
                # Use cached movie data if available
                movie_data = self.cache_manager.get_tmdb_movie(movie_id, self.tmdb_api_key)
                if movie_data:
                    text = f"{movie_data['title']}. {movie_data.get('overview', '')}"
                    user_texts.append(text)
            
            if not user_texts:
                return None
            
            # Use cache manager to get user embeddings
            user_id = user_data['user_id']
            user_embedding = self.cache_manager.get_user_embeddings(user_id, user_texts, self.content_model)
            
            return user_embedding
            
        except Exception as e:
            self.logger.warning(f"Error generating user content preferences: {e}")
            return None

    def _calculate_enhanced_movie_score(self, movie: Dict, user_data: Dict, user_content_embedding: Optional[np.ndarray]) -> float:
        """Calculate enhanced movie score using multiple factors"""
        score = 0.0
        
        # Base score from TMDB metrics
        if movie['vote_average'] > 0:
            score += (movie['vote_average'] / 10.0) * 0.3
        
        if movie['popularity'] > 0:
            popularity_score = min(movie['popularity'] / 100.0, 1.0)
            score += popularity_score * 0.2
        
        # Enhanced content similarity
        if self.enhanced_content_similarity and user_content_embedding is not None:
            content_score = self._calculate_content_similarity(movie, user_content_embedding)
            score += content_score * 0.3
        
        # User rating pattern matching
        ratings = user_data.get('ratings', {})
        if ratings:
            # Calculate user's average rating preference
            avg_user_rating = np.mean(list(ratings.values()))
            rating_diff = abs(movie['vote_average'] - avg_user_rating)
            rating_score = max(0, 1 - (rating_diff / 5.0))
            score += rating_score * 0.2
        
        return score

    def _calculate_content_similarity(self, movie: Dict, user_content_embedding: np.ndarray) -> float:
        """Calculate content similarity using SentenceTransformer with caching"""
        if not self.content_model:
            return 0.5
        
        try:
            movie_text = f"{movie['title']}. {movie.get('overview', '')}"
            
            # Use cache manager to get movie embedding
            movie_embedding = self.cache_manager.get_embedding(movie_text, self.content_model)
            
            if movie_embedding is None:
                return 0.5
            
            # Calculate cosine similarity
            norm_product = np.linalg.norm(movie_embedding) * np.linalg.norm(user_content_embedding)
            if norm_product == 0:
                return 0.5
            
            similarity = np.dot(movie_embedding, user_content_embedding) / norm_product
            return max(0, min(1, similarity))
            
        except Exception as e:
            self.logger.warning(f"Error calculating content similarity: {e}")
            return 0.5

    def assess_collaborative_filtering_readiness(self, user_data: Dict) -> Dict:
        """Assess whether the system has enough data for collaborative filtering"""
        conn = self.get_db_connection()
        if not conn:
            return {'use_collaborative': False, 'reason': 'Database connection failed', 'method': 'content-based'}
        
        try:
            cursor = conn.cursor()
            
            # Count total users with ratings
            cursor.execute("SELECT COUNT(DISTINCT user_id) FROM watched_movies WHERE rating IS NOT NULL")
            total_users = cursor.fetchone()[0]
            
            # Count total ratings
            cursor.execute("SELECT COUNT(*) FROM watched_movies WHERE rating IS NOT NULL")
            total_ratings = cursor.fetchone()[0]
            
            # Count users with sufficient ratings
            cursor.execute("""
                SELECT COUNT(*) FROM (
                    SELECT user_id FROM watched_movies 
                    WHERE rating IS NOT NULL 
                    GROUP BY user_id 
                    HAVING COUNT(*) >= %s
                ) AS users_with_enough_ratings
            """, (self.min_ratings_per_user,))
            users_with_enough_ratings = cursor.fetchone()[0]
            
            current_user_ratings = len(user_data.get('ratings', {}))
            
            # Decision logic - more lenient thresholds
            use_collaborative = (
                total_users >= self.min_users_for_cf and
                total_ratings >= self.min_total_ratings and
                users_with_enough_ratings >= 2 and  # At least 2 users with enough ratings
                current_user_ratings >= self.min_ratings_per_user
            )
            
            return {
                'use_collaborative': use_collaborative,
                'total_users': total_users,
                'total_ratings': total_ratings,
                'current_user_ratings': current_user_ratings,
                'users_with_enough_ratings': users_with_enough_ratings,
                'method': 'hybrid' if use_collaborative else 'content-based',
                'reason': self._get_cf_decision_reason(use_collaborative, total_users, total_ratings,
                                                    current_user_ratings, users_with_enough_ratings)
            }
            
        except Exception as e:
            self.logger.error(f"Error assessing CF readiness: {e}")
            return {'use_collaborative': False, 'reason': f'Error: {e}', 'method': 'content-based'}
        finally:
            conn.close()

    def _get_cf_decision_reason(self, use_cf: bool, total_users: int, total_ratings: int,
                               current_user_ratings: int, users_with_enough_ratings: int) -> str:
        """Get human-readable reason for CF decision"""
        if use_cf:
            return f"Sufficient data: {total_users} users, {total_ratings} ratings, user has {current_user_ratings} ratings"
        
        reasons = []
        if total_users < self.min_users_for_cf:
            reasons.append(f"Need {self.min_users_for_cf} users (have {total_users})")
        if total_ratings < self.min_total_ratings:
            reasons.append(f"Need {self.min_total_ratings} total ratings (have {total_ratings})")
        if current_user_ratings < self.min_ratings_per_user:
            reasons.append(f"User needs {self.min_ratings_per_user} ratings (has {current_user_ratings})")
        if users_with_enough_ratings < 2:
            reasons.append(f"Need more active users with {self.min_ratings_per_user}+ ratings")
        
        return "Cold start: " + ", ".join(reasons)

    def generate_recommendations(self, user_data: Dict) -> List[Dict]:
        """Enhanced recommendation generation with guaranteed fallback"""
        start_time = datetime.now()
        
        # Get candidate movies (always succeeds with fallback)
        candidates = self.get_candidate_movies(user_data)
        if not candidates:
            # Emergency fallback - generate basic movies
            self.logger.warning("No candidates found, using emergency fallback")
            candidates = self._get_emergency_fallback_movies(user_data)
        
        self.logger.info(f"📊 Starting recommendation generation with {len(candidates)} candidates")
        
        # Try collaborative filtering first
        recommendations = []
        try:
            cf_readiness = self.assess_collaborative_filtering_readiness(user_data)
            self.logger.info(f"🔍 CF Assessment: {cf_readiness['reason']}")
            
            if cf_readiness['use_collaborative']:
                self.logger.info("🔄 Attempting Collaborative Filtering")
                recommendations = self.generate_collaborative_recommendations(user_data, candidates)
                
                if len(recommendations) >= 10:
                    self.logger.info(f"✅ CF generated {len(recommendations)} recommendations")
                else:
                    self.logger.info(f"⚠️ CF only generated {len(recommendations)}, supplementing with content-based")
                    
        except Exception as e:
            self.logger.warning(f"⚠️ Collaborative filtering failed: {e}")
        
        # If CF didn't produce enough results, use enhanced content-based
        if len(recommendations) < 20:
            self.logger.info("🎯 Using Enhanced Content-Based Filtering")
            try:
                content_recs = self.generate_enhanced_content_recommendations(user_data, candidates)
                
                # Merge avoiding duplicates
                existing_ids = {rec['tmdb_id'] for rec in recommendations}
                for rec in content_recs:
                    if rec['tmdb_id'] not in existing_ids and len(recommendations) < 50:
                        recommendations.append(rec)
                        
            except Exception as e:
                self.logger.warning(f"⚠️ Enhanced content filtering failed: {e}")
        
        # Final fallback - simple content-based
        if len(recommendations) < 15:
            self.logger.info("🛠️ Using Simple Content-Based Fallback")
            try:
                simple_recs = self._generate_simple_content_recommendations(user_data, candidates)
                
                # Merge avoiding duplicates
                existing_ids = {rec['tmdb_id'] for rec in recommendations}
                for rec in simple_recs:
                    if rec['tmdb_id'] not in existing_ids and len(recommendations) < 50:
                        recommendations.append(rec)
                        
            except Exception as e:
                self.logger.error(f"❌ Simple content filtering failed: {e}")
        
        # Absolute last resort - random selection
        if len(recommendations) < 10:
            self.logger.warning("🚨 Using random selection as last resort")
            watched_ids = set(user_data.get('user_history', []))
            for movie in candidates:
                if movie['tmdb_id'] not in watched_ids and len(recommendations) < 30:
                    recommendations.append({
                        'tmdb_id': movie['tmdb_id'],
                        'title': movie['title'],
                        'vote_average': movie.get('vote_average', 7.0),
                        'popularity': movie.get('popularity', 50.0),
                        'genres': movie.get('genres', []),
                        'overview': movie.get('overview', ''),
                        'poster_path': movie.get('poster_path', ''),
                        'release_date': movie.get('release_date', ''),
                        'similarity_score': 0.7,  # Default decent score
                        'recommendation_reason': 'Curated high-quality selection'
                    })
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        self.logger.info(f"✅ Generated {len(recommendations)} recommendations in {processing_time:.0f}ms")
        
        return recommendations[:50]  # Ensure we return at most 50

    def _get_emergency_fallback_movies(self, user_data: Dict) -> List[Dict]:
        """Emergency fallback movies when all else fails"""
        emergency_movies = [
            {'tmdb_id': 278, 'title': 'The Shawshank Redemption', 'genres': ['Drama'], 'vote_average': 9.3, 'popularity': 96.7, 'overview': 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.', 'release_date': '1994-09-23', 'poster_path': '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'runtime': 142},
            {'tmdb_id': 238, 'title': 'The Godfather', 'genres': ['Crime', 'Drama'], 'vote_average': 9.2, 'popularity': 91.7, 'overview': 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', 'release_date': '1972-03-14', 'poster_path': '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'runtime': 175},
            {'tmdb_id': 155, 'title': 'The Dark Knight', 'genres': ['Action', 'Crime', 'Drama'], 'vote_average': 9.0, 'popularity': 98.5, 'overview': 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests.', 'release_date': '2008-07-18', 'poster_path': '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'runtime': 152},
            {'tmdb_id': 603, 'title': 'The Matrix', 'genres': ['Action', 'Science Fiction'], 'vote_average': 8.7, 'popularity': 93.8, 'overview': 'A computer hacker learns from mysterious rebels about the true nature of his reality.', 'release_date': '1999-03-30', 'poster_path': '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'runtime': 136},
            {'tmdb_id': 13, 'title': 'Forrest Gump', 'genres': ['Comedy', 'Drama'], 'vote_average': 8.5, 'popularity': 89.3, 'overview': 'The presidencies of Kennedy and Johnson, Vietnam, Watergate, and other history unfold through the perspective of an Alabama man.', 'release_date': '1994-07-06', 'poster_path': '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'runtime': 142}
        ]
        
        user_history = set(user_data.get('user_history', []))
        return [movie for movie in emergency_movies if movie['tmdb_id'] not in user_history]

    def _generate_simple_content_recommendations(self, user_data: Dict, candidates: List[Dict]) -> List[Dict]:
        """Simple content-based recommendations that always work"""
        recommendations = []
        favorite_genres = set(user_data['favourite_genres'])
        mood = user_data['mood']
        profile_config = user_data.get('profile_config', {})
        
        for movie in candidates:
            if movie['tmdb_id'] in user_data['user_history']:
                continue
            
            # Simple scoring
            score = 0.0
            
            # Vote average score (40% weight)
            if movie.get('vote_average', 0) > 0:
                score += (movie['vote_average'] / 10.0) * 0.4
            else:
                score += 0.28  # Default decent score
            
            # Popularity score (20% weight)
            if movie.get('popularity', 0) > 0:
                popularity_score = min(movie['popularity'] / 100.0, 1.0)
                score += popularity_score * 0.2
            else:
                score += 0.1  # Default
            
            # Genre matching (40% weight)
            movie_genres = set(movie.get('genres', []))
            if favorite_genres:
                genre_overlap = len(movie_genres & favorite_genres)
                genre_score = genre_overlap / len(favorite_genres)
                score += genre_score * 0.4
            else:
                score += 0.2  # Default when no genre preferences
            
            # Mood adjustment
            mood_weights = profile_config.get('mood_weights', {})
            mood_multiplier = mood_weights.get(mood, 1.0)
            score *= mood_multiplier
            
            recommendations.append({
                'tmdb_id': movie['tmdb_id'],
                'title': movie['title'],
                'vote_average': movie.get('vote_average', 7.0),
                'popularity': movie.get('popularity', 50.0),
                'genres': movie.get('genres', []),
                'overview': movie.get('overview', ''),
                'poster_path': movie.get('poster_path', ''),
                'release_date': movie.get('release_date', ''),
                'similarity_score': round(min(score, 1.0), 4),
                'recommendation_reason': f"Simple content-based: genre preferences, mood: {mood}"
            })
        
        # Sort by similarity score
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        return recommendations[:50]

    # Keep all existing methods unchanged for backward compatibility
    def store_recommendations_to_profile(self, username: str, recommendations: List[Dict]) -> bool:
        """Store recommendations to the profile-specific table (unchanged)"""
        if username not in self.profile_configs:
            self.logger.error(f"Unknown profile: {username}")
            return False

        table_name = self.profile_configs[username]['table_name']
        conn = self.get_db_connection()
        if not conn:
            return False

        try:
            cursor = conn.cursor()
            cursor.execute(f"DELETE FROM {table_name} WHERE is_active = TRUE")

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
                # Convert numpy types to native Python types
                vote_average = rec.get('vote_average')
                if hasattr(vote_average, 'item'):  # numpy scalar
                    vote_average = float(vote_average.item())
                elif vote_average is None:
                    vote_average = 7.0
                else:
                    vote_average = float(vote_average)
                
                popularity = rec.get('popularity')
                if hasattr(popularity, 'item'):  # numpy scalar
                    popularity = float(popularity.item())
                elif popularity is None:
                    popularity = 50.0
                else:
                    popularity = float(popularity)
                
                similarity_score = rec.get('similarity_score')
                if hasattr(similarity_score, 'item'):  # numpy scalar
                    similarity_score = float(similarity_score.item())
                elif similarity_score is None:
                    similarity_score = 0.5
                else:
                    similarity_score = float(similarity_score)
                
                cursor.execute(insert_query, (
                    int(rec['tmdb_id']),
                    str(rec['title']),
                    rec.get('genres', []),
                    vote_average,
                    popularity,
                    str(rec.get('overview', '')),
                    str(rec.get('poster_path', '')),
                    similarity_score,
                    str(rec.get('recommendation_reason', 'Enhanced recommendation'))
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
        """Get current recommendations for a profile from database (unchanged)"""
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
        """Main function to refresh recommendations for a profile (enhanced)"""
        self.logger.info(f"🚀 Refreshing enhanced recommendations for {username}")
        start_time = datetime.now()

        user_data = self.get_user_data_from_backend(username)
        if not user_data:
            self.logger.error(f"No user data found for {username}")
            return False

        recommendations = self.generate_recommendations(user_data)
        if not recommendations:
            self.logger.warning(f"No recommendations generated for {username}")
            return False

        success = self.store_recommendations_to_profile(username, recommendations)
        if success:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.logger.info(f"✅ Successfully refreshed enhanced recommendations for {username} in {processing_time:.0f}ms")

        return success

    # Keep all other existing methods unchanged for backward compatibility
    def refresh_all_profiles(self) -> Dict[str, bool]:
        """Refresh recommendations for all profiles"""
        results = {}
        for profile in self.profile_configs.keys():
            results[profile] = self.refresh_recommendations_for_profile(profile)
        return results

    def add_incremental_recommendations(self, username: str, count: int = 10) -> bool:
        """Generate and add NEW recommendations when user watches a movie (enhanced with cache invalidation)"""
        self.logger.info(f"Adding {count} enhanced incremental recommendations for {username}")
        start_time = datetime.now()

        # Invalidate user cache since they watched new movies
        self.cache_manager.invalidate_user_cache(username)

        user_data = self.get_user_data_from_backend(username)
        if not user_data:
            self.logger.error(f"No user data found for {username}")
            return False

        existing_recs = self.get_profile_recommendations(username, limit=1000)
        existing_tmdb_ids = {rec['tmdb_id'] for rec in existing_recs}

        user_data['count'] = count * 3

        new_recommendations = self.generate_recommendations(user_data)
        if not new_recommendations:
            self.logger.warning(f"No new recommendations generated for {username}")
            return False

        filtered_recs = []
        for rec in new_recommendations:
            if rec['tmdb_id'] not in existing_tmdb_ids and len(filtered_recs) < count:
                filtered_recs.append(rec)

        if not filtered_recs:
            self.logger.warning(f"No new unique recommendations found for {username}")
            return False

        success = self.add_recommendations_to_profile(username, filtered_recs)
        if success:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.logger.info(f"✅ Successfully added {len(filtered_recs)} enhanced recommendations for {username} in {processing_time:.0f}ms")

        return success

    def add_recommendations_to_profile(self, username: str, recommendations: List[Dict]) -> bool:
        """Add new recommendations to profile table WITHOUT clearing existing ones (unchanged)"""
        if username not in self.profile_configs:
            self.logger.error(f"Unknown profile: {username}")
            return False

        table_name = self.profile_configs[username]['table_name']
        conn = self.get_db_connection()
        if not conn:
            return False

        try:
            cursor = conn.cursor()

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
                # Convert numpy types to native Python types
                vote_average = rec.get('vote_average')
                if hasattr(vote_average, 'item'):  # numpy scalar
                    vote_average = float(vote_average.item())
                elif vote_average is None:
                    vote_average = 7.0
                else:
                    vote_average = float(vote_average)
                
                popularity = rec.get('popularity')
                if hasattr(popularity, 'item'):  # numpy scalar
                    popularity = float(popularity.item())
                elif popularity is None:
                    popularity = 50.0
                else:
                    popularity = float(popularity)
                
                similarity_score = rec.get('similarity_score')
                if hasattr(similarity_score, 'item'):  # numpy scalar
                    similarity_score = float(similarity_score.item())
                elif similarity_score is None:
                    similarity_score = 0.5
                else:
                    similarity_score = float(similarity_score)
                
                cursor.execute(insert_query, (
                    int(rec['tmdb_id']),
                    str(rec['title']),
                    rec.get('genres', []),
                    vote_average,
                    popularity,
                    str(rec.get('overview', '')),
                    str(rec.get('poster_path', '')),
                    similarity_score,
                    str(rec.get('recommendation_reason', 'Enhanced incremental recommendation'))
                ))

            conn.commit()
            self.logger.info(f"Added {len(recommendations)} enhanced recommendations for {username}")
            return True

        except Exception as e:
            self.logger.error(f"Error adding recommendations: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

    def handle_movie_dislike(self, username: str, tmdb_id: int) -> bool:
        """Remove or deprioritize a disliked movie from recommendations (unchanged)"""
        if username not in self.profile_configs:
            self.logger.error(f"Unknown profile: {username}")
            return False

        table_name = self.profile_configs[username]['table_name']
        conn = self.get_db_connection()
        if not conn:
            return False

        try:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE {table_name} SET is_active = FALSE WHERE tmdb_id = %s", (tmdb_id,))

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
        """Get statistics about a profile's recommendations (unchanged)"""
        if username not in self.profile_configs:
            return {}

        table_name = self.profile_configs[username]['table_name']
        conn = self.get_db_connection()
        if not conn:
            return {}

        try:
            cursor = conn.cursor()

            cursor.execute(f"SELECT COUNT(*) FROM {table_name} WHERE is_active = TRUE")
            active_count = cursor.fetchone()[0]

            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_count = cursor.fetchone()[0]

            cursor.execute(f"SELECT AVG(similarity_score) FROM {table_name} WHERE is_active = TRUE")
            avg_score = cursor.fetchone()[0] or 0

            return {
                'active_recommendations': active_count,
                'total_recommendations': total_count,
                'average_similarity_score': float(avg_score),
                'growth': active_count - 30
            }

        except Exception as e:
            self.logger.error(f"Error getting profile stats: {e}")
            return {}
        finally:
            conn.close()

    def __del__(self):
        """Cleanup GPU memory when object is destroyed"""
        if hasattr(self, 'device') and TORCH_AVAILABLE:
            if str(self.device) != 'cpu':
                torch.cuda.empty_cache()

def main():
    """Main entry point with command line argument support (unchanged function signatures)"""
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '5432')),
        'database': os.getenv('DB_NAME', 'firetv_db'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '263153')
    }

    tmdb_api_key = os.getenv('TMDB_API_KEY', '6bd9c6be12f52c21691a2cc2d4187047')

    # Initialize enhanced service
    service = FireTVRecommendationService(db_config, tmdb_api_key)

    # Handle command line arguments (same logic as before)
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'refresh' and len(sys.argv) > 2:
            profile = sys.argv[2]
            print(f"🚀 Refreshing enhanced recommendations for {profile}")
            success = service.refresh_recommendations_for_profile(profile)
            if success:
                print(f"✅ Successfully refreshed enhanced recommendations for {profile}")
                sys.exit(0)
            else:
                print(f"❌ Failed to refresh recommendations for {profile}")
                sys.exit(1)
                
        elif command == 'refresh-all':
            print("🚀 Refreshing enhanced recommendations for all profiles")
            results = service.refresh_all_profiles()
            all_success = True
            for profile, success in results.items():
                if success:
                    print(f"✅ Successfully refreshed enhanced recommendations for {profile}")
                else:
                    print(f"❌ Failed to refresh recommendations for {profile}")
                    all_success = False
            sys.exit(0 if all_success else 1)
            
        elif command == 'get' and len(sys.argv) > 2:
            profile = sys.argv[2]
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            recs = service.get_profile_recommendations(profile, limit)
            print(f"📊 {len(recs)} enhanced recommendations for {profile}:")
            for i, rec in enumerate(recs, 1):
                print(f"  {i}. {rec['title']} (Score: {rec['similarity_score']})")
            sys.exit(0)
            
        elif command == 'add' and len(sys.argv) > 2:
            profile = sys.argv[2]
            count = int(sys.argv[3]) if len(sys.argv) > 3 else 5
            print(f"🚀 Adding {count} enhanced recommendations for {profile}")
            success = service.add_incremental_recommendations(profile, count)
            if success:
                stats = service.get_profile_stats(profile)
                print(f"✅ Successfully added enhanced recommendations! Profile now has {stats.get('active_recommendations', 0)} movies")
                sys.exit(0)
            else:
                print(f"❌ Failed to add recommendations for {profile}")
                sys.exit(1)
                
        elif command == 'dislike' and len(sys.argv) > 3:
            profile = sys.argv[2]
            tmdb_id = int(sys.argv[3])
            print(f"🚀 Processing dislike for movie {tmdb_id} in {profile}'s profile")
            success = service.handle_movie_dislike(profile, tmdb_id)
            if success:
                print(f"✅ Successfully processed dislike for movie {tmdb_id}")
                sys.exit(0)
            else:
                print(f"❌ Failed to process dislike for movie {tmdb_id}")
                sys.exit(1)
                
        elif command == 'stats' and len(sys.argv) > 2:
            profile = sys.argv[2]
            stats = service.get_profile_stats(profile)
            if stats:
                print(f"📊 Enhanced Profile Statistics for {profile}:")
                print(f"   Active Recommendations: {stats['active_recommendations']}")
                print(f"   Total Recommendations: {stats['total_recommendations']}")
                print(f"   Average Similarity Score: {stats['average_similarity_score']:.3f}")
                print(f"   Growth from Initial: +{stats['growth']} movies")
            else:
                print(f"❌ Could not get statistics for {profile}")
            sys.exit(0)
            
        elif command == 'cache-stats':
            cache_stats = service.cache_manager.get_cache_stats()
            print("💾 Cache Statistics:")
            print(f"   TMDB API Entries: {cache_stats['tmdb_entries']}")
            print(f"   Embedding Entries: {cache_stats['embedding_entries']}")
            print(f"   Similarity Entries: {cache_stats['similarity_entries']}")
            print(f"   User Data Entries: {cache_stats['user_data_entries']}")
            print(f"   Cache Directory: {cache_stats['cache_dir']}")
            print(f"   TTL: {cache_stats['ttl_hours']} hours")
            sys.exit(0)
            
        elif command == 'cache-cleanup':
            print("🧹 Cleaning up expired cache entries...")
            service.cache_manager.save_and_cleanup()
            cache_stats = service.cache_manager.get_cache_stats()
            print(f"✅ Cache cleaned! Current entries: TMDB({cache_stats['tmdb_entries']}), Embeddings({cache_stats['embedding_entries']}), Similarity({cache_stats['similarity_entries']})")
            sys.exit(0)
            
        else:
            print("📖 Enhanced FireTV Recommendation System with Caching Usage:")
            print("   python firetv_integration_fixed.py refresh <profile>")
            print("   python firetv_integration_fixed.py refresh-all")
            print("   python firetv_integration_fixed.py get <profile> [limit]")
            print("   python firetv_integration_fixed.py add <profile> [count]")
            print("   python firetv_integration_fixed.py dislike <profile> <tmdb_id>")
            print("   python firetv_integration_fixed.py stats <profile>")
            print("   python firetv_integration_fixed.py cache-stats")
            print("   python firetv_integration_fixed.py cache-cleanup")
            sys.exit(1)
            
    else:
        # Default behavior - test all profiles with enhanced recommendations
        profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya']
        for profile in profiles:
            print(f"\n🚀 Testing enhanced recommendations for {profile}")
            success = service.refresh_recommendations_for_profile(profile)
            if success:
                recs = service.get_profile_recommendations(profile, 5)
                print(f"✅ Got {len(recs)} enhanced recommendations:")
                for i, rec in enumerate(recs[:3], 1):
                    print(f"   {i}. {rec['title']} (Score: {rec['similarity_score']})")
            else:
                print(f"❌ Failed to generate enhanced recommendations for {profile}")

if __name__ == "__main__":
    main()
