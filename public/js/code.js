document.addEventListener("DOMContentLoaded", function () {
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");
    
    const openLoginBtn = document.getElementById("openLogin");
    const openRegisterBtn = document.getElementById("openRegister");
    
    const closeLoginBtn = loginModal.querySelector(".close");
    const closeRegisterBtn = registerModal.querySelector(".close");
    
    const registerLink = loginModal.querySelector("a[href='#']");
    const loginLink = registerModal.querySelector("a[href='#']");
    
    // Mở modal đăng nhập
    if (openLoginBtn) {
        openLoginBtn.addEventListener("click", function (event) {
            event.preventDefault();
            loginModal.style.display = "flex";
        });
    }
    
    // Mở modal đăng ký
    if (openRegisterBtn) {
        openRegisterBtn.addEventListener("click", function (event) {
            event.preventDefault();
            registerModal.style.display = "block";
        });
    }
    
    // Đóng modal đăng nhập
    closeLoginBtn.addEventListener("click", function () {
        loginModal.style.display = "none";
    });
    
    // Đóng modal đăng ký
    closeRegisterBtn.addEventListener("click", function () {
        registerModal.style.display = "none";
    });
    
    // Đóng modal khi click ra ngoài
    window.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none";
        } else if (event.target === registerModal) {
            registerModal.style.display = "none";
        }
    });
    
    // Chuyển từ đăng nhập sang đăng ký
    registerLink.addEventListener("click", function (event) {
        event.preventDefault();
        loginModal.style.display = "none";
        registerModal.style.display = "block";
    });
    
    // Chuyển từ đăng ký sang đăng nhập
    loginLink.addEventListener("click", function (event) {
        event.preventDefault();
        registerModal.style.display = "none";
        loginModal.style.display = "flex";
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");

    const openLoginBtn = document.getElementById("openLogin");
    const openRegisterBtn = document.getElementById("openRegister");

    const closeLoginBtn = loginModal.querySelector(".close");
    const closeRegisterBtn = registerModal.querySelector(".close");

    const registerLink = loginModal.querySelector("a[href='#']");
    const loginLink = registerModal.querySelector("a[href='#']");

    // Mở modal đăng nhập
    if (openLoginBtn) {
        openLoginBtn.addEventListener("click", function (event) {
            event.preventDefault();
            loginModal.style.display = "flex";
        });
    }

    // Mở modal đăng ký
    if (openRegisterBtn) {
        openRegisterBtn.addEventListener("click", function (event) {
            event.preventDefault();
            registerModal.style.display = "block";
        });
    }

    // Đóng modal đăng nhập
    closeLoginBtn.addEventListener("click", function () {
        loginModal.style.display = "none";
    });

    // Đóng modal đăng ký
    closeRegisterBtn.addEventListener("click", function () {
        registerModal.style.display = "none";
    });

    // Đóng modal khi click ra ngoài
    window.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none";
        } else if (event.target === registerModal) {
            registerModal.style.display = "none";
        }
    });

    // Chuyển từ đăng nhập sang đăng ký
    registerLink.addEventListener("click", function (event) {
        event.preventDefault();
        loginModal.style.display = "none";
        registerModal.style.display = "block";
    });

    // Chuyển từ đăng ký sang đăng nhập
    loginLink.addEventListener("click", function (event) {
        event.preventDefault();
        registerModal.style.display = "none";
        loginModal.style.display = "flex";
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu__account-item");
    const sections = document.querySelectorAll(".container__account > div");

    menuItems.forEach((item, index) => {
        item.addEventListener("click", function (e) {
            e.preventDefault();

            // Ẩn tất cả phần nội dung
            sections.forEach(section => {
                if (!section.classList.contains("menu__account")) {
                    section.style.display = "none";
                }
            });

            // Hiển thị phần tương ứng
            if (index === 1) { // "Thêm địa chỉ"
                document.querySelector(".content__address").style.display = "block";
            } else if (index === 0) {
                document.querySelector(".content__account").style.display = "block";
            } else if (index === 4) {
                document.querySelector(".content__change-password").style.display = "block";
            }
            // bạn có thể thêm các trường hợp khác nếu cần
        });
    });
});

