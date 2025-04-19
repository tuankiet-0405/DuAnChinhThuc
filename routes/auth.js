const express = require('express');
const router = express.Router();
const db = require('../data/db'); // Đường dẫn đến file db.js
const path = require('path');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                // Trả về file account.html từ thư mục views
                res.sendFile(path.join(__dirname, '../views/account.html'));
            } else {
                res.send('❌ Sai tài khoản hoặc mật khẩu. <br><a href="/auth/login">Thử lại</a>');
            }
        }
    );
});
module.exports = router;
