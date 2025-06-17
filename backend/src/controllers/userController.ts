import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { CreateUserRequest, UpdateUserRequest, ApiResponse } from '../types';

export class UserController {
  
  // GET /api/users - Get all users
  static async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const result = await UserModel.getAllUsers();
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/users/:id - Get user by ID
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await UserModel.getUserById(userId);
      
      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getUserById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/users/username/:username - Get user by username
  static async getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
      const username = req.params.username;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await UserModel.getUserByUsername(username);
      
      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // POST /api/users - Create new user
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      
      // Validate required fields
      if (!userData.username || !userData.display_name) {
        res.status(400).json({
          success: false,
          error: 'Username and display_name are required'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await UserModel.createUser(userData);
      
      if (!result.success) {
        const statusCode = result.error?.includes('already exists') ? 409 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'User created successfully'
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in createUser:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // PUT /api/users/:id - Update user
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const updateData: UpdateUserRequest = req.body;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await UserModel.updateUser(userId, updateData);
      
      if (!result.success) {
        let statusCode = 500;
        if (result.error === 'User not found') statusCode = 404;
        else if (result.error === 'No fields to update') statusCode = 400;
        else if (result.error?.includes('already exists')) statusCode = 409;
        
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'User updated successfully'
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in updateUser:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // DELETE /api/users/:id - Delete user
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await UserModel.deleteUser(userId);
      
      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: null,
        message: 'User deleted successfully'
      } as ApiResponse<null>);
      
    } catch (error) {
      console.error('Error in deleteUser:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/users/check/username/:username - Check if username exists
  static async checkUsername(req: Request, res: Response): Promise<void> {
    try {
      const username = req.params.username;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      const exists = await UserModel.usernameExists(username);
      
      res.status(200).json({
        success: true,
        data: { exists }
      } as ApiResponse<{ exists: boolean }>);
      
    } catch (error) {
      console.error('Error in checkUsername:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/users/check/email/:email - Check if email exists
  static async checkEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.params.email;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        } as ApiResponse<null>);
        return;
      }
      
      const exists = await UserModel.emailExists(email);
      
      res.status(200).json({
        success: true,
        data: { exists }
      } as ApiResponse<{ exists: boolean }>);
      
    } catch (error) {
      console.error('Error in checkEmail:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
} 