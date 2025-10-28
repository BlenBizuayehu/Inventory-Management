const express = require('express');
const {
  assignUserToShop,
  getUserAssignments,
  getShopAssignments,
  updateAssignment,
  removeAssignment
} = require('../controllers/userShopController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.use(authorize('admin', 'owner'));

// Assign user to shop
router.post('/', assignUserToShop);

// Get all assignments for a user
router.get('/user/:userId', getUserAssignments);

// Get all assignments for a shop
router.get('/shop/:shopId', getShopAssignments);

// Update assignment
router.put('/:assignmentId', updateAssignment);

// Remove assignment
router.delete('/:assignmentId', removeAssignment);

module.exports = router;