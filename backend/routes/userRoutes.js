const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  resetUserPassword
} = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getUserProfile);
router.get('/all', getAllUsers);
router.put('/update/:id', updateUser);
router.put('/reset-password/:id', resetUserPassword);
router.delete('/delete/:id', deleteUser);

module.exports = router; 