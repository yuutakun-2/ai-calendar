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

export interface Exam {
  id: string;
  code: string;
  subject: string;
  examType: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  createdAt: string;
}

type Tab = "calendar" | "ai";

export default function DashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
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

  const filteredExams = exams.filter((e) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Regular" || activeFilter === "Backlog")
      return e.category === activeFilter;
    return e.examType === activeFilter;
  });

  const nearest = exams
    .filter((e) => !e.completed && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

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
        {/* Nearest Exam */}
        <NearestExamCard exam={nearest} loading={loading} />

        {/* Tab navigation */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "20px",
            background: "var(--bg-card)",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid var(--border)",
            width: "fit-content",
          }}
        >
          {(["calendar", "ai"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                position: "relative",
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color:
                  activeTab === tab
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-bg"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))",
                    borderRadius: "8px",
                    border: "1px solid var(--border-hover)",
                  }}
                  transition={{ duration: 0.15 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>
                {tab === "calendar" ? "📅 Calendar" : "🤖 AI Assistant"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "calendar" ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ExamFilterTabs
                active={activeFilter}
                onChange={setActiveFilter}
              />
              <CalendarView
                exams={filteredExams}
                loading={loading}
                onEdit={(exam) => {
                  setEditingExam(exam);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <AIAssistant onExamAdded={fetchExams} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
