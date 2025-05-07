const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chuyển đổi pool thành promise để có thể sử dụng async/await
const promisePool = pool.promise();

// Kiểm tra kết nối
promisePool.getConnection()
    .then(connection => {
        console.log('✓ Kết nối database thành công!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối database:', err.message);
    });

module.exports = promisePool;
