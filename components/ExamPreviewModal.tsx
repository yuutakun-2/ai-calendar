"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

interface ExamData {
  code: string;
  subject: string;
  examType: string;
  category: string;
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  exam: ExamData;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  "Mid Term": "#a78bfa",
  "End Term": "#f87171",
  CA: "#fbbf24",
  Lab: "#34d399",
  Other: "#60a5fa",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        {label}
      </span>
      <span
        style={{
          color: "var(--text-primary)",
          fontWeight: 600,
          fontSize: "0.875rem",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ExamPreviewModal({
  exam,
  onConfirm,
  onEdit,
  onClose,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/exams", exam);
      onConfirm();
    } catch {
      setError("Failed to save exam. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="glass"
        style={{ width: "100%", maxWidth: "460px", padding: "28px" }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>✨</div>
          <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>
            Confirm Exam Details
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}
          >
            Review and confirm before saving
          </p>
        </div>

        {/* Exam data preview */}
        <div
          style={{
            background: "rgba(139,92,246,0.06)",
            borderRadius: "12px",
            padding: "4px 16px",
            border: "1px solid var(--border)",
            marginBottom: "20px",
          }}
        >
          <Row label="Subject Code" value={exam.code} />
          <Row label="Subject" value={exam.subject} />
          <Row label="Exam Type" value={exam.examType} />
          <Row label="Category" value={exam.category} />
          <Row label="Semester" value={String(exam.semester)} />
          <Row
            label="Date"
            value={new Date(exam.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Time
            </span>
            <span
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              {exam.startTime} – {exam.endTime}
            </span>
          </div>
        </div>

        {/* Type color indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: TYPE_COLORS[exam.examType] || "#a78bfa",
            }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {exam.examType} · {exam.category}
          </span>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              color: "var(--danger)",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onEdit}
            className="btn-ghost"
            style={{ flex: 1 }}
            data-testid="exam-preview-edit-btn"
          >
            Edit
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary"
            disabled={saving}
            style={{ flex: 2 }}
            data-testid="exam-preview-confirm-btn"
          >
            {saving ? (
              <>
                <span className="spinner" />
                Saving…
              </>
            ) : (
              "✅ Confirm & Add"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
