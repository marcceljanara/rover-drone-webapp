/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import "./Navbar.css";
import { Link } from "react-scroll";

const Navbar = () => {
  const [loginClicked, setLoginClicked] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignUp, setShowPasswordSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          handleLogout();
          window.location.reload();
        } else setIsLoggedIn(true);
      } catch {
        handleLogout();
      }
    }
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = localStorage.getItem("rememberPassword");
    if (savedEmail && savedPassword) {
      setEmailLogin(savedEmail);
      setPasswordLogin(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const toggleMenu = () => setIsMenuOpen(p => !p);
  const handleLoginClick = () => {
    if (isLoggedIn) handleLogout();
    else {
      setShowSignUpForm(false);
      setShowVerify(false);
      setShowLoginForm(true);
      setLoginClicked(true);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    showSuccessNotification("🔒 Anda telah berhasil keluar.");
  };
  const closeAllForms = () => {
    setShowLoginForm(false);
    setShowSignUpForm(false);
    setShowVerify(false);
    setLoginClicked(false);
  };
  const showSuccessNotification = (msg, type = "success") => {
    setNotificationMessage(msg);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("http://localhost:5000/v1/authentications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLogin, password: passwordLogin }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || "Login gagal.");
      }
      const data = await resp.json();
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      const decoded = jwtDecode(accessToken);
      if (decoded.role) localStorage.setItem("role", decoded.role);
      if (rememberMe) {
        localStorage.setItem("rememberEmail", emailLogin);
        localStorage.setItem("rememberPassword", passwordLogin);
      } else {
        localStorage.removeItem("rememberEmail");
        localStorage.removeItem("rememberPassword");
      }
      showSuccessNotification(`✅ Login berhasil! Selamat datang kembali ${decoded.role}`);
      closeAllForms();
      setIsLoggedIn(true);
    } catch (err) {
      showSuccessNotification(`❌ ${err.message}`, "error");
    }
  };

  const handleSignUpClick = () => {
    setShowLoginForm(false);
    setShowVerify(false);
    setShowSignUpForm(true);
  };
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    const fullname = e.target.fullname.value;
    const username = e.target.username.value;
    const email = e.target["email-signup"].value;
    const password = e.target["password-signup"].value;
    try {
      const resp = await fetch("http://localhost:5000/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, username, email, password }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || "Pendaftaran gagal.");
      }
      setShowSignUpForm(false);
      setShowVerify(true);
      setRegisteredEmail(email);
      showSuccessNotification("✅ Sign Up berhasil! Silakan verifikasi email Anda.");
    } catch (err) {
      showSuccessNotification(err.message || "❌ Pendaftaran gagal.", "error");
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const otp = e.target.otp.value;
    try {
      const resp = await fetch("http://localhost:5000/v1/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp }),
      });
      if (resp.status === 200) {
        showSuccessNotification("✅ OTP berhasil diverifikasi!");
        setShowVerify(false);
        setShowLoginForm(true);
      } else {
        showSuccessNotification("❌ OTP salah atau kadaluarsa.", "error");
      }
    } catch {
      showSuccessNotification("❌ Terjadi kesalahan jaringan saat verifikasi.", "error");
    }
  };

  const handleResendOTP = async (e) => {
    e.preventDefault();
    if (resendCooldown > 0) return;
    try {
      const resp = await fetch("http://localhost:5000/v1/users/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || "Gagal mengirim ulang OTP.");
      }
      const data = await resp.json();
      showSuccessNotification("✅ " + data.message);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(p => {
          if (p <= 1) {
            clearInterval(timer);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    } catch (err) {
      showSuccessNotification(err.message, "error");
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`n-wrapper ${isMenuOpen ? "menu-open" : ""}`} id="Navbar">
      <div className="n-left">
        <div className="n-name">Roone</div>
      </div>
      <div className="hamburger" onClick={toggleMenu}>☰</div>
      <div className={`n-right ${isMenuOpen ? "open" : ""}`}>
        <div className="n-list">
          <ul className="navbar-menu">
            <li>
              <a
                href="#intro"
                className="navbar-link"
                onClick={e => { e.preventDefault(); scrollToSection("intro"); }}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#services"
                className="navbar-link"
                onClick={e => { e.preventDefault(); scrollToSection("services"); }}
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#works"
                className="navbar-link"
                onClick={e => { e.preventDefault(); scrollToSection("works"); }}
              >
                Experience
              </a>
            </li>
            <li>
              <button
                className={`button n-button navbar-auth ${loginClicked ? "clicked" : ""}`}
                onClick={handleLoginClick}
              >
                {isLoggedIn ? "Log Out" : "Login"}
              </button>
            </li>
          </ul>
        </div>
        <a href="https://wa.me/6282178452180" target="_blank" rel="noopener noreferrer">
          <button className="button n-button contact-button">kontak</button>
        </a>
      </div>

      {(showLoginForm || showSignUpForm || showVerify) && (
        <div className="login-overlay active" onClick={closeAllForms}></div>
      )}
      {showNotification && (
        <div className={`notification ${notificationType}`}>{notificationMessage}</div>
      )}

      {/* LOGIN FORM */}
      {showLoginForm && (
        <div className="login-form">
          <button className="close-btn" onClick={closeAllForms}>&times;</button>
          <h2>Sign In</h2>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={emailLogin}
                onChange={e => setEmailLogin(e.target.value)}
                required
              />
            </div>
            <div className="form-group password-toggle">
              <label>Password</label>
              <input
                type={showPasswordLogin ? "text" : "password"}
                value={passwordLogin}
                onChange={e => setPasswordLogin(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPasswordLogin(p => !p)}
              >
                {showPasswordLogin ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.93 10.93 0 0112 19c-5 0-9.27-3.11-11-7 1.21-2.77 3.64-5.01 6.59-6.2"/>
                    <path d="M9.5 9.5a3 3 0 014 4"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="form-group">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={() => setRememberMe(p => !p)}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <button type="submit" className="login-btn">Sign In</button>
          </form>
          <p>Don't have an account? <a href="#" onClick={handleSignUpClick}>Sign up</a></p>
        </div>
      )}

      {/* SIGN UP FORM */}
      {showSignUpForm && (
        <div className="signup-form">
          <button className="close-btn" onClick={closeAllForms}>&times;</button>
          <h2>Sign Up</h2>
          <form onSubmit={handleSignUpSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullname" required />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input type="text" name="username" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email-signup" required />
            </div>
            <div className="form-group password-toggle">
              <label>Password</label>
              <input
                type={showPasswordSignUp ? "text" : "password"}
                name="password-signup"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPasswordSignUp(p => !p)}
              >
                {showPasswordSignUp ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.93 10.93 0 0112 19c-5 0-9.27-3.11-11-7 1.21-2.77 3.64-5.01 6.59-6.2"/>
                    <path d="M9.5 9.5a3 3 0 014 4"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  </svg>
                )}
              </button>
            </div>
            <button type="submit" className="login-btn">Register</button>
          </form>
          <p>Already have an account? <a href="#" onClick={() => { setShowSignUpForm(false); setShowLoginForm(true); }}>Sign in</a></p>
        </div>
      )}

      {/* VERIFY OTP */}
      {showVerify && (
        <div className="verify-form">
          <button className="close-btn" onClick={closeAllForms}>&times;</button>
          <h2>Verify Email</h2>
          <form onSubmit={handleVerifySubmit}>
            <div className="form-group">
              <label>Kode OTP</label>
              <input type="text" name="otp" required />
            </div>
            <button type="submit" className="login-btn">Verifikasi</button>
          </form>
          <div className="resend-otp">
            <button className="resend-btn" onClick={handleResendOTP} disabled={resendCooldown > 0}>
              {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}s` : "Kirim Ulang OTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
