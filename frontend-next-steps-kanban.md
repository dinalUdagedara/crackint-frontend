## Crackint Frontend – Next Steps Kanban

_Last updated: Feb 11, 2026_

This document tracks upcoming work for the Crackint frontend in a **Kanban-style** view. Move items from **Backlog → Todo → In Progress → Done** as you implement them.

---

### Backlog (Ideas / Later)

- **Advanced scoring & analytics**
  - Multi-dimension scores (technical, behavioral, communication, system design).
  - Trends over time per user and per role.
  - Exportable summary (PDF or shareable link) per session or time window.

- **Gamification**
  - Streaks and practice-day counter.
  - Badges for milestones (e.g., 5 sessions completed, 10 answers above 80%).
  - Optional leaderboard view (per cohort / class / company).

- **Job suitability & location checks**
  - Compare job location vs user’s preferred / current location.
  - Highlight remote-friendly roles.
  - Simple “practicality” flag in job posting detail and in session view.

- **Practice modes**
  - “Quick practice” bank of generic behavioral/technical questions.
  - “Custom questions” mode where users paste or write their own questions.

---

### Todo (Planned Next)

- **Auth integration (NextAuth)**
  - Decide backend mapping from `session.user` → `user_id` (e.g., via email).
  - Add NextAuth configuration (providers, callbacks, session strategy).
  - Protect key routes:
    - `/` (dashboard), `/cv-upload`, `/job-upload`, `/job-postings`, `/sessions`.
  - Thread `userId` from session into existing APIs:
    - Resumes: `listResumes(page, pageSize, userId)`; future resume create endpoints.
    - Job postings:
      - `listJobPostings(page, pageSize, userId)`.
      - `createJobPosting({ user_id: userId, ... })`.
    - Sessions:
      - `listSessions(page, pageSize, userId)`.
      - `createSession({ user_id: userId, resume_id, job_posting_id, mode })`.

- **Skill gap analysis (MVP)**
  - Derive skills and requirements from existing entities:
    - Resume: `SKILL`, `EXPERIENCE`, `EDUCATION`.
    - Job posting: `SKILLS_REQUIRED`, `EXPERIENCE_REQUIRED`, `EDUCATION_REQUIRED`.
  - Compute a simple “gap” view:
    - Overlapping skills (present in both CV and job).
    - Missing skills (in job, not in CV).
  - UI integration:
    - Add a “Skill gap” side panel or tab in `SessionChatView`.
    - Show counts, lists of skills, and a basic gap score (e.g., % of required skills present).

- **Readiness score surfacing**
  - Agree on a simple readiness score formula (for now, even if computed only on the backend), combining:
    - Answer-level scores, once available.
    - Skill gap score.
    - Session completion (e.g., number of questions answered).
  - Frontend:
    - Display readiness score in `SessionsView` table.
    - Show a more detailed readiness badge + short explanation in `SessionChatView` header.

- **Basic AI feedback loop**
  - Backend:
    - After a `USER` message, optionally generate:
      - `ASSISTANT` follow-up question.
      - `FEEDBACK` message with `metadata` like `{ "score": "85", "dimension": "technical" }`.
  - Frontend (`SessionChatView`):
    - Visual distinction for `FEEDBACK` messages (already partially styled).
    - Show score/dimension from `metadata` as small chips or labels.
    - Keep answer + feedback visually grouped in the chat timeline.

---

### In Progress (Blocks / Coordination)

_Use this section while actively implementing items above. Example:_

- **Assistant message generation API (design)**
  - Define endpoint (e.g., `POST /api/v1/sessions/{id}/generate`).
  - Decide inputs (recent messages window, target dimension/role).
  - Decide outputs (next question, optional feedback, updated readiness).
  - Once stable, hook into `SessionChatView`:
    - After user answer, show “assistant is thinking” state.
    - Append generated messages when ready.

- **Session summary structure**
  - Finalize shape of `summary` field on `PrepSession`:
    - Example: `{ strengths: string[], weaknesses: string[], suggestions: string[] }`.
  - Frontend:
    - Show summary panel in `SessionChatView`.
    - Add small summary icon or tooltip in `SessionsView`.

(You can replace these placeholder items with whatever is actually in progress.) 

---

### Done (Current Frontend Capabilities)

These are already implemented in the current codebase.

- **Core types and services**
  - Centralized TypeScript models in `types/api.types.ts`:
    - `ApiResponse`, pagination meta, `Resume`, `JobPosting`, `PrepSession`, `Message`, etc.
  - Services:
    - Resumes: extract from file/text, list, delete all.
    - Jobs: extract from file/text, job posting list/get/create.
    - Sessions: create/list/get/get-with-messages.
    - Messages: append and list per session.

- **Job posting flow**
  - `JobUploadView`:
    - Upload/paste job description → call `/api/v1/jobs/extract`.
    - Display extracted entities in a friendly card.
    - “Save as job posting” creates a `JobPosting` via `/api/v1/job-postings` and redirects to detail.
  - Pages:
    - `/job-postings`: paginated list (`JobPostingsList`) with title, company, location, deadline, created date, and link to upload.
    - `/job-postings/[id]`: detail view (`JobPostingDetail`) showing:
      - Meta (id, created/updated, deadline, location).
      - All extracted entities.
      - Raw job description text.

- **Prep sessions: create + list**
  - `/sessions` (via `SessionsView`):
    - **Create section**:
      - Loads resumes from `/api/v1/resumes` and job postings from `/api/v1/job-postings`.
      - Allows selecting:
        - Resume.
        - Job posting.
        - Mode: `TARGETED` vs `QUICK_PRACTICE`.
      - Creates a new session (`POST /api/v1/sessions`) and navigates to `/sessions/{id}`.
    - **Sessions table**:
      - Paginates over sessions (`GET /api/v1/sessions`).
      - Shows mode, status, readiness score (nullable), created_at.
      - Each row links to the session chat.

- **Chat-style session view**
  - `/sessions/[id]` (`SessionChatView`):
    - Loads `GET /api/v1/sessions/{id}/with-messages`.
    - Header:
      - Mode, status, created/updated timestamps.
      - Resume and job posting IDs.
      - Readiness score placeholder (shows value when backend populates).
    - Chat timeline:
      - Renders messages with different styling for:
        - `USER`.
        - `ASSISTANT`.
        - `FEEDBACK` (highlighted).
    - Composer:
      - Textarea + “Send” button.
      - Sends `POST /api/v1/sessions/{id}/messages` with `{ sender: "USER", type: "QUESTION" }`.
      - Optimistically appends new message to the chat.

- **Navigation & UX**
  - Home `/` acts as a simple dashboard:
    - Explains the Crackint flow.
    - Quick links to:
      - `/cv-upload` (resume upload & extraction).
      - `/job-upload` (job poster upload & extraction).
      - `/sessions` (prep session creation and history).
  - All major pages share:
    - Sidebar layout (`AppSidebar`).
    - Theme toggle (`ModeToggle`).
    - Loading, error, and empty states for lists and forms.

---

### How to Use This Document

- Treat each bullet under **Todo** as a Kanban card.
- When you pick something up, move it to **In Progress** (and optionally link to a branch or issue).
- When finished and merged, move it to **Done** with a one-line summary and date.

