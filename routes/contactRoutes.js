const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/ContactController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route tạo yêu cầu liên hệ mới (public)
router.post('/', ContactController.createContact);

// Routes cho admin (yêu cầu xác thực)
router.get('/admin/contacts', authMiddleware.verifyAdmin, ContactController.getAllContacts);
router.put('/admin/contacts/:id', authMiddleware.verifyAdmin, ContactController.updateContactStatus);

module.exports = router;
