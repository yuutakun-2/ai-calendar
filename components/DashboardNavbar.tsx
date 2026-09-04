import React, { RefObject, useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { ThemeConfig } from "@/lib/themes";
import { AnimatePresence, motion } from "framer-motion";

interface DashboardNavbarProps {
  isMobile: boolean;
  themeName: string;
  theme: ThemeConfig;
  userEmail?: string;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: RefObject<HTMLInputElement | null>;
  onAddExam: () => void;
  onLogout: () => void;
}

import Link from "next/link";

export default function DashboardNavbar({
  isMobile,
  themeName,
  theme,
  userEmail,
  onExport,
  onImport,
  importInputRef,
  onAddExam,
  onLogout,
}: DashboardNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDark = themeName === "dark";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownItemStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.875rem",
    background: "transparent",
    color: theme.textPrimary,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.2s",
  };

  return (
    <nav
      style={{
        height: "73px",
        borderBottom: `1px solid ${theme.border}`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(12px)",
        background: isDark ? "rgba(10,10,15,0.85)" : "rgba(255,255,255,0.85)",
        position: "relative",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.4rem" }}>📅</span>
        {!isMobile && (
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: theme.textPrimary,
            }}
          >
            ExamPal
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={onAddExam}
          style={{
            height: "40px",
            padding: "0 18px",
            fontSize: "0.875rem",
            background: theme.accent,
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: `0 4px 12px ${theme.accent}44`,
            transition: "transform 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.background =
              `${theme.accent}ee`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.background =
              theme.accent;
          }}
        >
          <span>+</span> {!isMobile && "Add Exam"}
        </button>

        <ThemeToggle showLabel={false} />

        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
              border: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              padding: 0,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                theme.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                theme.border;
            }}
          >
            <div style={{ fontSize: "1.2rem" }}>👤</div>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  width: "240px",
                  background: isDark ? "#12121a" : "#ffffff",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  padding: "8px",
                  overflow: "hidden",
                }}
              >
                {userEmail && (
                  <div
                    style={{
                      padding: "10px 12px",
                      marginBottom: "8px",
                      borderBottom: `1px solid ${theme.border}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: theme.textMuted,
                        marginBottom: "2px",
                      }}
                    >
                      Signed in as
                    </p>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: theme.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userEmail}
                    </p>
                  </div>
                )}

                <Link
                  href="/dashboard/profile"
                  style={{ ...dropdownItemStyle, textDecoration: "none" }}
                  onClick={() => setShowDropdown(false)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>⚙️</span> Profile Settings
                </Link>

                <button
                  onClick={() => {
                    onExport();
                    setShowDropdown(false);
                  }}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>⬇️</span> Export
                </button>

                <button
                  onClick={() => {
                    importInputRef.current?.click();
                    setShowDropdown(false);
                  }}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>⬆️</span> Import
                </button>

                <div
                  style={{
                    height: "1px",
                    background: theme.border,
                    margin: "8px 4px",
                  }}
                />

                <button
                  onClick={() => {
                    onLogout();
                    setShowDropdown(false);
                  }}
                  style={{
                    ...dropdownItemStyle,
                    color: "#ef4444",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>🚪</span> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          type="file"
          accept=".ics"
          ref={importInputRef}
          onChange={onImport}
          style={{ display: "none" }}
        />
      </div>
    </nav>
  );
}
