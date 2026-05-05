// Lightweight heuristic: reject clearly non-exam prompts before hitting the AI
const EXAM_KEYWORDS = [
  "exam",
  "test",
  "midterm",
  "mid term",
  "endterm",
  "end term",
  "lab",
  "quiz",
  "subject",
  "semester",
  "schedule",
  "timetable",
  "date",
  "time",
  "add",
  "create",
  "update",
  "edit",
  "delete",
  "remove",
  "mark",
  "complete",
  "backlog",
  "regular",
  "course",
  "class",
  "paper",
  "assessment",
  "ca ",
  "code",
  "morning",
  "afternoon",
  "evening",
];

export function looksExamRelated(message: string): boolean {
  const lower = message.toLowerCase();
  return EXAM_KEYWORDS.some((kw) => lower.includes(kw));
}

const VALID_STATUSES = ["off_topic", "incomplete", "complete"];
const VALID_EXAM_TYPES = ["Mid Term", "End Term", "CA", "Lab", "Other"];
const VALID_CATEGORIES = ["Regular", "Backlog"];

export function validateAIResponse(
  json: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!json.status || !VALID_STATUSES.includes(json.status as string)) {
    return null;
  }

  if (json.status === "off_topic") {
    return {
      status: "off_topic",
      message:
        (json.message as string) ||
        "I can only help you manage your exam schedule. Please describe an exam you'd like to add or manage.",
    };
  }

  if (json.status === "incomplete") {
    return {
      status: "incomplete",
      missing: Array.isArray(json.missing) ? json.missing : [],
      gathered:
        json.gathered && typeof json.gathered === "object" ? json.gathered : {},
      message:
        (json.message as string) ||
        "I need a few more details to add your exam.",
    };
  }

  if (json.status === "complete") {
    const data = json.data as Record<string, unknown> | undefined;
    if (!data) return null;

    // Validate all required fields exist
    const required = [
      "code",
      "subject",
      "examType",
      "category",
      "semester",
      "date",
      "startTime",
      "endTime",
    ];
    for (const field of required) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        return null;
      }
    }

    // Validate examType
    if (!VALID_EXAM_TYPES.includes(data.examType as string)) return null;

    // Validate category
    if (!VALID_CATEGORIES.includes(data.category as string)) return null;

    // Validate semester is a positive integer
    const semester = Number(data.semester);
    if (!Number.isInteger(semester) || semester < 1) return null;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date as string)) return null;

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(data.startTime as string)) return null;
    if (!/^\d{2}:\d{2}$/.test(data.endTime as string)) return null;

    return {
      status: "complete",
      data: {
        code: data.code,
        subject: data.subject,
        examType: data.examType,
        category: data.category,
        semester: semester,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    };
  }

  return null;
}
