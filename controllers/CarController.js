const db = require('../data/db');
const { saveBase64Image } = require('../utils/imageUtils');

// Hàm chuẩn hóa đường dẫn hình ảnh
const normalizeImageUrl = (url) => {
    if (!url) return null;
    
    // Nếu đường dẫn đã là URL đầy đủ hoặc đường dẫn tương đối, trả về nguyên vẹn
    if (url.startsWith('http') || url.startsWith('/')) {
        return url;
    }
    
    // Nếu là đường dẫn tương đối không bắt đầu bằng "/"
    return '/' + url;
};

const carController = {
    // Lấy thống kê xe
    getCarStats: async (req, res) => {
        try {
            // Lấy tổng số xe
            const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM xe');
            
            // Lấy số xe đang sẵn sàng
            const [availableResult] = await db.execute(`
                SELECT COUNT(*) as available 
                FROM xe 
                WHERE tinh_trang = 'san_sang'
            `);
            
            // Lấy số xe đang cho thuê
            const [rentedResult] = await db.execute(`
                SELECT COUNT(*) as rented 
                FROM xe 
                WHERE tinh_trang = 'dang_thue'
            `);
            
            // Lấy số xe đang bảo trì
            const [maintenanceResult] = await db.execute(`
                SELECT COUNT(*) as maintenance 
                FROM xe 
                WHERE tinh_trang = 'bao_tri'
            `);
            
            // Lấy số xe đã ngừng hoạt động
            const [inactiveResult] = await db.execute(`
                SELECT COUNT(*) as inactive 
                FROM xe 
                WHERE tinh_trang = 'ngung_hoat_dong'
            `);
            
            // Lấy số lượng xe theo loại
            const [carTypeResult] = await db.execute(`
                SELECT loai_xe, COUNT(*) as count
                FROM xe
                GROUP BY loai_xe
            `);
            
            // Lấy 5 xe được thuê nhiều nhất
            const [topRentedCars] = await db.execute(`
                SELECT x.id, x.ten_xe, x.hang_xe, COUNT(dx.id) as total_bookings
                FROM xe x
                JOIN dat_xe dx ON x.id = dx.xe_id
                GROUP BY x.id, x.ten_xe, x.hang_xe
                ORDER BY total_bookings DESC
                LIMIT 5
            `);
            
            res.status(200).json({
                success: true,
                message: 'Lấy thống kê xe thành công',
                stats: {
                    totalCars: totalResult[0].total || 0,
                    availableCars: availableResult[0].available || 0,
                    rentedCars: rentedResult[0].rented || 0,
                    maintenanceCars: maintenanceResult[0].maintenance || 0,
                    inactiveCars: inactiveResult[0].inactive || 0,
                    carsByType: carTypeResult,
                    topRentedCars: topRentedCars
                }
            });
        } catch (error) {
            console.error('Lỗi khi lấy thống kê xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy thống kê xe',
                error: error.message
            });
        }
    },
    
    // Lấy tất cả xe
    getAllCars: async (req, res) => {
        try {
            // Xác định nếu request đến từ admin hoặc client
            const isAdmin = req.user && req.user.loai_tai_khoan === 'admin';
            
            // Nếu là admin, không cần lọc theo tinh_trang
            const statusFilter = isAdmin ? '' : "WHERE x.tinh_trang IN ('san_sang', 'dang_thue', 'bao_tri')";
            
            console.log("User role:", req.user ? req.user.loai_tai_khoan : 'not authenticated');
            console.log("Using filter for status:", statusFilter);
            
            // Lấy danh sách xe
            const [rows] = await db.execute(`
                SELECT x.*, 
                       COALESCE(AVG(d.so_sao), 0) as danh_gia, 
                       COUNT(DISTINCT d.id) as so_danh_gia,
                       COUNT(DISTINCT dx.id) as so_chuyen
                FROM xe x
                LEFT JOIN danh_gia d ON x.id = d.xe_id
                LEFT JOIN dat_xe dx ON x.id = dx.xe_id
                ${statusFilter}
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
            const carsWithImages = rows.map(car => {                return {
                    ...car,
                    hinh_anh: normalizeImageUrl(carImageMap[car.id]) || null,
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
    },    // Tạo xe mới
    createCar: async (req, res) => {
        try {
            // Lấy dữ liệu từ form
            const { 
                brand, model, year, seats, transmission, fuel,
                license_plate, price_per_day, deposit, km_limit,
                location, description, type, features, loai_xe, ten_xe, hang_xe,
                bien_so, nam_san_xuat, mau_xe, so_cho, hop_so, nhien_lieu, gia_thue, 
                mo_ta, loai_dich_vu, dia_chi_xe, hinh_anh
            } = req.body;
            
            // ID của người dùng đăng nhập (từ token)
            const chu_xe_id = req.user.id;
            
            // Trường hợp DACS1: Từ brand + model
            let finalTenXe = ten_xe;
            let finalHangXe = hang_xe;
            let finalBienSo = bien_so;
            let finalNamSanXuat = nam_san_xuat;
            let finalSoCho = so_cho;
            let finalGiaThue = gia_thue;
            let finalMoTa = mo_ta;
            let finalDiaChiXe = dia_chi_xe;
            let finalLoaiDichVu = loai_dich_vu;
            
            // Nếu có dữ liệu kiểu DACS1 (brand + model), ưu tiên sử dụng
            if (brand && model) {
                finalTenXe = `${brand} ${model}`;
                finalHangXe = brand;
                finalBienSo = license_plate;
                finalNamSanXuat = year;
                finalSoCho = seats;
                finalGiaThue = price_per_day;
                
                // Tạo mô tả chi tiết kết hợp features
                finalMoTa = description || '';
                
                // Xử lý features
                let featuresArray = [];
                try {
                    if (features && typeof features === 'string') {
                        featuresArray = JSON.parse(features);
                    } else if (Array.isArray(features)) {
                        featuresArray = features;
                    }
                    
                    if (featuresArray.length > 0) {
                        finalMoTa += "\n\nTính năng:\n" + featuresArray.join(", ");
                    }
                } catch (error) {
                    console.error('Lỗi khi parse tính năng xe:', error);
                }
                
                finalDiaChiXe = location;
                finalLoaiDichVu = type || 'tu_lai';
            }
            
            // Validate loại xe
            let validated_loai_xe = loai_xe;
            if (!validated_loai_xe) {
                // Nếu không có loại xe, thử lấy từ số chỗ
                if (finalSoCho) {
                    if (finalSoCho <= 4) validated_loai_xe = '4_cho';
                    else if (finalSoCho <= 7) validated_loai_xe = '7_cho';
                    else if (finalSoCho <= 16) validated_loai_xe = '16_cho';
                    else validated_loai_xe = '29_cho';
                } else {
                    validated_loai_xe = '4_cho'; // Giá trị mặc định
                }
            }
            
            // Đảm bảo loại xe là một trong những giá trị ENUM hợp lệ
            const validEnumValues = ['4_cho', '7_cho', '16_cho', '29_cho'];
            if (!validEnumValues.includes(validated_loai_xe)) {
                if (validated_loai_xe.includes('4')) validated_loai_xe = '4_cho';
                else if (validated_loai_xe.includes('7')) validated_loai_xe = '7_cho';
                else if (validated_loai_xe.includes('16')) validated_loai_xe = '16_cho';
                else if (validated_loai_xe.includes('29')) validated_loai_xe = '29_cho';
                else validated_loai_xe = '4_cho'; // Giá trị mặc định
                
                console.log(`Đã chuyển đổi giá trị loai_xe: "${loai_xe}" -> "${validated_loai_xe}"`);
            }
            
            // Validate các trường bắt buộc
            if (!finalTenXe || !finalHangXe || !validated_loai_xe || !finalBienSo || 
                !finalNamSanXuat || !finalSoCho || !finalGiaThue || !finalDiaChiXe) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }
            
            // Xử lý các trường text khác để tránh lỗi data truncation
            let validated_mau_xe = mau_xe;
            if (mau_xe && mau_xe.length > 30) {
                validated_mau_xe = mau_xe.substring(0, 30);
            }
            
            // Validate hộp số
            let validated_hop_so = hop_so || transmission;
            if (validated_hop_so) {
                const validHopSoValues = ['tu_dong', 'so_san'];
                if (!validHopSoValues.includes(validated_hop_so)) {
                    if (validated_hop_so.toLowerCase().includes('tự') || 
                        validated_hop_so.toLowerCase().includes('tu') || 
                        validated_hop_so.toLowerCase().includes('auto')) {
                        validated_hop_so = 'tu_dong';
                    } else {
                        validated_hop_so = 'so_san';
                    }
                }
            } else {
                validated_hop_so = 'tu_dong'; // Giá trị mặc định
            }
            
            // Validate nhiên liệu
            let validated_nhien_lieu = nhien_lieu || fuel;
            if (validated_nhien_lieu) {
                const validNhienLieuValues = ['xang', 'dau', 'dien', 'hybrid'];
                if (!validNhienLieuValues.includes(validated_nhien_lieu)) {
                    if (validated_nhien_lieu.toLowerCase().includes('xăng') || validated_nhien_lieu.toLowerCase().includes('xang')) {
                        validated_nhien_lieu = 'xang';
                    } else if (validated_nhien_lieu.toLowerCase().includes('dầu') || validated_nhien_lieu.toLowerCase().includes('dau')) {
                        validated_nhien_lieu = 'dau';
                    } else if (validated_nhien_lieu.toLowerCase().includes('điện') || validated_nhien_lieu.toLowerCase().includes('dien')) {
                        validated_nhien_lieu = 'dien';
                    } else if (validated_nhien_lieu.toLowerCase().includes('hybrid')) {
                        validated_nhien_lieu = 'hybrid';
                    } else {
                        validated_nhien_lieu = 'xang'; // Giá trị mặc định
                    }
                }
            } else {
                validated_nhien_lieu = 'xang'; // Giá trị mặc định
            }
            
            // Đặt các giá trị mặc định cho đặt cọc và giới hạn km
            const realDeposit = deposit || 0;
            const realKmLimit = km_limit || 0;
            
            // Thêm xe vào database
            const [result] = await db.execute(`
                INSERT INTO xe (
                    chu_xe_id, ten_xe, hang_xe, loai_xe, bien_so, 
                    nam_san_xuat, mau_xe, so_cho, hop_so, 
                    nhien_lieu, gia_thue, dat_coc, gioi_han_km,
                    mo_ta, tinh_trang, loai_dich_vu, 
                    dia_chi_xe
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                chu_xe_id, finalTenXe, finalHangXe, validated_loai_xe, finalBienSo, 
                finalNamSanXuat, validated_mau_xe, finalSoCho, validated_hop_so, 
                validated_nhien_lieu, finalGiaThue, realDeposit, realKmLimit,
                finalMoTa, 'cho_duyet', finalLoaiDichVu, 
                finalDiaChiXe
            ]);
            
            const xe_id = result.insertId;
            
            // Xử lý upload hình ảnh
            const uploadDirectory = './public/uploads/cars/';
            
            // Đảm bảo thư mục upload tồn tại
            const fs = require('fs');
            const path = require('path');
            
            if (!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory, { recursive: true });
            }
            
            // Xử lý nhiều hình ảnh
            if (req.files && req.files.car_images) {
                const carImages = Array.isArray(req.files.car_images) 
                    ? req.files.car_images 
                    : [req.files.car_images];
                
                console.log(`Đã nhận ${carImages.length} hình ảnh xe`);
                
                // Lưu các hình ảnh của xe
                for (let i = 0; i < carImages.length; i++) {
                    const file = carImages[i];
                    const fileName = `car-${xe_id}-${Date.now()}-${i}-${file.name}`;
                    const filePath = path.join(uploadDirectory, fileName);
                    
                    // Đợi ghi file xong
                    await new Promise((resolve, reject) => {
                        file.mv(filePath, err => {
                            if (err) {
                                console.error('Lỗi khi lưu file:', err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                    
                    // Lưu thông tin ảnh vào database
                    const isMainImage = i === 0; // Ảnh đầu tiên là ảnh chính
                    const imageUrl = `/public/uploads/cars/${fileName}`;
                    
                    await db.execute(`
                        INSERT INTO hinh_anh_xe (xe_id, url_hinh_anh, la_hinh_chinh, ngay_tao)
                        VALUES (?, ?, ?, NOW())
                    `, [xe_id, imageUrl, isMainImage ? 1 : 0]);
                }
            } else if (hinh_anh) {
                // Xử lý theo cách cũ nếu không có file nhưng có base64
                let imageUrl = hinh_anh;
                
                // Kiểm tra nếu là dữ liệu base64 thì lưu thành file
                if (hinh_anh.startsWith('data:') || hinh_anh.length > 255) {
                    try {
                        // Lưu hình ảnh và lấy đường dẫn file
                        const { saveBase64Image } = require('../utils/imageUtils');
                        imageUrl = saveBase64Image(hinh_anh, 'car-' + xe_id);
                        console.log('Đã lưu hình ảnh:', imageUrl);
                        
                        // Nếu xử lý hình ảnh thành công, lưu vào database
                        if (imageUrl) {
                            await db.execute(
                                'INSERT INTO hinh_anh_xe (xe_id, url_hinh_anh, la_hinh_chinh) VALUES (?, ?, TRUE)',
                                [xe_id, imageUrl]
                            );
                        }
                    } catch (error) {
                        console.error('Lỗi khi lưu hình ảnh:', error);
                    }
                }
            }
            
            // Xử lý giấy tờ xe
            if (req.files) {
                // Xử lý đăng ký xe
                if (req.files.registration_image) {
                    const file = req.files.registration_image;
                    const fileName = `registration-${xe_id}-${Date.now()}-${file.name}`;
                    const filePath = path.join(uploadDirectory, fileName);
                    
                    try {
                        await new Promise((resolve, reject) => {
                            file.mv(filePath, err => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                        
                        // Lưu thông tin giấy tờ vào database
                        const imageUrl = `/public/uploads/cars/${fileName}`;
                        
                        await db.execute(`
                            INSERT INTO giay_to_xe (xe_id, loai_giay_to, url_hinh_anh, ngay_tao)
                            VALUES (?, ?, ?, NOW())
                        `, [xe_id, 'dang_ky', imageUrl]);
                        
                        console.log('Đã lưu giấy đăng ký xe');
                    } catch (error) {
                        console.error('Lỗi khi lưu giấy đăng ký xe:', error);
                    }
                }
                
                // Xử lý bảo hiểm xe
                if (req.files.insurance_image) {
                    const file = req.files.insurance_image;
                    const fileName = `insurance-${xe_id}-${Date.now()}-${file.name}`;
                    const filePath = path.join(uploadDirectory, fileName);
                    
                    try {
                        await new Promise((resolve, reject) => {
                            file.mv(filePath, err => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                        
                        // Lưu thông tin giấy tờ vào database
                        const imageUrl = `/public/uploads/cars/${fileName}`;
                        
                        await db.execute(`
                            INSERT INTO giay_to_xe (xe_id, loai_giay_to, url_hinh_anh, ngay_tao)
                            VALUES (?, ?, ?, NOW())
                        `, [xe_id, 'bao_hiem', imageUrl]);
                        
                        console.log('Đã lưu giấy bảo hiểm xe');
                    } catch (error) {
                        console.error('Lỗi khi lưu giấy bảo hiểm xe:', error);
                    }
                }
            }
            
            // Tạo thông báo cho admin
            try {
                // Lấy ID của các tài khoản admin
                const [admins] = await db.execute('SELECT id FROM nguoi_dung WHERE loai_tai_khoan = ?', ['admin']);
                
                // Lấy thông tin người dùng đăng ký xe
                const [ownerInfo] = await db.execute('SELECT ho_ten FROM nguoi_dung WHERE id = ?', [chu_xe_id]);
                const ownerName = ownerInfo.length > 0 ? ownerInfo[0].ho_ten : 'Người dùng';
                
                console.log('Tìm thấy', admins.length, 'admin để gửi thông báo');
                if (admins.length === 0) {
                    console.log('CẢNH BÁO: Không tìm thấy admin nào để gửi thông báo!');
                }
                  // Nội dung thông báo
                const notificationTitle = 'Yêu cầu đăng ký xe mới';
                const notificationContent = `${ownerName} đã đăng ký xe ${finalTenXe} (${finalBienSo}) và đang chờ xét duyệt.`;
                
                // Thêm thông báo cho mỗi admin
                for (const admin of admins) {
                    console.log(`Đang gửi thông báo đến admin ID: ${admin.id}`);
                    const [notifyResult] = await db.execute(`
                        INSERT INTO thong_bao (
                            nguoi_gui_id, nguoi_nhan_id, tieu_de, noi_dung, loai_thong_bao, 
                            lien_ket, da_doc, ngay_tao
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    `, [
                        chu_xe_id,
                        admin.id,
                        notificationTitle,
                        notificationContent,
                        'car_registration',
                        `/admin/cars/view/${result.insertId}`,
                        0
                    ]);
                    
                    console.log(`Kết quả thông báo: ${notifyResult.affectedRows > 0 ? 'Thành công' : 'Thất bại'}`);
                }
            } catch (notifyError) {
                console.error('Lỗi khi tạo thông báo cho admin:', notifyError);
                // Không để lỗi thông báo ảnh hưởng đến quá trình đăng ký
            }
            
            // Gửi email thông báo cho admin
            try {
                const { sendCarRegistrationNotification } = require('../utils/mailer');
                
                // Lấy thông tin owner
                const [ownerInfo] = await db.execute(
                    'SELECT id, ho_ten, email, so_dien_thoai FROM nguoi_dung WHERE id = ?', 
                    [chu_xe_id]
                );
                  // Tạo object thông tin xe
                const carInfo = {
                    id: result.insertId,
                    ten_xe: finalTenXe,
                    hang_xe: finalHangXe,
                    bien_so: finalBienSo,
                    so_cho: finalSoCho,
                    gia_thue: finalGiaThue
                };
                
                // Gửi email thông báo
                await sendCarRegistrationNotification(carInfo, ownerInfo[0] || {});
                console.log('Đã gửi email thông báo đăng ký xe mới đến admin');
            } catch (emailError) {
                console.error('Lỗi khi gửi email thông báo:', emailError);
                // Không để lỗi gửi email ảnh hưởng đến quá trình đăng ký
            }
            
            // Đọc lại thông tin xe sau khi tạo để có dữ liệu đầy đủ
            const [newCarInfo] = await db.execute(`
                SELECT x.*, 
                       (SELECT url_hinh_anh FROM hinh_anh_xe WHERE xe_id = x.id AND la_hinh_chinh = TRUE LIMIT 1) as hinh_anh
                FROM xe x
                WHERE x.id = ?
            `, [result.insertId]);

            res.status(201).json({
                success: true,
                message: 'Tạo xe mới thành công, đang chờ xét duyệt',
                data: newCarInfo[0]
            });
        } catch (error) {
            console.error('Lỗi khi tạo xe mới:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi tạo xe mới',
                error: error.message
            });
        }
    },    // Cập nhật thông tin xe
    updateCar: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Các field cần cập nhật
            const { 
                ten_xe, hang_xe, loai_xe, bien_so, nam_san_xuat, 
                mau_xe, so_cho, hop_so, nhien_lieu, gia_thue, 
                mo_ta, tinh_trang, loai_dich_vu, dia_chi_xe, hinh_anh
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
            }// Xử lý các giá trị undefined - thay bằng null để MySQL hiểu
            // Kiểm tra và xử lý giá trị loai_xe để đảm bảo phù hợp với ENUM trong DB
            let processed_loai_xe = loai_xe;
            
            // Đảm bảo loai_xe là một trong những giá trị ENUM hợp lệ ('4_cho', '7_cho', '16_cho', '29_cho')
            if (processed_loai_xe) {
                const validEnumValues = ['4_cho', '7_cho', '16_cho', '29_cho'];
                if (!validEnumValues.includes(processed_loai_xe)) {
                    // Nếu giá trị không hợp lệ, thử chuyển đổi thành giá trị đúng định dạng
                    if (processed_loai_xe.includes('4')) processed_loai_xe = '4_cho';
                    else if (processed_loai_xe.includes('7')) processed_loai_xe = '7_cho';
                    else if (processed_loai_xe.includes('16')) processed_loai_xe = '16_cho';
                    else if (processed_loai_xe.includes('29')) processed_loai_xe = '29_cho';
                    else processed_loai_xe = '4_cho'; // Giá trị mặc định nếu không thể xác định
                    
                    console.log(`Đã chuyển đổi giá trị loai_xe: "${loai_xe}" -> "${processed_loai_xe}"`);
                }
            }
            
            // Xử lý các trường text khác để tránh lỗi data truncation
            let processed_mau_xe = mau_xe;
            if (mau_xe && mau_xe.length > 30) {  // Giả sử giới hạn là 30 ký tự
                processed_mau_xe = mau_xe.substring(0, 30);
            }
              let processed_hop_so = hop_so;
            if (processed_hop_so) {
                // Đảm bảo hop_so là một trong những giá trị ENUM hợp lệ ('tu_dong', 'so_san')
                const validHopSoValues = ['tu_dong', 'so_san'];
                if (!validHopSoValues.includes(processed_hop_so)) {
                    // Nếu giá trị không hợp lệ, thử chuyển đổi thành giá trị đúng định dạng
                    if (processed_hop_so.toLowerCase().includes('tự') || 
                        processed_hop_so.toLowerCase().includes('tu') || 
                        processed_hop_so.toLowerCase().includes('auto')) {
                        processed_hop_so = 'tu_dong';
                    } else {
                        processed_hop_so = 'so_san'; // Giá trị mặc định nếu không thể xác định
                    }
                    console.log(`Đã chuyển đổi giá trị hop_so: "${hop_so}" -> "${processed_hop_so}"`);
                }
            }
              let processed_nhien_lieu = nhien_lieu;
            if (processed_nhien_lieu) {
                // Đảm bảo nhien_lieu là một trong những giá trị ENUM hợp lệ ('xang', 'dau', 'dien', 'hybrid')
                const validNhienLieuValues = ['xang', 'dau', 'dien', 'hybrid'];
                if (!validNhienLieuValues.includes(processed_nhien_lieu)) {
                    // Nếu giá trị không hợp lệ, thử chuyển đổi thành giá trị đúng định dạng
                    if (processed_nhien_lieu.toLowerCase().includes('xăng') || processed_nhien_lieu.toLowerCase().includes('xang')) {
                        processed_nhien_lieu = 'xang';
                    } else if (processed_nhien_lieu.toLowerCase().includes('dầu') || processed_nhien_lieu.toLowerCase().includes('dau')) {
                        processed_nhien_lieu = 'dau';
                    } else if (processed_nhien_lieu.toLowerCase().includes('điện') || processed_nhien_lieu.toLowerCase().includes('dien')) {
                        processed_nhien_lieu = 'dien';
                    } else if (processed_nhien_lieu.toLowerCase().includes('hybrid')) {
                        processed_nhien_lieu = 'hybrid';
                    } else {
                        processed_nhien_lieu = 'xang'; // Giá trị mặc định nếu không thể xác định
                    }
                    console.log(`Đã chuyển đổi giá trị nhien_lieu: "${nhien_lieu}" -> "${processed_nhien_lieu}"`);
                }
            }
            
            let processed_tinh_trang = tinh_trang;
            if (processed_tinh_trang) {
                // Đảm bảo tinh_trang là một trong những giá trị ENUM hợp lệ ('san_sang', 'dang_thue', 'bao_tri', 'ngung_hoat_dong')
                const validTinhTrangValues = ['san_sang', 'dang_thue', 'bao_tri', 'ngung_hoat_dong'];
                if (!validTinhTrangValues.includes(processed_tinh_trang)) {
                    // Nếu giá trị không hợp lệ, thử chuyển đổi thành giá trị đúng định dạng
                    if (processed_tinh_trang.toLowerCase().includes('sẵn') || processed_tinh_trang.toLowerCase().includes('san')) {
                        processed_tinh_trang = 'san_sang';
                    } else if (processed_tinh_trang.toLowerCase().includes('thuê') || processed_tinh_trang.toLowerCase().includes('thue')) {
                        processed_tinh_trang = 'dang_thue';
                    } else if (processed_tinh_trang.toLowerCase().includes('bảo') || processed_tinh_trang.toLowerCase().includes('bao')) {
                        processed_tinh_trang = 'bao_tri';
                    } else if (processed_tinh_trang.toLowerCase().includes('ngừng') || processed_tinh_trang.toLowerCase().includes('ngung')) {
                        processed_tinh_trang = 'ngung_hoat_dong';
                    } else {
                        processed_tinh_trang = 'san_sang'; // Giá trị mặc định nếu không thể xác định
                    }
                    console.log(`Đã chuyển đổi giá trị tinh_trang: "${tinh_trang}" -> "${processed_tinh_trang}"`);
                }
            }const params = [
                ten_xe === undefined ? null : ten_xe,
                hang_xe === undefined ? null : hang_xe,
                processed_loai_xe === undefined ? null : processed_loai_xe, // Sử dụng biến đã được xử lý
                bien_so === undefined ? null : bien_so,
                nam_san_xuat === undefined ? null : nam_san_xuat,
                processed_mau_xe === undefined ? null : processed_mau_xe,
                so_cho === undefined ? null : so_cho,
                processed_hop_so === undefined ? null : processed_hop_so,
                processed_nhien_lieu === undefined ? null : processed_nhien_lieu,
                gia_thue === undefined ? null : gia_thue,
                mo_ta === undefined ? null : mo_ta,
                processed_tinh_trang === undefined ? null : processed_tinh_trang,
                loai_dich_vu === undefined ? null : loai_dich_vu,
                dia_chi_xe === undefined ? null : dia_chi_xe,
                id
            ];
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
            `, params);
              // Xử lý hình ảnh nếu có
            if (hinh_anh) {
                let imageUrl = hinh_anh;
                
                // Kiểm tra nếu là dữ liệu base64 thì lưu thành file
                if (hinh_anh.startsWith('data:') || hinh_anh.length > 255) {
                    try {
                        // Lưu hình ảnh và lấy đường dẫn file
                        imageUrl = saveBase64Image(hinh_anh, 'car-' + id);
                        console.log('Đã lưu hình ảnh:', imageUrl);
                    } catch (error) {
                        console.error('Lỗi khi lưu hình ảnh:', error);
                        // Nếu lỗi khi lưu, bỏ qua việc cập nhật hình ảnh
                        imageUrl = null;
                    }
                }

                // Nếu xử lý hình ảnh thành công, cập nhật vào database
                if (imageUrl) {
                    // Kiểm tra xem đã có hình ảnh chính nào cho xe này chưa
                    const [existingImages] = await db.execute(
                        'SELECT * FROM hinh_anh_xe WHERE xe_id = ? AND la_hinh_chinh = TRUE', 
                        [id]
                    );
    
                    if (existingImages.length > 0) {
                        // Cập nhật hình ảnh hiện có
                        await db.execute(
                            'UPDATE hinh_anh_xe SET url_hinh_anh = ? WHERE xe_id = ? AND la_hinh_chinh = TRUE',
                            [imageUrl, id]
                        );
                    } else {
                        // Thêm hình ảnh mới
                        await db.execute(
                            'INSERT INTO hinh_anh_xe (xe_id, url_hinh_anh, la_hinh_chinh) VALUES (?, ?, TRUE)',
                            [id, imageUrl]
                        );
                    }
                }
            }
              // Đọc lại thông tin xe sau khi cập nhật để có dữ liệu mới nhất
            const [updatedCarInfo] = await db.execute(`
                SELECT x.*, 
                       (SELECT url_hinh_anh FROM hinh_anh_xe WHERE xe_id = x.id AND la_hinh_chinh = TRUE LIMIT 1) as hinh_anh
                FROM xe x
                WHERE x.id = ?
            `, [id]);

            // Tạo response object với dữ liệu đã cập nhật
            const responseData = {
                ...updatedCarInfo[0],
                id: parseInt(id)
            };

            res.status(200).json({
                success: true,
                message: 'Cập nhật xe thành công',
                data: responseData
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật xe',
                error: error.message
            });
        }
    },    // Xóa xe
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
            
            // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
            const connection = await db.getConnection();
            await connection.beginTransaction();
            
            try {
                // Bước 1: Xóa tất cả hình ảnh liên quan đến xe trong bảng hinh_anh_xe
                await connection.execute('DELETE FROM hinh_anh_xe WHERE xe_id = ?', [id]);
                console.log(`Đã xóa hình ảnh của xe có ID: ${id}`);
                
                // Bước 2: Kiểm tra và xóa các bản ghi liên quan trong các bảng khác (nếu có)
                // Kiểm tra xem còn các bảng nào khác tham chiếu đến xe
                const [references] = await connection.execute(`
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE REFERENCED_TABLE_NAME = 'xe' 
                    AND REFERENCED_COLUMN_NAME = 'id' 
                    AND TABLE_NAME != 'hinh_anh_xe'
                `);
                
                // Nếu có các bảng khác tham chiếu đến xe, xóa các bản ghi trong những bảng đó
                for (const ref of references) {
                    const tableName = ref.TABLE_NAME;
                    await connection.execute(`DELETE FROM ${tableName} WHERE xe_id = ?`, [id]);
                    console.log(`Đã xóa dữ liệu liên quan từ bảng ${tableName}`);
                }
                
                // Bước 3: Xóa xe
                await connection.execute('DELETE FROM xe WHERE id = ?', [id]);
                console.log(`Đã xóa xe có ID: ${id}`);
                
                // Commit transaction
                await connection.commit();
                
                res.status(200).json({
                    success: true,
                    message: 'Xóa xe thành công'
                });
            } catch (error) {
                // Rollback nếu có lỗi
                await connection.rollback();
                throw error;
            } finally {
                // Luôn giải phóng kết nối
                connection.release();
            }
        } catch (error) {
            console.error('Lỗi khi xóa xe:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa xe',
                error: error.message
            });
        }
    },    // Phương thức duyệt xe (approve car)
    approveCar: async (req, res) => {
        try {
            const carId = req.params.id;
            
            // Kiểm tra xe tồn tại
            const [existingCar] = await db.execute('SELECT * FROM xe WHERE id = ?', [carId]);
            
            if (!existingCar.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy xe'
                });
            }
            
            // Kiểm tra quyền (chỉ admin mới được duyệt xe)
            if (req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền duyệt xe'
                });
            }
            
            // Kiểm tra xem xe đã được duyệt hay chưa
            if (existingCar[0].tinh_trang !== 'cho_duyet') {
                return res.status(400).json({
                    success: false,
                    message: 'Xe này không ở trạng thái chờ duyệt'
                });
            }
            
            // Cập nhật trạng thái xe thành "sẵn sàng"
            await db.execute(
                'UPDATE xe SET tinh_trang = ?, ngay_duyet = NOW() WHERE id = ?', 
                ['san_sang', carId]
            );
            
            // Lấy thông tin chủ xe
            const [owner] = await db.execute(
                'SELECT id, ho_ten, email FROM nguoi_dung WHERE id = ?',
                [existingCar[0].chu_xe_id]
            );
            
            // Tạo thông báo cho chủ xe
            if (owner.length > 0) {
                await db.execute(`
                    INSERT INTO thong_bao (
                        nguoi_gui_id, nguoi_nhan_id, tieu_de, noi_dung, loai_thong_bao, 
                        lien_ket, da_doc, ngay_tao
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    req.user.id,
                    owner[0].id,
                    'Xe của bạn đã được duyệt',
                    `Xe ${existingCar[0].ten_xe} (${existingCar[0].bien_so}) đã được chấp nhận và sẵn sàng cho thuê.`,
                    'car_approval',
                    `/mycars.html`, 
                    0
                ]);
                
                // Gửi email thông báo cho chủ xe
                try {
                    const { sendEmail } = require('../utils/mailer');
                    await sendEmail(
                        owner[0].email,
                        'Xe của bạn đã được duyệt',
                        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Thông báo duyệt xe</h2>
                            <p style="color: #555;">Kính gửi ${owner[0].ho_ten},</p>
                            <p style="color: #555;">Chúng tôi vui mừng thông báo rằng xe ${existingCar[0].ten_xe} (${existingCar[0].bien_so}) của bạn đã được chấp nhận và sẵn sàng cho thuê.</p>
                            <p style="color: #555;">Xe của bạn bây giờ đã có trong danh sách xe cho thuê và khách hàng có thể đặt xe của bạn.</p>
                            <p style="color: #555;">Truy cập <a href="http://localhost:${process.env.PORT || 3001}/mycars.html" style="color: #2196F3; text-decoration: none;">Quản lý xe của tôi</a> để xem chi tiết.</p>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                                <p>Trân trọng,<br>TKĐK Carental</p>
                                <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.</p>
                            </div>
                        </div>`
                    );
                    console.log(`Đã gửi email thông báo duyệt xe đến ${owner[0].email}`);
                } catch (emailError) {
                    console.error('Lỗi khi gửi email thông báo:', emailError);
                    // Không để lỗi gửi email ảnh hưởng đến quá trình duyệt xe
                }
            }
            
            return res.status(200).json({
                success: true,
                message: 'Xe đã được duyệt thành công',
                data: {
                    id: parseInt(carId),
                    tinh_trang: 'san_sang',
                    ngay_duyet: new Date()
                }
            });
        } catch (error) {
            console.error('Lỗi khi duyệt xe:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi duyệt xe',
                error: error.message
            });
        }
    },
      // Phương thức từ chối xe (reject car)
    rejectCar: async (req, res) => {
        try {
            const carId = req.params.id;
            const { ly_do_tu_choi } = req.body;
            
            // Kiểm tra xe tồn tại
            const [existingCar] = await db.execute('SELECT * FROM xe WHERE id = ?', [carId]);
            
            if (!existingCar.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy xe'
                });
            }
            
            // Kiểm tra quyền (chỉ admin mới được từ chối xe)
            if (req.user.loai_tai_khoan !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền từ chối xe'
                });
            }
            
            // Kiểm tra xem xe đã được duyệt hay chưa
            if (existingCar[0].tinh_trang !== 'cho_duyet') {
                return res.status(400).json({
                    success: false,
                    message: 'Xe này không ở trạng thái chờ duyệt'
                });
            }
            
            // Yêu cầu lý do từ chối
            if (!ly_do_tu_choi) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp lý do từ chối'
                });
            }
            
            // Cập nhật trạng thái xe thành "bị từ chối"
            await db.execute(
                'UPDATE xe SET tinh_trang = ?, ly_do_tu_choi = ?, ngay_duyet = NOW() WHERE id = ?', 
                ['bi_tu_choi', ly_do_tu_choi, carId]
            );
            
            // Lấy thông tin chủ xe
            const [owner] = await db.execute(
                'SELECT id, ho_ten, email FROM nguoi_dung WHERE id = ?',
                [existingCar[0].chu_xe_id]
            );
            
            // Tạo thông báo cho chủ xe
            if (owner.length > 0) {
                await db.execute(`
                    INSERT INTO thong_bao (
                        nguoi_gui_id, nguoi_nhan_id, tieu_de, noi_dung, loai_thong_bao, 
                        lien_ket, da_doc, ngay_tao
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    req.user.id,
                    owner[0].id,
                    'Xe của bạn không được duyệt',
                    `Xe ${existingCar[0].ten_xe} (${existingCar[0].bien_so}) đã bị từ chối. Lý do: ${ly_do_tu_choi}`,
                    'car_rejection',
                    `/mycars.html`,
                    0
                ]);
                
                // Gửi email thông báo cho chủ xe
                try {
                    const { sendEmail } = require('../utils/mailer');
                    await sendEmail(
                        owner[0].email,
                        'Xe của bạn không được duyệt',
                        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <h2 style="color: #e53e3e; border-bottom: 1px solid #eee; padding-bottom: 10px;">Thông báo từ chối xe</h2>
                            <p style="color: #555;">Kính gửi ${owner[0].ho_ten},</p>
                            <p style="color: #555;">Chúng tôi rất tiếc phải thông báo rằng xe ${existingCar[0].ten_xe} (${existingCar[0].bien_so}) của bạn không được duyệt.</p>
                            <p style="color: #555;"><strong>Lý do:</strong> ${ly_do_tu_choi}</p>
                            <p style="color: #555;">Bạn có thể chỉnh sửa thông tin xe và đăng ký lại hoặc liên hệ với chúng tôi để biết thêm chi tiết.</p>
                            <p style="color: #555;">Truy cập <a href="http://localhost:${process.env.PORT || 3001}/mycars.html" style="color: #2196F3; text-decoration: none;">Quản lý xe của tôi</a> để cập nhật thông tin xe.</p>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                                <p>Trân trọng,<br>TKĐK Carental</p>
                                <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.</p>
                            </div>
                        </div>`
                    );
                    console.log(`Đã gửi email thông báo từ chối xe đến ${owner[0].email}`);
                } catch (emailError) {
                    console.error('Lỗi khi gửi email thông báo:', emailError);
                    // Không để lỗi gửi email ảnh hưởng đến quá trình từ chối xe
                }
            }
            
            return res.status(200).json({
                success: true,
                message: 'Đã từ chối xe thành công',
                data: {
                    id: parseInt(carId),
                    tinh_trang: 'bi_tu_choi',
                    ly_do_tu_choi: ly_do_tu_choi,
                    ngay_duyet: new Date()
                }
            });
        } catch (error) {
            console.error('Lỗi khi từ chối xe:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi từ chối xe',
                error: error.message
            });
        }
    }
};

module.exports = carController;