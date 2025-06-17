import { pool } from '../config/database';
import { User, CreateUserRequest, UpdateUserRequest, QueryResult } from '../types';

export class UserModel {
  
  // Get all users
  static async getAllUsers(): Promise<QueryResult<User[]>> {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT id, username, email, display_name, avatar_url, preferences, created_at, updated_at 
        FROM users 
        ORDER BY created_at ASC
      `);
      client.release();
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<QueryResult<User>> {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT id, username, email, display_name, avatar_url, preferences, created_at, updated_at 
        FROM users 
        WHERE id = $1
      `, [id]);
      client.release();
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<QueryResult<User>> {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT id, username, email, display_name, avatar_url, preferences, created_at, updated_at 
        FROM users 
        WHERE username = $1
      `, [username]);
      client.release();
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Create new user
  static async createUser(userData: CreateUserRequest): Promise<QueryResult<User>> {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        INSERT INTO users (username, email, display_name, avatar_url, preferences)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, display_name, avatar_url, preferences, created_at, updated_at
      `, [
        userData.username,
        userData.email || null,
        userData.display_name,
        userData.avatar_url || null,
        JSON.stringify(userData.preferences || {})
      ]);
      client.release();
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_username_key') {
          return {
            success: false,
            error: 'Username already exists'
          };
        }
        if (error.constraint === 'users_email_key') {
          return {
            success: false,
            error: 'Email already exists'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update user
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<QueryResult<User>> {
    try {
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      if (userData.display_name !== undefined) {
        updateFields.push(`display_name = $${paramCounter++}`);
        values.push(userData.display_name);
      }
      
      if (userData.email !== undefined) {
        updateFields.push(`email = $${paramCounter++}`);
        values.push(userData.email);
      }
      
      if (userData.avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${paramCounter++}`);
        values.push(userData.avatar_url);
      }
      
      if (userData.preferences !== undefined) {
        updateFields.push(`preferences = $${paramCounter++}`);
        values.push(JSON.stringify(userData.preferences));
      }
      
      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'No fields to update'
        };
      }
      
      values.push(id); // Add ID as last parameter
      
      const client = await pool.connect();
      const result = await client.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, username, email, display_name, avatar_url, preferences, created_at, updated_at
      `, values);
      client.release();
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        return {
          success: false,
          error: 'Email already exists'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete user
  static async deleteUser(id: number): Promise<QueryResult<boolean>> {
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      client.release();
      
      if (result.rowCount === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);
      client.release();
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking username existence:', error);
      return false;
    }
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
      client.release();
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }
} 