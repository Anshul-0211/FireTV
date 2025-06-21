#!/usr/bin/env python3
"""
Comprehensive Test Suite for FireTV Recommendation System
Tests all components: Database, API endpoints, Python service, and integration flow
"""

import requests
import json
import subprocess
import psycopg2
import os
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:3001"
DB_CONFIG = {
    'host': 'localhost',
    'database': 'firetv_db',
    'user': 'postgres',
    'password': '263153'  # Update with your actual password
}

class RecommendationSystemTester:
    def __init__(self):
        self.test_results = []
        self.profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya']
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if data and not success:
            print(f"   Data: {data}")
    
    def test_database_connection(self):
        """Test 1: Database Connection and Tables"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Check if all tables exist
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name LIKE '%_dash'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            expected_tables = ['anshul_dash', 'shikhar_dash', 'priyanshu_dash', 'shaurya_dash']
            
            missing_tables = set(expected_tables) - set(tables)
            if missing_tables:
                self.log_test("Database Tables", False, f"Missing tables: {missing_tables}")
                return False
            
            # Check table data counts
            table_counts = {}
            for table in expected_tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                table_counts[table] = count
            
            conn.close()
            self.log_test("Database Connection", True, "All tables present", table_counts)
            return True
            
        except Exception as e:
            self.log_test("Database Connection", False, str(e))
            return False
    
    def test_api_endpoints(self):
        """Test 2: Backend API Endpoints"""
        # Test getting recommendations for each profile
        for profile in self.profiles:
            try:
                response = requests.get(f"{API_BASE_URL}/api/recommendations/{profile}")
                if response.status_code == 200:
                    data = response.json()
                    movie_count = len(data.get('recommendations', []))
                    self.log_test(f"API Get Recommendations - {profile}", True, 
                                f"Retrieved {movie_count} movies")
                else:
                    self.log_test(f"API Get Recommendations - {profile}", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"API Get Recommendations - {profile}", False, str(e))
        
        # Test recommendation stats
        for profile in self.profiles:
            try:
                response = requests.get(f"{API_BASE_URL}/api/recommendations/{profile}/stats")
                if response.status_code == 200:
                    stats = response.json()
                    self.log_test(f"API Stats - {profile}", True, 
                                f"Stats retrieved: {stats.get('total_recommendations', 0)} total")
                else:
                    self.log_test(f"API Stats - {profile}", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"API Stats - {profile}", False, str(e))
    
    def test_python_recommendation_service(self):
        """Test 3: Python Recommendation Service"""
        try:
            # Test getting recommendations
            result = subprocess.run([
                'python', 'src4/firetv_integration_fixed.py', 'get', 'anshul'
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.log_test("Python Service - Get", True, "Successfully retrieved recommendations")
            else:
                self.log_test("Python Service - Get", False, f"Error: {result.stderr}")
            
            # Test refresh functionality
            result = subprocess.run([
                'python', 'src4/firetv_integration_fixed.py', 'refresh', 'anshul'
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                self.log_test("Python Service - Refresh", True, "Successfully refreshed recommendations")
            else:
                self.log_test("Python Service - Refresh", False, f"Error: {result.stderr}")
                
        except Exception as e:
            self.log_test("Python Service", False, str(e))
    
    def test_watch_movie_integration(self):
        """Test 4: Watch Movie Integration (End-to-End)"""
        try:
            # Simulate watching a movie
            watch_data = {
                "movie_id": "tt0137523",  # Fight Club IMDB ID
                "tmdb_id": 550,  # Fight Club TMDB ID
                "title": "Fight Club",
                "rating": "loved",
                "current_mood": "excited"
            }
            
            # Use the correct endpoint with user ID in URL
            response = requests.post(f"{API_BASE_URL}/api/watched-movies/user/1", json=watch_data)
            
            if response.status_code in [200, 201]:
                self.log_test("Watch Movie API", True, "Movie watch recorded successfully")
                
                # Wait a moment for background processing
                time.sleep(3)
                
                # Check if recommendations were triggered using correct endpoint
                trigger_data = {
                    "username": "anshul",
                    "tmdb_id": 550
                }
                
                response = requests.post(f"{API_BASE_URL}/api/recommendations/trigger-on-watch", 
                                       json=trigger_data)
                
                if response.status_code == 200:
                    self.log_test("Auto-Recommendation Trigger", True, "Recommendation refresh triggered")
                else:
                    self.log_test("Auto-Recommendation Trigger", False, 
                                f"Status: {response.status_code}")
            else:
                self.log_test("Watch Movie API", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Watch Movie Integration", False, str(e))
    
    def test_api_refresh_endpoints(self):
        """Test 5: API Refresh Endpoints"""
        # Test single profile refresh
        try:
            response = requests.post(f"{API_BASE_URL}/api/recommendations/anshul/refresh")
            if response.status_code == 200:
                self.log_test("API Refresh Single", True, "Single profile refresh successful")
            else:
                self.log_test("API Refresh Single", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Refresh Single", False, str(e))
        
        # Test all profiles refresh (be careful - this takes time)
        try:
            response = requests.post(f"{API_BASE_URL}/api/recommendations/refresh-all")
            if response.status_code == 200:
                self.log_test("API Refresh All", True, "All profiles refresh initiated")
            else:
                self.log_test("API Refresh All", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Refresh All", False, str(e))
    
    def test_data_quality(self):
        """Test 6: Data Quality and Content"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            for profile in self.profiles:
                table_name = f"{profile}_dash"
                
                # Check for required fields
                cursor.execute(f"""
                    SELECT COUNT(*) FROM {table_name} 
                    WHERE tmdb_id IS NOT NULL AND title IS NOT NULL AND genres IS NOT NULL
                """)
                valid_records = cursor.fetchone()[0]
                
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                total_records = cursor.fetchone()[0]
                
                if valid_records == total_records and total_records > 0:
                    self.log_test(f"Data Quality - {profile}", True, 
                                f"All {total_records} records have required fields")
                else:
                    self.log_test(f"Data Quality - {profile}", False, 
                                f"Only {valid_records}/{total_records} records are valid")
            
            conn.close()
            
        except Exception as e:
            self.log_test("Data Quality", False, str(e))
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "="*60)
        print("RECOMMENDATION SYSTEM TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Save detailed results
        with open('test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\nDetailed results saved to: test_results.json")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("Starting Recommendation System Tests...")
        print("="*60)
        
        # Run tests in logical order
        self.test_database_connection()
        time.sleep(1)
        
        self.test_api_endpoints()
        time.sleep(1)
        
        self.test_data_quality()
        time.sleep(1)
        
        self.test_python_recommendation_service()
        time.sleep(2)
        
        self.test_api_refresh_endpoints()
        time.sleep(2)
        
        self.test_watch_movie_integration()
        
        self.print_summary()

def main():
    print("FireTV Recommendation System Tester")
    print("Make sure your backend server is running on port 3000")
    print("Update the DB_CONFIG password in this script if needed")
    print()
    
    input("Press Enter to start testing...")
    
    tester = RecommendationSystemTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 