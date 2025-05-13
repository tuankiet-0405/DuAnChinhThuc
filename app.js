const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/car');
const paymentRoutes = require('./routes/payment');
const reviewRoutes = require('./routes/review');
const notificationRoutes = require('./routes/notification');
const adminBookingRoutes = require('./routes/bookingRoutes');
const adminCarRoutes = require('./routes/adminCarsRoutes_new');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminContactRoutes = require('./routes/adminContactRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Configure file upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached (max 5MB)'
}));

// Static files configuration
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Debug middleware cho API routes để xem request headers
app.use('/api/*', (req, res, next) => {
    console.log('============= API REQUEST RECEIVED ===============');
    console.log('URL:', req.originalUrl);
    console.log('Method:', req.method);
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('User Agent:', req.headers['user-agent']);
    if (req.headers.authorization) {
        console.log('Auth header prefix:', req.headers.authorization.substring(0, 20) + '...');
    }
    console.log('==================================================');
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminBookingRoutes);
app.use('/api/admin', adminCarRoutes);
app.use('/api/admin', userRoutes);
app.use('/api/admin', transactionRoutes);
app.use('/api/admin', voucherRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/contact', adminContactRoutes);

// Frontend routes
app.get('/', (req, res) => {
    res.redirect('/public/index.html');
});

// Add route to serve public/index.html directly
app.get('/public/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle HTML page routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'account.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/admin-auth-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'AdminAuthTest.html'));
});

// Serve other HTML pages from views directory
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.endsWith('.html')) {
        res.sendFile(path.join(__dirname, 'views', page));
    } else {
        next();
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Đã xảy ra lỗi server' 
    });
});


// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên http://localhost:${PORT}`);
});
