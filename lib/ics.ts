import { Exam } from "@/app/dashboard/page";

export function generateICS(exams: Exam[]): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ExamPal//EN\n";

  for (const exam of exams) {
    // exam.date could be a full ISO string from Prisma, extract YYYY-MM-DD
    const dateStr = exam.date.split("T")[0];
    const startDate = new Date(`${dateStr}T${exam.startTime}`);
    const endDate = new Date(`${dateStr}T${exam.endTime}`);

    const dtStart =
      startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd =
      endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    ics += "BEGIN:VEVENT\n";
    ics += `UID:${exam.id}\n`;
    ics += `DTSTAMP:${dtStart}\n`;
    ics += `DTSTART:${dtStart}\n`;
    ics += `DTEND:${dtEnd}\n`;
    ics += `SUMMARY:${exam.subject} (${exam.examType})\n`;
    ics += `DESCRIPTION:${exam.code} - ${exam.category} Semester ${exam.semester}. ${exam.examDescription || ""}\n`;
    ics += "END:VEVENT\n";
  }

  ics += "END:VCALENDAR";
  return ics;
}

export function parseICS(icsData: string): Partial<Exam>[] {
  const lines = icsData.split(/\r?\n/);
  const exams: Partial<Exam>[] = [];
  let currentExam: Partial<Exam> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("BEGIN:VEVENT")) {
      currentExam = {
        code: "IMPORTED",
        subject: "Imported Exam",
        examType: "Other",
        category: "Regular",
        semester: 1,
      };
    } else if (line.startsWith("END:VEVENT") && currentExam) {
      if (currentExam.date && currentExam.startTime && currentExam.endTime) {
        exams.push(currentExam);
      }
      currentExam = null;
    } else if (currentExam) {
      if (line.startsWith("SUMMARY:")) {
        const summary = line.substring(8);
        const match = summary.match(/(.*)\s\((.*)\)/);
        if (match) {
          currentExam.subject = match[1].trim();
          const typeMatch = match[2].trim();
          if (
            ["Mid Term", "End Term", "CA", "Lab", "Other"].includes(typeMatch)
          ) {
            currentExam.examType = typeMatch;
          }
        } else {
          currentExam.subject = summary;
        }
      } else if (line.startsWith("DESCRIPTION:")) {
        const desc = line.substring(12);
        // "CS101 - Regular Semester 1."
        const codeMatch = desc.split("-");
        if (codeMatch.length > 1) {
          currentExam.code = codeMatch[0].trim();
          const catMatch = codeMatch[1].match(
            /(Regular|Backlog)\sSemester\s(\d+)/,
          );
          if (catMatch) {
            currentExam.category = catMatch[1];
            currentExam.semester = parseInt(catMatch[2], 10);
          }
        }
      } else if (line.startsWith("DTSTART:")) {
        const dt = line.substring(8); // YYYYMMDDTHHmmssZ
        const year = dt.substring(0, 4);
        const month = dt.substring(4, 6);
        const day = dt.substring(6, 8);
        const hour = dt.substring(9, 11);
        const min = dt.substring(11, 13);
        const d = new Date(
          Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(min),
          ),
        );

        currentExam.date =
          d.getFullYear() +
          "-" +
          String(d.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(d.getDate()).padStart(2, "0");
        currentExam.startTime =
          String(d.getHours()).padStart(2, "0") +
          ":" +
          String(d.getMinutes()).padStart(2, "0");
      } else if (line.startsWith("DTEND:")) {
        const dt = line.substring(6);
        const year = dt.substring(0, 4);
        const month = dt.substring(4, 6);
        const day = dt.substring(6, 8);
        const hour = dt.substring(9, 11);
        const min = dt.substring(11, 13);
        const d = new Date(
          Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(min),
          ),
        );

        currentExam.endTime =
          String(d.getHours()).padStart(2, "0") +
          ":" +
          String(d.getMinutes()).padStart(2, "0");
      }
    }
  }

  return exams;
}
