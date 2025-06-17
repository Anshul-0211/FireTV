"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// User CRUD routes
router.get('/', userController_1.UserController.getAllUsers);
router.get('/:id', userController_1.UserController.getUserById);
router.get('/username/:username', userController_1.UserController.getUserByUsername);
router.post('/', userController_1.UserController.createUser);
router.put('/:id', userController_1.UserController.updateUser);
router.delete('/:id', userController_1.UserController.deleteUser);
// Utility routes
router.get('/check/username/:username', userController_1.UserController.checkUsername);
router.get('/check/email/:email', userController_1.UserController.checkEmail);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map