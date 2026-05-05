import React from "react";
import { ThemeConfig } from "@/lib/themes";
import { Exam } from "@/app/dashboard/page";

interface ExamCardProps {
  exam: Exam;
  theme: ThemeConfig;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function ExamCard({
  exam,
  theme,
  onClick,
  onEdit,
  onDelete,
}: ExamCardProps) {
  return (
    <div
      style={{
        padding: "14px",
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = theme.accent;
        (e.currentTarget as HTMLDivElement).style.background = theme.bgCard;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = theme.border;
        (e.currentTarget as HTMLDivElement).style.background =
          theme.bgSecondary;
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: exam.completed ? theme.textMuted : theme.textPrimary,
              textDecoration: exam.completed ? "line-through" : "none",
            }}
          >
            {exam.subject}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: theme.textMuted,
              marginTop: 4,
            }}
          >
            {exam.examType} • {exam.code}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: theme.textSecondary,
              marginTop: "6px",
            }}
          >
            📅 {new Date(exam.date).toLocaleDateString()} &nbsp;·&nbsp; 🕐{" "}
            {exam.startTime} – {exam.endTime}
          </div>
          {exam.examDescription && (
            <div
              style={{
                fontSize: "0.8rem",
                color: theme.textMuted,
                marginTop: "6px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontStyle: "italic",
              }}
            >
              {exam.examDescription}
            </div>
          )}
          {exam.completed && (
            <div
              style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "2px 8px",
                background: theme.success,
                color: "white",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              Completed
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <button
            onClick={onEdit}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: theme.accent,
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              whiteSpace: "normal",
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: theme.danger,
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
