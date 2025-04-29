const router = require('express').Router();

const roleController = require('../controllers/role.controller');
const userController = require('../controllers/user.controllers');

// Create new role
router.post('/role/create', roleController.createRole);

// Get Single Role Details
router.get('/roles/:id', roleController.getRoleDetails);

// Delete Role
router.delete('/roles/:id', roleController.deleteRole);

// Create a new User
router.post('/create-user', userController.createUser);

// Delete User
router.delete('/delete-user', userController.deleteUser);

// Update User
router.post('/update-user', userController.editUser);

// Admin Dashboard details
router.get('/dashboard', userController.dashboardDetails);

// Get Single Users
router.get('/users/:id', userController.getUserDetails);

// Get all Users
router.get('/usersAll', userController.getAllUsers);

// Get all Roles
router.get('/rolesAll', userController.getAllRoles);

// Login User
router.post('/login', userController.login);

// Change Password of admin
router.post('/change-password', userController.resetAdminPassword);

module.exports = router;