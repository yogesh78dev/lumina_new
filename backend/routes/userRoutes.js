
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User routes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Role routes
router.get('/roles', userController.getAllRoles);
router.post('/roles', userController.createRole);
router.put('/roles/:id', userController.updateRole);
router.delete('/roles/:id', userController.deleteRole);

module.exports = router;
