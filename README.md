# AI-Powered University Exam Planner

An intelligent, multi-user web application that allows students to:

- 📅 View exams in calendar format
- 🔥 Automatically detect the nearest upcoming exam
- ✅ Mark exams as completed
- 🤖 Use an AI assistant to convert raw timetable text into structured exam data
- 🗄️ Store everything securely in a database

---

## 🚀 Project Vision

University students often receive exam schedules in messy text format.
This system allows them to paste raw text directly into an AI assistant, which extracts structured data and inserts it into their personal exam calendar.

This project demonstrates:

- Full-stack architecture
- AI structured extraction
- Calendar data modeling
- Multi-user SaaS design
- Production-ready database design

---

## 🏗️ Architecture Overview

```
Frontend (Next.js + Tailwind)
        ↓
API Layer (Next.js API Routes)
        ↓
AI Service (OpenAI Structured Output)
        ↓
PostgreSQL (Prisma ORM)
```

---

## 🛠️ Tech Stack

### Frontend

- Next.js 14 (App Router)
- TailwindCSS
- Framer Motion (animations & transitions)
- React Big Calendar
- Axios

### Backend

- Node.js
- Next.js API Routes
- Prisma ORM
- JWT Authentication
- Zod (input validation)

### Database

- PostgreSQL

### AI

- Google Gemini API (free tier — Gemini 1.5 Flash via `@google/generative-ai`)

### Deployment

- Frontend → Vercel
- Backend → Railway
- Database → Supabase

---

## 📦 Features

### 👤 Authentication

- User registration
- Login / Logout
- JWT-based session handling
- Password hashing (bcrypt)

> ⚡ **Performance Requirement:** All authentication flows (register, login, logout) must feel **instant**. Use optimistic UI updates, minimal loading states, and fast JWT verification. Target < 300ms perceived response time.

---

### 🎨 Animations & Transitions

- All page transitions, modal opens/closes, and form interactions must use **smooth but fast animations**.
- Target animation duration: **150ms–250ms** (never sluggish).
- Use Framer Motion for:
  - Page enter/exit transitions
  - Modal slide-in / fade-out
  - Exam card hover effects
  - Calendar event pop-ups
- No animation should ever block user interaction.

---

### 📅 Exam Management

- Add exam manually
- Add exam using AI assistant
- Edit exam
- Delete exam
- Mark as completed
- Filter by:
  - Mid Term
  - End Term
  - Regular
  - Backlog

---

### 🔥 Nearest Exam Detection

Automatically detects the next upcoming uncompleted exam:

```ts
const nearestExam = await prisma.exam.findFirst({
  where: {
    userId,
    date: { gte: new Date() },
    completed: false,
  },
  orderBy: { date: "asc" },
});
```

---

### 🤖 AI Assistant

#### User Flow

1. User pastes raw timetable text (or describes the exam)
2. AI checks if the prompt is **exam-related** — rejects off-topic messages
3. AI identifies any **missing required fields** and asks the user to provide them
4. Once all fields are present, the backend sends the data to OpenAI
5. AI extracts structured JSON
6. System shows **preview modal**
7. User confirms insertion
8. Data is saved in PostgreSQL

#### AI Topic Restriction

> 🚫 The AI assistant must **only** respond to prompts related to exam CRUD operations (creating, reading, updating, or deleting exam entries).
>
> Any unrelated prompts (e.g., general questions, jokes, weather, coding help) must be **rejected gracefully** with a message like:
> _"I can only help you manage your exam schedule. Please provide exam-related information."_

#### AI Missing Data Prompting

> 🔍 Before extracting or inserting exam data, the AI must **check for required fields** and ask the user to supply any that are missing.
>
> Required fields:
>
> - `code` (subject code)
> - `subject` (subject name)
> - `examType` (Mid Term / End Term / Lab / Other)
> - `category` (Regular / Backlog)
> - `date` (YYYY-MM-DD)
> - `startTime` (HH:mm)
> - `endTime` (HH:mm)
>
> Example: If the user says _"Add my Math exam on March 10"_, the AI should respond:
> _"Got it! I need a few more details: What is the subject code? Is it a Mid Term, End Term, Lab, or Other? Is it Regular or Backlog? What time does it start and end?"_

---

## 🔎 AI Structured Output Schema

The AI must return:

```json
{
  "code": "string",
  "subject": "string",
  "examType": "Mid Term | End Term | Lab | Other",
  "category": "Regular | Backlog",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm"
}
```

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  exams     Exam[]
  createdAt DateTime @default(now())
}

model Exam {
  id          String   @id @default(uuid())
  code        String
  subject     String
  examType    String
  category    String
  date        DateTime
  startTime   String
  endTime     String
  completed   Boolean  @default(false)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}
```

---

## 📁 Project Structure

```
exam-planner/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── page.tsx           ← Calendar + NearestExamCard
│   │   └── ai-assistant/
│   └── api/
│       ├── auth/
│       ├── exams/
│       └── ai/
│
├── components/
│   ├── CalendarView.tsx
│   ├── NearestExamCard.tsx
│   ├── ExamForm.tsx
│   └── AIAssistant.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── openai.ts
│
├── prisma/
│   └── schema.prisma
│
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
JWT_SECRET=
GEMINI_API_KEY=
```

---

## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/exam-planner.git
cd exam-planner
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Database

```bash
npx prisma migrate dev
```

### 4️⃣ Run Development Server

```bash
npm run dev
```

---

## 🧠 AI API Example (Gemini)

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const systemPrompt = `
You are an exam schedule assistant. You ONLY help users manage their exam schedule.
If the user's message is unrelated to exam CRUD, respond with:
{ "status": "off_topic", "message": "I can only help you manage your exam schedule." }

Before extracting data, verify all 7 required fields are present:
code, subject, examType (Mid Term | End Term | Lab | Other),
category (Regular | Backlog), date (YYYY-MM-DD), startTime (HH:mm), endTime (HH:mm).

If missing:
{ "status": "incomplete", "missing": ["field1"], "message": "Please provide: ..." }

If complete:
{ "status": "complete", "data": { code, subject, examType, category, date, startTime, endTime } }
`;

const result = await model.generateContent(
  systemPrompt + "\n\nUser: " + textInput,
);
const text = result.response.text();
const json = JSON.parse(text);
```

---

## 🛡️ Security Considerations

- Rate limiting on AI endpoint
- Input validation (Zod)
- Password hashing (bcrypt)
- JWT expiration
- SQL injection prevention (Prisma handles this)
- CORS configuration

---

## 📊 Future Enhancements

- 📈 Study progress tracking
- ⏳ Countdown timer
- 📤 Export to Google Calendar (.ics)
- 👥 Public timetable sharing
- 🧠 AI study strategy suggestions
- 🔔 Push notifications
- 📱 Mobile responsive PWA

---

## 🎯 Target Users

- University students
- Engineering colleges
- Institutions managing exam schedules
- Study groups

---

## 💡 Why This Project Is Valuable

This project demonstrates:

- Full-stack system design
- Database modeling
- Authentication systems
- AI structured data extraction
- Production-ready architecture
- Real SaaS-level thinking

---

## 📜 License

MIT License

---

## 👨‍💻 Author

Built by **Arkar Chan Myae**  
Full-Stack Developer | AI Enthusiast | Future Digital Team Leader
