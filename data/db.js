const mysql = require('mysql2/promise');

// Tạo pool connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Thay bằng username của bạn
    password: '', // Thay bằng password của bạn
    database: 'car_rental_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
