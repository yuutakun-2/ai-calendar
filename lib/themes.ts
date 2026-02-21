export const THEMES = {
  light: {
    name: "light",
    bgCard: "#ffffff",
    bgSecondary: "#f8fafc",
    border: "#e2e8f0",
    accent: "#3b82f6",
    success: "#10b981",
    textPrimary: "#1f2937",
    textMuted: "#6b7280",
    textSecondary: "#4b5563",
    danger: "#ef4444",
  },
  dark: {
    name: "dark",
    bgCard: "#1e1b2e",
    bgSecondary: "#2a2f3e",
    border: "#374151",
    accent: "#8b5cf6",
    success: "#10b981",
    textPrimary: "#f1f5f9",
    textMuted: "#9ca3af",
    textSecondary: "#6b7280",
    danger: "#ef4444",
  },
} as const;

export type Theme = keyof typeof THEMES;
