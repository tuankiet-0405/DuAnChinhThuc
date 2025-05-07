const jwt = require('jsonwebtoken');
require('dotenv').config();

// Thiết lập JWT_SECRET fallback để tránh lỗi khi không tìm thấy trong môi trường
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development';

const authMiddleware = {
    // Xác minh token
    verifyToken: (req, res, next) => {
        try {
            let token;
            
            // Ghi log để debug
            console.log('AUTH CHECK - Headers:', JSON.stringify({
                authorization: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'Not found',
                cookie: req.headers.cookie || 'Not found'
            }));
            
            // Thử lấy token từ header Authorization trước (ưu tiên cao hơn)
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
                console.log('Token từ Authorization header được tìm thấy');
            }
            // Sau đó thử lấy từ cookie nếu không có trong header
            else if (req.cookies && req.cookies.token) {
                token = req.cookies.token;
                console.log('Token từ cookie token được tìm thấy');
            }
            // Kiểm tra cookie jwt làm phương án dự phòng
            else if (req.cookies && req.cookies.jwt) {
                token = req.cookies.jwt;
                console.log('Token từ cookie jwt được tìm thấy');
            }
            
            // Kiểm tra nếu không có token
            if (!token) {
                console.log('Không tìm thấy token trong request');
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy token xác thực'
                });
            }
            
            // Xác minh token
            console.log('Bắt đầu xác minh token');
            
            try {
                // Thử decode token để debug
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const decoded = JSON.parse(atob(base64));
                console.log('Token payload (decoded):', JSON.stringify(decoded));
            } catch (e) {
                console.log('Không thể decode token để debug');
            }
            
            // Xác minh token với secret key
            const verified = jwt.verify(token, JWT_SECRET);
            console.log('Token đã được xác minh thành công, thông tin:', JSON.stringify(verified));
            
            // Cấu trúc req.user chuẩn hóa
            req.user = {
                id: verified.id || verified.userId,
                email: verified.email,
                loai_tai_khoan: verified.loai_tai_khoan || verified.loaiTaiKhoan
            };
            
            console.log('Người dùng đã được xác thực:', JSON.stringify(req.user));
            
            // Tiếp tục xử lý request
            next();
        } catch (error) {
            console.error('Chi tiết lỗi xác thực token:', error);
            
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
        // verifyToken đã được gọi trước đó và đã set req.user
        if (req.user && (req.user.loai_tai_khoan === 'admin' || req.user.loaiTaiKhoan === 'admin')) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập chức năng này'
            });
        }
    }
};

module.exports = authMiddleware;