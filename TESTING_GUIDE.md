# FireTV Recommendation System Testing Guide

## Overview
This guide helps you test the complete FireTV recommendation system integration including:
- Database schema and data
- Backend API endpoints
- Python recommendation service
- End-to-end workflow
- Frontend integration

## Prerequisites

### 1. Environment Setup
- ✅ PostgreSQL database running with `firetv_db`
- ✅ Backend server running on port 3000
- ✅ Python environment with required packages
- ✅ TMDB API key configured

### 2. Check Services Status
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check database connection
psql -h localhost -U postgres -d firetv_db -c "SELECT COUNT(*) FROM users;"
```

## Testing Methods

### Method 1: Automated Testing (Recommended)
```bash
# Run the comprehensive test suite
python test_recommendation_system.py
```

This will test:
- ✅ Database connectivity and table integrity
- ✅ All API endpoints functionality
- ✅ Python service operations
- ✅ Data quality validation
- ✅ End-to-end workflow

### Method 2: Manual API Testing

#### Test 1: Get Recommendations
```bash
# Test getting recommendations for each profile
curl http://localhost:3000/api/recommendations/anshul
curl http://localhost:3000/api/recommendations/shikhar
curl http://localhost:3000/api/recommendations/priyanshu
curl http://localhost:3000/api/recommendations/shaurya
```

**Expected Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "tmdb_id": 550,
      "title": "Fight Club",
      "genres": ["Drama", "Thriller"],
      "vote_average": 8.4,
      "popularity": 75.0,
      "poster_path": "/path/to/poster.jpg",
      "similarity_score": 0.95
    }
  ],
  "total": 30
}
```

#### Test 2: Get Recommendation Stats
```bash
curl http://localhost:3000/api/recommendations/anshul/stats
```

#### Test 3: Refresh Single Profile
```bash
curl -X POST http://localhost:3000/api/recommendations/anshul/refresh
```

#### Test 4: Refresh All Profiles (Takes time!)
```bash
curl -X POST http://localhost:3000/api/recommendations/refresh-all
```

#### Test 5: Watch Movie (Triggers Auto-Recommendation)
```bash
curl -X POST http://localhost:3000/api/watched-movies \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "tmdb_id": 550,
    "watched_at": "2024-01-15T10:30:00Z"
  }'
```

### Method 3: Python Service Direct Testing

#### Test Python Service Commands
```bash
# Get current recommendations
python src4/firetv_integration.py get anshul

# Refresh recommendations for a profile
python src4/firetv_integration.py refresh anshul

# Refresh all profiles
python src4/firetv_integration.py refresh-all
```

### Method 4: Database Verification

#### Check Tables and Data
```sql
-- Connect to database
psql -h localhost -U postgres -d firetv_db

-- Check all recommendation tables
\dt *_dash

-- Check data counts
SELECT 'anshul_dash' as table_name, COUNT(*) FROM anshul_dash
UNION ALL
SELECT 'shikhar_dash', COUNT(*) FROM shikhar_dash
UNION ALL
SELECT 'priyanshu_dash', COUNT(*) FROM priyanshu_dash
UNION ALL
SELECT 'shaurya_dash', COUNT(*) FROM shaurya_dash;

-- Check sample data
SELECT tmdb_id, title, genres, vote_average, similarity_score 
FROM anshul_dash 
ORDER BY similarity_score DESC 
LIMIT 5;

-- Check recent recommendation sessions
SELECT * FROM recommendation_sessions ORDER BY created_at DESC LIMIT 5;
```

## Test Scenarios

### Scenario 1: Cold Start (New User)
1. Clear a profile's recommendations
2. Test recommendation generation
3. Verify profile-appropriate content

### Scenario 2: Warm User (Has Watch History)
1. Add watched movies for a user
2. Trigger recommendation refresh
3. Verify personalized recommendations

### Scenario 3: Mood-Based Recommendations
1. Set user mood in `mood_selections` table
2. Generate recommendations
3. Verify mood influences results

### Scenario 4: Performance Testing
1. Time recommendation generation
2. Test concurrent requests
3. Monitor database performance

## Expected Results

### Database Tables
- ✅ 4 profile tables: `anshul_dash`, `shikhar_dash`, `priyanshu_dash`, `shaurya_dash`
- ✅ Each table has 30 initial movies
- ✅ `recommendation_sessions` table exists

### API Response Times
- ✅ Get recommendations: < 200ms
- ✅ Refresh single profile: < 30 seconds
- ✅ Refresh all profiles: < 2 minutes

### Data Quality
- ✅ All movies have valid TMDB IDs
- ✅ Genres match profile preferences
- ✅ Similarity scores between 0.0-1.0
- ✅ No duplicate movies per profile

## Common Issues and Solutions

### Issue 1: "Table doesn't exist"
**Solution:**
```bash
psql -h localhost -U postgres -d firetv_db -f backend/src/database/recommendation_schema.sql
```

### Issue 2: "TMDB API key not found"
**Solution:**
- Check `.env` file in backend folder
- Ensure `TMDB_API_KEY` is set

### Issue 3: "Python service timeout"
**Solution:**
- Check internet connection
- Verify TMDB API quota
- Increase timeout values

### Issue 4: "Backend server not responding"
**Solution:**
```bash
cd backend
npm install
npm start
```

### Issue 5: "Empty recommendations"
**Solution:**
- Run initial setup: `python src4/setup_profile_tables.py`
- Or manually refresh: `python src4/firetv_integration.py refresh-all`

## Performance Benchmarks

### Expected Performance
- **Database queries**: < 50ms
- **TMDB API calls**: < 500ms per request
- **Recommendation generation**: < 30 seconds per profile
- **Full system refresh**: < 2 minutes for all profiles

### Monitoring Commands
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/recommendations/anshul

# Monitor database performance
psql -h localhost -U postgres -d firetv_db -c "SELECT * FROM pg_stat_activity WHERE datname = 'firetv_db';"
```

## Integration Testing with Frontend

### Test Frontend Integration
1. Start the FireTV UI application
2. Navigate to profile pages
3. Verify recommendations load correctly
4. Test watch movie functionality
5. Confirm auto-refresh works

### Frontend Test URLs
- Anshul: `http://localhost:3000/anshul`
- Shikhar: `http://localhost:3000/shikhar`
- Priyanshu: `http://localhost:3000/priyanshu`
- Shaurya: `http://localhost:3000/shaurya`

## Troubleshooting Commands

```bash
# Check logs
tail -f backend/logs/application.log

# Check database connections
psql -h localhost -U postgres -d firetv_db -c "SELECT count(*) FROM pg_stat_activity;"

# Test TMDB API directly
curl "https://api.themoviedb.org/3/movie/550?api_key=YOUR_API_KEY"

# Check Python dependencies
pip list | grep -E "(requests|psycopg2|transformers)"
```

## Success Criteria

The system passes testing if:
- ✅ All database tables exist and contain data
- ✅ All API endpoints return 200 status codes
- ✅ Python service runs without errors
- ✅ Recommendations are profile-appropriate
- ✅ Watch movie triggers auto-refresh
- ✅ Performance meets benchmarks
- ✅ Frontend integration works smoothly

## Next Steps After Testing

1. **Production Deployment**: Configure production database and API keys
2. **Monitoring Setup**: Add logging and monitoring for production
3. **Performance Optimization**: Optimize slow queries and API calls
4. **User Feedback**: Collect user feedback on recommendation quality
5. **A/B Testing**: Test different recommendation algorithms

## Support

If you encounter issues:
1. Check the `test_results.json` file for detailed error information
2. Review the database logs and API logs
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed 