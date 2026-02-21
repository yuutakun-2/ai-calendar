"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface Exam {
  id: string;
  code: string;
  subject: string;
  examType: string;
  category: string;
  date: string;
  semester: number;
  startTime: string;
  endTime: string;
  completed: boolean;
}

interface Props {
  exams: Exam[];
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
}

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function FullCalendarView({
  exams,
  onEdit,
  onDelete,
}: Props) {
  const [view, setView] = useState<View>("month");
  const [dividerPos, setDividerPos] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Convert exams to calendar events
  const events = exams.map((exam) => ({
    id: exam.id,
    title: `${exam.subject} (${exam.examType})`,
    start: new Date(`${exam.date}T${exam.startTime}`),
    end: new Date(`${exam.date}T${exam.endTime}`),
    resource: exam,
  }));

  // Handle dragging divider
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newPos = ((e.clientX - rect.left) / rect.width) * 100;
      if (newPos > 25 && newPos < 75) {
        setDividerPos(newPos);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Mobile view - stacked vertically
  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Exam cards section */}
        <div
          style={{
            height: "55%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Upcoming Exams
          </h3>
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              position: "relative",
              background: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "100%",
                overflowY: "auto",
              }}
            >
              {exams.map((exam, idx) => {
                // Show 2 full cards and partial 3rd
                let opacity = 1;
                let maxHeight = "auto";
                if (idx === 2) {
                  opacity = 0.5;
                  maxHeight = "50%";
                } else if (idx > 2) {
                  opacity = 0.3;
                  maxHeight = "0px";
                }

                return (
                  <div
                    key={exam.id}
                    style={{
                      padding: "12px",
                      background: "var(--bg-card)",
                      border: `1px solid var(--border)`,
                      borderRadius: "8px",
                      opacity,
                      maxHeight,
                      overflow: "hidden",
                      transition: "all 0.2s",
                      pointerEvents: idx > 2 ? "none" : "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {exam.subject}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          {exam.examType} • {exam.code}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => onEdit(exam)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            background: "var(--accent)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(exam.id)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            background: "var(--danger)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {exams.length > 3 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "60px",
                  background:
                    "linear-gradient(to bottom, transparent, var(--bg-secondary))",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Calendar section */}
        <div
          style={{
            height: "45%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setView("month")}
              style={{
                padding: "6px 16px",
                fontSize: "0.85rem",
                background: view === "month" ? "var(--accent)" : "var(--bg-card)",
                color: view === "month" ? "white" : "var(--text-secondary)",
                border: `1px solid ${view === "month" ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              style={{
                padding: "6px 16px",
                fontSize: "0.85rem",
                background: view === "week" ? "var(--accent)" : "var(--bg-card)",
                color: view === "week" ? "white" : "var(--text-secondary)",
                border: `1px solid ${view === "week" ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Week
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              padding: "12px",
            }}
          >
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{
                height: "100%",
                color: "var(--text-primary)",
              }}
              view={view}
              onView={setView}
              views={["month", "week"]}
              onSelectEvent={(event) => onEdit(event.resource)}
              popup
              toolbar={false}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: "var(--accent)",
                  borderRadius: "4px",
                  opacity: 0.8,
                  color: "white",
                  border: "none",
                  display: "block",
                },
              })}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop view - side by side with draggable divider
  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        height: "100%",
        gap: "0",
        overflow: "hidden",
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "col-resize" : "default",
      }}
    >
      {/* Left panel - Exam cards */}
      <div
        style={{
          width: `${dividerPos}%`,
          overflow: "auto",
          paddingRight: "12px",
          borderRight: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Exams ({exams.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {exams.map((exam) => (
            <div
              key={exam.id}
              style={{
                padding: "14px",
                background: "var(--bg-card)",
                border: `1px solid var(--border)`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--accent)";
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--border)";
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--bg-card)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {exam.subject}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {exam.examType} • {exam.code}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      marginTop: "6px",
                    }}
                  >
                    {format(new Date(exam.date), "MMM d, yyyy")}
                  </div>
                  {exam.completed && (
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: "6px",
                        padding: "2px 8px",
                        background: "var(--success)",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Completed
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    onClick={() => onEdit(exam)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      background: "var(--accent)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(exam.id)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      background: "var(--danger)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Draggable divider */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "2px",
          background: isDragging ? "var(--accent)" : "var(--border)",
          cursor: "col-resize",
          transition: isDragging ? "none" : "background 0.2s",
          flexShrink: 0,
        }}
      />

      {/* Right panel - Calendar */}
      <div
        style={{
          width: `${100 - dividerPos}%`,
          overflow: "hidden",
          paddingLeft: "12px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setView("month")}
            style={{
              padding: "8px 20px",
              fontSize: "0.9rem",
              background: view === "month" ? "var(--accent)" : "var(--bg-card)",
              color: view === "month" ? "white" : "var(--text-secondary)",
              border: `1px solid ${view === "month" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Month
          </button>
          <button
            onClick={() => setView("week")}
            style={{
              padding: "8px 20px",
              fontSize: "0.9rem",
              background: view === "week" ? "var(--accent)" : "var(--bg-card)",
              color: view === "week" ? "white" : "var(--text-secondary)",
              border: `1px solid ${view === "week" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Week
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            padding: "12px",
          }}
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%", color: "var(--text-primary)" }}
            view={view}
            onView={setView}
            views={["month", "week"]}
            onSelectEvent={(event) => onEdit(event.resource)}
            popup
            toolbar={false}
            eventPropGetter={() => ({
              style: {
                backgroundColor: "var(--accent)",
                borderRadius: "4px",
                opacity: 0.8,
                color: "white",
                border: "none",
                display: "block",
              },
            })}
          />
        </div>
      </div>
    </div>
  );
}
