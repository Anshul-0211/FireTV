import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

export class DatabaseInitializer {
  
  // Read and execute SQL schema file
  static async initializeDatabase(): Promise<void> {
    try {
      console.log('🚀 Starting database initialization...');
      
      // Read the schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      const client = await pool.connect();
      
      try {
        // Execute the entire schema as one query
        await client.query(schema);
        
        console.log('✅ Database schema initialized successfully');
        
      } catch (error) {
        console.error('❌ Error executing schema:', error);
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Check if tables exist
  static async checkTablesExist(): Promise<boolean> {
    try {
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'mood_selections', 'watched_movies')
      `);
      
      client.release();
      
      return result.rows.length === 3;
    } catch (error) {
      console.error('Error checking tables existence:', error);
      return false;
    }
  }

  // Reset database (DROP and recreate tables)
  static async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database...');
      
      const client = await pool.connect();
      
      try {
        // Drop tables in reverse order of dependencies
        await client.query('DROP TABLE IF EXISTS watched_movies CASCADE');
        await client.query('DROP TABLE IF EXISTS mood_selections CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // Drop custom types
        await client.query('DROP TYPE IF EXISTS movie_rating CASCADE');
        await client.query('DROP TYPE IF EXISTS mood_type CASCADE');
        
        // Drop views
        await client.query('DROP VIEW IF EXISTS user_mood_history CASCADE');
        await client.query('DROP VIEW IF EXISTS user_watched_movies CASCADE');
        await client.query('DROP VIEW IF EXISTS user_stats CASCADE');
        
        console.log('✅ Database reset completed');
        
        // Reinitialize
        await this.initializeDatabase();
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  // Seed additional test data
  static async seedTestData(): Promise<void> {
    try {
      console.log('🌱 Seeding test data...');
      
      const client = await pool.connect();
      
      try {
        // Add some sample mood selections
        await client.query(`
          INSERT INTO mood_selections (user_id, mood, page, selected_at) VALUES
          (1, 'cheerful', 'anshul', NOW() - INTERVAL '1 hour'),
          (2, 'very_happy', 'shikhar', NOW() - INTERVAL '2 hours'),
          (3, 'neutral', 'priyanshu', NOW() - INTERVAL '3 hours'),
          (4, 'happy', 'shaurya', NOW() - INTERVAL '4 hours')
          ON CONFLICT DO NOTHING
        `);
        
        // Add some sample watched movies
        await client.query(`
          INSERT INTO watched_movies (user_id, movie_id, tmdb_id, title, rating, current_mood, watched_at) VALUES
          (1, 550, 550, 'Fight Club', 'loved', 'cheerful', NOW() - INTERVAL '1 day'),
          (1, 680, 680, 'Pulp Fiction', 'good', 'neutral', NOW() - INTERVAL '2 days'),
          (2, 13, 13, 'Forrest Gump', 'loved', 'very_happy', NOW() - INTERVAL '1 day'),
          (3, 18, 18, 'The Fifth Element', 'good', 'neutral', NOW() - INTERVAL '3 days'),
          (4, 19404, 19404, 'Dilwale Dulhania Le Jayenge', 'loved', 'cheerful', NOW() - INTERVAL '2 days')
          ON CONFLICT (user_id, tmdb_id) DO NOTHING
        `);
        
        console.log('✅ Test data seeded successfully');
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Test data seeding failed:', error);
      throw error;
    }
  }

  // Get database statistics
  static async getDatabaseStats(): Promise<any> {
    try {
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM mood_selections) as total_mood_selections,
          (SELECT COUNT(*) FROM watched_movies) as total_watched_movies
      `);
      
      client.release();
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }
} 