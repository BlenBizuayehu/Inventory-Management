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
  uploadProfileImage,
  updateProfile,
  getMe
} = require('../controllers/UserController');
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const {  checkPermission } = require('../middleware/permissions');
const { upload, handleUploadErrors } = require('../config/multer');
// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


// Public routes
router.post('/login', loginUser);

// Protected routes
router.use(protect);

router.route('/me').get(getMe);

// Current user routes
router.get('/me', getCurrentUser);
router.put('/me', updateProfile);
router.post('/me/upload-image', upload.single('image'), uploadProfileImage); 
router.put('/me/change-password', changePassword); 
router.post(
  '/upload-image',
  upload.single('image'), // 'image' should match the field name in your form
  handleUploadErrors,
  uploadProfileImage
);
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