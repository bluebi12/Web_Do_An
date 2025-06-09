// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {getAuth, GoogleAuthProvider,signInWithRedirect, getRedirectResult, signInWithEmailAndPassword,onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyARDVp4S1gCqthn3VYpKTQJv--Sl_xaqD8",
    authDomain: "fir-project-esp32.firebaseapp.com",
    databaseURL: "https://fir-project-esp32-default-rtdb.firebaseio.com",
    projectId: "fir-project-esp32",
    storageBucket: "fir-project-esp32.appspot.com",
    messagingSenderId: "656047656204",
    appId: "1:656047656204:web:0bde420be3a1f5d8dfcd29",
    measurementId: "G-RZR300WEJ2"
};
// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Xử lý đăng nhập bằng email & password
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault(); // Ngăn reload trang
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert(`Đăng nhập thành công: ${user.email}`);
            window.location.href = "Do_an_IOT.html"; //Chuyển hướng chỉ khi đăng nhập thành công
        })
        .catch((error) => {
            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại!';
            if (error.message.includes('email')) {
                errorMessage = 'Email không hợp lệ hoặc không tồn tại!';
            } else if (error.message.includes('password')) {
                errorMessage = 'Mật khẩu không đúng!';
            }
            alert(`Lỗi: ${errorMessage}`);
            console.error("Login error", error);
        });
});
// Đăng nhập bằng Google
document.getElementById('google-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    signInWithRedirect(auth, provider);
});
// Xử lý kết quả sau khi redirect Google
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            const user = result.user;
            alert(`Chào mừng ${user.displayName}`);
            window.location.href = "Do_an_IOT.html";
        }
    })
    .catch((error) => {
        console.error('Google login error: ', error);
    });

// Hiển thị ẩn/hiện mật khẩu
$(document).ready(function () {
    $('#eye').click(function () {
        $(this).toggleClass('open');
        $(this).children('i').toggleClass('fa-eye fa-eye-slash');
        const passwordInput = $('#password');
        passwordInput.attr('type', $(this).hasClass('open') ? 'text' : 'password');
    });
});
