const db = require('../data/db');

const carController = {
    // Lấy tất cả xe
    getAllCars: async (req, res) => {
        try {
            // Lấy danh sách xe
            const [rows] = await db.execute(`
                SELECT x.*, 
                       COALESCE(AVG(d.so_sao), 0) as danh_gia, 
                       COUNT(DISTINCT d.id) as so_danh_gia,
                       COUNT(DISTINCT dx.id) as so_chuyen
                FROM xe x
                LEFT JOIN danh_gia d ON x.id = d.xe_id
                LEFT JOIN dat_xe dx ON x.id = dx.xe_id
                WHERE x.tinh_trang IN ('san_sang', 'dang_thue', 'bao_tri')
                GROUP BY x.id
                ORDER BY x.ngay_tao DESC
            `);
            
            // Lấy ID của tất cả các xe
            const carIds = rows.map(car => car.id);
            
            // Nếu không có xe nào, trả về mảng rỗng
            if (carIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Không có xe nào',
                    data: []
                });
            }
            
            // Lấy hình ảnh chính của các xe từ bảng hinh_anh_xe
            let carImages = [];
            if (carIds.length > 0) {
                const inPlaceholders = carIds.map(() => '?').join(',');
                [carImages] = await db.execute(`
                    SELECT xe_id, url_hinh_anh, la_hinh_chinh
                    FROM hinh_anh_xe 
                    WHERE xe_id IN (${inPlaceholders})
                    ORDER BY la_hinh_chinh DESC
                `, carIds);
            }
            
            // Tạo map để lưu trữ hình ảnh theo id xe
            const carImageMap = {};
            carImages.forEach(img => {
                if (!carImageMap[img.xe_id] || img.la_hinh_chinh) {
                    carImageMap[img.xe_id] = img.url_hinh_anh;
                }
            });
            
            // Thêm thông tin hình ảnh vào dữ liệu xe
            const carsWithImages = rows.map(car => {
                return {
                    ...car,
                    hinh_anh: carImageMap[car.id] || null,
                    danh_gia: parseFloat(car.danh_gia).toFixed(1)
                };
            });
            
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách xe thành công',
                data: carsWithImages
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách xe',
                error: error.message
            });
        }
    },

    // Lấy xe nổi bật
    getFeaturedCars: async (req, res) => {
        try {
            // Lấy danh sách xe nổi bật
            const [rows] = await db.execute(`
                SELECT x.*, 
                       COALESCE(AVG(d.so_sao), 0) as danh_gia, 
                       COUNT(DISTINCT d.id) as so_danh_gia,
                       COUNT(DISTINCT dx.id) as so_chuyen
                FROM xe x
                LEFT JOIN danh_gia d ON x.id = d.xe_id
                LEFT JOIN dat_xe dx ON x.id = dx.xe_id
                WHERE x.tinh_trang = 'san_sang'
                GROUP BY x.id
                ORDER BY x.id ASC
                LIMIT 4
            `);
            
            // Nếu không có xe nào, trả về mảng rỗng
            if (!rows.length) {
                return res.status(200).json({
                    success: true,
                    message: 'Không có xe nổi bật',
                    data: []
                });
            }
            
            // Lấy danh sách ID của các xe nổi bật
            const carIds = rows.map(car => car.id);
            
            // Lấy hình ảnh cho các xe nổi bật
            let carImages = [];
            try {
                if (carIds.length > 0) {
                    const inPlaceholders = carIds.map(() => '?').join(',');
                    const query = `
                        SELECT xe_id, url_hinh_anh, la_hinh_chinh
                        FROM hinh_anh_xe 
                        WHERE xe_id IN (${inPlaceholders})
                    `;
                    [carImages] = await db.execute(query, carIds);
                }
            } catch (error) {
                console.error('Lỗi khi truy vấn hình ảnh xe:', error);
            }
            
            // Tạo map để lưu trữ hình ảnh theo id xe
            const carImageMap = {};
            carImages.forEach(img => {
                if (!carImageMap[img.xe_id] || img.la_hinh_chinh) {
                    carImageMap[img.xe_id] = img.url_hinh_anh;
                }
            });
            
            // Tính toán giá gốc và % giảm giá (giả lập)
            const featuredCars = rows.map(car => {
                // Giả lập giảm giá (từ 5% đến 25%)
                const discountPercent = Math.floor(Math.random() * 21) + 5;
                const originalPrice = Math.round(car.gia_thue * (100 / (100 - discountPercent)));
                
                return {
                    ...car,
                    hinh_anh: carImageMap[car.id] || '', // Sử dụng đường dẫn hình ảnh từ bảng hinh_anh_xe
                    giam_gia: discountPercent,
                    gia_goc: originalPrice,
                    so_chuyen: car.so_chuyen || 0,
                    danh_gia: parseFloat(car.danh_gia).toFixed(1) || 5.0
                };
            });
            
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách xe nổi bật thành công',
                data: featuredCars
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách xe nổi bật:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách xe nổi bật',
                error: error.message
            });
        }
    },

    // Lấy xe theo ID
    getCarById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [rows] = await db.execute(`
                SELECT x.*, 
                       COALESCE(AVG(d.so_sao), 0) as danh_gia, 
                       COUNT(DISTINCT d.id) as so_danh_gia,
                       COUNT(DISTINCT dx.id) as so_chuyen,
                       nd.ho_ten as ten_chu_xe,
                       nd.so_dien_thoai as lien_he_chu_xe
                FROM xe x
                LEFT JOIN danh_gia d ON x.id = d.xe_id
                LEFT JOIN dat_xe dx ON x.id = dx.xe_id
                LEFT JOIN nguoi_dung nd ON x.chu_xe_id = nd.id
                WHERE x.id = ?
                GROUP BY x.id
            `, [id]);
            
            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy xe'
                });
            }
            
            // Lấy các hình ảnh của xe
            const [images] = await db.execute(`
                SELECT * FROM hinh_anh_xe
                WHERE xe_id = ?
                ORDER BY la_hinh_chinh DESC
            `, [id]);
            
            const car = {
                ...rows[0],
                hinh_anh: images.map(img => img.url_hinh_anh),
                danh_gia: parseFloat(rows[0].danh_gia).toFixed(1)
            };
            
            res.status(200).json({
                success: true,
                message: 'Lấy thông tin xe thành công',
                data: car
            });
        } catch (error) {
            console.error('Lỗi khi lấy thông tin xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy thông tin xe',
                error: error.message
            });
        }
    },

    // Tạo xe mới
    createCar: async (req, res) => {
        try {
            // Các field từ form tạo xe
            const { 
                ten_xe, hang_xe, loai_xe, bien_so, nam_san_xuat, 
                mau_xe, so_cho, hop_so, nhien_lieu, gia_thue, 
                mo_ta, loai_dich_vu, dia_chi_xe
            } = req.body;
            
            // ID của người dùng đăng nhập (từ token)
            const chu_xe_id = req.user.id;
            
            // Kiểm tra các trường bắt buộc
            if (!ten_xe || !hang_xe || !loai_xe || !bien_so || !nam_san_xuat || !so_cho || !hop_so || !nhien_lieu || !gia_thue || !loai_dich_vu || !dia_chi_xe) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }
            
            // Thêm xe vào database
            const [result] = await db.execute(`
                INSERT INTO xe (
                    chu_xe_id, ten_xe, hang_xe, loai_xe, bien_so, 
                    nam_san_xuat, mau_xe, so_cho, hop_so, 
                    nhien_lieu, gia_thue, mo_ta, tinh_trang, 
                    loai_dich_vu, dia_chi_xe
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                chu_xe_id, ten_xe, hang_xe, loai_xe, bien_so, 
                nam_san_xuat, mau_xe, so_cho, hop_so, 
                nhien_lieu, gia_thue, mo_ta, 'san_sang', 
                loai_dich_vu, dia_chi_xe
            ]);
            
            res.status(201).json({
                success: true,
                message: 'Tạo xe mới thành công',
                data: {
                    id: result.insertId,
                    ten_xe,
                    hang_xe,
                    loai_xe
                }
            });
        } catch (error) {
            console.error('Lỗi khi tạo xe mới:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi tạo xe mới',
                error: error.message
            });
        }
    },

    // Cập nhật thông tin xe
    updateCar: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Các field cần cập nhật
            const { 
                ten_xe, hang_xe, loai_xe, bien_so, nam_san_xuat, 
                mau_xe, so_cho, hop_so, nhien_lieu, gia_thue, 
                mo_ta, tinh_trang, loai_dich_vu, dia_chi_xe
            } = req.body;
            
            // Kiểm tra xe tồn tại
            const [existingCar] = await db.execute('SELECT * FROM xe WHERE id = ?', [id]);
            
            if (!existingCar.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy xe'
                });
            }
            
            // Kiểm tra quyền (chỉ chủ xe hoặc admin mới được cập nhật)
            if (req.user.id !== existingCar[0].chu_xe_id && req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền cập nhật xe này'
                });
            }
            
            // Cập nhật thông tin xe
            await db.execute(`
                UPDATE xe SET
                    ten_xe = COALESCE(?, ten_xe),
                    hang_xe = COALESCE(?, hang_xe),
                    loai_xe = COALESCE(?, loai_xe),
                    bien_so = COALESCE(?, bien_so),
                    nam_san_xuat = COALESCE(?, nam_san_xuat),
                    mau_xe = COALESCE(?, mau_xe),
                    so_cho = COALESCE(?, so_cho),
                    hop_so = COALESCE(?, hop_so),
                    nhien_lieu = COALESCE(?, nhien_lieu),
                    gia_thue = COALESCE(?, gia_thue),
                    mo_ta = COALESCE(?, mo_ta),
                    tinh_trang = COALESCE(?, tinh_trang),
                    loai_dich_vu = COALESCE(?, loai_dich_vu),
                    dia_chi_xe = COALESCE(?, dia_chi_xe)
                WHERE id = ?
            `, [
                ten_xe, hang_xe, loai_xe, bien_so, nam_san_xuat,
                mau_xe, so_cho, hop_so, nhien_lieu, gia_thue,
                mo_ta, tinh_trang, loai_dich_vu, dia_chi_xe, id
            ]);
            
            res.status(200).json({
                success: true,
                message: 'Cập nhật xe thành công',
                data: {
                    id: parseInt(id),
                    ...req.body
                }
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật xe',
                error: error.message
            });
        }
    },

    // Xóa xe
    deleteCar: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Kiểm tra xe tồn tại
            const [existingCar] = await db.execute('SELECT * FROM xe WHERE id = ?', [id]);
            
            if (!existingCar.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy xe'
                });
            }
            
            // Kiểm tra quyền (chỉ chủ xe hoặc admin mới được xóa)
            if (req.user.id !== existingCar[0].chu_xe_id && req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xóa xe này'
                });
            }
            
            // Xóa xe
            await db.execute('DELETE FROM xe WHERE id = ?', [id]);
            
            res.status(200).json({
                success: true,
                message: 'Xóa xe thành công'
            });
        } catch (error) {
            console.error('Lỗi khi xóa xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa xe',
                error: error.message
            });
        }
    }
};

module.exports = carController;