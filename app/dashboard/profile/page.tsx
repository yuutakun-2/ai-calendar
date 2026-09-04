"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { THEMES } from "@/lib/themes";

export default function ProfilePage() {
  const { themeName } = useTheme();
  const theme = THEMES[themeName as keyof typeof THEMES] || THEMES.dark;
  const isDark = themeName === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setName(data.name || "");
        setEmail(data.email);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load profile data." });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "An error occurred while updating your profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          color: theme.textPrimary,
        }}
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "600px",
        margin: "0 auto",
        color: theme.textPrimary,
      }}
    >
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: theme.accent,
          textDecoration: "none",
          fontSize: "0.875rem",
          marginBottom: "24px",
          fontWeight: "500",
        }}
      >
        ← Back to Dashboard
      </Link>

      <div
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${theme.border}`,
          borderRadius: "16px",
          padding: "32px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "24px",
            color: theme.textPrimary,
          }}
        >
          Profile Settings
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: theme.textMuted }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                background: isDark
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(255,255,255,0.8)",
                color: theme.textMuted,
                cursor: "not-allowed",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: theme.textMuted }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                background: isDark
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(255,255,255,0.8)",
                color: theme.textPrimary,
                fontSize: "0.9rem",
              }}
            />
          </div>

          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background:
                  message.type === "success"
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(239,68,68,0.1)",
                color: message.type === "success" ? "#22c55e" : "#ef4444",
                border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: theme.accent,
              color: "white",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "600",
              transition: "opacity 0.2s",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
