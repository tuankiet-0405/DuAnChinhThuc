document.addEventListener('DOMContentLoaded', () => {

    // Header scroll handling
    
    const header = document.querySelector('.header');
    
    if (header) {
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
    
    if (lastScrollY < window.scrollY) {
    
    header.classList.add('header--hidden');
    
    } else {
    
    header.classList.remove('header--hidden');
    
    }
    
    lastScrollY = window.scrollY;
    
    });
    
    }
    
    // Mobile menu toggle
    
    const menuToggle = document.querySelector('.menu-toggle');
    
    const menuHeader = document.querySelector('.menu-header');
    
    if (menuToggle && menuHeader) {
    
    menuToggle.innerHTML = `
    
    <span></span>
    
    <span></span>
    
    <span></span>
    
    `;
    
    menuToggle.addEventListener('click', () => {
    
    menuToggle.classList.toggle('active');
    
    menuHeader.classList.toggle('active');
    
    });
    
    }
    
    // Modal handling with animations
    
    const modals = document.querySelectorAll('.modal');
    
    const openLoginBtn = document.getElementById('openLogin');
    
    const closeBtns = document.querySelectorAll('.close');
    
    const openModal = (modal) => {
    
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
    
    modal.classList.add('active');
    
    });
    
    };
    
    const closeModal = (modal) => {
    
    if (!modal) return;
    
    modal.classList.remove('active');
    
    setTimeout(() => {
    
    modal.style.display = 'none';
    
    document.body.style.overflow = '';
    
    }, 300);
    
    };
    
    if (openLoginBtn) {
    
    openLoginBtn.addEventListener('click', (e) => {
    
    e.preventDefault();
    
    const loginModal = document.getElementById('loginModal');
    
    openModal(loginModal);
    
    });
    
    }
    
    closeBtns.forEach(btn => {
    
    btn.addEventListener('click', () => {
    
    const modal = btn.closest('.modal');
    
    closeModal(modal);
    
    });
    
    });
    
    modals.forEach(modal => {
    
    modal.addEventListener('click', (e) => {
    
    if (e.target === modal) {
    
    closeModal(modal);
    
    }
    
    });
    
    });
    
    // Form validation with better UX
    
    const forms = document.querySelectorAll('form');
    
    const validateInput = (input) => {
    
    const error = input.parentNode.querySelector('.input-error');
    
    let isValid = true;
    
    let errorMessage = '';
    
    switch (input.type) {
    
    case 'tel':
    
    case 'number':
    
    if (input.name === 'phone') {
    
    isValid = /^(0[3|5|7|8|9])+([0-9]{8})$/.test(input.value);
    
    errorMessage = 'Số điện thoại không hợp lệ';
    
    }
    
    break;
    
    case 'password':
    
    isValid = input.value.length >= 6;
    
    errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự';
    
    break;
    
    case 'text':
    
    isValid = input.value.trim().length > 0;
    
    errorMessage = 'Trường này không được để trống';
    
    break;
    
    }
    
    if (!isValid && input.value) {
    
    error.textContent = errorMessage;
    
    input.classList.add('error');
    
    } else {
    
    error.textContent = '';
    
    input.classList.remove('error');
    
    }
    
    return isValid || !input.value;
    
    };
    
    if (forms.length > 0) {
    
    forms.forEach(form => {
    
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach(input => {
    
    const wrapper = document.createElement('div');
    
    wrapper.className = 'input-wrapper';
    
    input.parentNode.insertBefore(wrapper, input);
    
    wrapper.appendChild(input);
    
    const error = document.createElement('div');
    
    error.className = 'input-error';
    
    wrapper.appendChild(error);
    
    input.addEventListener('input', () => validateInput(input));
    
    });
    
    form.addEventListener('submit', (e) => {
    
    e.preventDefault();
    
    let isValid = true;
    
    inputs.forEach(input => {
    
    if (!validateInput(input)) {
    
    isValid = false;
    
    }
    
    });
    
    if (isValid) {
    
    const submitBtn = form.querySelector('[type="submit"]');
    
    if (submitBtn) {
    
    submitBtn.disabled = true;
    
    submitBtn.classList.add('loading');
    
    // Simulate form submission
    
    setTimeout(() => {
    
    submitBtn.disabled = false;
    
    submitBtn.classList.remove('loading');
    
    }, 1500);
    
    }
    
    }
    
    });
    
    });
    
    }
    
    // Enhanced form validation and submission
    
    let loginForm = document.getElementById('loginForm') || document.querySelector('.sign-in-form');
    
    if (loginForm) {
    
    const handleLogin = async (e) => {
    
    e.preventDefault();
    
    const username = document.querySelector('input[name="email"]')?.value;
    
    const password = document.querySelector('input[name="password"]')?.value;
    
    const errorElement = document.querySelector('.error-message') || createErrorElement();
    
    if (!username || !password) {
    
    showError(errorElement, 'Vui lòng nhập đầy đủ thông tin');
    
    return;
    
    }
    
    try {
    
    const response = await fetch('/auth/login', {
    
    method: 'POST',
    
    headers: {
    
    'Content-Type': 'application/json',
    
    },
    
    body: JSON.stringify({ username, password })
    
    });
    
    const data = await response.json();
    
    if (data.success) {
    
    showSuccess(errorElement, data.message);
    
    setTimeout(() => {
    
    window.location.href = data.redirectUrl || '/';
    
    }, 1000);
    
    } else {
    
    showError(errorElement, data.message);
    
    }
    
    } catch (error) {
    
    showError(errorElement, 'Lỗi kết nối, vui lòng thử lại sau');
    
    }
    
    };
    
    const createErrorElement = () => {
    
    const errorElement = document.createElement('div');
    
    errorElement.className = 'error-message';
    
    loginForm.insertBefore(errorElement, loginForm.firstChild);
    
    return errorElement;
    
    };
    
    const showError = (element, message) => {
    
    element.textContent = message;
    
    element.className = 'error-message error';
    
    element.style.display = 'block';
    
    };
    
    const showSuccess = (element, message) => {
    
    element.textContent = message;
    
    element.className = 'error-message success';
    
    element.style.display = 'block';
    
    };
    
    loginForm.addEventListener('submit', handleLogin);
    
    }
    
    // Logout functionality
    
    const logoutButton = document.querySelector('.logout-button');
    
    if (logoutButton) {
    
    logoutButton.addEventListener('click', async () => {
    
    try {
    
    const response = await fetch('/auth/logout', { method: 'POST' });
    
    const data = await response.json();
    
    if (data.success) window.location.href = '/login.html';
    
    } catch (error) {
    
    console.error('Logout error:', error);
    
    }
    
    });
    
    }
    
    // Lazy loading images
    
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window && lazyImages.length > 0) {
    
    const imageObserver = new IntersectionObserver((entries) => {
    
    entries.forEach(entry => {
    
    if (entry.isIntersecting) {
    
    const img = entry.target;
    
    img.src = img.dataset.src;
    
    img.classList.remove('lazy');
    
    imageObserver.unobserve(img);
    
    }
    
    });
    
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
    
    }
    
    // Smooth reveal animation for sections
    
    const revealSections = document.querySelectorAll('section');
    
    if (revealSections.length > 0) {
    
    const revealOnScroll = new IntersectionObserver((entries) => {
    
    entries.forEach(entry => {
    
    if (entry.isIntersecting) entry.target.classList.add('section--visible');
    
    });
    
    }, { threshold: 0.1 });
    
    revealSections.forEach(section => {
    
    section.classList.add('section--hidden');
    
    revealOnScroll.observe(section);
    
    });
    
    }
    
    // Smooth scroll for navigation
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    
    anchor.addEventListener('click', function(e) {
    
    e.preventDefault();
    
    const target = document.querySelector(this.getAttribute('href'));
    
    if (target) {
    
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    if (menuToggle && menuHeader) {
    
    menuToggle.classList.remove('active');
    
    menuHeader.classList.remove('active');
    
    }
    
    }
    
    });
    
    });
    
    // Password change form handling
    
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    
    if (passwordChangeForm) {
    
    const handlePasswordChange = async (e) => {
    
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword')?.value;
    
    const newPassword = document.getElementById('newPassword')?.value;
    
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
    
    alert('Mật khẩu mới không khớp!');
    
    return;
    
    }
    
    try {
    
    const response = await fetch('/api/change-password', {
    
    method: 'POST',
    
    headers: { 'Content-Type': 'application/json' },
    
    body: JSON.stringify({ currentPassword, newPassword })
    
    });
    
    const data = await response.json();
    
    if (response.ok) {
    
    alert('Đổi mật khẩu thành công!');
    
    passwordChangeForm.reset();
    
    } else {
    
    alert(data.message || 'Đổi mật khẩu thất bại!');
    
    }
    
    } catch (error) {
    
    alert('Có lỗi xảy ra, vui lòng thử lại sau!');
    
    }
    
    };
    
    passwordChangeForm.addEventListener('submit', handlePasswordChange);
    
    }
    
    // Registration form handling
    
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
    
    const handleRegister = async (e) => {
    
    e.preventDefault();
    
    const formData = {
    
    ho_ten: document.getElementById('registerName')?.value,
    
    email: document.getElementById('registerEmail')?.value,
    
    so_dien_thoai: document.getElementById('registerPhone')?.value,
    
    mat_khau: document.getElementById('registerPassword')?.value,
    
    gioi_tinh: document.querySelector('input[name="gioi_tinh"]:checked')?.value
    
    };
    
    // Validate form
    
    const errors = validateForm(formData, 'register');
    
    if (errors.length > 0) {
    
    alert(errors.join('\n'));
    
    return;
    
    }
    
    try {
    
    const response = await fetch('/auth/register', {
    
    method: 'POST',
    
    headers: { 'Content-Type': 'application/json' },
    
    body: JSON.stringify(formData)
    
    });
    
    const data = await response.json();
    
    if (response.ok) {
    
    alert('Đăng ký thành công!');
    
    window.location.href = '/views/login.html';
    
    } else {
    
    alert(data.message || 'Đăng ký thất bại');
    
    }
    
    } catch (error) {
    
    console.error('Lỗi đăng ký:', error);
    
    alert('Có lỗi xảy ra, vui lòng thử lại sau');
    
    }
    
    };
    
    const validateForm = (formData, type) => {
    
    const errors = [];
    
    if (type === 'register') {
    
    if (!formData.ho_ten || formData.ho_ten.length < 2) {
    
    errors.push('Họ tên phải có ít nhất 2 ký tự');
    
    }
    
    if (!formData.so_dien_thoai || !/^[0-9]{10}$/.test(formData.so_dien_thoai)) {
    
    errors.push('Số điện thoại không hợp lệ');
    
    }
    
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    
    errors.push('Email không hợp lệ');
    
    }
    
    if (!formData.mat_khau || formData.mat_khau.length < 6) {
    
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    
    }
    
    return errors;
    
    };
    
    registerForm.addEventListener('submit', handleRegister);
    
    }
    
    // Toggle password visibility
    
    const togglePasswordVisibility = (inputId, iconId) => {
    
    const passwordInput = document.getElementById(inputId);
    
    const icon = document.getElementById(iconId);
    
    if (!passwordInput || !icon) return;
    
    if (passwordInput.type === 'password') {
    
    passwordInput.type = 'text';
    
    icon.classList.replace('fa-eye', 'fa-eye-slash');
    
    } else {
    
    passwordInput.type = 'password';
    
    icon.classList.replace('fa-eye-slash', 'fa-eye');
    
    }
    
    };
    
    // Initialize event listeners for password toggles
    
    document.querySelectorAll('.toggle-password').forEach(button => {
    
    button.addEventListener('click', () => {
    
    const targetInput = button.getAttribute('data-target');
    
    const targetIcon = button.getAttribute('data-icon');
    
    togglePasswordVisibility(targetInput, targetIcon);
    
    });
    
    });
    
    });
    
    window.addEventListener('load', () => {
    
    document.querySelector('.loading-indicator')?.remove();
    
    document.querySelector('.page-transition')?.classList.remove('active');
    
    });