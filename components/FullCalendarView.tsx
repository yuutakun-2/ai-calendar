"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { Exam } from "@/app/dashboard/page";
import { useTheme } from "@/components/ThemeToggle";
import { THEMES } from "@/lib/themes";

interface Props {
  exams: Exam[];
  loading?: boolean;
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
  nearestExam?: Exam | null;
  filteredExams?: Exam[];
}

export default function FullCalendarView({
  exams,
  loading,
  onEdit,
  onDelete,
  nearestExam,
  filteredExams,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const { theme: themeName } = useTheme();
  const theme = THEMES[themeName as keyof typeof THEMES];

  // Add CSS variables and theme styles
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Update CSS custom properties for FullCalendar
      const root = document.documentElement;
      root.style.setProperty("--fc-border-color", theme.border);
      root.style.setProperty("--fc-bg-color", theme.bgCard);
      root.style.setProperty("--fc-bg-secondary", theme.bgSecondary);
      root.style.setProperty("--fc-text-color", theme.textPrimary);
      root.style.setProperty("--fc-accent-color", theme.accent);
      root.style.setProperty(
        "--fc-today-bg",
        themeName === "dark"
          ? "rgba(139, 92, 246, 0.1)"
          : "rgba(59, 130, 246, 0.1)",
      );

      // Add nearest exam highlight if available
      if (nearestExam) {
        const nearestDate = new Date(nearestExam.date)
          .toISOString()
          .split("T")[0];
        root.style.setProperty(
          "--fc-nearest-exam-bg",
          themeName === "dark"
            ? "rgba(34, 197, 94, 0.15)"
            : "rgba(34, 197, 94, 0.1)",
        );
        root.style.setProperty("--fc-nearest-exam-border", theme.success);
      }

      // Add filtered exam highlights if available
      if (filteredExams && filteredExams.length > 0) {
        root.style.setProperty(
          "--fc-filtered-exam-bg",
          themeName === "dark"
            ? "rgba(59, 130, 246, 0.15)"
            : "rgba(59, 130, 246, 0.1)",
        );
        root.style.setProperty("--fc-filtered-exam-border", theme.accent);
      }

      // Generate CSS for highlighted dates
      let highlightCSS = "";

      if (nearestExam) {
        const nearestDate = new Date(nearestExam.date)
          .toISOString()
          .split("T")[0];
        highlightCSS += `
        .fc-daygrid-day[data-date="${nearestDate}"] {
          background-color: var(--fc-nearest-exam-bg) !important;
          border: 2px solid var(--fc-nearest-exam-border) !important;
          position: relative !important;
        }
        
        .fc-daygrid-day[data-date="${nearestDate}"]::before {
          content: "🔥" !important;
          position: absolute !important;
          top: 2px !important;
          right: 2px !important;
          font-size: 12px !important;
          z-index: 10 !important;
        }`;
      }

      if (filteredExams && filteredExams.length > 0) {
        const filteredDates = [
          ...new Set(
            filteredExams.map(
              (exam) => new Date(exam.date).toISOString().split("T")[0],
            ),
          ),
        ];

        filteredDates.forEach((date) => {
          // Skip if this is already the nearest exam (avoid double styling)
          if (
            nearestExam &&
            date === new Date(nearestExam.date).toISOString().split("T")[0]
          ) {
            return;
          }

          highlightCSS += `
        .fc-daygrid-day[data-date="${date}"] {
          background-color: var(--fc-filtered-exam-bg) !important;
          border: 1px solid var(--fc-filtered-exam-border) !important;
          position: relative !important;
        }`;
        });
      }

      // Add spinner animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* FullCalendar theme overrides */
        .fc-theme-standard .fc-scrollgrid {
          border-color: var(--fc-border-color) !important;
        }
        
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--fc-border-color) !important;
        }
        
        .fc-theme-standard .fc-daygrid-day-number {
          color: var(--fc-text-color) !important;
        }
        
        .fc-theme-standard .fc-col-header-cell {
          background-color: var(--fc-bg-secondary) !important;
          color: var(--fc-text-color) !important;
        }
        
        .fc-theme-standard .fc-day-today {
          background-color: var(--fc-today-bg) !important;
        }
        
        /* Dynamic highlights */
        ${highlightCSS}
        
        .fc-theme-standard .fc-button-primary {
          background-color: var(--fc-accent-color) !important;
          border-color: var(--fc-accent-color) !important;
          color: white !important;
        }
        
        .fc-theme-standard .fc-button-primary:hover {
          opacity: 0.8 !important;
        }
        
        .fc-theme-standard .fc-button-primary:disabled {
          background-color: var(--fc-border-color) !important;
          border-color: var(--fc-border-color) !important;
          color: var(--fc-text-color) !important;
          opacity: 0.5 !important;
        }
        
        .fc-theme-standard .fc-toolbar-title {
          color: var(--fc-text-color) !important;
        }
        
        .fc-theme-standard .fc-more-link {
          color: var(--fc-accent-color) !important;
        }
        
        .fc-theme-standard .fc-popover {
          background-color: var(--fc-bg-color) !important;
          border: 1px solid var(--fc-border-color) !important;
        }
        
        .fc-theme-standard .fc-popover-title {
          background-color: var(--fc-bg-secondary) !important;
          color: var(--fc-text-color) !important;
        }
        
        .fc-theme-standard .fc-daygrid-event {
          border-radius: 4px !important;
        }
      `;
      style.setAttribute("data-calendar-styles", "true");
      document.head.appendChild(style);

      return () => {
        style.remove();
      };
    }
  }, [theme, themeName, nearestExam, filteredExams]);

  // Convert exams to FullCalendar events
  const events = exams.map((exam) => {
    // Parse the ISO date and extract just the date part
    const examDate = new Date(exam.date);
    const dateStr = examDate.toISOString().split("T")[0]; // Get YYYY-MM-DD format

    // Create proper datetime for FullCalendar
    const startDate = new Date(`${dateStr}T${exam.startTime}`);
    const endDate = new Date(`${dateStr}T${exam.endTime}`);

    return {
      id: exam.id,
      title: `${exam.subject} (${exam.examType})`,
      start: startDate,
      end: endDate,
      backgroundColor: exam.completed ? theme.success : theme.accent,
      borderColor: exam.completed ? theme.success : theme.accent,
      textColor: themeName === "dark" ? "white" : "black",
      extendedProps: {
        exam,
      },
    };
  });

  const handleEventClick = (info: any) => {
    const exam = info.event.extendedProps.exam as Exam;
    onEdit(exam);
  };

  const handleEventMouseEnter = (info: any) => {
    const exam = info.event.extendedProps.exam as Exam;
    // Show tooltip or additional info on hover
    info.el.style.cursor = "pointer";
    info.el.style.opacity = "0.9";
  };

  const handleEventMouseLeave = (info: any) => {
    info.el.style.opacity = "1";
  };

  const renderEventContent = (eventInfo: any) => {
    const exam = eventInfo.event.extendedProps.exam;
    return (
      <div
        style={{
          padding: "2px 4px",
          fontSize: "0.85rem",
          fontWeight: "500",
          color: theme.textPrimary, // Use theme color instead of hardcoded white
          overflow: "hidden",
        }}
      >
        <div style={{ fontWeight: "600" }}>{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div
      style={{
        height: "100%",
        background: theme.bgCard,
        borderRadius: "12px",
        border: `1px solid ${theme.border}`,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        minHeight: "500px",
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            color: theme.textMuted,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: `3px solid ${theme.border}`,
                borderTop: `3px solid ${theme.accent}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            Loading calendar...
          </div>
        </div>
      ) : events.length === 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            color: theme.textMuted,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📅</div>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              No exams scheduled
            </p>
            <p style={{ fontSize: "0.875rem", opacity: "0.8" }}>
              Add your first exam to get started!
            </p>
          </div>
        </div>
      ) : (
        <div style={{ overflowY: "auto", flex: 1 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={handleEventClick}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventContent={renderEventContent}
            height="auto"
            aspectRatio={1.5}
            displayEventEnd={true}
            dayMaxEvents={true}
            moreLinkClick="popover"
            weekends={true}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayHeaderFormat={{ weekday: "short" }}
            titleFormat={{
              month: "long",
              year: "numeric",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            eventDidMount={(info) => {
              // Apply custom styles to ensure theme consistency
              const el = info.el;
              el.style.borderRadius = "6px";
              el.style.border = "none";
              el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              el.style.transition = "all 0.2s ease";
            }}
          />
        </div>
      )}
    </div>
  );
}
