const express = require('express');
const router = express.Router();
const AdminContactController = require('../controllers/AdminContactController'); // Import AdminContactController
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware to check admin role
router.use(authMiddleware.verifyToken, authMiddleware.isAdmin);

// Lấy danh sách liên hệ
router.get('/contacts', AdminContactController.getAllContacts); // Use controller method

// Lấy chi tiết một liên hệ
router.get('/contacts/:id', AdminContactController.getContactById); // Use controller method

// Cập nhật trạng thái
router.put('/contacts/:id/status', AdminContactController.updateContactStatus); // Use controller method

// Gửi phản hồi cho liên hệ
router.post('/contacts/:id/respond', AdminContactController.respondToContact); // New endpoint for responding

module.exports = router;