// Mở modal
document.getElementById("openModal").addEventListener("click", function (e) {
    e.preventDefault(); // tránh reload trang
    document.getElementById("updateModal").style.display = "flex";
});

// Đóng modal
document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("updateModal").style.display = "none";
});

/*Thay đổi mật khẩu*/
function togglePassword(id, iconElement) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.2 9.01006C21.6 10.7001 21.6 13.3001 20.2 14.9901C18.2 17.4001 15.27 18.9401 12 18.9401C8.73001 18.9401 5.81 17.4101 3.8 14.9901C2.4 13.3001 2.4 10.7001 3.8 9.01006C5.8 6.60006 8.73001 5.06006 12 5.06006C15.27 5.06006 18.19 6.59006 20.2 9.01006Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20.2 9.01006C21.6 10.7001 21.6 13.3001 20.2 14.9901C18.2 17.4001 15.27 18.9401 12 18.9401C8.73001 18.9401 5.81 17.4101 3.8 14.9901C2.4 13.3001 2.4 10.7001 3.8 9.01006C5.8 6.60006 8.73001 5.06006 12 5.06006C15.27 5.06006 18.19 6.59006 20.2 9.01006Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.9999 15.0802C13.7009 15.0802 15.0799 13.7012 15.0799 12.0002C15.0799 10.2991 13.7009 8.92017 11.9999 8.92017C10.2989 8.92017 8.91992 10.2991 8.91992 12.0002C8.91992 13.7012 10.2989 15.0802 11.9999 15.0802Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'; // đổi biểu tượng thành "hiện"
    } else {
        input.type = 'password';
        iconElement.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http:www.w3.org/2000/svg"><path d="M14.52 18.6297C13.71 18.8397 12.87 18.9397 12 18.9397C8.73 18.9397 5.8 17.4097 3.8 14.9897C2.4 13.2997 2.4 10.6897 3.8 9.00969C3.96 8.80969 4.14 8.61969 4.32 8.42969" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20.2 14.9896C19.4 15.9496 18.45 16.7696 17.4 17.4096L6.58997 6.58957C8.17997 5.60957 10.02 5.05957 12 5.05957C15.27 5.05957 18.2 6.58957 20.2 9.00957C21.6 10.6896 21.6 13.3096 20.2 14.9896Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.0799 11.9999C15.0799 12.8499 14.7299 13.6199 14.1799 14.1799L9.81995 9.81992C10.3699 9.25992 11.1499 8.91992 11.9999 8.91992C13.7099 8.91992 15.0799 10.2899 15.0799 11.9999Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2.75 2.75L6.59 6.59L9.82 9.82L14.18 14.18L17.41 17.41L21.25 21.25" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'; // đổi biểu tượng thành "ẩn"
    }
}
/*Thay đổi mật khẩu*/

/*modal hiển thị thông tin giới thiệu người mới*/
  // Lấy các phần tử
  const wrapSvg = document.querySelector(".wrap-svg");
  const modal = document.querySelector(".moda");
  const closeBtn = document.querySelector(".close-button");
  const pointerImg = document.querySelector(".content-img.pointer");

  // Hàm hiển thị modal
  function showModal() {
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Ngăn cuộn nền
  }

  // Hàm đóng modal
  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = ""; // Cho phép cuộn trở lại
  }

  // Click vào icon SVG => mở modal
  wrapSvg.addEventListener("click", showModal);

  // Click vào ảnh => mở modal
  pointerImg.addEventListener("click", showModal);

  // Click vào nút đóng => đóng modal
  closeBtn.addEventListener("click", closeModal);

  // Click ra ngoài modal-content => đóng modal
  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });
/*modal hiển thị thông tin giới thiệu người mới*/
