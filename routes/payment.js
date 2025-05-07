const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Placeholder for future payment controller
const paymentController = {
    getAllPayments: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Lấy danh sách thanh toán thành công',
            data: []
        });
    },
    getPaymentById: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Lấy thông tin thanh toán thành công',
            data: {}
        });
    },
    createPayment: (req, res) => {
        res.status(201).json({
            success: true,
            message: 'Tạo thanh toán thành công',
            data: {}
        });
    },
    updatePayment: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Cập nhật thanh toán thành công',
            data: {}
        });
    }
};

// Get all payments (admin only)
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, paymentController.getAllPayments);

// Get a specific payment by ID
router.get('/:id', authMiddleware.verifyToken, paymentController.getPaymentById);

// Create a new payment
router.post('/', authMiddleware.verifyToken, paymentController.createPayment);

// Update a payment (admin only)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, paymentController.updatePayment);

module.exports = router;