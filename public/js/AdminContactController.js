document.addEventListener('DOMContentLoaded', function() {
    // Verify DOM elements and Bootstrap is loaded
    console.log('DOM fully loaded for AdminContactController');
    
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap không được tải. Vui lòng kiểm tra lại.');
        Swal.fire('Lỗi', 'Không thể tải trang. Bootstrap không được tìm thấy.', 'error');
        return;
    }
    console.log('Bootstrap version available:', bootstrap.Modal ? 'Modal is available' : 'Modal is NOT available');
    
    const modalElement = document.getElementById('contactDetailModal');
    if (!modalElement) {
        console.error('Modal element #contactDetailModal not found in the document');
        // Don't necessarily stop everything, but log it.
    } else {
        console.log('Modal element #contactDetailModal found:', modalElement);
    }
    
    loadContacts();
    setupEventListeners();
});

let contacts = [];
let contactDetailModalInstance = null; // To store modal instance

function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('filterStatus').value = this.getAttribute('data-status');
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterContacts();
        });
    });
    
    document.getElementById('searchInput').addEventListener('input', filterContacts);
    
    // Export to Excel button
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    } else {
        console.warn("Export button #exportExcelBtn not found");
    }
    
    // Event delegation for dynamic buttons within the contact list
    const contactListTbody = document.getElementById('contactList');
    if (contactListTbody) {
        contactListTbody.addEventListener('click', function(event) {
            const viewButton = event.target.closest('.view-detail');
            const completeButton = event.target.closest('.mark-completed');

            if (viewButton) {
                const contactId = viewButton.getAttribute('data-id');
                viewDetail(contactId);
            } else if (completeButton) {
                const contactId = completeButton.getAttribute('data-id');
                markAsCompleted(contactId);
            }
        });
    } else {
        console.error("Element with ID 'contactList' not found for event delegation.");
    }

    // Modal related buttons (if they are outside the dynamically loaded modal content)
    const modalSendResponseButton = document.getElementById('btnSendResponseModal');
    if (modalSendResponseButton) {
        modalSendResponseButton.addEventListener('click', sendResponse);
    }
    const modalMarkAsCompletedButton = document.getElementById('btnMarkAsCompletedModal');
    if (modalMarkAsCompletedButton) {
        // This button's action might need the current contact ID, typically set when modal is shown
        // For now, just logging. Actual logic is in viewDetail or a separate handler.
        modalMarkAsCompletedButton.addEventListener('click', () => {
            const contactId = modalMarkAsCompletedButton.dataset.contactId; // Assuming ID is stored on button
            if (contactId) {
                markAsCompleted(contactId, true); // true to indicate it's from modal
            } else {
                console.error("Contact ID not found on modal's mark as completed button");
                Swal.fire('Lỗi', 'Không tìm thấy ID liên hệ để đánh dấu hoàn thành.', 'error');
            }
        });
    }
}

// Removed old showLoading and hideLoading which created an overlay.
// We will now directly manipulate the visibility of #loadingState, #contactsTableContainer, #emptyState

function showToast(message, type = 'success') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

