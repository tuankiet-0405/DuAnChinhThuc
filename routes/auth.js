const express = require('express');
const router = express.Router();
const db = require('../data/db');
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const jwt = require('jsonwebtoken');

// Middleware để kiểm tra JWT token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

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

// Đăng ký tài khoản
router.post('/register', async (req, res) => {
    try {
        const { ho_ten, email, so_dien_thoai, mat_khau, gioi_tinh } = req.body;
        
        console.log('Received registration data:', {
            ho_ten,
            email,
            so_dien_thoai,
            gioi_tinh,
            hasPassword: !!mat_khau
        });

        // Kiểm tra email đã tồn tại
        const [existingUsers] = await db.query(
            'SELECT * FROM nguoi_dung WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            console.log('Email already exists:', email);
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        
        // Log the SQL query we're about to execute
        const insertQuery = 'INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau, gioi_tinh) VALUES (?, ?, ?, ?, ?)';
        console.log('Executing query:', insertQuery);
        console.log('With values:', [ho_ten, email, so_dien_thoai, '[HASHED]', gioi_tinh]);

        // Thêm người dùng mới
        const [result] = await db.query(
            insertQuery,
            [ho_ten, email, so_dien_thoai, hashedPassword, gioi_tinh]
        );

        if (!result || !result.insertId) {
            console.error('Insert failed - no insertId returned');
            throw new Error('Không thể thêm người dùng mới');
        }

        console.log('Successfully inserted user with ID:', result.insertId);

        // Tạo JWT token
        const token = jwt.sign(
            { id: result.insertId, email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server: ' + error.message 
        });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username: email, password } = req.body;
        
        // Tìm user theo email
        const [users] = await db.query(
            'SELECT * FROM nguoi_dung WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const user = users[0];

        // Kiểm tra mật khẩu
        const validPassword = await bcrypt.compare(password, user.mat_khau);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'DACS2_secure_jwt_secret_key_2024',
            { expiresIn: '24h' }
        );

        // Set cookie với các options phù hợp
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                email: user.email,
                ho_ten: user.ho_ten,
                anh_dai_dien: user.anh_dai_dien || '/public/image/default-avatar.png'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

// Admin login route
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Tìm user theo email và phải có quyền admin
        const [users] = await db.query(
            'SELECT * FROM nguoi_dung WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        const user = users[0];

        // Kiểm tra có phải admin không
        if (user.loai_tai_khoan !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không có quyền admin'
            });
        }

        // So sánh mật khẩu trực tiếp vì mật khẩu chưa được mã hóa
        if (password !== user.mat_khau) {
            return res.status(401).json({
                success: false, 
                message: 'Mật khẩu không đúng'
            });
        }

        // Tạo JWT token cho admin
        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'admin' },
            process.env.JWT_SECRET || 'DACS2_secure_jwt_secret_key_2024',
            { expiresIn: '24h' }
        );

        // Set cookie với token
        res.cookie('admin_jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                email: user.email,
                ho_ten: user.ho_ten
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

// Đăng xuất
router.post('/logout', (req, res) => {
    // Clear JWT cookie
    res.clearCookie('jwt');
    
    // Destroy session if exists
    if (req.session) {
        req.session.destroy();
    }
    
    res.json({ 
        success: true,
        message: 'Đăng xuất thành công',
        redirectUrl: '/views/AdminLogin.html'
    });
});

// Lấy thông tin user hiện tại
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, ho_ten, email, so_dien_thoai, gioi_tinh, ngay_sinh, anh_dai_dien FROM nguoi_dung WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({ message: 'Lỗi server' });
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

module.exports = router;
