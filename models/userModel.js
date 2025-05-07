const db = require('../data/db');
const bcrypt = require('bcrypt');

const User = {
    // Tạo người dùng mới
    create: async (userData) => {
        try {
            // Mã hóa mật khẩu trước khi lưu vào database
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.mat_khau, salt);

            // Thực hiện truy vấn để thêm người dùng vào database
            const [result] = await db.execute(
                `INSERT INTO nguoi_dung (
                    ho_ten, 
                    email, 
                    mat_khau, 
                    so_dien_thoai, 
                    gioi_tinh, 
                    loai_tai_khoan,
                    trang_thai
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userData.ho_ten,
                    userData.email,
                    hashedPassword,
                    userData.so_dien_thoai,
                    userData.gioi_tinh,
                    'user', // Mặc định là 'user'
                    'active' // Mặc định là 'active'
                ]
            );

            // Trả về ID của người dùng mới được tạo
            return { id: result.insertId, ...userData, mat_khau: undefined };
        } catch (error) {
            console.error('Lỗi khi tạo người dùng:', error);
            throw error;
        }
    },

    // Tìm người dùng theo email
    findByEmail: async (email) => {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM nguoi_dung WHERE email = ?',
                [email]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Lỗi khi tìm người dùng theo email:', error);
            throw error;
        }
    },

    // Kiểm tra đăng nhập
    authenticate: async (email, password) => {
        try {
            const user = await User.findByEmail(email);
            if (!user) return null;

            const isMatch = await bcrypt.compare(password, user.mat_khau);
            if (!isMatch) return null;

            // Không trả về mật khẩu
            const { mat_khau, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            console.error('Lỗi khi xác thực người dùng:', error);
            throw error;
        }
    },
    
    // Hàm mã hóa mật khẩu để sử dụng cho reset password
    hashPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(10);
            return bcrypt.hash(password, salt);
        } catch (error) {
            console.error('Lỗi khi mã hóa mật khẩu:', error);
            throw error;
        }
    }
};

module.exports = User;