"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ResizableHandle, ResizablePanelGroup, ResizablePanel } from "react-resizable-panels";
import type { Exam } from "@/app/dashboard/page";

interface Props {
  exams: Exam[];
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps?: {
    exam: Exam;
  };
}

const TYPE_COLORS: Record<string, string> = {
  "Mid Term": "#8b5cf6",
  "End Term": "#ef4444",
  CA: "#f59e0b",
  Lab: "#10b981",
  Other: "#3b82f6",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FullCalendarView({ exams, onEdit, onDelete }: Props) {
  const [viewMode, setViewMode] = useState<"dayGridMonth" | "timeGridWeek">(
    "dayGridMonth"
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const calendarEvents: CalendarEvent[] = exams.map((exam) => ({
    id: exam.id,
    title: `${exam.subject} (${exam.examType})`,
    start: new Date(`${exam.date}T${exam.startTime}`),
    end: new Date(`${exam.date}T${exam.endTime}`),
    extendedProps: {
      exam,
    },
  }));

  const ExamCards = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        overflowY: "auto",
        paddingRight: "8px",
      }}
    >
      <AnimatePresence>
        {exams.map((exam, i) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, delay: i * 0.04 }}
            className="glass"
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.15s",
              border: "1px solid var(--border)",
            }}
            onClick={() => onEdit(exam)}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.style.borderColor = "var(--border-hover)";
              target.style.background =
                "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(14,165,233,0.05))";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.style.borderColor = "var(--border)";
              target.style.background = "";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                gap: "8px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: exam.completed
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                    textDecoration: exam.completed ? "line-through" : "none",
                    margin: "0 0 4px 0",
                    wordBreak: "break-word",
                  }}
                >
                  {exam.subject}
                </h4>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    margin: "0 0 6px 0",
                  }}
                >
                  {exam.code}
                </p>
              </div>
              {exam.completed && (
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "#fff", fontSize: "11px" }}>✓</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: `${TYPE_COLORS[exam.examType]}20`,
                  color: TYPE_COLORS[exam.examType],
                  fontWeight: 600,
                }}
              >
                {exam.examType}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background:
                    exam.category === "Backlog"
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(16,185,129,0.15)",
                  color:
                    exam.category === "Backlog" ? "var(--danger)" : "var(--success)",
                  fontWeight: 600,
                }}
              >
                {exam.category}
              </span>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <div>{formatDate(exam.date)}</div>
              <div>
                {exam.startTime} – {exam.endTime}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "8px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(exam);
                }}
                className="btn-ghost"
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: "0.75rem",
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this exam?")) onDelete(exam.id);
                }}
                className="btn-danger"
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: "0.75rem",
                }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const CalendarSection = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "0 16px",
        }}
      >
        <button
          onClick={() => setViewMode("dayGridMonth")}
          className={
            viewMode === "dayGridMonth" ? "btn-primary" : "btn-ghost"
          }
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "0.85rem",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setViewMode("timeGridWeek")}
          className={
            viewMode === "timeGridWeek" ? "btn-primary" : "btn-ghost"
          }
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "0.85rem",
          }}
        >
          Weekly
        </button>
      </div>

      <div
        className="glass"
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          border: "1px solid var(--border)",
        }}
      >
        <style>{`
          .fc {
            font-family: inherit;
            color: var(--text-primary);
          }
          .fc .fc-button-primary {
            background-color: var(--accent);
            border-color: var(--accent);
            color: white;
          }
          .fc .fc-button-primary:hover {
            background-color: var(--accent-light);
            border-color: var(--accent-light);
          }
          .fc .fc-button-primary.fc-button-active {
            background-color: var(--accent);
            border-color: var(--accent);
          }
          .fc .fc-button-group > .fc-button {
            border: 1px solid var(--border);
            color: var(--text-primary);
            background-color: transparent;
          }
          .fc .fc-button-group > .fc-button:hover {
            background-color: var(--bg-card-hover);
          }
          .fc .fc-col-header-cell {
            background-color: var(--bg-card);
            color: var(--text-primary);
            border-color: var(--border);
            padding: 12px 0;
            font-weight: 600;
          }
          .fc .fc-daygrid-day {
            background-color: var(--bg-primary);
            border-color: var(--border);
          }
          .fc .fc-daygrid-day:hover {
            background-color: var(--bg-card);
          }
          .fc .fc-daygrid-day-number {
            color: var(--text-primary);
            padding: 8px;
          }
          .fc .fc-daygrid-day-frame {
            min-height: 80px;
          }
          .fc .fc-event {
            background-color: var(--accent);
            border-color: var(--accent);
            padding: 2px 4px;
            font-size: 0.8rem;
          }
          .fc .fc-event-title {
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .fc .fc-timegrid-slot {
            height: 3em;
          }
          .fc .fc-timegrid-slot-label {
            color: var(--text-muted);
            font-size: 0.85rem;
          }
          .fc .fc-col-time-cell {
            color: var(--text-muted);
          }
          .fc .fc-daygrid-day-bg {
            background-color: var(--bg-primary);
          }
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: var(--border);
          }
          .fc .fc-daygrid-day.fc-day-other {
            background-color: var(--bg-card);
            opacity: 0.5;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewMode}
          events={calendarEvents}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          height="auto"
          contentHeight="auto"
          eventDisplay="block"
          eventColor={undefined}
          eventDidMount={(info) => {
            const exam = (info.event.extendedProps as any)?.exam;
            if (exam) {
              info.el.style.backgroundColor =
                TYPE_COLORS[exam.examType] || "var(--accent)";
              info.el.style.borderColor =
                TYPE_COLORS[exam.examType] || "var(--accent)";
              info.el.style.cursor = "pointer";
              info.el.addEventListener("click", () => {
                onEdit(exam);
              });
            }
          }}
          views={{
            dayGridMonth: {
              type: "dayGrid",
              duration: { months: 1 },
            },
            timeGridWeek: {
              type: "timeGrid",
              duration: { days: 7 },
            },
          }}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Exam Cards Section */}
        <div
          style={{
            maxHeight: "50vh",
            overflowY: "auto",
            paddingRight: "4px",
            position: "relative",
          }}
        >
          <ExamCards />
          {/* Opacity fade at bottom to indicate scrollability */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40px",
              background:
                "linear-gradient(transparent, rgba(15,15,30,0.8))",
              pointerEvents: "none",
              borderRadius: "8px",
            }}
          />
        </div>

        {/* Calendar Section */}
        <div style={{ minHeight: "500px" }}>
          <CalendarSection />
        </div>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <ResizablePanelGroup direction="horizontal" style={{ height: "700px" }}>
      <ResizablePanel
        defaultSize={40}
        minSize={25}
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        <ExamCards />
      </ResizablePanel>

      <ResizableHandle
        style={{
          width: "4px",
          background: "var(--border)",
          cursor: "col-resize",
          transition: "background 0.2s",
          margin: "0 4px",
        }}
      />

      <ResizablePanel
        defaultSize={60}
        minSize={35}
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CalendarSection />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
