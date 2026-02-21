"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const FILTERS = [
  { name: "All", icon: "📋" },
  { name: "Mid Term", icon: "📝" },
  { name: "End Term", icon: "📚" },
  { name: "CA", icon: "📄" },
  { name: "Lab", icon: "🔬" },
  { name: "Other", icon: "📌" },
  { name: "Regular", icon: "✅" },
  { name: "Backlog", icon: "⏰" },
];

interface Props {
  active: string;
  onChange: (f: string) => void;
}

export default function ExamFilterTabs({ active, onChange }: Props) {
  const [isMobile, setIsMobile] = useState(false);

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
        marginBottom: "20px",
        flexWrap: "wrap",
      }}
    >
      {FILTERS.map((f) => (
        <button
          key={f.name}
          onClick={() => onChange(f.name)}
          style={{
            position: "relative",
            padding: isMobile ? "8px 12px" : "6px 16px",
            borderRadius: "20px",
            border: "1px solid",
            borderColor: active === f.name ? "var(--accent)" : "var(--border)",
            background: "transparent",
            color:
              active === f.name ? "var(--accent-light)" : "var(--text-muted)",
            fontWeight: 500,
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: isMobile ? "40px" : "auto",
          }}
        >
          {active === f.name && (
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
          <span style={{ position: "relative", zIndex: 1 }}>
            {isMobile ? f.icon : f.name}
          </span>
        </button>
      ))}
    </div>
  );
}
