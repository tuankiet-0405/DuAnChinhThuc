const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files - ensure public directory is served first
app.use(express.static(path.join(__dirname, 'public')));

// Authentication routes
app.use('/auth', authRoutes);

// Main routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Authentication middleware
const checkAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token && !req.path.startsWith('/login')) {
        return res.redirect('/login');
    }
    next();
};

// Apply authentication check to protected routes
app.use('/views', checkAuth);

// Serve files from views directory
app.use('/views', express.static(path.join(__dirname, 'views')));

// Fallback route handler
app.use((req, res, next) => {
    // Try to serve from views directory
    const viewPath = path.join(__dirname, 'views', req.path);
    res.sendFile(viewPath, (err) => {
        if (err) {
            // If not found in views, try public directory
            const publicPath = path.join(__dirname, 'public', req.path);
            res.sendFile(publicPath, (err) => {
                if (err) {
                    // If not found in either directory, return 404
                    res.status(404).json({ message: 'Không tìm thấy trang' });
                }
            });
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
    console.log(`Truy cập: http://localhost:${PORT}`);
});