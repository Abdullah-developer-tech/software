const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/auth.controller');

// 🔒 Sign In Route
router.post('/login', loginUser);

// 📝 Sign Up Route
router.post('/register', registerUser);

module.exports = router;