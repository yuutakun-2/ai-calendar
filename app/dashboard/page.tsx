"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import NearestExamCard from "@/components/NearestExamCard";
import ExamFilterTabs from "@/components/ExamFilterTabs";
import FullCalendarView from "@/components/FullCalendarView";
import ExamForm from "@/components/ExamForm";
import AIAssistant from "@/components/AIAssistant";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";
import { THEMES } from "@/lib/themes";

export interface Exam {
  id: string;
  code: string;
  subject: string;
  examType: string;
  category: string;
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  createdAt: string;
}

type CalendarMode = "all" | "nearest" | "filter";

export default function DashboardPage() {
  const router = useRouter();
  const { theme: themeName } = useTheme();
  const theme = THEMES[themeName as keyof typeof THEMES];
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("all");
  const [aiOpen, setAiOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/exams");
      // Auto-mark exams as complete if current time is past endTime
      const now = new Date();
      const examsWithAutoComplete = await Promise.all(
        data.exams.map(async (exam: Exam) => {
          if (!exam.completed) {
            const examDateTime = new Date(`${exam.date}T${exam.endTime}`);
            if (now > examDateTime) {
              // Auto-complete the exam
              try {
                await axios.patch(`/api/exams/${exam.id}/complete`);
                return { ...exam, completed: true };
              } catch {
                return exam;
              }
            }
          }
          return exam;
        }),
      );
      setExams(examsWithAutoComplete);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Check if mobile for responsive layout
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    await axios.delete(`/api/exams/${id}`);
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingExam(null);
    fetchExams();
  };

  const sortExams = (list: Exam[]) => {
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const filteredExams = sortExams(
    exams.filter((e) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Regular" || activeFilter === "Backlog")
        return e.category === activeFilter;
      return e.examType === activeFilter;
    }),
  );

  const nearest = exams
    .filter((e) => !e.completed && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const calendarExams =
    calendarMode === "filter" ? filteredExams : sortExams(exams as Exam[]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: theme.bgCard,
      }}
    >
      {/* Navbar - fixed at top */}
      <nav
        style={{
          height: "73px", // Fixed height for navbar
          borderBottom: `1px solid ${theme.border}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(12px)",
          background:
            themeName === "dark"
              ? "rgba(10,10,15,0.85)"
              : "rgba(255,255,255,0.85)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.4rem" }}>📅</span>
          {!isMobile && (
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                color: theme.textPrimary,
              }}
            >
              ExamPal
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => {
              setEditingExam(null);
              setShowForm(true);
            }}
            style={{
              width: isMobile ? "40px" : "auto",
              height: "40px",
              padding: isMobile ? "0" : "9px 18px",
              fontSize: "0.875rem",
              background: theme.accent,
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            id="add-exam-btn"
          >
            {isMobile ? "+" : "+ Add Exam"}
          </button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            style={{
              width: isMobile ? "40px" : "auto",
              height: "40px",
              padding: isMobile ? "0" : "9px 16px",
              fontSize: "0.875rem",
              background: "transparent",
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isMobile ? "🔑" : "Logout"}
          </button>
        </div>
      </nav>

      {/* Main content area - uses 100% remaining height */}
      <main
        style={{
          height: "calc(100vh - 73px)", // Full remaining height after navbar
          display: "flex",
          flexDirection: "column",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 16px",
        }}
      >
        {/* Top controls area */}
        <div style={{ display: "grid", gap: "16px", marginBottom: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            {["nearest", "all", "filter"].map((k) => {
              const active =
                (k === "nearest" && calendarMode === "nearest") ||
                (k === "all" && calendarMode === "all") ||
                (k === "filter" && calendarMode === "filter");

              return (
                <button
                  key={k}
                  onClick={() => {
                    if (k === "nearest") setCalendarMode("nearest");
                    if (k === "all") setCalendarMode("all");
                    if (k === "filter") setCalendarMode("filter");
                  }}
                  className="glass"
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    border: active
                      ? `1px solid ${theme.accent}`
                      : `1px solid ${theme.border}`,
                    background: active
                      ? "linear-gradient(135deg, rgba(139,92,246,0.16), rgba(109,40,217,0.10))"
                      : undefined,
                    transition: "all 0.15s",
                    position: "relative",
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>
                      {k === "nearest" ? "🔥" : k === "all" ? "📅" : "🔎"}
                    </span>
                    {!isMobile && (
                      <div>
                        <p style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                          {k === "nearest"
                            ? "View Nearest Exam"
                            : k === "all"
                              ? "View Calendar"
                              : "View Filter"}
                        </p>
                        <p
                          style={{
                            color: theme.textMuted,
                            fontSize: "0.78rem",
                            marginTop: 2,
                          }}
                        >
                          {k === "nearest"
                            ? "Focus on your next exam"
                            : k === "all"
                              ? "Show all exams normally"
                              : "Filter by type, semester, and subject"}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nearest exam details card (shown when nearest view active) */}
          <AnimatePresence mode="wait">
            {calendarMode === "nearest" ? (
              <motion.div
                key="nearest-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <NearestExamCard exam={nearest} loading={loading} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Filter controls (shown when filter view active) */}
          <AnimatePresence mode="wait">
            {calendarMode === "filter" ? (
              <motion.div
                key="filters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <ExamFilterTabs
                  active={activeFilter}
                  onChange={setActiveFilter}
                />
                <div
                  className="glass"
                  style={{
                    padding: "16px",
                    marginBottom: "12px",
                    borderRadius: "16px",
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: 6 }}>
                    Filter options
                  </p>
                  <p style={{ color: theme.textMuted, fontSize: "0.85rem" }}>
                    Semester number and subject-based filtering will be added
                    next.
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Main content area with cards and calendar - uses 100% remaining height */}
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: isMobile ? "16px" : "20px",
            flexDirection: isMobile ? "column" : "row",
            height: isMobile ? "auto" : "70vh", // Auto height on mobile to prevent overflow
            minHeight: isMobile ? "600px" : "auto", // Minimum height on mobile
          }}
        >
          {/* Exam cards section */}
          <div
            style={{
              width: isMobile ? "100%" : "350px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              height: isMobile ? "120px" : "auto", // Reduced height on mobile to show only first card
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto", // Enable vertical scrolling
                background: theme.bgCard,
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                padding: "16px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: theme.textPrimary,
                }}
              >
                {calendarMode === "nearest"
                  ? "Nearest Exam"
                  : calendarMode === "filter"
                    ? "Filtered Exams"
                    : `All Exams (${calendarExams.length})`}
              </h3>
              {calendarMode === "nearest" && nearest ? (
                <div
                  style={{
                    padding: "16px",
                    background: theme.bgSecondary,
                    borderRadius: "8px",
                    border: `2px solid ${theme.accent}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: theme.textPrimary,
                      marginBottom: "8px",
                    }}
                  >
                    {nearest.subject}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: theme.textMuted,
                      marginBottom: "4px",
                    }}
                  >
                    {nearest.examType} • {nearest.code}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: theme.textSecondary,
                      marginBottom: "12px",
                    }}
                  >
                    📅 {new Date(nearest.date).toLocaleDateString()}{" "}
                    &nbsp;·&nbsp; 🕐 {nearest.startTime} – {nearest.endTime}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setEditingExam(nearest);
                        setShowForm(true);
                      }}
                      className="btn-primary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(nearest.id)}
                      className="btn-danger"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {calendarExams.map((exam) => (
                    <div
                      key={exam.id}
                      style={{
                        padding: "14px",
                        background: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          theme.accent;
                        (e.currentTarget as HTMLDivElement).style.background =
                          theme.bgCard;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          theme.border;
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
                              color: exam.completed
                                ? theme.textMuted
                                : theme.textPrimary,
                              textDecoration: exam.completed
                                ? "line-through"
                                : "none",
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
                            📅 {new Date(exam.date).toLocaleDateString()}{" "}
                            &nbsp;·&nbsp; 🕐 {exam.startTime} – {exam.endTime}
                          </div>
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
                            onClick={() => {
                              setEditingExam(exam);
                              setShowForm(true);
                            }}
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
                            onClick={() => handleDelete(exam.id)}
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
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              minHeight: isMobile ? "350px" : "auto", // Ensure calendar has minimum height on mobile
            }}
          >
            <FullCalendarView
              exams={calendarExams}
              loading={loading}
              onEdit={(exam) => {
                setEditingExam(exam);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              nearestExam={calendarMode === "nearest" ? nearest : null}
              filteredExams={
                calendarMode === "filter" ? filteredExams : undefined
              }
            />
          </div>
        </div>
      </main>

      {/* Floating AI button + drawer */}
      <button
        onClick={() => setAiOpen(true)}
        aria-label="Open AI assistant"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 16,
          border: `1px solid ${theme.accent}`,
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(109,40,217,0.85))",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          cursor: "pointer",
          zIndex: 120,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        🤖
      </button>

      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 130,
            }}
            onClick={(e) => e.target === e.currentTarget && setAiOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                right: 16,
                bottom: 16,
                width: "min(420px, calc(100vw - 32px))",
              }}
            >
              <AIAssistant onExamAdded={fetchExams} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exam Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ExamForm
            exam={editingExam}
            onSuccess={handleFormSuccess}
            onClose={() => {
              setShowForm(false);
              setEditingExam(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
