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

// Simplified ExamField to pass back
// No ExamDate interface needed as we no longer manage confirmation state here

interface Props {
  onExamAdded: () => void;
  onExamsDetected: (exams: Partial<ExamField>[]) => void;
}

export default function AIAssistant({ onExamAdded, onExamsDetected }: Props) {
  const { theme: themeName } = useTheme();
  const theme = THEMES[themeName as keyof typeof THEMES];

  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant" | "error"; text: string }>
  >([
    {
      role: "assistant",
      text: "Hi! I'm your enhanced exam assistant 🎓 Tell me about your exams, and I'll extract the details to help you schedule them.",
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
        examDates: [], // We no longer maintain this state here
      });

      if (data.status === "off_topic") {
        setMessages((prev: any) => [
          ...prev,
          { role: "error", text: data.message },
        ]);
      } else if (data.status === "incomplete") {
        setMessages((prev: any) => [
          ...prev,
          {
            role: "assistant",
            text:
              data.message ||
              "I found some exam details. Please review them in the form.",
          },
        ]);

        if (
          data.examDates &&
          Array.isArray(data.examDates) &&
          data.examDates.length > 0
        ) {
          onExamsDetected(data.examDates.map((ed: any) => ed.fields));
        }
      } else if (data.status === "complete") {
        // Handle complete response
        if (data.examDates && Array.isArray(data.examDates)) {
          setMessages((prev: any) => [
            ...prev,
            {
              role: "assistant",
              text: "I've detected the exam details. Please confirm them in the form.",
            },
          ]);

          if (data.examDates.length > 0) {
            onExamsDetected(data.examDates.map((ed: any) => ed.fields));
          }
        } else if (data.data) {
          setMessages((prev: any) => [
            ...prev,
            {
              role: "assistant",
              text: "I've detected the exam details. Please confirm them in the form.",
            },
          ]);

          onExamsDetected([data.data]);
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

    try {
      const fileData = await new Promise<{ data: string; mimeType: string }>(
        (resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve({ data: base64Data, mimeType: file.type });
          };
          reader.onerror = (error) => reject(error);
        },
      );

      const msg = `Please extract exam details from this file: ${file.name}`;
      setMessages((prev: any) => [...prev, { role: "user", text: msg }]);
      setInput("");

      const { data } = await axios.post("/api/ai", {
        message: msg,
        examDates: [],
        file: fileData,
      });

      if (data.status === "complete") {
        if (data.examDates && Array.isArray(data.examDates)) {
          setMessages((prev: any) => [
            ...prev,
            {
              role: "assistant",
              text: `📄 Found ${data.examDates.length} exam date(s) in your file. Please review them in the form.`,
            },
          ]);

          if (data.examDates.length > 0) {
            onExamsDetected(data.examDates.map((ed: any) => ed.fields));
          }
        }
      } else if (data.status === "incomplete") {
        if (data.examDates && Array.isArray(data.examDates)) {
          setMessages((prev: any) => [
            ...prev,
            {
              role: "assistant",
              text:
                data.message ||
                "I found some exam details. Please review them in the form.",
            },
          ]);

          if (data.examDates.length > 0) {
            onExamsDetected(data.examDates.map((ed: any) => ed.fields));
          }
        }
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
              Extracts info and opens the form for you
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
        </div>

        {/* Input */}
        <div
          style={{
            padding: "12px 12px",
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
                  : "Describe your exam (e.g., 'Math exam on March 15, 9:00 AM')"
              }
              disabled={loading || fileLoading}
              style={{
                flex: 1,
                opacity: loading || fileLoading ? 0.6 : 1,
                minHeight: "80px",
                resize: "vertical",
                fontFamily: "inherit",
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: "6px",
                padding: "4px 8px",
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
                disabled={loading || fileLoading || !input.trim()}
                style={{
                  width: "auto",
                  padding: "10px 16px",
                  minWidth: "60px",
                  background: theme.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    loading || fileLoading || !input.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
                id="ai-send-btn"
                title="Send message"
              >
                {loading ? "Sending..." : "Send"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || fileLoading}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  background: "transparent",
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "6px",
                  cursor: loading || fileLoading ? "not-allowed" : "pointer",
                }}
                title="Upload file (PDF, image, text)"
              >
                {fileLoading ? <span className="spinner" /> : "📎 File"}
              </button>
              <button
                onClick={toggleVoiceInput}
                disabled={loading || fileLoading}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  background: isListening ? theme.accent : "transparent",
                  color: isListening ? "white" : theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "6px",
                  cursor: loading || fileLoading ? "not-allowed" : "pointer",
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
    </>
  );
}
