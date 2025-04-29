const router = require('express').Router();

const userController = require('../controllers/user.controllers');

router.post('/user/login', userController.login);

module.exports = router;