"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import NearestExamCard from "@/components/NearestExamCard";
import ExamFilterTabs from "@/components/ExamFilterTabs";
import FullCalendarView from "@/components/FullCalendarView";
import ExamForm from "@/components/ExamForm";
import AIAssistant from "@/components/AIAssistant";
import { useTheme } from "@/components/ThemeToggle";
import DashboardNavbar from "@/components/DashboardNavbar";
import ExamCard from "@/components/ExamCard";
import ExportModal from "@/components/ExportModal";
import { THEMES } from "@/lib/themes";
import { generateICS, parseICS } from "@/lib/ics";
import { sortExams } from "@/lib/examUtils";

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
  examDescription?: string;
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
  const [aiInitialData, setAiInitialData] = useState<Partial<Exam> | null>(
    null,
  );
  const [detectedExamsQueue, setDetectedExamsQueue] = useState<Partial<Exam>[]>(
    [],
  );
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/exams");
      // Auto-mark exams as complete if current time is past endTime
      const now = new Date();
      const examsWithAutoComplete = await Promise.all(
        data.exams.map(async (exam: Exam) => {
          if (!exam.completed) {
            const dateStr = exam.date.split("T")[0];
            const examDateTime = new Date(`${dateStr}T${exam.endTime}`);
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
    // Fetch user email
    axios
      .get("/api/user/me")
      .then(({ data }) => setUserEmail(data.email))
      .catch(() => {});
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
    window.location.assign("/login");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    await axios.delete(`/api/exams/${id}`);
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  const processNextInQueue = useCallback(() => {
    setDetectedExamsQueue((prevQueue) => {
      if (prevQueue.length > 0) {
        const nextExam = prevQueue[0];
        setAiInitialData(nextExam);
        setEditingExam(null);
        setShowForm(true);
        return prevQueue.slice(1);
      } else {
        setShowForm(false);
        setEditingExam(null);
        setAiInitialData(null);
        return prevQueue;
      }
    });
  }, []);

  const handleFormSuccess = () => {
    fetchExams();
    processNextInQueue();
  };

  const handleFormClose = () => {
    processNextInQueue();
  };

  const handleExamsDetected = (exams: Partial<Exam>[]) => {
    if (exams.length > 0) {
      setAiInitialData(exams[0]);
      setDetectedExamsQueue(exams.slice(1));
      setEditingExam(null);
      setShowForm(true);
      setAiOpen(false); // Close the AI drawer
    }
  };

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleDoExport = (selectedExams: Exam[], filename: string) => {
    const icsContent = generateICS(selectedExams);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const importedExams = parseICS(text);

    if (importedExams.length > 0) {
      if (
        confirm(
          `Found ${importedExams.length} exams in the file. Do you want to import them?`,
        )
      ) {
        setLoading(true);
        try {
          for (const exam of importedExams) {
            await axios.post("/api/exams", exam);
          }
          await fetchExams();
          alert("Import successful!");
        } catch (error) {
          console.error("Import failed", error);
          alert(
            "Failed to import some exams. They might have missing required fields.",
          );
        } finally {
          setLoading(false);
        }
      }
    } else {
      alert("No valid events found in the file.");
    }

    if (importInputRef.current) importInputRef.current.value = "";
  };

  const handleExamCardClick = (exam: Exam) => {
    // Set the selected date to navigate calendar to this exam's date
    setSelectedDate(exam.date);
    // Switch to "all" view to ensure calendar is visible
    setCalendarMode("all");
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
      <DashboardNavbar
        isMobile={isMobile}
        themeName={themeName}
        theme={theme}
        userEmail={userEmail}
        onExport={handleExport}
        onImport={handleImport}
        importInputRef={importInputRef}
        onAddExam={() => {
          setEditingExam(null);
          setAiInitialData(null);
          setDetectedExamsQueue([]);
          setShowForm(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main content area - uses 100% remaining height */}
      <main
        style={{
          height: "calc(100vh - 73px)", // Full remaining height after navbar
          display: "flex",
          flexDirection: "column",
          maxWidth: "1200px",
          margin: "0 auto",
          gap: "12px",
          padding: "12px 16px",
        }}
      >
        {/* Top controls area */}
        <div style={{ display: "grid", gap: "12px" }}>
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
                    background: active ? theme.accent : undefined,
                    transition: "all 0.15s",
                    position: "relative",
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <ExamFilterTabs
                  active={activeFilter}
                  onChange={setActiveFilter}
                />
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
          {calendarMode !== "nearest" && (
            <div
              style={{
                width: isMobile ? "100%" : "350px",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                height: isMobile ? "240px" : "auto", // Reduced height on mobile to show only first card
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
                  {calendarMode === "filter"
                    ? "Filtered Exams"
                    : `All Exams (${calendarExams.length})`}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {calendarExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      theme={theme}
                      onClick={() => handleExamCardClick(exam)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        setEditingExam(exam);
                        setAiInitialData(null);
                        setDetectedExamsQueue([]);
                        setShowForm(true);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDelete(exam.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

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
                setAiInitialData(null);
                setDetectedExamsQueue([]);
                setShowForm(true);
              }}
              nearestExam={calendarMode === "nearest" ? nearest : null}
              filteredExams={
                calendarMode === "filter" ? filteredExams : undefined
              }
              selectedDate={selectedDate}
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
              <AIAssistant onExamsDetected={handleExamsDetected} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportModal
            exams={exams}
            theme={theme}
            themeName={themeName}
            onExport={handleDoExport}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Exam Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ExamForm
            exam={editingExam}
            initialData={aiInitialData}
            onSuccess={handleFormSuccess}
            onClose={handleFormClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
