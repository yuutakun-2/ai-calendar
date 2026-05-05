import { Exam } from "@/app/dashboard/page";

export const sortExams = (list: Exam[]) => {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
};
