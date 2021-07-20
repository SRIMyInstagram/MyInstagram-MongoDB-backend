// requirements
const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { check, validationResult } = require('express-validator');



module.exports = router;