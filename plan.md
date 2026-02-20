# Sprint 1 Plan (Review)

## Goal

Deliver Sprint 1 foundations for the AI Exam Assistant and UX speed requirements.

## Sprint 1 Scope

### AI behavior (server + client integration)

- Enforce **exam CRUD-only** topic restriction.
- Ensure the AI **asks for missing exam details** before returning a “complete” payload.
- Ensure responses are **strict JSON** with one of these statuses:
  - `off_topic`
  - `incomplete`
  - `complete`

### UX speed

- Authentication flows should feel **fast** (minimal perceived waiting).
- Animations/transitions should feel **fast** (target ~150–250ms) and never block interaction.

## Work Items

1. **README alignment**
   - Add/confirm requirements for:
     - Fast auth UX
     - Fast animations/transitions
     - AI missing-field follow-ups
     - AI exam-CRUD-only guardrails

2. **AI contract + validation**
   - Define/confirm JSON response contract:
     - `off_topic`: message only
     - `incomplete`: missing fields list + user-facing message (+ optional partial `gathered`)
     - `complete`: fully populated `data` object
   - Validate AI output shape on the API route before returning to the client.

3. **Missing-field prompting loop**
   - Ensure `gatheredFields` are passed from client -> API -> prompt context.
   - Ensure backend merges newly extracted partial fields (if returned) and asks follow-up questions.

4. **CRUD-only enforcement**
   - System prompt must reject unrelated topics.
   - Add lightweight server-side heuristic check as a backup (e.g. keywords) to prevent accidental non-CRUD replies.

5. **Fast UX tuning**
   - Ensure auth pages use short, non-blocking loading states.
   - Ensure framer-motion transitions use short durations and snappy easing.

## Acceptance Criteria

- AI rejects non-exam prompts with `{"status":"off_topic", ...}`.
- AI asks for missing fields and lists them in `missing`.
- AI returns `complete` only when all required fields are present.
- Auth interactions remain responsive.
- Animations feel fast (<= 250ms) and do not block UI.

## Risks / Notes

- Model might occasionally output non-JSON; API must sanitize and handle parse failures.
- Prisma/Next build should remain passing after changes.
