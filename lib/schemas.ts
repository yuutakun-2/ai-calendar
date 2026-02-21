import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ExamSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  subject: z.string().min(1, "Subject name is required"),
  examType: z.enum(["Mid Term", "End Term", "CA", "Lab", "Other"]),
  category: z.enum(["Regular", "Backlog"]),
  semester: z
    .number()
    .int("Semester must be an integer")
    .min(1, "Semester must be at least 1"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:mm"),
});

export const AIMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  gatheredFields: z.record(z.string(), z.unknown()).optional(),
  examDates: z
    .array(
      z.object({
        date: z.string(),
        fields: z.record(z.string(), z.unknown()),
        missingFields: z.array(z.string()),
        isConfirmed: z.boolean(),
      }),
    )
    .optional(),
  file: z.any().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ExamInput = z.infer<typeof ExamSchema>;
export type AIMessageInput = z.infer<typeof AIMessageSchema>;
