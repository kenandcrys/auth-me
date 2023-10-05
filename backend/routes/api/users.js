const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const validator = require('validator');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

// Validation middleware
const validateSignup = [
  check('email').isEmail().withMessage('Invalid email'),
  check('username').isLength({ min: 4 }).withMessage('Username must have at least 4 characters'),
  check('username').isAlphanumeric().withMessage('Username cannot be an email'),
  check('password').isLength({ min: 6 }).withMessage('Password must have at least 6 characters'),
  (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }
    next();
  },
];

// Get the current user
router.get('/current', restoreUser, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findOne(userId);
    const safeUser = user
      ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username }
      : null;

    res.json({ user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup endpoint
router.post('/', validateSignup, async (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;
  console.log(req.body)


  try {
    // Check if user exists already
    const existingUserEmail = await User.findOne({ where: { email } });
    const existingUserUsername = await User.findOne({ where: { username } });

    if (existingUserEmail) {
      return res.status(500).json({ message: 'User already exists', errors: { email: 'User with that email already exists' } });
    }

    if (existingUserUsername) {
      return res.status(500).json({ message: 'User already exists', errors: { username: 'User with that username already exists' } });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      username,
      hashedPassword,
    });

    // Set cookie for newly registered user to log them in
    const safeUser = { id: newUser.id, email: newUser.email, username: newUser.username };
    await setTokenCookie(res, safeUser);

    // Return user info
    const { id, firstName: fName, lastName: lName, email: eMail, username: uName } = newUser;
    res.status(200).json({ id, firstName: fName, lastName: lName, email: eMail, username: uName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
