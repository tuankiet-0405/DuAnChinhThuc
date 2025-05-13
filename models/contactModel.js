const db = require('../data/db');

const Contact = {
    create: async (contact) => {
        const query = `
            INSERT INTO yeu_cau_lien_he (
                ten, email, so_dien_thoai, tieu_de, noi_dung
            ) VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            contact.name,
            contact.email,
            contact.phone,
            contact.subject,
            contact.message
        ]);
        return result.insertId;
    },    findAll: async () => {
        try {
            // Try first with phan_hoi column
            const query = `
                SELECT 
                    ma,
                    ten,
                    email,
                    so_dien_thoai,
                    tieu_de,
                    noi_dung,
                    phan_hoi,
                    da_xu_ly,
                    xu_ly_boi,
                    thoi_gian_xu_ly,
                    tao_luc
                FROM yeu_cau_lien_he
                ORDER BY tao_luc DESC
            `;
            const [rows] = await db.execute(query);
            return rows.map(row => ({
                id: row.ma,
                ten: row.ten,
                email: row.email,
                so_dien_thoai: row.so_dien_thoai,
                tieu_de: row.tieu_de,
                noi_dung: row.noi_dung,
                phan_hoi: row.phan_hoi,
                status: row.da_xu_ly ? 'completed' : 'new',
                xu_ly_boi: row.xu_ly_boi,
                thoi_gian_xu_ly: row.thoi_gian_xu_ly,
                tao_luc: row.tao_luc
            }));
        } catch (error) {
            // If column doesn't exist, fall back to query without phan_hoi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Cột phan_hoi chưa tồn tại, sử dụng truy vấn thay thế');
                const fallbackQuery = `
                    SELECT 
                        ma,
                        ten,
                        email,
                        so_dien_thoai,
                        tieu_de,
                        noi_dung,
                        da_xu_ly,
                        xu_ly_boi,
                        thoi_gian_xu_ly,
                        tao_luc
                    FROM yeu_cau_lien_he
                    ORDER BY tao_luc DESC
                `;
                const [rows] = await db.execute(fallbackQuery);
                return rows.map(row => ({
                    id: row.ma,
                    ten: row.ten,
                    email: row.email,
                    so_dien_thoai: row.so_dien_thoai,
                    tieu_de: row.tieu_de,
                    noi_dung: row.noi_dung,
                    phan_hoi: '', // Provide empty default
                    status: row.da_xu_ly ? 'completed' : 'new',
                    xu_ly_boi: row.xu_ly_boi,
                    thoi_gian_xu_ly: row.thoi_gian_xu_ly,
                    tao_luc: row.tao_luc
                }));
            }
            // If it's another error, rethrow it
            throw error;
        }
    },    findById: async (id) => {
        try {
            // Try first with phan_hoi column
            const query = `
                SELECT 
                    ma,
                    ten,
                    email,
                    so_dien_thoai,
                    tieu_de,
                    noi_dung,
                    phan_hoi,
                    da_xu_ly,
                    xu_ly_boi,
                    thoi_gian_xu_ly,
                    tao_luc
                FROM yeu_cau_lien_he
                WHERE ma = ?
            `;
            const [rows] = await db.execute(query, [id]);
            if (rows[0]) {
                return {
                    id: rows[0].ma,
                    ten: rows[0].ten,
                    email: rows[0].email,
                    so_dien_thoai: rows[0].so_dien_thoai,
                    tieu_de: rows[0].tieu_de,
                    noi_dung: rows[0].noi_dung,
                    phan_hoi: rows[0].phan_hoi,
                    status: rows[0].da_xu_ly ? 'completed' : 'new',
                    xu_ly_boi: rows[0].xu_ly_boi,
                    thoi_gian_xu_ly: rows[0].thoi_gian_xu_ly,
                    tao_luc: rows[0].tao_luc
                };
            }
            return null;
        } catch (error) {
            // If column doesn't exist, fall back to query without phan_hoi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Cột phan_hoi chưa tồn tại, sử dụng truy vấn thay thế');
                const fallbackQuery = `
                    SELECT 
                        ma,
                        ten,
                        email,
                        so_dien_thoai,
                        tieu_de,
                        noi_dung,
                        da_xu_ly,
                        xu_ly_boi,
                        thoi_gian_xu_ly,
                        tao_luc
                    FROM yeu_cau_lien_he
                    WHERE ma = ?
                `;
                const [rows] = await db.execute(fallbackQuery, [id]);
                if (rows[0]) {
                    return {
                        id: rows[0].ma,
                        ten: rows[0].ten,
                        email: rows[0].email,
                        so_dien_thoai: rows[0].so_dien_thoai,
                        tieu_de: rows[0].tieu_de,
                        noi_dung: rows[0].noi_dung,
                        phan_hoi: '', // Provide empty default
                        status: rows[0].da_xu_ly ? 'completed' : 'new',
                        xu_ly_boi: rows[0].xu_ly_boi,
                        thoi_gian_xu_ly: rows[0].thoi_gian_xu_ly,
                        tao_luc: rows[0].tao_luc
                    };
                }
                return null;
            }
            // If it's another error, rethrow it
            throw error;
        }
    },    updateStatus: async (id, status) => {
        const query = `
            UPDATE yeu_cau_lien_he 
            SET da_xu_ly = ?,
                thoi_gian_xu_ly = CURRENT_TIMESTAMP
            WHERE ma = ?
        `;
        const [result] = await db.execute(query, [status === 'completed', id]);
        return result.affectedRows > 0;
    },    respond: async (id, responseData) => {
        try {
            // First try with phan_hoi column
            const query = `
                UPDATE yeu_cau_lien_he 
                SET 
                    da_xu_ly = true,
                    phan_hoi = ?,
                    xu_ly_boi = ?,
                    thoi_gian_xu_ly = ?
                WHERE ma = ?
            `;
            const [result] = await db.execute(query, [
                responseData.phan_hoi,
                responseData.xu_ly_boi,
                responseData.thoi_gian_xu_ly,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            // If phan_hoi column doesn't exist, try to add it first
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Đang thêm cột phan_hoi...');
                try {
                    // Try to add the column
                    await db.execute(`
                        ALTER TABLE yeu_cau_lien_he
                        ADD COLUMN phan_hoi TEXT NULL AFTER noi_dung
                    `);
                    console.log('Đã thêm cột phan_hoi thành công.');
                    
                    // Try the update again
                    const updateQuery = `
                        UPDATE yeu_cau_lien_he 
                        SET 
                            da_xu_ly = true,
                            phan_hoi = ?,
                            xu_ly_boi = ?,
                            thoi_gian_xu_ly = ?
                        WHERE ma = ?
                    `;
                    const [updateResult] = await db.execute(updateQuery, [
                        responseData.phan_hoi,
                        responseData.xu_ly_boi,
                        responseData.thoi_gian_xu_ly,
                        id
                    ]);
                    return updateResult.affectedRows > 0;
                } catch (alterError) {
                    console.error('Không thể thêm cột phan_hoi:', alterError);
                    
                    // If we couldn't add the column, just update without it
                    const fallbackQuery = `
                        UPDATE yeu_cau_lien_he 
                        SET 
                            da_xu_ly = true,
                            xu_ly_boi = ?,
                            thoi_gian_xu_ly = ?
                        WHERE ma = ?
                    `;
                    const [fallbackResult] = await db.execute(fallbackQuery, [
                        responseData.xu_ly_boi,
                        responseData.thoi_gian_xu_ly,
                        id
                    ]);
                    return fallbackResult.affectedRows > 0;
                }
            }
            
            // If it's another error, rethrow it
            throw error;
        }
    }
};

module.exports = Contact;
