
const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');

router.get('/', targetController.getAllTargets);
router.post('/', targetController.createTarget);
router.delete('/:id', targetController.deleteTarget);

module.exports = router;
