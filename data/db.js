const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'khanh472004',
  database: 'dacs_quanlyxe'
});

connection.connect(err => {
  if (err) {
    console.error('Lỗi kết nối: ' + err.stack);
    return;
  }
  console.log('✅ Kết nối MySQL thành công!');
});

module.exports = connection;
