"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeToggle";
import { THEMES } from "@/lib/themes";

const FILTERS = [
  "All",
  "Mid Term",
  "End Term",
  "CA",
  "Lab",
  "Other",
  "Regular",
  "Backlog",
];

interface Props {
  active: string;
  onChange: (f: string) => void;
}

export default function ExamFilterTabs({ active, onChange }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const { theme: themeName } = useTheme();
  const theme = THEMES[themeName as keyof typeof THEMES];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {FILTERS.map((filterName) => (
        <button
          key={filterName}
          onClick={() => onChange(filterName)}
          style={{
            position: "relative",
            padding: isMobile ? "8px 12px" : "6px 16px",
            borderRadius: "20px",
            border: "1px solid",
            borderColor: active === filterName ? theme.accent : theme.border,
            background: "transparent",
            color: active === filterName ? theme.accent : theme.textMuted,
            fontWeight: 500,
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {active === filterName && (
            <motion.div
              layoutId="filter-bg"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: "rgba(139,92,246,0.15)",
              }}
              transition={{ duration: 0.15 }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>{filterName}</span>
        </button>
      ))}
    </div>
  );
}
