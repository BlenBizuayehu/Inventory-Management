const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/SettingsController');


// Settings routes
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;