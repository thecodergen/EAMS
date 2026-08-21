"use client";

import { useTheme, THEMES, ThemeId } from "@/lib/theme";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "14px",
      }}>
        {THEMES.map((t) => {
          const isSelected = theme === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                background: isSelected ? "rgba(37,99,235,0.06)" : "#ffffff",
                border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                boxShadow: isSelected ? "0 4px 14px rgba(37,99,235,0.15)" : "0 1px 3px rgba(0,0,0,0.04)"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {/* Active Badge */}
              {isSelected && (
                <span style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "10px"
                }}>
                  ACTIVE
                </span>
              )}

              {/* Color Bar Preview */}
              <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                <div style={{ flex: 1, background: t.preview[0] }} />
                <div style={{ flex: 1, background: t.preview[1] }} />
                <div style={{ flex: 1, background: t.preview[2] }} />
              </div>

              {/* Title & Emoji */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "18px" }}>{t.emoji}</span>
                <strong style={{ fontSize: "14px", color: isSelected ? "#2563eb" : "#1e293b" }}>
                  {t.label}
                </strong>
              </div>

              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                {t.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
