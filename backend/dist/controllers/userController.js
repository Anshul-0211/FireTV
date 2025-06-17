"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const User_1 = require("../models/User");
class UserController {
    // GET /api/users - Get all users
    static async getAllUsers(_req, res) {
        try {
            const result = await User_1.UserModel.getAllUsers();
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getAllUsers:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/users/:id - Get user by ID
    static async getUserById(req, res) {
        try {
            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await User_1.UserModel.getUserById(userId);
            if (!result.success) {
                const statusCode = result.error === 'User not found' ? 404 : 500;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getUserById:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/users/username/:username - Get user by username
    static async getUserByUsername(req, res) {
        try {
            const username = req.params.username;
            if (!username) {
                res.status(400).json({
                    success: false,
                    error: 'Username is required'
                });
                return;
            }
            const result = await User_1.UserModel.getUserByUsername(username);
            if (!result.success) {
                const statusCode = result.error === 'User not found' ? 404 : 500;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getUserByUsername:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // POST /api/users - Create new user
    static async createUser(req, res) {
        try {
            const userData = req.body;
            // Validate required fields
            if (!userData.username || !userData.display_name) {
                res.status(400).json({
                    success: false,
                    error: 'Username and display_name are required'
                });
                return;
            }
            const result = await User_1.UserModel.createUser(userData);
            if (!result.success) {
                const statusCode = result.error?.includes('already exists') ? 409 : 500;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(201).json({
                success: true,
                data: result.data,
                message: 'User created successfully'
            });
        }
        catch (error) {
            console.error('Error in createUser:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // PUT /api/users/:id - Update user
    static async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await User_1.UserModel.updateUser(userId, updateData);
            if (!result.success) {
                let statusCode = 500;
                if (result.error === 'User not found')
                    statusCode = 404;
                else if (result.error === 'No fields to update')
                    statusCode = 400;
                else if (result.error?.includes('already exists'))
                    statusCode = 409;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data,
                message: 'User updated successfully'
            });
        }
        catch (error) {
            console.error('Error in updateUser:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // DELETE /api/users/:id - Delete user
    static async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await User_1.UserModel.deleteUser(userId);
            if (!result.success) {
                const statusCode = result.error === 'User not found' ? 404 : 500;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: null,
                message: 'User deleted successfully'
            });
        }
        catch (error) {
            console.error('Error in deleteUser:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/users/check/username/:username - Check if username exists
    static async checkUsername(req, res) {
        try {
            const username = req.params.username;
            if (!username) {
                res.status(400).json({
                    success: false,
                    error: 'Username is required'
                });
                return;
            }
            const exists = await User_1.UserModel.usernameExists(username);
            res.status(200).json({
                success: true,
                data: { exists }
            });
        }
        catch (error) {
            console.error('Error in checkUsername:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/users/check/email/:email - Check if email exists
    static async checkEmail(req, res) {
        try {
            const email = req.params.email;
            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
                return;
            }
            const exists = await User_1.UserModel.emailExists(email);
            res.status(200).json({
                success: true,
                data: { exists }
            });
        }
        catch (error) {
            console.error('Error in checkEmail:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map