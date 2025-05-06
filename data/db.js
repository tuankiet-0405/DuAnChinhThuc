const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'khanh472004',
    database: 'ql_web',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        
     
        connection.release();
    } catch (err) {
        console.error('Lỗi kết nối MySQL:', err);
        process.exit(1);
    }
}

testConnection();

module.exports = pool;
