# Backend Setup Guide

Follow these steps to set up the FireTV backend:

## 1. Prerequisites

- Install Node.js (v16+): https://nodejs.org/
- Install PostgreSQL (v12+): https://postgresql.org/download/

## 2. Database Setup

1. **Start PostgreSQL service**
2. **Create database and user**:
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Create database
   CREATE DATABASE firetv_db;
   
   -- Create user (replace with your credentials)
   CREATE USER firetv_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE firetv_db TO firetv_user;
   
   -- Exit
   \q
   ```

## 3. Environment Configuration

1. **Create .env file**:
   ```bash
   # Copy the template
   cp config.template .env
   ```

2. **Update .env with your database credentials**:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=firetv_db
   DB_USER=firetv_user
   DB_PASSWORD=your_secure_password
   
   PORT=3001
   NODE_ENV=development
   
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRES_IN=24h
   
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

## 4. Install Dependencies

```bash
npm install
```

## 5. Start the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 6. Verify Setup

1. **Check server health**:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Expected response**:
   ```json
   {
     "success": true,
     "message": "FireTV Backend API is running",
     "timestamp": "2024-01-XX...",
     "version": "1.0.0"
   }
   ```

3. **Check database connection**:
   - The server will automatically create tables on first run
   - Check console logs for database initialization messages

## 7. Test API Endpoints

### Get all users
```bash
curl http://localhost:3001/api/users
```

### Get user by username
```bash
curl http://localhost:3001/api/users/username/anshul
```

### Create a mood selection
```bash
curl -X POST http://localhost:3001/api/moods/user/1 \
  -H "Content-Type: application/json" \
  -d '{"mood": "cheerful", "page": "main"}'
```

## 8. Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify user has proper permissions

### Port Already in Use
- Change PORT in .env file
- Kill any processes using port 3001

### TypeScript Compilation Errors
```bash
npm run build
```

### Reset Database (if needed)
The server includes utilities to reset and reinitialize the database:
- This will be available through admin endpoints or direct database commands

## Next Steps

1. **Connect Frontend**: Update frontend API configuration to point to `http://localhost:3001/api`
2. **Test Integration**: Verify frontend can communicate with backend
3. **Production Deployment**: Follow production deployment guide in README.md

## Support

- Check README.md for detailed API documentation
- Review server logs for error messages
- Ensure all environment variables are correctly set 