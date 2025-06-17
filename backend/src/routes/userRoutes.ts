import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

// User CRUD routes
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.get('/username/:username', UserController.getUserByUsername);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

// Utility routes
router.get('/check/username/:username', UserController.checkUsername);
router.get('/check/email/:email', UserController.checkEmail);

export default router; 