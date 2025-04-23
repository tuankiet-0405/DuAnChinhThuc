const express = require('express');
const router = express.Router();
const db = require('../data/db');
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

// Rate limiting setup
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
});

// Session setup
router.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        // Query user
        db.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            async (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Lỗi hệ thống, vui lòng thử lại sau'
                    });
                }

                if (results.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: 'Tài khoản hoặc mật khẩu không chính xác'
                    });
                }

                const user = results[0];
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Tài khoản hoặc mật khẩu không chính xác'
                    });
                }

                // Set session
                req.session.userId = user.id;
                req.session.username = user.username;

                // Send success response
                res.json({
                    success: true,
                    message: 'Đăng nhập thành công',
                    redirectUrl: '/account'
                });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
});

// Facebook Authentication route
router.post('/facebook/callback', async (req, res) => {
    try {
        const { name, email, facebookId, picture } = req.body;
        
        // Kiểm tra xem user đã tồn tại chưa
        let user = await User.findOne({ email: email });
        
        if (!user) {
            // Tạo user mới nếu chưa tồn tại
            user = new User({
                name: name,
                email: email,
                facebookId: facebookId,
                profilePicture: picture,
                authType: 'facebook'
            });
            await user.save();
        }

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Facebook authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Đăng nhập thất bại'
        });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi đăng xuất'
            });
        }
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    });
});

module.exports = router;
