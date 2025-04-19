const express = require('express');
const app = express();
const path = require('path');
const authRoutes = require('./routes/auth'); // Đường dẫn đúng tới auth.js
    
app.use(express.urlencoded({ extended: true })); // Để đọc form POST
app.use(express.static(path.join(__dirname, 'public'))); // Để load file tĩnh
app.use('/auth', authRoutes); // ⚠️ ĐĂNG KÝ ROUTE auth

app.listen(3000, () => {
  console.log('✅ Server chạy tại http://localhost:3000');
});