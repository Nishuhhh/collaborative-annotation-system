const express = require('express');
const router = express.Router();
const {registor,login} =  require("../controllers/userController")

// POST /api/users/register
router.post('/register', registor);

// POST /api/users/login
router.post('/login', login);

module.exports = router;