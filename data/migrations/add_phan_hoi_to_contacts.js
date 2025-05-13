// Migration để thêm cột phan_hoi vào bảng yeu_cau_lien_he
const db = require('../db');
console.log('Script started');

// Test database connection first
async function testConnection() {
    try {
        console.log('Testing database connection...');
        await db.execute('SELECT 1');
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

async function addPhanHoiColumn() {
    const alterTableSQL = `
        ALTER TABLE yeu_cau_lien_he
        ADD COLUMN phan_hoi TEXT NULL AFTER noi_dung;
    `;

    try {
        console.log('Đang thực hiện migration...');
        console.log('SQL:', alterTableSQL);
        
        await db.execute(alterTableSQL);
        console.log('Đã thêm cột phan_hoi vào bảng yeu_cau_lien_he thành công');
    } catch (error) {
        console.error('Lỗi khi thêm cột phan_hoi:', error);
        // Check if error is about column already existing
        if (error.errno === 1060) { // ER_DUP_FIELDNAME
            console.log('Cột phan_hoi đã tồn tại trong bảng, không cần thêm mới');
            return; // Don't throw error, just return
        }
        throw error;
    }
}

// Chạy migration
(async () => {
    console.log('Checking connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
        try {
            await addPhanHoiColumn();
            console.log('Migration hoàn tất');
        } catch (error) {
            console.error('Migration thất bại:', error);
        }
    } else {
        console.error('Không thể kết nối đến database');
    }
    
    process.exit(0);
})();
