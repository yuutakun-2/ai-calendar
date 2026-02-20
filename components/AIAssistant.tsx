"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ExamPreviewModal from "@/components/ExamPreviewModal";

interface Message {
  role: "user" | "assistant" | "error";
  text: string;
}

interface ExamData {
  code: string;
  subject: string;
  examType: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Props {
  onExamAdded: () => void;
}

export default function AIAssistant({ onExamAdded }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your exam assistant 🎓 Describe an exam you want to add and I'll extract the details for you. I'll ask if anything is missing!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gatheredFields, setGatheredFields] = useState<Record<string, string>>(
    {},
  );
  const [previewExam, setPreviewExam] = useState<ExamData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const { data } = await axios.post("/api/ai", {
        message: msg,
        gatheredFields,
      });

      if (data.status === "off_topic") {
        setMessages((prev) => [...prev, { role: "error", text: data.message }]);
      } else if (data.status === "incomplete") {
        // Merge any newly extracted partial fields
        if (data.gathered)
          setGatheredFields((prev) => ({ ...prev, ...data.gathered }));
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.message },
        ]);
      } else if (data.status === "complete") {
        setGatheredFields({});
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Perfect! Here's what I've extracted. Please review and confirm:",
          },
        ]);
        setPreviewExam(data.data);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            text: data.message || "Something went wrong. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
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
        style={{ display: "flex", flexDirection: "column", height: "600px" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>🤖</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              AI Exam Assistant
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Powered by Gemini · exam management only
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
                          : "var(--bg-card-hover)",
                    border: `1px solid ${msg.role === "error" ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                    color:
                      msg.role === "error"
                        ? "var(--danger)"
                        : "var(--text-primary)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex" }}
            >
              <div
                style={{
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "12px 18px",
                }}
              >
                <div
                  className="typing-dots"
                  style={{ display: "flex", gap: "4px" }}
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              loading
                ? "AI is thinking…"
                : "Describe your exam… (e.g. 'Math exam on March 10')"
            }
            disabled={loading}
            className="input-field"
            style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
            id="ai-input"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ width: "auto", padding: "10px 20px", flexShrink: 0 }}
            id="ai-send-btn"
          >
            {loading ? <span className="spinner" /> : "Send"}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewExam && (
          <ExamPreviewModal
            exam={previewExam}
            onConfirm={() => {
              setPreviewExam(null);
              onExamAdded();
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  text: "✅ Exam added successfully! You can see it in the Calendar tab.",
                },
              ]);
            }}
            onEdit={() => setPreviewExam(null)}
            onClose={() => setPreviewExam(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
