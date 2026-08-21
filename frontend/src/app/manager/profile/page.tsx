"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { LoggedInUser, saveUser } from "@/lib/auth";
import ThemeSelector from "@/components/ThemeSelector";

const API = "http://localhost:5000/api";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
];

export default function ManagerProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manager, setManager] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "management" | "contact" | "appearance">("personal");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeIdCode, setEmployeeIdCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const parsed: LoggedInUser = JSON.parse(stored);
      setManager(parsed);
      loadManagerDetails(parsed);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function loadManagerDetails(u: LoggedInUser) {
    setFullName(u.fullName || "");
    setEmail(u.email || "");
    setPhoneNumber(u.phoneNumber || "+1 (555) 345-6789");
    setJobTitle(u.jobTitle || "Engineering Manager & Department Lead");
    setDepartment(u.department || "Engineering & Technology");
    setEmployeeIdCode(u.employeeIdCode || `MGR-${1000 + u.id}`);
    setAddress(u.address || "100 Innovation Way, Suite 400");
    setCity(u.city || "San Francisco, CA");
    setBio(u.bio || "Engineering Manager responsible for cross-functional team delivery, talent mentorship, and project execution.");
    setAvatar(u.avatar || null);
    setLoading(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      setShowAvatarPicker(false);
      setMessage("Photo uploaded! Click Save Changes to apply.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!manager) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updatedUser: LoggedInUser = {
        ...manager,
        fullName: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
        avatar,
        phoneNumber: phoneNumber.trim(),
        jobTitle: jobTitle.trim(),
        employeeIdCode: employeeIdCode.trim(),
        address: address.trim(),
        city: city.trim(),
        bio: bio.trim(),
      };

      saveUser(updatedUser);
      setManager(updatedUser);

      setIsEditing(false);
      setMessage("✓ Manager profile updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !manager) {
    return (
      <EamsShell role="Manager">
        <div className="loading">Loading Manager Profile...</div>
      </EamsShell>
    );
  }

  const initial = (fullName || manager.fullName || "M").charAt(0).toUpperCase();

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        
        {/* HEADER */}
        <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              Manager Profile & Account
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Manage your manager credentials, photo, and leadership profile.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(37,99,235,0.25)"
                }}
              >
                ✏️ Edit Details
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadManagerDetails(manager);
                  }}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "9px 16px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  ✕ Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                  }}
                >
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ALERTS */}
        {message && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "14px", fontWeight: 500, marginBottom: "20px" }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "14px", fontWeight: 500, marginBottom: "20px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* HERO CARD */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "16px",
          padding: "32px",
          color: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "center" }}>
            
            <div style={{ position: "relative" }}>
              <div style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontSize: "40px",
                fontWeight: 800,
                border: "4px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
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
                  bottom: "2px",
                  right: "2px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "2px solid #1e293b",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                📷
              </button>
            </div>

            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  {fullName || manager.fullName}
                </h2>
                <span style={{
                  background: "rgba(59,130,246,0.2)",
                  color: "#60a5fa",
                  border: "1px solid rgba(59,130,246,0.4)",
                  borderRadius: "16px",
                  padding: "2px 10px",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  👑 Team Manager
                </span>
              </div>

              <p style={{ margin: "0 0 12px 0", color: "#94a3b8", fontSize: "14px", fontWeight: 500 }}>
                {jobTitle} • <span style={{ color: "#38bdf8" }}>{department}</span>
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#cbd5e1" }}>
                <div>🆔 <strong>{employeeIdCode}</strong></div>
                <div>✉️ {email}</div>
                <div>📱 {phoneNumber}</div>
                <div>📍 {city}</div>
              </div>
            </div>

          </div>

          {/* AVATAR PICKER DRAWER */}
          {showAvatarPicker && (
            <div style={{
              marginTop: "24px",
              padding: "20px",
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                  Choose Manager Photo
                </h4>
                <button type="button" onClick={() => setShowAvatarPicker(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: "none" }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  📤 Upload from Device
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", border: "1px solid rgba(220,38,38,0.4)", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    🗑️ Remove Photo
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {PRESET_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preset ${i + 1}`}
                    onClick={() => { setAvatar(url); setShowAvatarPicker(false); }}
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: avatar === url ? "3px solid #38bdf8" : "2px solid rgba(255,255,255,0.2)" }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
          {[
            { id: "personal", label: "👤 Personal Details" },
            { id: "management", label: "📊 Leadership & Department" },
            { id: "contact", label: "📍 Contact & Location" },
            { id: "appearance", label: "🎨 Theme & Appearance" },
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

        {/* FORM */}
        <form onSubmit={handleSaveProfile}>
          <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {activeTab === "personal" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Full Name</label>
                  <input type="text" className="form-input" value={fullName} disabled={!isEditing} onChange={(e) => setFullName(e.target.value)} required style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Email Address</label>
                  <input type="email" className="form-input" value={email} disabled={!isEditing} onChange={(e) => setEmail(e.target.value)} required style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Phone Number</label>
                  <input type="text" className="form-input" value={phoneNumber} disabled={!isEditing} onChange={(e) => setPhoneNumber(e.target.value)} required style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
              </div>
            )}

            {activeTab === "management" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Manager ID Code</label>
                  <input type="text" className="form-input" value={employeeIdCode} disabled={!isEditing} onChange={(e) => setEmployeeIdCode(e.target.value)} style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%", fontWeight: 600 }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Job Designation</label>
                  <input type="text" className="form-input" value={jobTitle} disabled={!isEditing} onChange={(e) => setJobTitle(e.target.value)} style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Managed Department</label>
                  <input type="text" className="form-input" value={department} disabled={!isEditing} onChange={(e) => setDepartment(e.target.value)} style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>Office Location / Address</label>
                  <input type="text" className="form-input" value={address} disabled={!isEditing} onChange={(e) => setAddress(e.target.value)} style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>City & Region</label>
                  <input type="text" className="form-input" value={city} disabled={!isEditing} onChange={(e) => setCity(e.target.value)} style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }} />
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                  Interface Color Theme
                </h3>
                <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "13px" }}>
                  Customize the manager portal appearance.
                </p>
                <ThemeSelector />
              </div>
            )}

            {isEditing && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: "#16a34a", color: "#ffffff", border: "none", padding: "9px 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>{saving ? "Saving..." : "💾 Save Changes"}</button>
              </div>
            )}
          </div>
        </form>

      </div>
    </EamsShell>
  );
}
