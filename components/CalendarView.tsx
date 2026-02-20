"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import type { Exam } from "@/app/dashboard/page";

interface Props {
  exams: Exam[];
  loading: boolean;
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  highlightExamId?: string;
  dimOthers?: boolean;
}

const TYPE_BADGE: Record<string, string> = {
  "Mid Term": "badge-midterm",
  "End Term": "badge-endterm",
  Lab: "badge-lab",
  CA: "badge-other",
  Other: "badge-other",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CalendarView({
  exams,
  loading,
  onEdit,
  onDelete,
  onToggleComplete,
  highlightExamId,
  dimOthers,
}: Props) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: "12px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "80px", borderRadius: "16px" }}
          />
        ))}
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass"
        style={{ padding: "48px", textAlign: "center" }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
        <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          No exams found
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginTop: "4px",
          }}
        >
          Add one manually or use the AI Assistant
        </p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <AnimatePresence>
        {exams.map((exam, i) =>
          (() => {
            const isHighlighted =
              highlightExamId && exam.id === highlightExamId;
            const shouldDim = Boolean(dimOthers && highlightExamId);
            const opacity = shouldDim
              ? isHighlighted
                ? 1
                : 0.25
              : exam.completed
                ? 0.55
                : 1;

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                className="glass"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                  opacity,
                  transition: "opacity 0.2s",
                  outline: isHighlighted
                    ? "2px solid rgba(139,92,246,0.45)"
                    : "none",
                }}
              >
                {/* Complete toggle */}
                <button
                  onClick={() => onToggleComplete(exam.id)}
                  title={exam.completed ? "Mark incomplete" : "Mark complete"}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: `2px solid ${exam.completed ? "var(--success)" : "var(--border)"}`,
                    background: exam.completed
                      ? "var(--success)"
                      : "transparent",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {exam.completed && (
                    <span style={{ color: "#fff", fontSize: "12px" }}>✓</span>
                  )}
                </button>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: exam.completed
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                        textDecoration: exam.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {exam.subject}
                    </span>
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                    >
                      {exam.code}
                    </span>
                    <span
                      className={`badge ${TYPE_BADGE[exam.examType] || "badge-other"}`}
                    >
                      {exam.examType}
                    </span>
                    <span
                      className={`badge ${exam.category === "Backlog" ? "badge-backlog" : "badge-regular"}`}
                    >
                      {exam.category}
                    </span>
                  </div>
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}
                  >
                    📅 {formatDate(exam.date)} &nbsp;·&nbsp; 🕐 {exam.startTime}{" "}
                    – {exam.endTime}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => onEdit(exam)}
                    className="btn-ghost"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(exam.id)}
                    className="btn-danger"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            );
          })(),
        )}
      </AnimatePresence>
    </div>
  );
}
