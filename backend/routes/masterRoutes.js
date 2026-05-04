
const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

// Pattern for generic master data CRUD
router.post('/:type', masterController.createItem);
router.put('/:type/:id', masterController.updateItem);
router.delete('/:type/:id', masterController.deleteItem);

module.exports = router;
