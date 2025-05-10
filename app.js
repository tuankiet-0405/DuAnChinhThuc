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
const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/payment');
const reviewRoutes = require('./routes/review');
const notificationRoutes = require('./routes/notification');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Frontend routes
app.get('/', (req, res) => {
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
const PORT = process.env.PORT || 3001;

// Function to try different ports if the preferred one is in use
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server đang chạy trên http://localhost:${port}/public/index.html`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} đã được sử dụng, thử port khác...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
};

startServer(PORT);
