// Validate form data
function validateForm(formData) {
    const errors = {};
    
    // Validate name
    if (!formData.ten.trim()) {
        errors.ten = 'Vui lòng nhập họ tên';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
        errors.email = 'Email không hợp lệ';
    }

    // Validate phone
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!formData.so_dien_thoai.trim() || !phoneRegex.test(formData.so_dien_thoai)) {
        errors.so_dien_thoai = 'Số điện thoại không hợp lệ';
    }

    // Validate subject
    if (!formData.tieu_de.trim()) {
        errors.tieu_de = 'Vui lòng nhập chủ đề';
    }

    // Validate message
    if (!formData.noi_dung.trim()) {
        errors.noi_dung = 'Vui lòng nhập nội dung';
    }

    return errors;
}

// Display error messages
function showErrors(errors) {
    // Clear all previous errors
    document.querySelectorAll('.form-error').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });

    // Show new errors
    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.style.display = 'block';
        }
    });
}

// Show alert message
function showAlert(type, message, duration = 3000) {
    const messageStatus = document.getElementById('messageStatus');
    const messageText = document.getElementById('messageText');
    const icon = messageStatus.querySelector('.fas');

    messageStatus.className = 'message-status';
    icon.className = 'fas';

    if (type === 'success') {
        messageStatus.classList.add('success');
        icon.classList.add('fa-check-circle');
        messageText.textContent = message || 'Gửi thông tin thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.';
    } else {
        messageStatus.classList.add('error');
        icon.classList.add('fa-exclamation-circle');
        messageText.textContent = message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
    }

    messageStatus.style.display = 'block';

    setTimeout(() => {
        messageStatus.style.display = 'none';
    }, duration);
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    // Get form data
    const form = event.target;
    const formData = {
        ten: form.ten.value,
        email: form.email.value,
        so_dien_thoai: form.so_dien_thoai.value,
        tieu_de: form.tieu_de.value,
        noi_dung: form.noi_dung.value
    };

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
        showErrors(errors);
        return;
    }

    // Disable submit button
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert('success', data.message); // Pass server message for success
            form.reset();
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Đã gửi thành công';
        } else {
            // Pass server's error message, or a default if server message is missing
            showAlert('error', data.message || 'Máy chủ đã phản hồi với lỗi không xác định.');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi lại';
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        // Specific message for fetch/network errors
        showAlert('error', 'Không thể gửi yêu cầu. Vui lòng kiểm tra kết nối mạng và thử lại.');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi lại';
    } finally {
        submitBtn.disabled = false;
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi ngay';
        }, 3000);
    }
}
