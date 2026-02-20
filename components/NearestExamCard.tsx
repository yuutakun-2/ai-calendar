"use client";

import { motion } from "framer-motion";
import type { Exam } from "@/app/dashboard/page";

interface Props {
  exam: Exam | undefined;
  loading: boolean;
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default function NearestExamCard({ exam, loading }: Props) {
  if (loading) {
    return (
      <div
        className="skeleton"
        style={{ height: "90px", marginBottom: "24px", borderRadius: "16px" }}
      />
    );
  }

  if (!exam) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="glass"
        style={{
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span style={{ fontSize: "2rem" }}>🎉</span>
        <div>
          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            No upcoming exams
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            You&apos;re all caught up!
          </p>
        </div>
      </motion.div>
    );
  }

  const days = daysUntil(exam.date);
  const urgencyColor =
    days <= 3
      ? "var(--danger)"
      : days <= 7
        ? "var(--warning)"
        : "var(--success)";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="glass"
      style={{
        padding: "20px 24px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))",
            border: "1px solid var(--border-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          🔥
        </div>
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Next Exam
          </p>
          <p
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--text-primary)",
            }}
          >
            {exam.subject}
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {exam.code} · {exam.examType} ·{" "}
            {new Date(exam.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            · {exam.startTime}–{exam.endTime}
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: urgencyColor,
            lineHeight: 1,
          }}
        >
          {days}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {days === 1 ? "day left" : "days left"}
        </div>
      </div>
    </motion.div>
  );
}
