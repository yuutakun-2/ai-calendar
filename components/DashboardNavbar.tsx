import React, { RefObject } from "react";
import ThemeToggle from "./ThemeToggle";
import { ThemeConfig } from "@/lib/themes";

interface DashboardNavbarProps {
  isMobile: boolean;
  themeName: string;
  theme: ThemeConfig;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: RefObject<HTMLInputElement | null>;
  onAddExam: () => void;
  onLogout: () => void;
}

export default function DashboardNavbar({
  isMobile,
  themeName,
  theme,
  onExport,
  onImport,
  importInputRef,
  onAddExam,
  onLogout,
}: DashboardNavbarProps) {
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
        background:
          themeName === "dark"
            ? "rgba(10,10,15,0.85)"
            : "rgba(255,255,255,0.85)",
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
          onClick={onExport}
          style={{
            width: isMobile ? "40px" : "auto",
            height: "40px",
            padding: isMobile ? "0" : "9px 16px",
            fontSize: "0.875rem",
            background: "transparent",
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Export to Calendar"
        >
          {isMobile ? "⬇️" : "Export"}
        </button>

        <button
          onClick={() => importInputRef.current?.click()}
          style={{
            width: isMobile ? "40px" : "auto",
            height: "40px",
            padding: isMobile ? "0" : "9px 16px",
            fontSize: "0.875rem",
            background: "transparent",
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Import from Calendar"
        >
          {isMobile ? "⬆️" : "Import"}
        </button>
        <input
          type="file"
          accept=".ics"
          ref={importInputRef}
          onChange={onImport}
          style={{ display: "none" }}
        />

        <button
          onClick={onAddExam}
          style={{
            width: isMobile ? "40px" : "auto",
            height: "40px",
            padding: isMobile ? "0" : "9px 18px",
            fontSize: "0.875rem",
            background: theme.accent,
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          id="add-exam-btn"
        >
          {isMobile ? "+" : "+ Add Exam"}
        </button>
        <ThemeToggle />
        <button
          onClick={onLogout}
          style={{
            width: isMobile ? "40px" : "auto",
            height: "40px",
            padding: isMobile ? "0" : "9px 16px",
            fontSize: "0.875rem",
            background: "transparent",
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isMobile ? "🔑" : "Logout"}
        </button>
      </div>
    </nav>
  );
}
