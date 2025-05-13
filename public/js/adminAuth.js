// Chức năng quản lý xác thực Admin
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xác thực Admin khi trang được tải
    checkAdminAuth();

    // Xử lý sự kiện đăng xuất
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutAdmin();
        });
    }
});

// Kiểm tra xem người dùng đã đăng nhập với quyền admin chưa
function checkAdminAuth() {
    console.log('Checking admin authentication...');
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    // Nếu không có token hoặc thông tin người dùng, chuyển hướng về trang đăng nhập
    if (!adminToken || !adminUser) {
        console.log('No admin token or user found, redirecting to login');
        redirectToAdminLogin();
        return;
    }
    
    try {
        // Kiểm tra thông tin người dùng
        const user = JSON.parse(adminUser);
        
        // Log để debug
        console.log('Admin user from localStorage:', user);
        console.log('User role:', user.loai_tai_khoan);
        
        if (!user || user.loai_tai_khoan !== 'admin') {
            console.log('User is not admin, redirecting to login');
            redirectToAdminLogin();
            return;
        }
        
        // Cập nhật UI với thông tin admin nếu cần
        updateAdminUI(user);
        
        // Set global axios Authorization header
        if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
            console.log('Set global axios authorization header');
        }
        
    } catch (error) {
        console.error('Lỗi khi kiểm tra xác thực admin:', error);
        redirectToAdminLogin();
    }
}

// Cập nhật giao diện người dùng với thông tin admin
function updateAdminUI(user) {
    // Hiển thị tên admin trong header nếu có phần tử tương ứng
    const adminNameElement = document.querySelector('.admin-name');
    if (adminNameElement && user.ho_ten) {
        adminNameElement.textContent = user.ho_ten;
    }
}

// Đăng xuất admin
function logoutAdmin() {
    // Hiển thị thông báo xác nhận
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Xóa thông tin đăng nhập từ localStorage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Gọi API đăng xuất nếu cần
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .finally(() => {
            // Chuyển hướng về trang đăng nhập admin
            redirectToAdminLogin();
        });
    }
}

// Chuyển hướng về trang đăng nhập admin
function redirectToAdminLogin() {
    window.location.href = '/views/AdminLogin.html';
}
