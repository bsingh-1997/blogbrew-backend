const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary'); // optional if you want to delete old image
const protect = require('../middleware/authMiddleware')



