"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { LoggedInUser, saveUser } from "@/lib/auth";
import ThemeSelector from "@/components/ThemeSelector";

const API = "http://localhost:5000/api";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
];

export default function EmployeeProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "contact" | "schedule" | "appearance">("personal");

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeIdCode, setEmployeeIdCode] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [workMode, setWorkMode] = useState("Hybrid");
  const [shiftPreference, setShiftPreference] = useState("Standard (09:00 - 18:00)");
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
      setUser(parsed);
      loadEmployeeDetails(parsed);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function loadEmployeeDetails(currentUser: LoggedInUser) {
    setFullName(currentUser.fullName || "");
    setEmail(currentUser.email || "");
    setPhoneNumber(currentUser.phoneNumber || "+1 (555) 234-5678");
    setJobTitle(currentUser.jobTitle || "Software Engineer");
    setDepartment(currentUser.department || "Engineering");
    setEmployeeIdCode(currentUser.employeeIdCode || `EMP-${1000 + currentUser.id}`);
    setHireDate(currentUser.hireDate || "2024-01-15");
    setDateOfBirth(currentUser.dateOfBirth || "1996-05-14");
    setGender(currentUser.gender || "Male");
    setAddress(currentUser.address || "742 Evergreen Terrace");
    setCity(currentUser.city || "San Francisco, CA");
    setEmergencyContact(currentUser.emergencyContact || "Jane Doe (Spouse)");
    setEmergencyPhone(currentUser.emergencyPhone || "+1 (555) 987-6543");
    setWorkMode(currentUser.workMode || "Hybrid");
    setShiftPreference(currentUser.shiftPreference || "Standard (09:00 - 18:00)");
    setBio(currentUser.bio || "Dedicated professional focused on delivering robust enterprise software solutions.");
    setAvatar(currentUser.avatar || null);
    setLoading(false);
  }

  // Handle Photo Upload
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

  // Handle Preset Avatar Selection
  function selectPresetAvatar(url: string) {
    setAvatar(url);
    setShowAvatarPicker(false);
    setMessage("Avatar selected! Click Save Changes to apply.");
  }

  // Remove Photo
  function handleRemovePhoto() {
    setAvatar(null);
    setShowAvatarPicker(false);
    setMessage("Photo removed. Click Save Changes to apply.");
  }

  // Save Changes
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updatedUser: LoggedInUser = {
        ...user,
        fullName: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
        avatar,
        phoneNumber: phoneNumber.trim(),
        jobTitle: jobTitle.trim(),
        employeeIdCode: employeeIdCode.trim(),
        hireDate,
        dateOfBirth,
        gender,
        address: address.trim(),
        city: city.trim(),
        emergencyContact: emergencyContact.trim(),
        emergencyPhone: emergencyPhone.trim(),
        workMode,
        shiftPreference,
        bio: bio.trim(),
      };

      // Save locally
      saveUser(updatedUser);
      setUser(updatedUser);

      // Attempt to sync basic fields with backend
      const token = typeof window !== "undefined" ? localStorage.getItem("eams_token") : null;
      try {
        await fetch(`${API}/employees/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            id: user.id,
            fullName: fullName.trim(),
            email: email.trim(),
            mobileNumber: phoneNumber.trim(),
            departmentId: 1,
            roleId: user.role === "Manager" ? 2 : user.role === "Admin" ? 1 : 3,
          }),
        });
      } catch (backendErr) {
        console.warn("Backend sync note:", backendErr);
      }

      setIsEditing(false);
      setMessage("✓ Profile and account details updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <EamsShell role="Employee">
        <div className="loading">Loading Profile & Account Details...</div>
      </EamsShell>
    );
  }

  const initial = (fullName || user.fullName || "U").charAt(0).toUpperCase();

  return (
    <EamsShell role="Employee">
      <div className="professional-attendance" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        
        {/* PAGE HEADER */}
        <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              My Profile & Account Details
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Manage your personal information, profile photo, and employment settings.
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
                ✏️ Edit Profile Details
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadEmployeeDetails(user);
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
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
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
          <div style={{
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>✓</span> {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* HERO PROFILE CARD */}
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
          {/* Subtle Background Glow */}
          <div style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "center" }}>
            
            {/* AVATAR WITH EDIT OVERLAY */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
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
                  <img
                    src={avatar}
                    alt={fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initial
                )}
              </div>

              {/* Edit Photo Trigger Button */}
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                title="Change Profile Photo"
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
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  transition: "transform 0.15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                📷
              </button>
            </div>

            {/* MAIN HEADER INFO */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                  {fullName || user.fullName}
                </h2>
                <span style={{
                  background: "rgba(34,197,94,0.2)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.4)",
                  borderRadius: "16px",
                  padding: "2px 10px",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  ● Active Employee
                </span>
              </div>

              <p style={{ margin: "0 0 12px 0", color: "#94a3b8", fontSize: "14px", fontWeight: 500 }}>
                {jobTitle} • <span style={{ color: "#38bdf8" }}>{department}</span>
              </p>

              {/* QUICK INFO PILLS */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#cbd5e1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🆔</span> <strong style={{ color: "#ffffff" }}>{employeeIdCode}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>✉️</span> {email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📱</span> {phoneNumber}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📍</span> {city}
                </div>
              </div>
            </div>

          </div>

          {/* AVATAR PICKER MODAL / DRAWER */}
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
                  Choose Profile Picture
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  📤 Upload from Device
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: "rgba(220,38,38,0.2)",
                      color: "#f87171",
                      border: "1px solid rgba(220,38,38,0.4)",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    🗑️ Remove Photo
                  </button>
                )}
              </div>

              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px", fontWeight: 600 }}>
                Or select a preset corporate avatar:
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {PRESET_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preset ${i + 1}`}
                    onClick={() => selectPresetAvatar(url)}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      cursor: "pointer",
                      border: avatar === url ? "3px solid #38bdf8" : "2px solid rgba(255,255,255,0.2)",
                      transition: "transform 0.15s, border 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "24px",
          overflowX: "auto"
        }}>
          {[
            { id: "personal", label: "👤 Personal Information" },
            { id: "employment", label: "🏢 Job & Employment" },
            { id: "contact", label: "📍 Address & Emergency" },
            { id: "schedule", label: "⏱️ Schedule & Bio" },
            { id: "appearance", label: "🎨 Appearance & Theme" },
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
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FORM / DETAILS CARD */}
        <form onSubmit={handleSaveProfile}>
          <div style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            
            {/* TAB 1: PERSONAL INFORMATION */}
            {activeTab === "personal" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 18px 0" }}>
                  Personal Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={fullName}
                      disabled={!isEditing}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Official Email Address *
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      disabled={!isEditing}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Mobile / Phone Number *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={phoneNumber}
                      disabled={!isEditing}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={dateOfBirth}
                      disabled={!isEditing}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Gender
                    </label>
                    <select
                      className="form-input"
                      value={gender}
                      disabled={!isEditing}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Nationality / Language
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue="English (US) / International"
                      disabled={!isEditing}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: JOB & EMPLOYMENT DETAILS */}
            {activeTab === "employment" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 18px 0" }}>
                  Employment & Organizational Details
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Employee ID / Code
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={employeeIdCode}
                      disabled={!isEditing}
                      onChange={(e) => setEmployeeIdCode(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%", fontWeight: 600 }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Official Designation / Title
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobTitle}
                      disabled={!isEditing}
                      onChange={(e) => setJobTitle(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Assigned Department
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={department}
                      disabled={!isEditing}
                      onChange={(e) => setDepartment(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      System Role
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={user.role}
                      disabled
                      style={{ background: "#f1f5f9", width: "100%", color: "#64748b", fontWeight: 600 }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Date of Joining (Hire Date)
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={hireDate}
                      disabled={!isEditing}
                      onChange={(e) => setHireDate(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Work Arrangement Mode
                    </label>
                    <select
                      className="form-input"
                      value={workMode}
                      disabled={!isEditing}
                      onChange={(e) => setWorkMode(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    >
                      <option value="Hybrid">Hybrid (WFO + WFH)</option>
                      <option value="Work From Office">Work From Office (WFO)</option>
                      <option value="Work From Home">Work From Home (WFH)</option>
                      <option value="On-Site Client">On-Site Client</option>
                    </select>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: ADDRESS & EMERGENCY CONTACT */}
            {activeTab === "contact" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 18px 0" }}>
                  Residential Address & Emergency Contact
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Residential Street Address
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={address}
                      disabled={!isEditing}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      City & State
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={city}
                      disabled={!isEditing}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue="United States"
                      disabled={!isEditing}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Emergency Contact Person Name & Relationship
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={emergencyContact}
                      disabled={!isEditing}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Jane Doe (Spouse)"
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Emergency Contact Phone Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={emergencyPhone}
                      disabled={!isEditing}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: SCHEDULE & BIO */}
            {activeTab === "schedule" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 18px 0" }}>
                  Work Schedule Preference & Bio
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                  
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Default Shift Preference
                    </label>
                    <select
                      className="form-input"
                      value={shiftPreference}
                      disabled={!isEditing}
                      onChange={(e) => setShiftPreference(e.target.value)}
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%" }}
                    >
                      <option value="Standard (09:00 - 18:00)">Standard Shift (09:00 - 18:00)</option>
                      <option value="Morning Shift (08:00 - 17:00)">Morning Shift (08:00 - 17:00)</option>
                      <option value="Evening Shift (13:00 - 22:00)">Evening Shift (13:00 - 22:00)</option>
                      <option value="Flexible Shift">Flexible Hours</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                      Professional Summary / Bio
                    </label>
                    <textarea
                      rows={4}
                      className="form-input"
                      value={bio}
                      disabled={!isEditing}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a brief professional summary about yourself..."
                      style={{ background: !isEditing ? "#f8fafc" : "#ffffff", width: "100%", resize: "vertical" }}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: APPEARANCE & THEME */}
            {activeTab === "appearance" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                  Interface Appearance & Color Themes
                </h3>
                <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "13px" }}>
                  Choose your preferred color theme. Changes apply immediately across all portal pages.
                </p>

                <ThemeSelector />
              </div>
            )}

            {/* BOTTOM ACTION BUTTONS */}
            {isEditing && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadEmployeeDetails(user);
                  }}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                  }}
                >
                  {saving ? "Saving Changes..." : "💾 Save Changes"}
                </button>
              </div>
            )}

          </div>
        </form>

      </div>
    </EamsShell>
  );
}