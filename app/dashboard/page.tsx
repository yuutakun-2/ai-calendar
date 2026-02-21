"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import NearestExamCard from "@/components/NearestExamCard";
import ExamFilterTabs from "@/components/ExamFilterTabs";
import CalendarView from "@/components/CalendarView";
import ExamForm from "@/components/ExamForm";
import AIAssistant from "@/components/AIAssistant";
import ThemeToggle from "@/components/ThemeToggle";

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
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("all");
  const [aiOpen, setAiOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/exams");
      setExams(data.exams);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
  };

  const handleToggleComplete = async (id: string) => {
    await axios.patch(`/api/exams/${id}/complete`);
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)),
    );
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
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top left, #150a2e 0%, var(--bg-primary) 50%)",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Navbar */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,15,0.85)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.4rem" }}>📅</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #f1f0ff, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ExamPal
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => {
              setEditingExam(null);
              setShowForm(true);
            }}
            className="btn-primary"
            style={{ width: "auto", padding: "9px 18px", fontSize: "0.875rem" }}
            id="add-exam-btn"
          >
            + Add Exam
          </button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="btn-ghost"
            style={{ padding: "9px 16px", fontSize: "0.875rem" }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}
      >
        {/* Top controls area (approx top 1/4) */}
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
                      ? "1px solid var(--border-hover)"
                      : "1px solid var(--border)",
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
                          color: "var(--text-muted)",
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
                    border: "1px solid var(--border)",
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: 6 }}>
                    Filter options
                  </p>
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                  >
                    Semester number and subject-based filtering will be added
                    next.
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Calendar area */}
        <motion.div
          key={calendarMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <CalendarView
            exams={calendarExams}
            loading={loading}
            onEdit={(exam) => {
              setEditingExam(exam);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
            highlightExamId={
              calendarMode === "nearest" ? nearest?.id : undefined
            }
            dimOthers={calendarMode === "nearest"}
          />
        </motion.div>
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
          border: "1px solid var(--border-hover)",
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
