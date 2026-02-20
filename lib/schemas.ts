import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ExamSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  subject: z.string().min(1, "Subject name is required"),
  examType: z.enum(["Mid Term", "End Term", "CA", "Lab", "Other"]),
  category: z.enum(["Regular", "Backlog"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:mm"),
});

export const AIMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  gatheredFields: z.record(z.string(), z.unknown()).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ExamInput = z.infer<typeof ExamSchema>;
export type AIMessageInput = z.infer<typeof AIMessageSchema>;
