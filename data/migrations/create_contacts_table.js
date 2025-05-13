const db = require('../db');

async function createContactsTable() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS yeu_cau_lien_he (
            ma INT AUTO_INCREMENT PRIMARY KEY,                        
            ten VARCHAR(100) NOT NULL,                            
            email VARCHAR(100) NOT NULL,                             
            so_dien_thoai VARCHAR(20) NOT NULL,                 
            tieu_de VARCHAR(200) NOT NULL,                           
            noi_dung TEXT NOT NULL,                                   
            da_xu_ly BOOLEAN DEFAULT FALSE,                           
            xu_ly_boi VARCHAR(50) NULL,                               
            thoi_gian_xu_ly DATETIME NULL,                          
            tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             
            cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP                   
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await db.execute(createTableSQL);
        console.log('Bảng yeu_cau_lien_he đã được tạo thành công');
    } catch (error) {
        console.error('Lỗi khi tạo bảng yeu_cau_lien_he:', error);
        throw error;
    }
}

// Chạy migration
createContactsTable()
    .then(() => {
        console.log('Migration hoàn tất');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration thất bại:', error);
        process.exit(1);
    });
