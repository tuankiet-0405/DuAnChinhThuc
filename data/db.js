const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '113311',
  database: 'demo_login'
});

connection.connect(err => {
  if (err) {
    console.error('Lỗi kết nối: ' + err.stack);
    return;
  }
  console.log('✅ Kết nối MySQL thành công!');
});

module.exports = connection;
