document.addEventListener('DOMContentLoaded', () => {
    // Header scroll handling
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (lastScrollY < window.scrollY) {
            header.classList.add('header--hidden');
        } else {
            header.classList.remove('header--hidden');
        }
        lastScrollY = window.scrollY;
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const menuHeader = document.querySelector('.menu-header');
    
    if (menuToggle) {
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
    
    function openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }
    
    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
    
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
            
            input.addEventListener('input', () => {
                validateInput(input);
            });
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
                // Add loading state
                const submitBtn = form.querySelector('[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('loading');
                }
                
                // Simulate form submission
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('loading');
                    // Here you would normally submit the form
                }, 1500);
            }
        });
    });
    
    function validateInput(input) {
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
    }

    // Enhanced form validation and submission
    const loginForm = document.getElementById('loginForm') || document.querySelector('.sign-in-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.querySelector('input[name="username"]').value;
            const password = document.querySelector('input[name="password"]').value;
            const errorElement = document.querySelector('.error-message') || createErrorElement();

            // Basic validation
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
                        window.location.href = data.redirectUrl;
                    }, 1000);
                } else {
                    showError(errorElement, data.message);
                }
            } catch (error) {
                showError(errorElement, 'Lỗi kết nối, vui lòng thử lại sau');
            }
        });
    }

    function createErrorElement() {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        const form = document.querySelector('.sign-in-form');
        form.insertBefore(errorElement, form.firstChild);
        return errorElement;
    }

    function showError(element, message) {
        element.textContent = message;
        element.className = 'error-message error';
        element.style.display = 'block';
    }

    function showSuccess(element, message) {
        element.textContent = message;
        element.className = 'error-message success';
        element.style.display = 'block';
    }

    // Logout functionality
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/auth/logout', {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/login.html';
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    // Xử lý form đăng xuất
    function showLogoutModal() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
        }
    }

    function hideLogoutModal() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

    // Thêm sự kiện click cho nút đăng xuất
    const logoutButtonModal = document.querySelector('.logout-button');
    if (logoutButtonModal) {
        logoutButtonModal.addEventListener('click', showLogoutModal);
    }

    const cancelButton = document.querySelector('.logout-cancel');
    if (cancelButton) {
        cancelButton.addEventListener('click', hideLogoutModal);
    }

    // Đóng modal khi click ra ngoài
    window.addEventListener('click', function(event) {
        const logoutModal = document.querySelector('.logout-modal');
        if (event.target === logoutModal) {
            hideLogoutModal();
        }
    });

    // Lazy loading images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Smooth reveal animation for sections
    const revealSections = document.querySelectorAll('section');
    
    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section--visible');
            }
        });
    }, {
        threshold: 0.1
    });

    revealSections.forEach(section => {
        section.classList.add('section--hidden');
        revealOnScroll.observe(section);
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                menuToggle?.classList.remove('active');
                menuHeader?.classList.remove('active');
            }
        });
    });

    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    document.body.appendChild(loadingIndicator);

    // Add page transition element
    const pageTransition = document.createElement('div');
    pageTransition.className = 'page-transition';
    document.body.appendChild(pageTransition);

    // Handle page transitions
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && !link.target && !link.hasAttribute('download') && !link.classList.contains('no-transition')) {
            e.preventDefault();
            const href = link.href;
            
            pageTransition.classList.add('active');
            loadingIndicator.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = href;
            }, 500);
        }
    });

    // Handle image loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.parentElement.classList.add('img-loading');
        img.addEventListener('load', () => {
            img.parentElement.classList.remove('img-loading');
        });
    });

    // Add smooth reveal for cards and sections
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section--visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px'
    };

    const revealObserver = new IntersectionObserver(observerCallback, observerOptions);

    document.querySelectorAll('.product-item, .feature-card, .content-section, .box2').forEach(el => {
        el.classList.add('section--hidden');
        revealObserver.observe(el);
    });

    // Password change form handling
    function togglePassword(inputId) {
        const passwordInput = document.getElementById(inputId);
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    }

    document.getElementById('passwordChangeForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới không khớp!');
            return;
        }

        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Đổi mật khẩu thành công!');
                document.getElementById('passwordChangeForm').reset();
            } else {
                alert(data.message || 'Đổi mật khẩu thất bại!');
            }
        } catch (error) {
            alert('Có lỗi xảy ra, vui lòng thử lại sau!');
        }
    });

    // Toggle password visibility
    function togglePasswordVisibility(inputId, iconId) {
        const passwordInput = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    document.getElementById('passwordChangeForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }

        if (newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Đổi mật khẩu thành công!');
                // Clear the form
                document.getElementById('passwordChangeForm').reset();
            } else {
                alert(data.message || 'Có lỗi xảy ra khi đổi mật khẩu!');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi đổi mật khẩu!');
        }
    });

    // Hàm kiểm tra form
    function validateForm(formData, type) {
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
    }

    // Xử lý đăng ký
    async function handleRegister(event) {
        event.preventDefault();
        
        // Lấy dữ liệu từ form
        const formData = {
            ho_ten: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            so_dien_thoai: document.getElementById('registerPhone').value,
            mat_khau: document.getElementById('registerPassword').value,
            gioi_tinh: document.querySelector('input[name="gioi_tinh"]:checked')?.value
        };

        console.log('Sending registration data:', formData);
        
        // Validate form
        const errors = validateForm(formData, 'register');
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }
        
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            console.log('Server response:', data);
            
            if (response.ok) {
                alert('Đăng ký thành công!');
                // Chuyển đến trang đăng nhập sau khi đăng ký thành công
                window.location.href = '/views/login.html';
            } else {
                alert(data.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại sau');
        }
    }

    // Remove duplicate event listeners
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Remove any existing listeners
        const newRegisterForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
        
        // Add single event listener
        newRegisterForm.addEventListener('submit', handleRegister);
    }

    // Xử lý đăng nhập
    async function handleLogin(event) {
        event.preventDefault();
        
        const formData = {
            email: document.getElementById('loginEmail').value,
            mat_khau: document.getElementById('loginPassword').value
        };

        // Lưu thông tin remember me
        const rememberMe = document.getElementById('rememberMe').checked;
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', formData.email);
            localStorage.setItem('rememberMe', 'true');
        }
        
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Chuyển hướng ngay lập tức về trang chủ sau khi đăng nhập thành công
                window.location.replace('/');
            } else {
                // Hiển thị lỗi
                const errorElement = document.getElementById('loginEmailError');
                if (errorElement) {
                    errorElement.textContent = data.message || 'Đăng nhập thất bại';
                    errorElement.style.display = 'block';
                } else {
                    alert(data.message || 'Đăng nhập thất bại');
                }
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại sau');
        }
    }
    
    // Thêm event listener cho form đăng nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Xử lý đăng xuất
    async function handleLogout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
            });
            
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
        }
    }

    // Kiểm tra trạng thái đăng nhập và hiển thị tên người dùng
    async function checkAuthStatus() {
        try {
            const response = await fetch('/auth/me');
            const data = await response.json();
            
            if (response.ok) {
                // User đã đăng nhập
                document.querySelectorAll('.auth-required').forEach(el => {
                    el.style.display = 'block';
                });
                document.querySelectorAll('.guest-only').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Hiển thị tên người dùng
                const userNameElements = document.querySelectorAll('.user-name');
                userNameElements.forEach(el => {
                    el.textContent = data.ho_ten;
                });

                // Hiển thị menu user
                const userInfoElement = document.querySelector('.user-info');
                if (userInfoElement) {
                    userInfoElement.style.display = 'flex';
                }
            } else {
                // User chưa đăng nhập
                document.querySelectorAll('.auth-required').forEach(el => {
                    el.style.display = 'none';
                });
                document.querySelectorAll('.guest-only').forEach(el => {
                    el.style.display = 'block';
                });
            }
        } catch (error) {
            console.error('Lỗi kiểm tra đăng nhập:', error);
        }
    }

    // Thêm event listeners
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Kiểm tra trạng thái đăng nhập khi tải trang
    checkAuthStatus();

    // Xử lý hiển thị mật khẩu form đăng nhập
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');
    
    if (toggleLoginPassword && loginPassword) {
        toggleLoginPassword.addEventListener('click', () => {
            const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassword.setAttribute('type', type);
            toggleLoginPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Xử lý xác nhận mật khẩu form đăng ký
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('registerConfirmPassword');
    const checkIcon = document.getElementById('passwordMatchIcon');
    
    if (registerPassword && confirmPassword && checkIcon) {
        const validatePasswords = () => {
            if (confirmPassword.value === '') {
                checkIcon.style.display = 'none';
            } else if (registerPassword.value === confirmPassword.value) {
                checkIcon.innerHTML = '<i class="fas fa-check-circle" style="color: #2ecc71;"></i>';
                checkIcon.style.display = 'block';
                confirmPassword.style.borderColor = '#2ecc71';
            } else {
                checkIcon.innerHTML = '<i class="fas fa-times-circle" style="color: #e74c3c;"></i>';
                checkIcon.style.display = 'block';
                confirmPassword.style.borderColor = '#e74c3c';
            }
        };

        registerPassword.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
    }
});

window.addEventListener('load', () => {
    document.querySelector('.loading-indicator')?.style.display = 'none';
    document.querySelector('.page-transition')?.classList.remove('active');
});
