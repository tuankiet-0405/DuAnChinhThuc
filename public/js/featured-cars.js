document.addEventListener('DOMContentLoaded', function() {
    // Lấy dữ liệu xe nổi bật từ API
    fetchFeaturedCars();

    // Xử lý sự kiện khi click vào xe
    document.querySelectorAll('.product-item.clickable').forEach(item => {
        item.addEventListener('click', function() {
            const carId = this.getAttribute('data-car-id');
            window.location.href = `/views/ShowChiTietXe.html?id=${carId}`;
        });
    });
});

// Hàm lấy dữ liệu xe nổi bật từ API
function fetchFeaturedCars() {
    fetch('/api/cars/featured')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể lấy dữ liệu xe nổi bật');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data.length > 0) {
                renderFeaturedCars(data.data);
            } else {
                // Sử dụng dữ liệu mẫu nếu API chưa có dữ liệu
                renderFeaturedCars(getSampleFeaturedCars());
            }
        })
        .catch(error => {
            console.error('Lỗi khi lấy dữ liệu xe nổi bật:', error);
            // Sử dụng dữ liệu mẫu nếu API gặp lỗi
            renderFeaturedCars(getSampleFeaturedCars());
        });
}

// Hàm hiển thị dữ liệu xe nổi bật
function renderFeaturedCars(cars) {
    const productGrid = document.querySelector('.featured-cars .product-grid');
    
    // Xóa dữ liệu cũ nếu có
    productGrid.innerHTML = '';
    
    // Debug: In ra dữ liệu xe nhận được từ API
    console.log('Dữ liệu xe nổi bật:', cars);
      // Hiển thị tối đa 8 xe nổi bật
    const carsToShow = cars.slice(0, 8);
    
    carsToShow.forEach(car => {
        const discountBadge = car.giam_gia ? 
            `<span class="discount-badge">Giảm ${car.giam_gia}%</span>` : '';
        
        const originalPrice = car.giam_gia ? 
            `<span class="original-price">${formatCurrency(car.gia_goc)}</span>` : '';
        
        // Debug: In ra hình ảnh của từng xe
        console.log(`Xe ${car.id} - hình ảnh gốc:`, car.hinh_anh);
        
        // Xử lý đường dẫn hình ảnh
        let imageSrc = '';
        
        if (car.hinh_anh && car.hinh_anh !== '') {
            imageSrc = car.hinh_anh;
            // Nếu đường dẫn là của hinh_anh_xe và không bắt đầu bằng /public
            if (imageSrc.startsWith('/image/')) {
                imageSrc = '/public' + imageSrc;
            }
        } else {
            // Nếu không có hình ảnh, sử dụng hình mặc định dựa vào loại xe
            switch(car.loai_xe) {
                case '4_cho':
                    imageSrc = '/public/image/ToyotaCamry.png';
                    break;
                case '7_cho':
                    imageSrc = '/public/image/ToyotaFortuner.jpeg';
                    break;
                case '16_cho':
                    imageSrc = '/public/image/Xe16Cho.png';
                    break;
                default:
                    imageSrc = '/public/image/lazy.svg';
            }
        }
        
        // Debug: In ra đường dẫn hình ảnh sau khi xử lý
        console.log(`Xe ${car.id} - hình ảnh sau xử lý:`, imageSrc);
        
        const carElement = `
            <div class="product-item clickable" data-car-id="${car.id}">
                <div class="car-image">
                    <img src="${imageSrc}" alt="${car.ten_xe}" onerror="this.src='/public/image/lazy.svg'">
                    ${discountBadge}
                </div>
                <div class="car-info">
                    <h3 class="car-title">${car.ten_xe}</h3>
                    <div class="car-features">
                        <span><i class="fas fa-car"></i> ${car.so_cho} chỗ</span>
                        <span><i class="fas fa-cog"></i> ${formatTransmission(car.hop_so)}</span>
                        <span><i class="fas fa-gas-pump"></i> ${formatFuel(car.nhien_lieu)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${car.dia_chi_xe}</span>
                    </div>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${car.danh_gia} (${car.so_chuyen} chuyến)</span>
                    </div>
                    <div class="price">
                        <span class="current-price">${formatCurrency(car.gia_thue)}/ngày</span>
                        ${originalPrice}
                    </div>
                </div>
            </div>
        `;
        
        productGrid.innerHTML += carElement;
    });
    
    // Thêm lại event listener cho các xe mới
    document.querySelectorAll('.product-item.clickable').forEach(item => {
        item.addEventListener('click', function() {
            const carId = this.getAttribute('data-car-id');
            window.location.href = `/views/ShowChiTietXe.html?id=${carId}`;
        });
    });
}

// Hàm định dạng loại hộp số
function formatTransmission(hopSo) {
    return hopSo === 'tu_dong' ? 'Số tự động' : 'Số sàn';
}

// Hàm định dạng loại nhiên liệu
function formatFuel(nhienLieu) {
    switch (nhienLieu) {
        case 'xang': return 'Xăng';
        case 'dau': return 'Dầu';
        case 'dien': return 'Điện';
        case 'hybrid': return 'Hybrid';
        default: return nhienLieu;
    }
}

// Hàm định dạng tiền tệ
function formatCurrency(amount) {
    const formattedAmount = Math.round(amount / 1000);
    return `${formattedAmount}K`;
}

// Dữ liệu mẫu xe nổi bật (sử dụng khi API chưa hoạt động)
function getSampleFeaturedCars() {
    return [
        {
            id: 1,
            ten_xe: 'KIA Sonet Deluxe 2024',
            hinh_anh: './image/kia-sonet.jpg',
            so_cho: 5,
            hop_so: 'tu_dong',
            nhien_lieu: 'xang',
            dia_chi_xe: 'TP.Thủ Đức, TP.HCM',
            danh_gia: 5.0,
            so_chuyen: 20,
            gia_thue: 731000,
            gia_goc: 791000,
            giam_gia: 7
        },
        {
            id: 2,
            ten_xe: 'Nissan Almera VL 2023',
            hinh_anh: './image/nissan-almera.jpg',
            so_cho: 5,
            hop_so: 'tu_dong',
            nhien_lieu: 'xang',
            dia_chi_xe: 'TP.Thủ Đức, TP.HCM',
            danh_gia: 5.0,
            so_chuyen: 16,
            gia_thue: 643000,
            gia_goc: 693000,
            giam_gia: 8
        },
        {
            id: 3,
            ten_xe: 'Mitsubishi Mirage 2017',
            hinh_anh: './image/mitsubishi-mirage.jpg',
            so_cho: 5,
            hop_so: 'so_san',
            nhien_lieu: 'xang',
            dia_chi_xe: 'Quận 1, TP.HCM',
            danh_gia: 4.8,
            so_chuyen: '100+',
            gia_thue: 359000,
            gia_goc: 459000,
            giam_gia: 25
        },
        {
            id: 4,
            ten_xe: 'MG5 Luxury 2022',
            hinh_anh: './image/mg5-luxury.jpg',
            so_cho: 5,
            hop_so: 'tu_dong',
            nhien_lieu: 'xang',
            dia_chi_xe: 'TP.Thủ Đức, TP.HCM',
            danh_gia: 5.0,
            so_chuyen: 9,
            gia_thue: 692000,
            gia_goc: 742000,
            giam_gia: 8
        }
    ];
}