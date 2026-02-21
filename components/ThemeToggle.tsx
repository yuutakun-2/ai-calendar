"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { THEMES, Theme } from "@/lib/themes";

// Theme context
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback to dark theme if context is undefined
    return {
      theme: "dark",
      toggleTheme: () => {},
    };
  }
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const handleToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: handleToggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("theme") as Theme;
    if (stored && Object.keys(THEMES).includes(stored)) return stored;
  }
  return "dark";
};

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const currentTheme = THEMES[theme as keyof typeof THEMES];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      style={{
        padding: "9px 18px", // Match Add Exam and Logout button height
        background: currentTheme.bgCard,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: "6px", // Match other navbar buttons
        color: currentTheme.textPrimary,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.875rem", // Match other navbar buttons
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          currentTheme.accent;
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          currentTheme.border;
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      <span
        style={{
          fontSize: "1.2rem",
        }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {theme}
      </span>
    </button>
  );
}
