const express = require('express');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

// Validation middleware for login
const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Please provide a valid email or username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a password.'),
  handleValidationErrors
];

// Login route
router.post('/', async (req, res) => {
  const { credential, password } = req.body;
console.log(req.body)
  if (!credential || !password) {
    return res.status(404).json({
      message: 'Bad Request',
      errors: {
        credential: 'Email or username is required',
        password: 'Password is required'
      }
    });
  }

  const user = await User.scope('withFullName').findOne({
    where: { email: credential },
    attributes: ['id', 'firstName', 'lastName', 'email', 'hashedPassword'],
  });

  if (!user || !(await bcrypt.compare(password, user.hashedPassword.toString()))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = await setTokenCookie(res, user);

  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
  };

  res.json({ user: safeUser, token });
});

// Logout route
router.delete('/', (_req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logout successful' });
});

// Restore session user route
router.get('/', (req, res) => {
  const { user } = req;

  if (user) {
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    return res.json({ user: safeUser });
  } else {
    return res.json({ user: null });
  }
});

module.exports = router;
