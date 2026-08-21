"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { LoggedInUser, saveUser } from "@/lib/auth";
import ThemeSelector from "@/components/ThemeSelector";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [admin, setAdmin] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "company" | "attendance" | "security" | "appearance">("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Admin Profile State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // System Settings State
  const [companyName, setCompanyName] = useState("Enterprise Solutions Inc.");
  const [fiscalYear, setFiscalYear] = useState("January - December");
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState("5 Days (Monday - Friday)");
  const [defaultShift, setDefaultShift] = useState("General (09:00 - 18:00)");
  const [gracePeriod, setGracePeriod] = useState("15 Minutes");
  const [autoApproval, setAutoApproval] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditRetention, setAuditRetention] = useState("365 Days");

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const parsed: LoggedInUser = JSON.parse(stored);
      setAdmin(parsed);
      setFullName(parsed.fullName || "System Administrator");
      setEmail(parsed.email || "admin@eams.com");
      setPhoneNumber(parsed.phoneNumber || "+1 (555) 100-2000");
      setAvatar(parsed.avatar || null);
      setLoading(false);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      setShowAvatarPicker(false);
      setMessage("Admin photo updated! Click Save Changes.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!admin) return;

    try {
      setSaving(true);
      const updatedAdmin: LoggedInUser = {
        ...admin,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        avatar,
      };

      saveUser(updatedAdmin);
      setAdmin(updatedAdmin);

      setMessage("✓ System settings and admin profile saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !admin) {
    return (
      <EamsShell role="Admin">
        <div className="loading">Loading System Settings...</div>
      </EamsShell>
    );
  }

  const initial = (fullName || admin.fullName || "A").charAt(0).toUpperCase();

  return (
    <EamsShell role="Admin">
      <div className="professional-attendance" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        
        {/* HEADER */}
        <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              System Settings & Administration
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Configure global company policies, attendance parameters, and administrator account details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "9px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(37,99,235,0.25)"
            }}
          >
            {saving ? "Saving..." : "💾 Save All Settings"}
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "14px", fontWeight: 500, marginBottom: "20px" }}>
            {message}
          </div>
        )}

        {/* HERO ADMIN CARD */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: "16px",
          padding: "28px",
          color: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          marginBottom: "24px",
          display: "flex",
          gap: "24px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5, #9333ea)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: "36px",
              fontWeight: 800,
              border: "3px solid rgba(255,255,255,0.2)",
              overflow: "hidden"
            }}>
              {avatar ? (
                <img src={avatar} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initial
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              title="Change Photo"
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                background: "#2563eb",
                color: "#ffffff",
                border: "2px solid #0f172a",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "grid",
                placeItems: "center",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              📷
            </button>
          </div>

          <div style={{ flex: 1, minWidth: "240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                {fullName}
              </h2>
              <span style={{
                background: "rgba(168,85,247,0.2)",
                color: "#c084fc",
                border: "1px solid rgba(168,85,247,0.4)",
                borderRadius: "16px",
                padding: "2px 10px",
                fontSize: "11px",
                fontWeight: 700
              }}>
                🛡️ Super Administrator
              </span>
            </div>
            <p style={{ margin: "0 0 8px 0", color: "#94a3b8", fontSize: "13px" }}>
              {email} • Full System & Global Access Permissions
            </p>
          </div>

          {showAvatarPicker && (
            <div style={{ width: "100%", marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.06)", borderRadius: "10px" }}>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: "none" }} />
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                  Upload Photo
                </button>
                {avatar && (
                  <button type="button" onClick={() => setAvatar(null)} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => setShowAvatarPicker(false)} style={{ background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", marginLeft: "auto" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {PRESET_AVATARS.map((url, i) => (
                  <img key={i} src={url} alt={`Preset ${i}`} onClick={() => { setAvatar(url); setShowAvatarPicker(false); }} style={{ width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", border: avatar === url ? "2px solid #38bdf8" : "1px solid #64748b" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
          {[
            { id: "profile", label: "👤 Admin Profile" },
            { id: "company", label: "🏢 Company & Policy" },
            { id: "attendance", label: "⏱️ Attendance Rules" },
            { id: "security", label: "🔒 Security & Audit" },
            { id: "appearance", label: "🎨 Theme & Branding" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #2563eb" : "3px solid transparent",
                padding: "10px 18px",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "#2563eb" : "#64748b",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <form onSubmit={handleSaveSettings}>
          <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            
            {activeTab === "profile" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Admin Full Name</label>
                  <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Admin Email</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Contact Phone</label>
                  <input type="text" className="form-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required style={{ width: "100%" }} />
                </div>
              </div>
            )}

            {activeTab === "company" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Organization Name</label>
                  <input type="text" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Fiscal Year Cycle</label>
                  <input type="text" className="form-input" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Work Week Standard</label>
                  <input type="text" className="form-input" value={workDaysPerWeek} onChange={(e) => setWorkDaysPerWeek(e.target.value)} style={{ width: "100%" }} />
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Default Standard Shift</label>
                  <input type="text" className="form-input" value={defaultShift} onChange={(e) => setDefaultShift(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Check-in Grace Period</label>
                  <input type="text" className="form-input" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
                  <input type="checkbox" id="autoApprove" checked={autoApproval} onChange={(e) => setAutoApproval(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                  <label htmlFor="autoApprove" style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    Enable Auto-approval for 1-day emergency leave
                  </label>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Audit Trail Retention Period</label>
                  <input type="text" className="form-input" value={auditRetention} onChange={(e) => setAuditRetention(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
                  <input type="checkbox" id="emailAlerts" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                  <label htmlFor="emailAlerts" style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    Send Automated Manager Notification Emails
                  </label>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                  Global Theme & Interface Appearance
                </h3>
                <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "13px" }}>
                  Choose a theme for your EAMS session. Select any theme to test live styling.
                </p>
                <ThemeSelector />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
              <button type="submit" disabled={saving} style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}>
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>

          </div>
        </form>

      </div>
    </EamsShell>
  );
}
