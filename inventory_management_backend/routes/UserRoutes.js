const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  changePassword,
  uploadProfileImage
} = require('../controllers/UserController');
const { protect, restrictTo } = require('../middleware/auth');
const {  checkPermission } = require('../middleware/permissions');
const upload = require('../middleware/upload');

// Public routes
router.post('/login', loginUser);

// Protected routes
router.use(protect);

// Current user routes
router.get('/me', getCurrentUser);
router.put('/change-password', changePassword);
router.post('/upload-image', upload.single('image'), uploadProfileImage);

// Admin/Owner routes
router.use(checkPermission('userManagement.view'));
// router.use(restrictTo('owner', 'admin'));

router.post('/register', 
  checkPermission('userManagement.create'),
  upload.single('image'), 
  registerUser
);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', 
  checkPermission('userManagement.editOthers'),
  upload.none(), // Add this if you're using multer
  updateUser
);
router.delete('/:id', 
  checkPermission('userManagement.deleteOthers'), 
  deleteUser
);


module.exports = router;