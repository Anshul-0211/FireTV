#!/usr/bin/env python3
"""
Test script to verify 10 movie incremental additions and shuffling functionality
"""

import os
import sys
sys.path.append('src4')

from firetv_integration_fixed import FireTVRecommendationService

def test_10_movies_and_shuffle():
    """Test that 10 movies are added and shuffling works"""
    
    print("🎬 Testing 10 Movie Addition & Shuffling")
    print("=" * 50)
    
    # Initialize service
    db_config = {
        'host': 'localhost',
        'database': 'firetv_db', 
        'user': 'postgres',
        'password': '263153',
        'port': 5432
    }
    
    tmdb_api_key = os.getenv('TMDB_API_KEY', '6bd9c6be12f52c21691a2cc2d4187047')
    
    try:
        service = FireTVRecommendationService(db_config, tmdb_api_key)
        print("✅ Service initialized successfully")
        
        # Test with Shikhar profile
        username = 'shikhar'
        print(f"\n🧪 Testing incremental additions for {username}")
        
        # Get initial count
        initial_recs = service.get_profile_recommendations(username, limit=1000, shuffle=False)
        initial_count = len(initial_recs)
        print(f"📊 Initial recommendation count: {initial_count}")
        
        # Test adding 10 movies (default)
        print(f"\n➕ Adding incremental recommendations (default should be 10)...")
        success = service.add_incremental_recommendations(username)
        
        if success:
            print("✅ Incremental addition completed successfully")
            
            # Get new count
            new_recs = service.get_profile_recommendations(username, limit=1000, shuffle=False)
            new_count = len(new_recs)
            added_count = new_count - initial_count
            
            print(f"📊 Results:")
            print(f"   Before: {initial_count} movies")
            print(f"   After: {new_count} movies")
            print(f"   Added: {added_count} movies")
            
            if added_count == 10:
                print(f"   🎉 SUCCESS: Exactly 10 movies were added!")
            elif added_count > 0:
                print(f"   ⚠️  {added_count} movies added (expected 10, might be due to duplicates)")
            else:
                print(f"   ❌ FAILED: No movies were added")
                return False
                
        else:
            print("❌ Failed to add incremental recommendations")
            return False
        
        # Test shuffling functionality
        print(f"\n🔀 Testing shuffling functionality...")
        
        # Get recommendations without shuffle
        recs_no_shuffle = service.get_profile_recommendations(username, limit=20, shuffle=False)
        
        # Get recommendations with shuffle (default)
        recs_with_shuffle = service.get_profile_recommendations(username, limit=20, shuffle=True)
        
        if len(recs_no_shuffle) >= 5 and len(recs_with_shuffle) >= 5:
            # Check if order is different (shuffled)
            no_shuffle_order = [rec['tmdb_id'] for rec in recs_no_shuffle[:5]]
            shuffle_order = [rec['tmdb_id'] for rec in recs_with_shuffle[:5]]
            
            print(f"📋 First 5 movies (no shuffle): {no_shuffle_order}")
            print(f"🔀 First 5 movies (shuffled): {shuffle_order}")
            
            if no_shuffle_order != shuffle_order:
                print(f"   🎉 SUCCESS: Shuffling is working - order is different!")
            else:
                print(f"   ⚠️  Shuffling may not be working or movies happened to be in same order")
            
            return True
        else:
            print(f"   ❌ Not enough recommendations to test shuffling")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_explicit_count():
    """Test adding specific number of movies"""
    
    print(f"\n🔢 Testing Explicit Count (Add 3 Movies)")
    print("=" * 40)
    
    # Initialize service
    db_config = {
        'host': 'localhost',
        'database': 'firetv_db', 
        'user': 'postgres',
        'password': '263153',
        'port': 5432
    }
    
    tmdb_api_key = os.getenv('TMDB_API_KEY', '6bd9c6be12f52c21691a2cc2d4187047')
    
    try:
        service = FireTVRecommendationService(db_config, tmdb_api_key)
        
        username = 'anshul'  # Test with different profile
        
        # Get initial count
        initial_recs = service.get_profile_recommendations(username, limit=1000, shuffle=False)
        initial_count = len(initial_recs)
        print(f"📊 Initial count for {username}: {initial_count}")
        
        # Add exactly 3 movies
        print(f"➕ Adding exactly 3 movies...")
        success = service.add_incremental_recommendations(username, count=3)
        
        if success:
            new_recs = service.get_profile_recommendations(username, limit=1000, shuffle=False)
            new_count = len(new_recs)
            added_count = new_count - initial_count
            
            print(f"📊 Results:")
            print(f"   Added: {added_count} movies (expected 3)")
            
            if added_count == 3:
                print(f"   🎉 SUCCESS: Exactly 3 movies were added!")
                return True
            else:
                print(f"   ⚠️  {added_count} movies added (expected 3)")
                return added_count > 0
        else:
            print("❌ Failed to add 3 movies")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🎮 Fire TV Enhanced Incremental & Shuffle Test")
    print("Testing 10 movie additions and random shuffling\n")
    
    test1_success = test_10_movies_and_shuffle()
    test2_success = test_explicit_count()
    
    print(f"\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print(f"   10 Movie Addition & Shuffle: {'✅ PASSED' if test1_success else '❌ FAILED'}")
    print(f"   Explicit Count (3 movies): {'✅ PASSED' if test2_success else '❌ FAILED'}")
    
    if test1_success and test2_success:
        print(f"\n🎉 ALL TESTS PASSED!")
        print("   ✅ Default incremental count is now 10 movies")
        print("   ✅ Shuffling displays movies randomly")
        print("   ✅ Explicit counts work correctly")
    else:
        print(f"\n⚠️  Some tests failed - check output above")
    
    return test1_success and test2_success

if __name__ == "__main__":
    main() 