"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ExamSchema, ExamInput } from "@/lib/schemas";
import type { Exam } from "@/app/dashboard/page";

interface Props {
  exam: Exam | null;
  onSuccess: () => void;
  onClose: () => void;
}

const EXAM_TYPES = ["Mid Term", "End Term", "CA", "Lab", "Other"] as const;
const CATEGORIES = ["Regular", "Backlog"] as const;

export default function ExamForm({ exam, onSuccess, onClose }: Props) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamInput>({
    resolver: zodResolver(ExamSchema),
    defaultValues: exam
      ? {
          code: exam.code,
          subject: exam.subject,
          examType: exam.examType as ExamInput["examType"],
          category: exam.category as ExamInput["category"],
          semester: Number(exam.semester),
          date: exam.date.slice(0, 10),
          startTime: exam.startTime,
          endTime: exam.endTime,
        }
      : undefined,
  });

  useEffect(() => {
    if (exam) {
      reset({
        code: exam.code,
        subject: exam.subject,
        examType: exam.examType as ExamInput["examType"],
        category: exam.category as ExamInput["category"],
        semester: Number(exam.semester),
        date: exam.date.slice(0, 10),
        startTime: exam.startTime,
        endTime: exam.endTime,
      });
    } else {
      reset({});
    }
  }, [exam, reset]);

  const onSubmit = async (data: ExamInput) => {
    setServerError("");
    try {
      if (exam) {
        await axios.put(`/api/exams/${exam.id}`, data);
      } else {
        await axios.post("/api/exams", data);
      }
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.error || "Failed to save exam.");
      }
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    outline: "none",
    position: "relative" as const,
    zIndex: 10,
  });

  const selectStyle = {
    ...inputStyle(false),
    appearance: "none" as const,
    cursor: "pointer" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="glass"
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "28px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>
            {exam ? "✏️ Edit Exam" : "➕ Add Exam"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.4rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label className="field-label">Subject Code</label>
              <input
                {...register("code")}
                placeholder="e.g. CS101"
                style={inputStyle(!!errors.code)}
              />
              {errors.code && (
                <p className="error-text">{errors.code.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">Subject Name</label>
              <input
                {...register("subject")}
                placeholder="e.g. Data Structures"
                style={inputStyle(!!errors.subject)}
              />
              {errors.subject && (
                <p className="error-text">{errors.subject.message}</p>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label className="field-label">Exam Type</label>
              <select
                {...register("examType")}
                style={{ ...selectStyle, WebkitAppearance: "none" }}
              >
                <option value="">Select type</option>
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.examType && (
                <p className="error-text">{errors.examType.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">Category</label>
              <select
                {...register("category")}
                style={{ ...selectStyle, WebkitAppearance: "none" }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="error-text">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className="field-label">Semester</label>
            <input
              {...register("semester", { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="e.g. 1"
              style={inputStyle(!!errors.semester)}
            />
            {errors.semester && (
              <p className="error-text">{errors.semester.message}</p>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className="field-label">Date</label>
            <input
              {...register("date")}
              type="date"
              style={inputStyle(!!errors.date)}
            />
            {errors.date && <p className="error-text">{errors.date.message}</p>}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label className="field-label">Start Time</label>
              <input
                {...register("startTime")}
                type="time"
                style={inputStyle(!!errors.startTime)}
              />
              {errors.startTime && (
                <p className="error-text">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">End Time</label>
              <input
                {...register("endTime")}
                type="time"
                style={inputStyle(!!errors.endTime)}
              />
              {errors.endTime && (
                <p className="error-text">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {serverError && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                color: "var(--danger)",
                fontSize: "0.875rem",
              }}
            >
              {serverError}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ flex: 2 }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  {exam ? "Saving…" : "Adding…"}
                </>
              ) : exam ? (
                "Save Changes"
              ) : (
                "Add Exam"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
