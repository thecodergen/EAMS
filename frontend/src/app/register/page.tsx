"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWithOtp, sendOtp } from "@/lib/api";

type Step =
  | "idle"
  | "otp_sent"
  | "verifying"
  | "success";

export default function RegisterPage() {
  const router = useRouter();

  // Form Fields
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Employee");

  // OTP Verification
  const [otpCode, setOtpCode] = useState("");
  const [otpDemo, setOtpDemo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // States
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect to login on success after 2 seconds
  useEffect(() => {
    if (step === "success") {
      const t = setTimeout(() => router.push("/login?registered=1"), 2000);
      return () => clearTimeout(t);
    }
  }, [step, router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Send Registration OTP
  async function handleSendRegistrationOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    // Client-side validations
    if (!username.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Send OTP to email (or mobile)
      const targetIdentifier = email.trim();
      const res = await sendOtp(targetIdentifier, "register");
      
      setStep("otp_sent");
      setCountdown(60);
      setInfoMessage(res.message || "OTP verification code sent!");
      if (res.otp) {
        setOtpDemo(res.otp);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please verify your details."
      );
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP and Complete Registration
  async function handleVerifyAndRegister(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit OTP verification code.");
      return;
    }

    setLoading(true);
    setStep("verifying");

    try {
      await registerWithOtp(
        username.trim(),
        fullName.trim(),
        email.trim(),
        password,
        otpCode.trim(),
        role,
        mobileNumber.trim()
      );

      setStep("success");
    } catch (err) {
      setStep("otp_sent");
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  const isSuccess = step === "success";

  return (
    <main className="register-page">
      {/* ─── Left Panel ─── */}
      <section className="register-left">
        <div className="register-brand">
          <div className="register-logo">EAMS</div>
          <h1>Create Your Account</h1>
          <p>
            Join the Employee Attendance Management System. Register with your
            Email or Phone Number and verify with OTP.
          </p>
        </div>

        {/* Visual Progress Steps */}
        <div className="reg-flow">
          <div className={`reg-flow-step ${step === "idle" ? "active" : "done"}`}>
            <span className="reg-flow-num">1</span>
            <div>
              <strong>Enter Account Details</strong>
              <p>Name, Email, Mobile &amp; Password</p>
            </div>
          </div>

          <div className="reg-flow-arrow">↓</div>

          <div className={`reg-flow-step ${["otp_sent", "verifying"].includes(step) ? "active" : step === "success" ? "done" : ""}`}>
            <span className="reg-flow-num">2</span>
            <div>
              <strong>Verify 6-Digit OTP</strong>
              <p>Secures your email and mobile identity</p>
            </div>
          </div>

          <div className="reg-flow-arrow">↓</div>

          <div className={`reg-flow-step ${step === "success" ? "done success-step" : ""}`}>
            <span className="reg-flow-num">✓</span>
            <div>
              <strong>Account Activated</strong>
              <p>Ready to login to EAMS</p>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="reg-security-note">
          🔒 Multi-factor verified registration with encrypted password hashing
        </div>
      </section>

      {/* ─── Right Panel ─── */}
      <section className="register-right">
        <div className="register-card">

          {isSuccess ? (
            <div className="reg-success-screen">
              <div className="reg-success-icon">🎉</div>
              <h2>Registration Successful!</h2>
              <p>Your account has been verified and created. Redirecting to login...</p>
              <div className="reg-success-bar">
                <div className="reg-success-bar-fill" />
              </div>
            </div>
          ) : step === "otp_sent" || step === "verifying" ? (
            /* ─── Step 2: OTP Verification Card ─── */
            <form onSubmit={handleVerifyAndRegister}>
              <div className="register-card-header">
                <h2>Verify Email &amp; Phone</h2>
                <p>We sent a 6-digit verification code to <strong>{email}</strong></p>
              </div>

              {infoMessage && (
                <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#93c5fd", fontSize: "13px" }}>
                  ℹ️ {infoMessage}
                </div>
              )}

              {/* Demo OTP Box */}
              {otpDemo && (
                <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#4ade80", fontSize: "13px" }}>
                  🔐 <strong>Verification OTP Code:</strong> <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "2px" }}>{otpDemo}</span>
                </div>
              )}

              <div className="form-group" style={{ marginTop: "16px" }}>
                <label htmlFor="reg-otp">Enter 6-Digit OTP</label>
                <input
                  id="reg-otp"
                  className="form-input"
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  style={{ letterSpacing: "6px", fontSize: "22px", textAlign: "center", fontWeight: 700 }}
                />
              </div>

              {/* Resend & Edit Details */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", fontSize: "13px" }}>
                <button
                  type="button"
                  onClick={() => { setStep("idle"); setOtpDemo(null); }}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  ← Edit Information
                </button>
                <button
                  type="button"
                  onClick={handleSendRegistrationOtp}
                  disabled={countdown > 0 || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: countdown > 0 ? "#64748b" : "#38bdf8",
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    fontWeight: 600
                  }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>

              {error && (
                <div className="login-error reg-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                id="reg-verify-submit"
                className="login-button register-button"
                type="submit"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? "Verifying & Creating..." : "Verify & Complete Registration"}
              </button>
            </form>
          ) : (
            /* ─── Step 1: Account Information Form ─── */
            <form onSubmit={handleSendRegistrationOtp} noValidate>
              <div className="register-card-header">
                <h2>Create Account</h2>
                <p>Fill in your details to get started</p>
              </div>

              {/* Username */}
              <div className="form-group">
                <label htmlFor="reg-username">Username *</label>
                <input
                  id="reg-username"
                  className="form-input"
                  type="text"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="username"
                />
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="reg-fullname">Full Name *</label>
                <input
                  id="reg-fullname"
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="reg-email">Email ID *</label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Mobile / Phone Number */}
              <div className="form-group">
                <label htmlFor="reg-phone">Phone Number (Optional / Recommended)</label>
                <input
                  id="reg-phone"
                  className="form-input"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label htmlFor="reg-role">Role</label>
                <select
                  id="reg-role"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="reg-password">Password *</label>
                <div className="password-wrapper">
                  <input
                    id="reg-password"
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="reg-confirm">Confirm Password *</label>
                <input
                  id="reg-confirm"
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="login-error reg-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                id="reg-submit"
                className="login-button register-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Continue & Verify with OTP →"}
              </button>

              <p className="register-login-link">
                Already have an account?{" "}
                <Link href="/login">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
