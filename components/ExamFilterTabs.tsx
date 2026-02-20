"use client";

import { motion } from "framer-motion";

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
          key={f}
          onClick={() => onChange(f)}
          style={{
            position: "relative",
            padding: "6px 16px",
            borderRadius: "20px",
            border: "1px solid",
            borderColor: active === f ? "var(--accent)" : "var(--border)",
            background: "transparent",
            color: active === f ? "var(--accent-light)" : "var(--text-muted)",
            fontWeight: 500,
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {active === f && (
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
          <span style={{ position: "relative", zIndex: 1 }}>{f}</span>
        </button>
      ))}
    </div>
  );
}
