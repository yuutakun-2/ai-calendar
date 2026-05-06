"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Exam } from "@/app/dashboard/page";
import { ThemeConfig } from "@/lib/themes";

interface ExportModalProps {
  exams: Exam[];
  theme: ThemeConfig;
  themeName: string;
  onExport: (selectedExams: Exam[], filename: string) => void;
  onClose: () => void;
}

export default function ExportModal({
  exams,
  theme,
  themeName,
  onExport,
  onClose,
}: ExportModalProps) {
  const isDark = themeName === "dark";

  const today = new Date().toISOString().split("T")[0];
  const [filename, setFilename] = useState(`exampal_calendar_${today}`);
  const [mode, setMode] = useState<"quick" | "advanced">("quick");

  // Group exams by date for advanced selection
  const grouped = useMemo(() => {
    const map = new Map<string, Exam[]>();
    for (const exam of exams) {
      const key = exam.date; // ISO date string e.g. "2025-06-10"
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exam);
    }
    // Sort by date ascending
    return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [exams]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(exams.map((e) => e.id)),
  );

  const toggleExam = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDateGroup = (key: string) => {
    const dateExams = grouped.get(key) ?? [];
    const allSelected = dateExams.every((e) => selectedIds.has(e.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) dateExams.forEach((e) => next.delete(e.id));
      else dateExams.forEach((e) => next.add(e.id));
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(exams.map((e) => e.id)));
  const selectNone = () => setSelectedIds(new Set());

  const handleExport = () => {
    const selected =
      mode === "quick" ? exams : exams.filter((e) => selectedIds.has(e.id));
    const name = filename.trim() || `exampal_calendar_${today}`;
    onExport(selected, name);
    onClose();
  };

  const selectedCount = mode === "quick" ? exams.length : selectedIds.size;

  /* ── Shared styles ─────────────────────────────────────────── */
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  };

  const modalStyle: React.CSSProperties = {
    background: isDark ? "#0f0f16" : "#ffffff",
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    width: "min(520px, 100%)",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
    overflow: "hidden",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "0.9rem",
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    borderRadius: "8px",
    transition: "all 0.15s",
    background: active
      ? "linear-gradient(135deg, rgba(139,92,246,0.85), rgba(109,40,217,0.75))"
      : "transparent",
    color: active ? "#fff" : theme.textMuted,
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: theme.textSecondary,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={overlayStyle}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={modalStyle}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: "20px 24px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: theme.textPrimary,
                }}
              >
                Export Calendar
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.8rem",
                  color: theme.textMuted,
                }}
              >
                {exams.length} exam{exams.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.3rem",
                color: theme.textMuted,
                lineHeight: 1,
                padding: "4px",
                borderRadius: "6px",
              }}
            >
              ×
            </button>
          </div>

          {/* ── Body ── */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              minHeight: 0,
            }}
          >
            {/* Filename */}
            <div style={{ flexShrink: 0 }}>
              <label style={labelStyle}>File name</label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  style={inputStyle}
                  placeholder="exampal_calendar"
                  spellCheck={false}
                />
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: theme.textMuted,
                    whiteSpace: "nowrap",
                  }}
                >
                  .ics
                </span>
              </div>
            </div>

            {/* Mode tabs */}
            <div style={{ flexShrink: 0 }}>
              <label style={labelStyle}>Export mode</label>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "4px",
                  background: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.04)",
                  borderRadius: "10px",
                }}
              >
                <button
                  style={tabStyle(mode === "quick")}
                  onClick={() => setMode("quick")}
                >
                  ⚡ Quick Export
                </button>
                <button
                  style={tabStyle(mode === "advanced")}
                  onClick={() => setMode("advanced")}
                >
                  🎛️ Advanced
                </button>
              </div>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "0.78rem",
                  color: theme.textMuted,
                }}
              >
                {mode === "quick"
                  ? "Exports all exams in one click."
                  : "Pick which exams to include, organised by exam date."}
              </p>
            </div>

            {/* ── Advanced: date-grouped selector ── */}
            {mode === "advanced" && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Select all / none */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{ fontSize: "0.8rem", color: theme.textSecondary }}
                  >
                    {selectedIds.size} of {exams.length} selected
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={selectAll}
                      style={{
                        fontSize: "0.75rem",
                        color: theme.accent,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                        fontWeight: 600,
                      }}
                    >
                      All
                    </button>
                    <button
                      onClick={selectNone}
                      style={{
                        fontSize: "0.75rem",
                        color: theme.textMuted,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                        fontWeight: 600,
                      }}
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Date group list — scrollable, always fully expanded */}
                <div
                  style={{
                    flex: 1,
                    minHeight: "120px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    paddingRight: "4px",
                  }}
                >
                  {Array.from(grouped.entries()).map(([dateKey, dateExams]) => {
                    const allSelected = dateExams.every((e) =>
                      selectedIds.has(e.id),
                    );
                    const someSelected = dateExams.some((e) =>
                      selectedIds.has(e.id),
                    );

                    const formattedDate = new Date(dateKey).toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    );

                    return (
                      <div
                        key={dateKey}
                        style={{
                          border: `1px solid ${theme.border}`,
                          borderRadius: "10px",
                          overflow: "hidden",
                          minHeight: "112px",
                          background: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(0,0,0,0.02)",
                        }}
                      >
                        {/* Date header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            background: isDark
                              ? "rgba(139,92,246,0.08)"
                              : "rgba(139,92,246,0.05)",
                            borderBottom: `1px solid ${theme.border}`,
                          }}
                        >
                          {/* Date-level checkbox */}
                          <button
                            onClick={() => toggleDateGroup(dateKey)}
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              border: `2px solid ${
                                allSelected
                                  ? theme.accent
                                  : someSelected
                                    ? theme.accent
                                    : theme.border
                              }`,
                              background: allSelected
                                ? theme.accent
                                : someSelected
                                  ? `${theme.accent}44`
                                  : "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.1s",
                            }}
                          >
                            {allSelected && (
                              <span
                                style={{
                                  color: "white",
                                  fontSize: "11px",
                                  lineHeight: 1,
                                }}
                              >
                                ✓
                              </span>
                            )}
                            {someSelected && !allSelected && (
                              <span
                                style={{
                                  color: theme.accent,
                                  fontSize: "11px",
                                  lineHeight: 1,
                                  fontWeight: 700,
                                }}
                              >
                                –
                              </span>
                            )}
                          </button>

                          {/* Date label + count badge */}
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: theme.textPrimary,
                              }}
                            >
                              {formattedDate}
                            </span>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: theme.textMuted,
                                background: isDark
                                  ? "rgba(255,255,255,0.07)"
                                  : "rgba(0,0,0,0.07)",
                                padding: "1px 7px",
                                borderRadius: "99px",
                              }}
                            >
                              {dateExams.length} exam
                              {dateExams.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Exam rows — always visible */}
                        <div style={{ padding: "4px 0" }}>
                          {dateExams.map((exam) => (
                            <div
                              key={exam.id}
                              onClick={() => toggleExam(exam.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "9px 12px 9px 40px",
                                cursor: "pointer",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = isDark
                                  ? "rgba(255,255,255,0.04)"
                                  : "rgba(0,0,0,0.04)";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "transparent";
                              }}
                            >
                              {/* Exam checkbox */}
                              <div
                                style={{
                                  width: "15px",
                                  height: "15px",
                                  borderRadius: "3px",
                                  border: `2px solid ${
                                    selectedIds.has(exam.id)
                                      ? theme.accent
                                      : theme.border
                                  }`,
                                  background: selectedIds.has(exam.id)
                                    ? theme.accent
                                    : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  transition: "all 0.1s",
                                }}
                              >
                                {selectedIds.has(exam.id) && (
                                  <span
                                    style={{
                                      color: "white",
                                      fontSize: "9px",
                                      lineHeight: 1,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span
                                  style={{
                                    fontSize: "0.84rem",
                                    fontWeight: 600,
                                    color: theme.textPrimary,
                                  }}
                                >
                                  {exam.subject}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.78rem",
                                    color: theme.textMuted,
                                    marginLeft: "6px",
                                  }}
                                >
                                  {exam.code}
                                </span>
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: theme.textMuted,
                                    marginTop: "1px",
                                  }}
                                >
                                  {exam.examType}
                                  {exam.startTime ? ` • ${exam.startTime}` : ""}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "9px 18px",
                fontSize: "0.875rem",
                fontWeight: 600,
                background: "transparent",
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={mode === "advanced" && selectedIds.size === 0}
              style={{
                padding: "9px 20px",
                fontSize: "0.875rem",
                fontWeight: 600,
                background:
                  mode === "advanced" && selectedIds.size === 0
                    ? theme.border
                    : "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(109,40,217,0.85))",
                color:
                  mode === "advanced" && selectedIds.size === 0
                    ? theme.textMuted
                    : "white",
                border: "none",
                borderRadius: "8px",
                cursor:
                  mode === "advanced" && selectedIds.size === 0
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ⬇️ Export {selectedCount > 0 ? `(${selectedCount})` : ""}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
