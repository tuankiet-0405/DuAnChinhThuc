const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Placeholder for future review controller
const reviewController = {
    getAllReviews: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đánh giá thành công',
            data: []
        });
    },
    getReviewById: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Lấy đánh giá thành công',
            data: {}
        });
    },
    createReview: (req, res) => {
        res.status(201).json({
            success: true,
            message: 'Thêm đánh giá thành công',
            data: {}
        });
    },
    updateReview: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: {}
        });
    },
    deleteReview: (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Xóa đánh giá thành công'
        });
    }
};

// Get all reviews for a car
router.get('/car/:carId', reviewController.getAllReviews);

// Get a specific review by ID
router.get('/:id', reviewController.getReviewById);

// Create a new review (requires authentication)
router.post('/', authMiddleware.verifyToken, reviewController.createReview);

// Update a review (only by the author)
router.put('/:id', authMiddleware.verifyToken, reviewController.updateReview);

// Delete a review (only by the author or admin)
router.delete('/:id', authMiddleware.verifyToken, reviewController.deleteReview);

module.exports = router;