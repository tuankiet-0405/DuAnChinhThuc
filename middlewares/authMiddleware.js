const jwt = require('jsonwebtoken');
require('dotenv').config();

// Thiết lập JWT_SECRET fallback để tránh lỗi khi không tìm thấy trong môi trường
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';

// Biến kiểm soát việc ghi log
const ENABLE_DEBUG_LOGS = false; // Đặt thành false để tắt logs

// Hàm log có điều kiện
const debugLog = (...args) => {
    if (ENABLE_DEBUG_LOGS) {
        console.log(...args);
    }
};

const authMiddleware = {
    // Xác minh token
    verifyToken: (req, res, next) => {
        console.log('=====================================================');
        console.log('Đang xác minh token cho:', req.originalUrl);
        try {
            let token;
            
            // Thử lấy token từ header Authorization trước (ưu tiên cao hơn)
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
                console.log('✅ Token từ Authorization header được tìm thấy');
                console.log('Token preview:', token.substring(0, 20) + '...');
            }
            // Sau đó thử lấy từ cookie nếu không có trong header
            else if (req.cookies && req.cookies.token) {
                token = req.cookies.token;
                console.log('✅ Token từ cookie token được tìm thấy');
            }
            // Kiểm tra cookie jwt làm phương án dự phòng
            else if (req.cookies && req.cookies.jwt) {
                token = req.cookies.jwt;
                console.log('✅ Token từ cookie jwt được tìm thấy');
            }
            
            // Kiểm tra nếu không có token
            if (!token) {
                console.log('❌ Không tìm thấy token trong request');
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy token xác thực'
                });
            }
            
            // Xác minh token với secret key
            const verified = jwt.verify(token, JWT_SECRET);
            console.log('✅ Token được xác thực thành công');
            console.log('Token payload:', JSON.stringify(verified));
            
            let determinedRole;
            if (verified.loai_tai_khoan === 'admin' || verified.loaiTaiKhoan === 'admin' || verified.isAdmin === true) {
                determinedRole = 'admin';
                console.log('✅ Vai trò admin được xác định');
            } else {
                // If not admin, use the provided role or default to null/undefined
                determinedRole = verified.loai_tai_khoan || verified.loaiTaiKhoan;
                console.log('ℹ️ Vai trò không phải admin:', determinedRole);
            }
            
            req.user = {
                id: verified.id || verified.userId,
                email: verified.email,
                loai_tai_khoan: determinedRole
            };
            console.log('Final req.user:', JSON.stringify(req.user));
            console.log('=====================================================');
            
            // Tiếp tục xử lý request
            next();
        } catch (error) {
            console.error('Lỗi xác thực:', error.name);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token đã hết hạn, vui lòng đăng nhập lại'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ: ' + error.message
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Lỗi xác thực: ' + error.message
            });
        }
    },

    // Kiểm tra vai trò admin
    isAdmin: (req, res, next) => {
        console.log('=====================================================');
        console.log('Kiểm tra quyền admin:');
        console.log('req.user:', JSON.stringify(req.user));
        console.log('loai_tai_khoan:', req.user?.loai_tai_khoan);
        console.log('=====================================================');
        
        if (req.user && req.user.loai_tai_khoan === 'admin') {
            console.log('✅ Người dùng có quyền admin');
            next();
        } else {
            console.log('❌ Người dùng KHÔNG có quyền admin');
            console.log('isAdmin check failed. req.user:', JSON.stringify(req.user)); // Added for debugging
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập chức năng này'
            });
        }
    },

    // Kiểm tra quyền chỉnh sửa thông tin người dùng
    canEditUserInfo: async (req, res, next) => {
        try {
            const currentUserId = req.user.id;
            const targetUserId = req.params.id;
            const isAdmin = req.user.loai_tai_khoan === 'admin' || req.user.loaiTaiKhoan === 'admin';
            
            // Admin luôn có quyền chỉnh sửa
            if (isAdmin) {
                return next();
            }
            
            // Người dùng chỉ có thể sửa thông tin của chính mình
            if (currentUserId.toString() === targetUserId.toString()) {
                return next();
            }
            
            // Không có quyền sửa
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa thông tin của người dùng này'
            });
        } catch (error) {
            console.error('Lỗi khi kiểm tra quyền:', error);
            return res.status(500).json({
                success: false, 
                message: 'Đã xảy ra lỗi khi kiểm tra quyền',
                error: error.message
            });
        }
    },

    // Xác minh quyền admin
    verifyAdmin: async (req, res, next) => {
        try {
            // Đầu tiên verify token
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            } else if (req.cookies && req.cookies.token) {
                token = req.cookies.token;
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy token xác thực'
                });
            }

            // Giải mã token và kiểm tra quyền admin
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập tính năng này'
                });
            }

            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
    }
};

module.exports = authMiddleware;