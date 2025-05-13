/**
 * Export contacts to Excel format
 * This script provides Excel export functionality for the Admin Contact Management page
 */

// Function to export contacts to Excel format
function exportContactsToExcel() {
    try {
        if (typeof showToast !== 'function') {
            alert('Đang chuẩn bị tải xuống...');
        } else {
            showToast('Đang chuẩn bị tải xuống...', 'success');
        }
        
        // Get the filtered contacts from the global contacts array
        const filteredContacts = getFilteredContacts();
        
        // Create a table structure for the Excel file
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Chủ đề</th>
                        <th>Nội dung</th>
                        <th>Ngày gửi</th>
                        <th>Trạng thái</th>
                        <th>Phản hồi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add data rows
        filteredContacts.forEach((contact, index) => {
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${contact.ten || ''}</td>
                    <td>${contact.email || ''}</td>
                    <td>${contact.so_dien_thoai || ''}</td>
                    <td>${contact.tieu_de || ''}</td>
                    <td>${contact.noi_dung || ''}</td>
                    <td>${formatDate(contact.tao_luc, true)}</td>
                    <td>${getStatusText(contact.status)}</td>
                    <td>${contact.phan_hoi || ''}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        // Create a Blob for the Excel file
        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        
        // Create a link and click it to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'danh-sach-lien-he.xls';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        
        if (typeof showToast !== 'function') {
            alert('Đã tải xuống thành công!');
        } else {
            showToast('Đã tải xuống thành công!', 'success');
        }
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        
        if (typeof showToast !== 'function') {
            alert('Không thể xuất file Excel: ' + error.message);
        } else {
            showToast('Không thể xuất file Excel: ' + error.message, 'error');
        }
    }
}

// Helper function to get the filtered contacts
function getFilteredContacts() {
    const status = getFilterStatus();
    const search = getSearchInput().toLowerCase();
    
    // Make sure contacts array exists
    if (!window.contacts || !Array.isArray(window.contacts)) {
        return [];
    }
    
    return window.contacts.filter(contact => {
        const matchStatus = status === '' || contact.status === status;
        const matchSearch = search === '' || 
            (contact.ten && contact.ten.toLowerCase().includes(search)) ||
            (contact.email && contact.email.toLowerCase().includes(search)) ||
            (contact.so_dien_thoai && contact.so_dien_thoai.includes(search)) ||
            (contact.tieu_de && contact.tieu_de.toLowerCase().includes(search)) ||
            (contact.noi_dung && contact.noi_dung.toLowerCase().includes(search));
        
        return matchStatus && matchSearch;
    });
}

// Helper function to get current filter status
function getFilterStatus() {
    const filterSelect = document.getElementById('filterStatus');
    return filterSelect ? filterSelect.value : '';
}

// Helper function to get current search input
function getSearchInput() {
    const searchInput = document.getElementById('searchInput');
    return searchInput ? searchInput.value : '';
}

// Add event listener to export button when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('exportExcel');
    if (exportButton) {
        exportButton.addEventListener('click', exportContactsToExcel);
    }
});
