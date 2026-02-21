"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useTheme } from "@/components/ThemeToggle";
import { THEMES } from "@/lib/themes";

interface ExamField {
  code: string;
  subject: string;
  examType: string;
  category: string;
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
}

interface ExamDate {
  date: string;
  fields: Partial<ExamField>;
  missingFields: string[];
  isConfirmed: boolean;
}

interface Props {
  onExamAdded: () => void;
}

export default function AIAssistant({ onExamAdded }: Props) {
  const { theme: themeName } = useTheme();
  const theme = THEMES[themeName as keyof typeof THEMES];

  // State for managing multiple exam dates
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant" | "error"; text: string }>
  >([
    {
      role: "assistant",
      text: "Hi! I'm your enhanced exam assistant 🎓 I can now handle multiple exam dates. Tell me about your exams, and I'll help you schedule them one by one. I'll track which fields are missing for each exam date.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.language = "en-US";

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev: any) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const { data } = await axios.post("/api/ai", {
        message: msg,
        examDates: examDates.map((ed) => ({
          date: ed.date,
          fields: ed.fields,
          missingFields: ed.missingFields,
          isConfirmed: ed.isConfirmed,
        })),
      });

      if (data.status === "off_topic") {
        setMessages((prev: any) => [
          ...prev,
          { role: "error", text: data.message },
        ]);
      } else if (data.status === "incomplete") {
        // Handle incomplete response with missing fields
        if (data.examDates && Array.isArray(data.examDates)) {
          setExamDates(data.examDates);

          // Find first incomplete exam to focus on
          const firstIncompleteIndex = data.examDates.findIndex(
            (ed: any) => !ed.isConfirmed,
          );
          if (firstIncompleteIndex !== -1) {
            setCurrentDateIndex(firstIncompleteIndex);
          }
        }

        setMessages((prev: any) => [
          ...prev,
          {
            role: "assistant",
            text:
              data.message ||
              "I need more information to process your request.",
          },
        ]);
      } else if (data.status === "complete") {
        // Handle complete response with confirmed exam(s)
        if (data.examDates && Array.isArray(data.examDates)) {
          setExamDates(data.examDates);

          // Process ALL confirmed exams
          const confirmedExams = data.examDates.filter(
            (ed: any) => ed.isConfirmed,
          );

          if (confirmedExams.length > 0) {
            let successCount = 0;
            let failureCount = 0;

            // Process each confirmed exam
            for (const exam of confirmedExams) {
              try {
                await axios.post("/api/exams", {
                  ...exam.fields,
                  completed: false,
                });
                successCount++;
              } catch {
                failureCount++;
              }
            }

            // Update messages with results
            setMessages((prev: any) => [
              ...prev,
              {
                role: "assistant",
                text: `✅ ${successCount} exam(s) have been added to your calendar!${failureCount > 0 ? ` (${failureCount} failed)` : ""}`,
              },
            ]);

            // Check if there are incomplete exams remaining
            const incompleteExams = data.examDates.filter(
              (ed: any) => !ed.isConfirmed,
            );
            if (incompleteExams.length > 0) {
              // Focus on first incomplete exam
              const firstIncompleteIndex = data.examDates.findIndex(
                (ed: any) => !ed.isConfirmed,
              );
              if (firstIncompleteIndex !== -1) {
                setCurrentDateIndex(firstIncompleteIndex);
                setMessages((prev: any) => [
                  ...prev,
                  {
                    role: "assistant",
                    text: `Now let's work on the exam for ${data.examDates[firstIncompleteIndex].date}. What details can you provide?`,
                  },
                ]);
              }
            } else {
              // All exams processed
              setExamDates([]);
              setCurrentDateIndex(0);
              setMessages((prev: any) => [
                ...prev,
                {
                  role: "assistant",
                  text: `🎉 All ${data.examDates.length} exams have been successfully added to your calendar!`,
                },
              ]);
              onExamAdded();
            }
          }
        }
      } else {
        setMessages((prev: any) => [
          ...prev,
          {
            role: "error",
            text: data.message || "Something went wrong. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev: any) => [
        ...prev,
        {
          role: "error",
          text: "Connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || fileLoading) return;

    setFileLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const msg = `Please extract exam details from this file: ${file.name}`;
      setMessages((prev: any) => [...prev, { role: "user", text: msg }]);
      setInput("");

      const { data } = await axios.post("/api/ai", {
        message: msg,
        examDates: examDates.map((ed) => ({
          date: ed.date,
          fields: ed.fields,
          missingFields: ed.missingFields,
          isConfirmed: ed.isConfirmed,
        })),
        file: file,
      });

      if (data.status === "complete") {
        if (data.examDates && Array.isArray(data.examDates)) {
          setExamDates(data.examDates);

          // Process ALL confirmed exams
          const confirmedExams = data.examDates.filter(
            (ed: any) => ed.isConfirmed,
          );

          if (confirmedExams.length > 0) {
            let successCount = 0;
            let failureCount = 0;

            // Process each confirmed exam
            for (const exam of confirmedExams) {
              try {
                await axios.post("/api/exams", {
                  ...exam.fields,
                  completed: false,
                });
                successCount++;
              } catch {
                failureCount++;
              }
            }

            // Update messages with results
            setMessages((prev: any) => [
              ...prev,
              {
                role: "assistant",
                text: `📄 ${successCount} exam(s) from your file have been added to your calendar!${failureCount > 0 ? ` (${failureCount} failed)` : ""}`,
              },
            ]);

            // Check if there are incomplete exams remaining
            const incompleteExams = data.examDates.filter(
              (ed: any) => !ed.isConfirmed,
            );
            if (incompleteExams.length > 0) {
              // Focus on first incomplete exam
              const firstIncompleteIndex = data.examDates.findIndex(
                (ed: any) => !ed.isConfirmed,
              );
              if (firstIncompleteIndex !== -1) {
                setCurrentDateIndex(firstIncompleteIndex);
                setMessages((prev: any) => [
                  ...prev,
                  {
                    role: "assistant",
                    text: `Now let's work on the exam for ${data.examDates[firstIncompleteIndex].date}. What details can you provide?`,
                  },
                ]);
              }
            } else {
              // All exams processed
              setExamDates([]);
              setCurrentDateIndex(0);
              setMessages((prev: any) => [
                ...prev,
                {
                  role: "assistant",
                  text: `🎉 All ${data.examDates.length} exams from your file have been successfully added to your calendar!`,
                },
              ]);
              onExamAdded();
            }
          } else {
            // No confirmed exams, focus on first incomplete
            const firstIncompleteIndex = data.examDates.findIndex(
              (ed: any) => !ed.isConfirmed,
            );
            if (firstIncompleteIndex !== -1) {
              setCurrentDateIndex(firstIncompleteIndex);
              setMessages((prev: any) => [
                ...prev,
                {
                  role: "assistant",
                  text: `📄 Found ${data.examDates.length} exam date(s) in your file. Let's review them one by one. Starting with exam for ${data.examDates[firstIncompleteIndex].date}.`,
                },
              ]);
            }
          }
        }
      } else if (data.status === "incomplete") {
        if (data.examDates && Array.isArray(data.examDates)) {
          setExamDates(data.examDates);

          // Find first incomplete exam to focus on
          const firstIncompleteIndex = data.examDates.findIndex(
            (ed: any) => !ed.isConfirmed,
          );
          if (firstIncompleteIndex !== -1) {
            setCurrentDateIndex(firstIncompleteIndex);
          }
        }

        setMessages((prev: any) => [
          ...prev,
          {
            role: "assistant",
            text:
              data.message ||
              "I need more information to process your request.",
          },
        ]);
      } else {
        setMessages((prev: any) => [
          ...prev,
          {
            role: "error",
            text: data.message || "Failed to process file. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev: any) => [
        ...prev,
        {
          role: "error",
          text: "Error uploading file. Please try again.",
        },
      ]);
    } finally {
      setFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const confirmCurrentExam = () => {
    if (currentDateIndex >= examDates.length) return;

    const currentExam = examDates[currentDateIndex];
    if (!currentExam) return;

    // Mark current exam as confirmed
    const updatedExamDates = [...examDates];
    updatedExamDates[currentDateIndex] = {
      ...currentExam,
      isConfirmed: true,
    };

    setExamDates(updatedExamDates);

    setMessages((prev: any) => [
      ...prev,
      {
        role: "assistant",
        text: `✅ Confirmed exam for ${currentExam.date}. Ready to add to calendar.`,
      },
    ]);
  };

  const updateExamField = (field: keyof ExamField, value: string) => {
    if (currentDateIndex >= examDates.length) return;

    const currentExam = examDates[currentDateIndex];
    if (!currentExam) return;

    const updatedExamDates = [...examDates];
    updatedExamDates[currentDateIndex] = {
      ...currentExam,
      fields: {
        ...currentExam.fields,
        [field]: value,
      },
    };

    setExamDates(updatedExamDates);
  };

  const getCurrentExam = () => {
    return examDates[currentDateIndex] || null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <div
        className="glass"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "600px",
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>🤖</span>
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: theme.textPrimary,
              }}
            >
              Enhanced AI Exam Assistant
            </p>
            <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}>
              Multi-exam scheduling with field tracking
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                        : msg.role === "error"
                          ? "rgba(239,68,68,0.1)"
                          : theme.bgSecondary,
                    border: `1px solid ${
                      msg.role === "error"
                        ? "rgba(239,68,68,0.3)"
                        : theme.border
                    }`,
                    color:
                      msg.role === "error" ? theme.danger : theme.textPrimary,
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Current Exam Status */}
          {getCurrentExam() && (
            <div
              style={{
                padding: "16px",
                background: theme.bgSecondary,
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  marginBottom: "12px",
                  color: theme.textPrimary,
                  fontWeight: 600,
                }}
              >
                📅 Exam for {getCurrentExam()?.date}
              </div>

              {/* Missing Fields */}
              {getCurrentExam()?.missingFields.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <p
                    style={{
                      color: theme.danger,
                      fontSize: "0.85rem",
                      marginBottom: "8px",
                    }}
                  >
                    ⚠️ Missing fields:{" "}
                    {getCurrentExam()?.missingFields.join(", ")}
                  </p>
                </div>
              )}

              {/* Current Fields */}
              <div style={{ marginBottom: "16px" }}>
                {Object.entries(getCurrentExam()?.fields || {}).map(
                  ([field, value]) => (
                    <div key={field} style={{ marginBottom: "8px" }}>
                      <label
                        style={{
                          display: "block",
                          color: theme.textSecondary,
                          fontSize: "0.85rem",
                          marginBottom: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}:
                      </label>
                      <input
                        type={
                          field === "date"
                            ? "date"
                            : field === "startTime" || field === "endTime"
                              ? "time"
                              : "text"
                        }
                        value={value}
                        onChange={(e) =>
                          updateExamField(
                            field as keyof ExamField,
                            e.target.value,
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: theme.bgCard,
                          border: `1px solid ${theme.border}`,
                          borderRadius: "4px",
                          color: theme.textPrimary,
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  ),
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={confirmCurrentExam}
                  disabled={getCurrentExam()?.missingFields.length > 0}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background:
                      getCurrentExam()?.missingFields.length === 0
                        ? theme.success
                        : theme.border,
                    color:
                      getCurrentExam()?.missingFields.length === 0
                        ? "white"
                        : theme.textMuted,
                    border: "none",
                    borderRadius: "6px",
                    cursor:
                      getCurrentExam()?.missingFields.length === 0
                        ? "pointer"
                        : "not-allowed",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  {getCurrentExam()?.missingFields.length === 0
                    ? "✅ Confirm & Add to Calendar"
                    : "⚠️ Fill Missing Fields"}
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {examDates.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                background: theme.bgSecondary,
                borderRadius: "8px",
                textAlign: "center",
                fontSize: "0.85rem",
                color: theme.textMuted,
              }}
            >
              Exam {currentDateIndex + 1} of {examDates.length}
            </div>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${theme.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                loading
                  ? "AI is thinking…"
                  : getCurrentExam()
                    ? `Describe details for exam on ${getCurrentExam()?.date} (e.g., 'Math exam on March 15')`
                    : "Describe your exam (e.g., 'Math exam on March 15, 9:00 AM')"
              }
              disabled={loading || fileLoading || examDates.length > 0}
              style={{
                flex: 1,
                opacity:
                  loading || fileLoading || examDates.length > 0 ? 0.6 : 1,
                minHeight: "80px",
                resize: "vertical",
                fontFamily: "inherit",
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: "6px",
                color: theme.textPrimary,
                fontSize: "0.9rem",
              }}
              id="ai-input"
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                onClick={send}
                disabled={
                  loading ||
                  fileLoading ||
                  !input.trim() ||
                  examDates.length > 0
                }
                style={{
                  width: "auto",
                  padding: "10px 16px",
                  minWidth: "60px",
                  background: theme.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    loading ||
                    fileLoading ||
                    !input.trim() ||
                    examDates.length > 0
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
                id="ai-send-btn"
                title={
                  examDates.length > 0
                    ? "Complete current exams first"
                    : "Send message"
                }
              >
                {loading ? <span className="spinner" /> : "Send"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || fileLoading || examDates.length > 0}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  background: "transparent",
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "6px",
                  cursor:
                    loading || fileLoading || examDates.length > 0
                      ? "not-allowed"
                      : "pointer",
                }}
                title={
                  examDates.length > 0
                    ? "Complete current exams first"
                    : "Upload file (PDF, image, text)"
                }
              >
                {fileLoading ? <span className="spinner" /> : "📎 File"}
              </button>
              <button
                onClick={toggleVoiceInput}
                disabled={loading || fileLoading || examDates.length > 0}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  background: isListening ? theme.accent : "transparent",
                  color: isListening ? "white" : theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "6px",
                  cursor:
                    loading || fileLoading || examDates.length > 0
                      ? "not-allowed"
                      : "pointer",
                }}
                title={
                  examDates.length > 0
                    ? "Complete current exams first"
                    : isListening
                      ? "Stop listening"
                      : "Start voice input"
                }
              >
                {isListening ? "🎤 Stop" : "🎤 Voice"}
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            id="file-input"
          />
        </div>
      </div>
    </>
  );
}
