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
  isMultiple?: boolean;
  currentIndex?: number;
  totalCount?: number;
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
  isMultiple = false,
  currentIndex = 1,
  totalCount = 1,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedExam, setEditedExam] = useState<ExamData>(exam);

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/exams", isEditing ? editedExam : exam);
      onConfirm();
    } catch {
      setError("Failed to save exam. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayExam = isEditing ? editedExam : exam;

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
            {isEditing ? "Edit Exam Details" : "Confirm Exam Details"}
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}
          >
            {isMultiple
              ? `Exam ${currentIndex} of ${totalCount}`
              : isEditing
                ? "Make changes as needed"
                : "Review and confirm before saving"}
          </p>
        </div>

        {/* Exam data preview/edit */}
        <div
          style={{
            background: "rgba(14,165,233,0.06)",
            borderRadius: "12px",
            padding: "4px 16px",
            border: "1px solid var(--border)",
            marginBottom: "20px",
          }}
        >
          {isEditing ? (
            <div style={{ display: "grid", gap: "12px", paddingTop: "12px" }}>
              <div>
                <label className="field-label">Subject Code</label>
                <input
                  type="text"
                  value={editedExam.code}
                  onChange={(e) =>
                    setEditedExam({ ...editedExam, code: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Subject</label>
                <input
                  type="text"
                  value={editedExam.subject}
                  onChange={(e) =>
                    setEditedExam({ ...editedExam, subject: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Exam Type</label>
                <select
                  value={editedExam.examType}
                  onChange={(e) =>
                    setEditedExam({ ...editedExam, examType: e.target.value })
                  }
                  className="input-field"
                >
                  <option>Mid Term</option>
                  <option>End Term</option>
                  <option>CA</option>
                  <option>Lab</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="field-label">Category</label>
                <select
                  value={editedExam.category}
                  onChange={(e) =>
                    setEditedExam({ ...editedExam, category: e.target.value })
                  }
                  className="input-field"
                >
                  <option>Regular</option>
                  <option>Backlog</option>
                </select>
              </div>
              <div>
                <label className="field-label">Semester</label>
                <input
                  type="number"
                  value={editedExam.semester}
                  onChange={(e) =>
                    setEditedExam({
                      ...editedExam,
                      semester: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Date</label>
                <input
                  type="date"
                  value={editedExam.date}
                  onChange={(e) =>
                    setEditedExam({ ...editedExam, date: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Start Time</label>
                <input
                  type="time"
                  value={editedExam.startTime}
                  onChange={(e) =>
                    setEditedExam({
                      ...editedExam,
                      startTime: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">End Time</label>
                <input
                  type="time"
                  value={editedExam.endTime}
                  onChange={(e) =>
                    setEditedExam({ ...editedExam, endTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>
          ) : (
            <>
              <Row label="Subject Code" value={displayExam.code} />
              <Row label="Subject" value={displayExam.subject} />
              <Row label="Exam Type" value={displayExam.examType} />
              <Row label="Category" value={displayExam.category} />
              <Row label="Semester" value={String(displayExam.semester)} />
              <Row
                label="Date"
                value={new Date(displayExam.date).toLocaleDateString("en-US", {
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
                <span
                  style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
                >
                  Time
                </span>
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  {displayExam.startTime} – {displayExam.endTime}
                </span>
              </div>
            </>
          )}
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
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
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
                  "✅ Save Changes"
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-ghost"
                style={{ flex: 1 }}
                data-testid="exam-preview-edit-btn"
              >
                ✏️ Edit
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
                ) : isMultiple ? (
                  `✅ Confirm (${currentIndex}/${totalCount})`
                ) : (
                  "✅ Confirm & Add"
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