async function loadContacts() {
    const loadingState = document.getElementById('loadingState');
    const contactsTableContainer = document.getElementById('contactsTableContainer');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');

    if (!loadingState || !contactsTableContainer || !emptyState || !paginationContainer) {
        console.error('Một hoặc nhiều phần tử DOM chính (loading, table, empty, pagination) không tìm thấy.');
        Swal.fire('Lỗi Giao Diện', 'Không thể khởi tạo giao diện quản lý liên hệ. Vui lòng thử làm mới trang.', 'error');
        return;
    }

    loadingState.style.display = 'block';
    contactsTableContainer.style.display = 'none';
    emptyState.style.display = 'none';
    paginationContainer.style.display = 'none';
    
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            showToast('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn', 'error');
            setTimeout(() => { window.location.href = 'AdminLogin.html'; }, 2000);
            loadingState.style.display = 'none'; // Hide loading before redirect
            emptyState.style.display = 'block'; // Show empty/error state
            emptyState.innerHTML = '<p class="lead text-danger">Phiên làm việc hết hạn. Đang chuyển hướng...</p>';
            return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/admin/contact/contacts');
        
        contacts = response.data;
        console.log('Số lượng liên hệ nhận được:', contacts.length);
        
        updateStatistics();
        // Initially display all contacts, then apply filters if any are set (e.g. from remembered state)
        // For now, just display all and let user filter.
        displayContacts(contacts); 

        loadingState.style.display = 'none';
        if (contacts.length > 0) {
            contactsTableContainer.style.display = 'block';
            paginationContainer.style.display = 'block'; // Show pagination if there's data
            emptyState.style.display = 'none';
        } else {
            contactsTableContainer.style.display = 'none';
            paginationContainer.style.display = 'none';
            emptyState.style.display = 'block';
        }

    } catch (error) {
        console.error('Lỗi khi tải danh sách liên hệ:', error);
        loadingState.style.display = 'none';
        contactsTableContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
        emptyState.style.display = 'block';
        
        let errorMessage = 'Không thể tải danh sách liên hệ.';
        if (error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                errorMessage = 'Bạn không có quyền truy cập hoặc phiên đã hết hạn.';
                setTimeout(() => { window.location.href = 'AdminLogin.html'; }, 2500);
            } else {
                errorMessage = `Lỗi từ máy chủ (${error.response.status}): ${error.response.data.message || 'Không có thông tin chi tiết'}`;
            }
        } else if (error.request) {
            errorMessage = 'Không nhận được phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
        }
        
        emptyState.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">Lỗi Tải Dữ Liệu</h5>
                <p class="text-muted">${errorMessage}</p>
                <button class="btn btn-primary mt-2" onclick="loadContacts()">
                    <i class="fas fa-sync-alt me-1"></i>Thử lại
                </button>
            </div>
        `;
        showToast(errorMessage, 'error');
    }
}

function updateStatistics() {
    const total = contacts.length;
    const pending = contacts.filter(c => c.status === 'new' || c.status === 'pending').length; // Adjusted to include 'pending' if used
    const completed = contacts.filter(c => c.status === 'completed').length;

    document.getElementById('totalContacts').textContent = total;
    document.getElementById('pendingContacts').textContent = pending;
    document.getElementById('completedContacts').textContent = completed;
}

function displayContacts(contactsToDisplay) {
    const tbody = document.getElementById('contactList');
    const emptyState = document.getElementById('emptyState');
    const contactsTableContainer = document.getElementById('contactsTableContainer');
    const paginationContainer = document.getElementById('paginationContainer');

    if (!tbody || !emptyState || !contactsTableContainer || !paginationContainer) {
        console.error("Một hoặc nhiều phần tử DOM (tbody, emptyState, contactsTableContainer, paginationContainer) không tìm thấy trong displayContacts.");
        return;
    }
    
    tbody.innerHTML = ''; // Clear previous rows
    
    if (!contactsToDisplay || contactsToDisplay.length === 0) {
        emptyState.style.display = 'block';
        contactsTableContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
        // Ensure the empty state message is appropriate for no data vs. error
        emptyState.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-envelope-open fa-4x text-muted mb-3"></i>
                <p class="lead text-muted">Không có dữ liệu liên hệ nào.</p>
                <p>Vui lòng thử lại với bộ lọc khác hoặc kiểm tra sau.</p>
            </div>
        `;
        return;
    }
    
    emptyState.style.display = 'none';
    contactsTableContainer.style.display = 'block';
    paginationContainer.style.display = 'block'; // Show pagination if there's data
    
    contactsToDisplay.forEach((contact, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', contact.id);
        
        let statusBadgeClass = 'bg-secondary'; // Default
        if (contact.status === 'new' || contact.status === 'pending') {
            statusBadgeClass = 'bg-warning text-dark';
        } else if (contact.status === 'completed') {
            statusBadgeClass = 'bg-success';
        }

        tr.innerHTML = `
            <td class="ps-3">${index + 1}</td>
            <td>${contact.ten || 'N/A'}</td>
            <td>
                <div><i class="fas fa-envelope fa-fw me-2 text-muted"></i>${contact.email || 'N/A'}</div>
                <div><i class="fas fa-phone fa-fw me-2 text-muted"></i>${contact.so_dien_thoai || 'N/A'}</div>
            </td>
            <td>${contact.tieu_de || 'N/A'}</td>
            <td><i class="fas fa-calendar-alt fa-fw me-2 text-muted"></i>${formatDate(contact.tao_luc) || 'N/A'}</td>
            <td><span class="badge ${statusBadgeClass}">${getStatusText(contact.status)}</span></td>
            <td class="text-center pe-3">
                <button type="button" class="btn btn-sm btn-outline-primary view-detail me-1" data-id="${contact.id}" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                ${(contact.status === 'new' || contact.status === 'pending') ? `
                    <button type="button" class="btn btn-sm btn-outline-success mark-completed" data-id="${contact.id}" title="Đánh dấu đã xử lý">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    // TODO: Implement or call pagination logic here if not already handled
}

// Helper function to get current filter status from the hidden select
function getFilterStatus() {
    const filterSelect = document.getElementById('filterStatus');
    return filterSelect ? filterSelect.value : 'all';
}

// Helper function to get current search input
function getSearchInput() {
    const searchInput = document.getElementById('searchInput');
    return searchInput ? searchInput.value : '';
}

function filterContacts() {
    const currentFilterStatus = getFilterStatus();
    const search = getSearchInput().toLowerCase().trim(); // Trim whitespace from search input

    console.log(`Filtering with status: "${currentFilterStatus}", search: "${search}"`);

    const filtered = contacts.filter(contact => {
        let matchStatus = false;
        if (currentFilterStatus === 'all') {
            matchStatus = true;
        } else if (currentFilterStatus === 'pending') {
            // Match 'new' or 'pending' for the "Chưa xử lý" filter
            matchStatus = (contact.status === 'new' || contact.status === 'pending');
        } else {
            matchStatus = contact.status === currentFilterStatus;
        }
        
        const matchSearch = search === '' || 
            (contact.ten && contact.ten.toLowerCase().includes(search)) ||
            (contact.email && contact.email.toLowerCase().includes(search)) ||
            (contact.so_dien_thoai && contact.so_dien_thoai.includes(search)) ||
            (contact.tieu_de && contact.tieu_de.toLowerCase().includes(search));
        
        return matchStatus && matchSearch;
    });

    console.log('Filtered contacts count:', filtered.length);
    displayContacts(filtered);
    // Note: Pagination should also be updated based on filtered results.
    // updatePagination(filtered); // Placeholder for pagination update
}

async function viewDetail(contactId) {
    const modalElement = document.getElementById('contactDetailModal');
    if (!contactDetailModalInstance) {
        if (modalElement) {
            contactDetailModalInstance = new bootstrap.Modal(modalElement);
        } else {
            console.error("Modal element #contactDetailModal not found for instantiation.");
            Swal.fire('Lỗi', 'Không thể hiển thị chi tiết liên hệ. Phần tử modal bị thiếu.', 'error');
            return;
        }
    }

    const modalLoading = document.getElementById('modalLoadingState');
    const modalContent = document.getElementById('modalContentArea');
    
    modalLoading.style.display = 'block';
    modalContent.style.display = 'none';
    contactDetailModalInstance.show();

    try {
        const token = localStorage.getItem('adminToken');
        if (!token) { /* ... handle no token ... */ return; }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Assuming an endpoint like /api/admin/contact/contacts/:id
        const response = await axios.get(`/api/admin/contact/contacts/${contactId}`);
        const contact = response.data;

        document.getElementById('modalName').textContent = contact.ten || 'N/A';
        document.getElementById('modalEmail').textContent = contact.email || 'N/A';
        document.getElementById('modalPhone').textContent = contact.so_dien_thoai || 'N/A';
        document.getElementById('modalDate').textContent = formatDate(contact.tao_luc, true) || 'N/A'; // true for detailed format
        document.getElementById('modalSubject').textContent = contact.tieu_de || 'N/A';
        document.getElementById('modalMessage').textContent = contact.noi_dung || 'N/A';
        
        const statusBadge = document.getElementById('modalStatusBadge');
        statusBadge.textContent = getStatusText(contact.status);
        statusBadge.className = 'badge'; // Reset classes
        if (contact.status === 'new' || contact.status === 'pending') {
            statusBadge.classList.add('bg-warning', 'text-dark');
        } else if (contact.status === 'completed') {
            statusBadge.classList.add('bg-success');
        } else {
            statusBadge.classList.add('bg-secondary');
        }

        const responseDisplaySection = document.getElementById('responseDisplaySection');
        const modalResponseContentDisplay = document.getElementById('modalResponseContentDisplay');
        if (contact.phan_hoi && contact.phan_hoi.trim() !== '') {
            modalResponseContentDisplay.textContent = contact.phan_hoi;
            responseDisplaySection.style.display = 'block';
        } else {
            responseDisplaySection.style.display = 'none';
        }
        
        document.getElementById('modalResponse').value = ''; // Clear previous response input

        // Control visibility of action buttons in modal footer
        const btnMarkAsCompletedModal = document.getElementById('btnMarkAsCompletedModal');
        const btnSendResponseModal = document.getElementById('btnSendResponseModal');
        const sendResponseSection = document.getElementById('sendResponseSection');

        if (contact.status === 'new' || contact.status === 'pending') {
            btnMarkAsCompletedModal.style.display = 'inline-block';
            btnSendResponseModal.style.display = 'inline-block';
            sendResponseSection.style.display = 'block';
            btnMarkAsCompletedModal.dataset.contactId = contact.id; // Store ID for the button
            btnSendResponseModal.dataset.contactId = contact.id;
        } else {
            btnMarkAsCompletedModal.style.display = 'none';
            btnSendResponseModal.style.display = 'none';
            sendResponseSection.style.display = 'none'; // Hide if already completed
        }

        modalLoading.style.display = 'none';
        modalContent.style.display = 'block';

    } catch (error) {
        console.error(`Lỗi khi tải chi tiết liên hệ ${contactId}:`, error);
        modalLoading.style.display = 'none';
        modalContent.style.display = 'block'; // Show content area to display error
        modalContent.innerHTML = '<p class="text-danger">Không thể tải chi tiết liên hệ. Vui lòng thử lại.</p>';
        showToast('Lỗi tải chi tiết liên hệ', 'error');
    }
}

async function markAsCompleted(contactId, fromModal = false) {
    Swal.fire({
        title: 'Xác nhận',
        text: "Bạn có chắc chắn muốn đánh dấu liên hệ này là đã xử lý?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745', // success color
        cancelButtonColor: '#6c757d', // secondary color
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) { /* ... handle no token ... */ return; }
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Assuming endpoint /api/admin/contact/contacts/:id/complete
                await axios.put(`/api/admin/contact/contacts/${contactId}/complete`);
                
                showToast('Đã cập nhật trạng thái thành công!', 'success');
                loadContacts(); // Refresh list

                if (fromModal && contactDetailModalInstance) {
                    contactDetailModalInstance.hide();
                }
            } catch (error) {
                console.error(`Lỗi khi đánh dấu hoàn thành liên hệ ${contactId}:`, error);
                let errorMsg = 'Không thể cập nhật trạng thái.';
                if(error.response && error.response.data && error.response.data.message){
                    errorMsg = error.response.data.message;
                }
                showToast(errorMsg, 'error');
            }
        }
    });
}

