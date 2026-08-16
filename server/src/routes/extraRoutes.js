const express = require('express');
const router = express.Router();
const { subscribeNewsletter, submitContact } = require('../controllers/extraController');

router.post('/newsletter/subscribe', subscribeNewsletter);
router.post('/contact', submitContact);

module.exports = router;

