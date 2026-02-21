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
  semester: number;
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
      text: "Hi! I'm your exam assistant 🎓 Describe an exam, upload a file (PDF/image), or use voice input to tell me about your exams. I'll extract the details for you!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [gatheredFields, setGatheredFields] = useState<Record<string, string>>(
    {},
  );
  const [previewExams, setPreviewExams] = useState<ExamData[]>([]);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
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
        // Handle single or multiple exams
        const exams = Array.isArray(data.data) ? data.data : [data.data];
        setPreviewExams(exams);
        setCurrentExamIndex(0);
        setGatheredFields({});
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              exams.length > 1
                ? `Perfect! I found ${exams.length} exams. Let's review them one by one.`
                : "Perfect! Here's what I've extracted. Please review and confirm:",
          },
        ]);
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
      setMessages((prev) => [...prev, { role: "user", text: msg }]);
      setInput("");

      const { data } = await axios.post("/api/ai", {
        message: msg,
        gatheredFields,
        file: file,
      });

      if (data.status === "complete") {
        const exams = Array.isArray(data.data) ? data.data : [data.data];
        setPreviewExams(exams);
        setCurrentExamIndex(0);
        setGatheredFields({});
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              exams.length > 1
                ? `Found ${exams.length} exams in your file. Let's review them.`
                : "Extracted exam details from your file. Please confirm:",
          },
        ]);
      } else if (data.status === "incomplete") {
        if (data.gathered)
          setGatheredFields((prev) => ({ ...prev, ...data.gathered }));
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            text: data.message || "Failed to process file. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "Error uploading file. Please try again." },
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
                  : "Describe your exam… (e.g. 'Math exam on March 10')"
              }
              disabled={loading || fileLoading}
              className="input-field"
              style={{
                flex: 1,
                opacity: loading || fileLoading ? 0.6 : 1,
                minHeight: "80px",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              id="ai-input"
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                onClick={send}
                disabled={loading || fileLoading || !input.trim()}
                className="btn-primary"
                style={{
                  width: "auto",
                  padding: "10px 16px",
                  minWidth: "60px",
                }}
                id="ai-send-btn"
                title="Send message"
              >
                {loading ? <span className="spinner" /> : "Send"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || fileLoading}
                className="btn-ghost"
                style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                title="Upload file (PDF, image, text)"
              >
                {fileLoading ? <span className="spinner" /> : "📎 File"}
              </button>
              <button
                onClick={toggleVoiceInput}
                disabled={loading || fileLoading}
                className={`btn-ghost ${isListening ? "btn-primary" : ""}`}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  background: isListening ? "var(--accent)" : "transparent",
                  color: isListening ? "white" : "var(--text-secondary)",
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewExams.length > 0 && (
          <ExamPreviewModal
            exam={previewExams[currentExamIndex]}
            isMultiple={previewExams.length > 1}
            currentIndex={currentExamIndex + 1}
            totalCount={previewExams.length}
            onConfirm={() => {
              const newIndex = currentExamIndex + 1;
              onExamAdded();
              if (newIndex < previewExams.length) {
                setCurrentExamIndex(newIndex);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    text: `Exam ${newIndex} confirmed! Let's review exam ${newIndex + 1}.`,
                  },
                ]);
              } else {
                setPreviewExams([]);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    text: `✅ All ${previewExams.length} exams added successfully! You can see them in the Calendar tab.`,
                  },
                ]);
              }
            }}
            onEdit={() => setPreviewExams([])}
            onClose={() => setPreviewExams([])}
          />
        )}
      </AnimatePresence>
    </>
  );
}
