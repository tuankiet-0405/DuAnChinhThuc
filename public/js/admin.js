// Kiểm tra đăng nhập admin
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') || sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        window.location.href = '/views/AdminLogin.html';
    }
}

// Xử lý đăng xuất
function handleAdminLogout() {
    // Xóa session storage
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    
    // Xóa local storage 
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');

    // Gọi API đăng xuất
    fetch('/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Chuyển về trang đăng nhập
            window.location.href = '/views/AdminLogin.html';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Vẫn chuyển về trang đăng nhập trong trường hợp lỗi
        window.location.href = '/views/AdminLogin.html';
    });
}

// Thêm sự kiện click cho nút đăng xuất
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập khi load trang
    checkAdminLogin();

    // Thêm sự kiện cho nút đăng xuất
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                handleAdminLogout();
            }
        });
    }
});