async function sendResponse() {
    // This function is now triggered by btnSendResponseModal
    const contactId = document.getElementById('btnSendResponseModal').dataset.contactId;
    const responseText = document.getElementById('modalResponse').value;

    if (!contactId) {
        showToast('Không tìm thấy ID liên hệ để gửi phản hồi.', 'error');
        return;
    }
    if (!responseText.trim()) {
        showToast('Vui lòng nhập nội dung phản hồi.', 'warning');
        return;
    }

    Swal.fire({
        title: 'Xác nhận gửi',
        text: "Gửi phản hồi này cho người dùng?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd', // primary color
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Gửi',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) { /* ... handle no token ... */ return; }
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Assuming endpoint /api/admin/contact/contacts/:id/respond
                await axios.post(`/api/admin/contact/contacts/${contactId}/respond`, { phan_hoi: responseText });
                
                showToast('Phản hồi đã được gửi thành công!', 'success');
                loadContacts(); // Refresh list to show updated status or info

                if (contactDetailModalInstance) {
                    contactDetailModalInstance.hide();
                }
            } catch (error) {
                console.error(`Lỗi khi gửi phản hồi cho liên hệ ${contactId}:`, error);
                let errorMsg = 'Không thể gửi phản hồi.';
                if(error.response && error.response.data && error.response.data.message){
                    errorMsg = error.response.data.message;
                }
                showToast(errorMsg, 'error');
            }
        }
    });
}


