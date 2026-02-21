"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { RegisterSchema, RegisterInput } from "@/lib/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError("");
    try {
      await axios.post("/api/auth/register", data);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.error || "Registration failed. Try again.",
        );
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at top, #1a0a3a 0%, var(--bg-primary) 60%)",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="glass w-full max-w-md p-10"
      >
        <div className="text-center mb-8">
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📅</div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #f1f0ff, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ExamPal
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              marginTop: "4px",
              fontSize: "0.9rem",
            }}
          >
            Create your free account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: "grid", gap: "20px", marginBottom: "28px" }}>
            <div>
              <label className="field-label">Email Address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@university.edu"
                className={`input-field ${errors.email ? "error" : ""}`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="At least 6 characters"
                className={`input-field ${errors.password ? "error" : ""}`}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
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
            </motion.div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            id="register-submit"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="divider" />

        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--accent-light)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
