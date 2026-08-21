"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getDashboardPath,
  getUser,
  saveUser,
  UserRole,
} from "@/lib/auth";
import { login, sendOtp, loginWithOtp } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Login Mode: "password" | "otp"
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");

  // Inputs
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpDemo, setOtpDemo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setRegistered(true);
    }

    const user = getUser();
    if (user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [router, searchParams]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Send OTP
  async function handleSendOtp() {
    if (!identifier.trim()) {
      setError("Please enter your registered Email or Phone Number.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res = await sendOtp(identifier.trim(), "login");
      setOtpSent(true);
      setCountdown(60);
      setInfoMessage(res.message || "OTP sent successfully!");
      if (res.otp) {
        setOtpDemo(res.otp);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send OTP. Ensure your Email or Phone is registered."
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle Submit (Password or OTP)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRegistered(false);

    try {
      let result;
      if (loginMode === "password") {
        result = await login(identifier.trim(), password);
      } else {
        if (!otpSent) {
          await handleSendOtp();
          setLoading(false);
          return;
        }
        if (!otpCode.trim()) {
          setError("Please enter the 6-digit OTP code.");
          setLoading(false);
          return;
        }
        result = await loginWithOtp(identifier.trim(), otpCode.trim());
      }

      const role = result.employee?.role ?? "Employee";
      const user = {
        id: result.employee.id,
        fullName: result.employee.fullName,
        email: result.employee.email,
        role: role as UserRole,
        department: result.employee.department ?? null,
        token: result.token,
      };

      saveUser(user);
      router.replace(getDashboardPath(user.role));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your credentials or OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* ─── Left Panel ─── */}
      <section className="login-left">
        <h1>EAMS</h1>
        <h2>Employee Attendance Management System</h2>

        <p>
          A complete attendance and leave management platform for employees,
          managers, and administrators with secure multi-factor authentication.
        </p>

        <div className="login-features">
          <div className="login-feature">✓ Login with Email, Phone, or Username</div>
          <div className="login-feature">✓ Fast &amp; Secure OTP Login</div>
          <div className="login-feature">✓ Attendance tracking &amp; Corrections</div>
          <div className="login-feature">✓ Manager approvals &amp; Leave workflows</div>
        </div>

        {/* Security notes */}
        <div className="login-security-notes">
          <div className="login-security-note">🔒 Passwords stored as SHA-256 HASH</div>
          <div className="login-security-note">📲 Secure 6-Digit OTP verification</div>
          <div className="login-security-note">🛡️ JWT Token-based session protection</div>
        </div>
      </section>

      {/* ─── Right Panel ─── */}
      <section className="login-right">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p>Choose your preferred sign-in method to access EAMS.</p>

          {/* Registration success banner */}
          {registered && (
            <div className="login-success-banner">
              🎉 Registration successful! You can now log in.
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="auth-tab-group" style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "rgba(255,255,255,0.06)", padding: "4px", borderRadius: "8px" }}>
            <button
              type="button"
              className={`auth-tab-btn ${loginMode === "password" ? "active" : ""}`}
              onClick={() => {
                setLoginMode("password");
                setError("");
                setInfoMessage("");
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                background: loginMode === "password" ? "#3b82f6" : "transparent",
                color: loginMode === "password" ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s"
              }}
            >
              🔑 Password Login
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${loginMode === "otp" ? "active" : ""}`}
              onClick={() => {
                setLoginMode("otp");
                setError("");
                setInfoMessage("");
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                background: loginMode === "otp" ? "#3b82f6" : "transparent",
                color: loginMode === "otp" ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s"
              }}
            >
              📲 OTP Login
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Identifier: Email / Phone / Username */}
            <div className="form-group">
              <label htmlFor="login-identifier">
                {loginMode === "otp" ? "Email ID or Phone Number" : "Email, Phone Number, or Username"}
              </label>
              <input
                id="login-identifier"
                className="form-input"
                type="text"
                placeholder={loginMode === "otp" ? "e.g. om@example.com or +919876543210" : "Enter Email, Phone, or Username"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                disabled={loginMode === "otp" && otpSent}
              />
            </div>

            {/* Password Login Field */}
            {loginMode === "password" && (
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            )}

            {/* OTP Flow Fields */}
            {loginMode === "otp" && (
              <>
                {!otpSent ? (
                  <button
                    type="button"
                    className="login-button"
                    onClick={handleSendOtp}
                    disabled={loading || !identifier.trim()}
                    style={{ marginTop: "10px", marginBottom: "15px" }}
                  >
                    {loading ? "Sending OTP..." : "Get OTP Code"}
                  </button>
                ) : (
                  <>
                    <div className="form-group" style={{ marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label htmlFor="login-otp">Enter 6-Digit OTP</label>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpDemo(null); }}
                          style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                        >
                          Change Email/Phone
                        </button>
                      </div>
                      <input
                        id="login-otp"
                        className="form-input"
                        type="text"
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        required
                        autoFocus
                        style={{ letterSpacing: "6px", fontSize: "20px", textAlign: "center", fontWeight: 700 }}
                      />
                    </div>

                    {/* Resend OTP button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", fontSize: "13px" }}>
                      <span style={{ color: "#94a3b8" }}>Didn&apos;t get code?</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
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

                    {/* Demo OTP Banner for immediate convenience */}
                    {otpDemo && (
                      <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#4ade80", fontSize: "13px" }}>
                        🔐 <strong>Demo Verification Code:</strong> <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "2px" }}>{otpDemo}</span> (auto-filled or type above)
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Information Message */}
            {infoMessage && (
              <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#93c5fd", fontSize: "13px" }}>
                ℹ️ {infoMessage}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit Button */}
            {(loginMode === "password" || otpSent) && (
              <button
                id="login-submit"
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : loginMode === "otp" ? "Verify & Login" : "Login"}
              </button>
            )}

            <p className="login-register-link">
              Don&apos;t have an account?{" "}
              <Link href="/register">Register here</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}