function formatDate(dateString, detailed = false) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Ngày không hợp lệ';
        }
        if (detailed) {
            return date.toLocaleString('vi-VN', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', second: '2-digit' 
            });
        }
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Lỗi ngày";
    }
}

function getStatusText(status) {
    switch (status) {
        case 'new': return 'Mới';
        case 'pending': return 'Đang chờ'; // If you use 'pending'
        case 'completed': return 'Đã xử lý';
        default: return status || 'Không rõ';
    }
}

function exportToExcel() {
    const status = getFilterStatus();
    const search = getSearchInput().toLowerCase();

    const dataToExport = contacts.filter(contact => {
        const matchStatus = status === 'all' || contact.status === status;
        const matchSearch = search === '' || 
            (contact.ten && contact.ten.toLowerCase().includes(search)) ||
            (contact.email && contact.email.toLowerCase().includes(search)) ||
            (contact.so_dien_thoai && contact.so_dien_thoai.includes(search)) ||
            (contact.tieu_de && contact.tieu_de.toLowerCase().includes(search));
        return matchStatus && matchSearch;
    }).map(contact => ({
        'ID': contact.id,
        'Họ Tên': contact.ten,
        'Email': contact.email,
        'Số Điện Thoại': contact.so_dien_thoai,
        'Chủ Đề': contact.tieu_de,
        'Nội Dung': contact.noi_dung,
        'Ngày Gửi': formatDate(contact.tao_luc, true),
        'Trạng Thái': getStatusText(contact.status),
        'Phản Hồi': contact.phan_hoi || ''
    }));

    if (dataToExport.length === 0) {
        showToast('Không có dữ liệu để xuất dựa trên bộ lọc hiện tại.', 'warning');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachLienHe");

    // Styling (optional, basic example)
    // worksheet['!cols'] = [ {wch:5}, {wch:20}, {wch:30}, {wch:15}, {wch:25}, {wch:40}, {wch:20}, {wch:15}, {wch:40} ];

    XLSX.writeFile(workbook, "DanhSachLienHe.xlsx");
    showToast('Đã xuất dữ liệu ra Excel thành công!', 'success');
}

// Make sure adminAuth.js is loaded and checkAuth is called
// This is usually handled in the HTML file itself, but good to keep in mind.
// Example:
// document.addEventListener('DOMContentLoaded', function() {
//     if (typeof checkAuth === 'function') {
//         checkAuth(); 
//     }
// });
