# Backend Requirements – Job Tracker & Job Detail Page

This document lists what the **backend** needs to provide so the frontend can fully support the job tracker and job detail features.

---

## 1. Reorder jobs (user-defined order)

**Goal:** Users can drag-and-drop or otherwise reorder job cards so their preferred order is persisted (e.g. “dream job” first).

### Option A – Order field on job posting (recommended)

- **Model:** Add an optional field on the job posting resource, e.g.:
  - `display_order` (integer) or `position` (integer), nullable.
- **List:** `GET /job-postings` should return jobs ordered by `display_order` (asc, nulls last) and then by `updated_at` or `created_at` as tiebreaker.
- **Update:** `PATCH /job-postings/:id` accepts `display_order` (or `position`) so the frontend can update one job’s order.
- **Bulk reorder (optional):** Either:
  - Frontend sends multiple `PATCH` requests (one per job whose order changed), or
  - Backend exposes e.g. `PUT /job-postings/reorder` with body `{ "order": ["id1", "id2", "id3", ...] }` and the backend updates each job’s `display_order` accordingly.

### Option B – No backend change

- Frontend stores order in `localStorage` only (keyed by user). Works but does not sync across devices or browsers.

**Recommendation:** Implement Option A so order is stored per user and syncs everywhere.

---

## 2. Cover image per job

**Goal:** Each job card (and job detail page) can show a cover image instead of only the gradient + initial placeholder.

- **Model:** Add an optional field on the job posting resource, e.g.:
  - `cover_image_url` (string, nullable). URL to an image (user-provided or from your storage after upload).
- **Create:** `POST /job-postings` request body may include `cover_image_url`.
- **Update:** `PATCH /job-postings/:id` may include `cover_image_url` (or `null` to clear).
- **Response:** `GET /job-postings` and `GET /job-postings/:id` include `cover_image_url` in the payload.

**Optional:** If you support file uploads, an endpoint like `POST /job-postings/:id/cover` that accepts a file and returns the stored URL (then frontend PATCHes that URL into `cover_image_url`). If not, frontend can just collect a URL string and send it in create/update.

---

## 3. Notes per job

**Goal:** On the job detail page, users can add free-form notes (e.g. key requirements, contact name, follow-up date) that are persisted.

- **Model:** Add an optional field on the job posting resource, e.g.:
  - `notes` (string, nullable). Plain text or markdown, depending on what the frontend will render.
- **Update:** `PATCH /job-postings/:id` accepts `notes` (string or null).
- **Response:** `GET /job-postings/:id` (and optionally `GET /job-postings` list) includes `notes`.

**Alternative:** Separate resource `GET/PUT /job-postings/:id/notes` with a body like `{ "content": "..." }`. Same effect; a single `notes` field on the job is usually simpler.

---

## 3b. More “notes-style” additions (great value for prep)

These work like notes: one or more optional fields per job that users can edit on the job detail page. All are optional and additive.

### Questions to ask

- **Goal:** Users prepare “questions I want to ask in the interview” (very common prep).
- **Model:** Optional `questions_to_ask` (string, nullable). Plain text; frontend can render as one textarea or split by newlines into a list.
- **Alternative:** `questions_to_ask` as array of strings if the backend prefers structured data.
- **Create/Update/GET:** Same as `notes` – include in PATCH and GET.

### Interview date / time

- **Goal:** “When is my interview?” so the app can show “Interview in 3 days” on the card or detail page and support sorting/filtering.
- **Model:** Optional `interview_at` (ISO 8601 datetime string, nullable), e.g. `"2025-04-15T14:00:00Z"`.
- **Create/Update/GET:** Include in PATCH and GET. Optional: reminder logic later (e.g. “remind me 1 day before”).

### Contact / recruiter

- **Goal:** Who to follow up with (recruiter name, email, or LinkedIn). Keeps it out of free-form notes and makes it easy to display (e.g. “Contact: Jane · jane@company.com”).
- **Model:** Optional fields, e.g.:
  - `contact_name` (string, nullable)
  - `contact_email` (string, nullable)
  - Or a single `contact` (string, nullable) for “name + email” in one line.
- **Create/Update/GET:** Include in PATCH and GET.

### Talking points / key points

- **Goal:** Short “key points I want to mention” or “why I’m a good fit” – classic interview prep.
- **Model:** Optional `talking_points` (string, nullable). Plain text; frontend can show as bullets (e.g. split by newlines) or a simple list editor.
- **Create/Update/GET:** Same as `notes`.

**Summary of 3b:** Adding `questions_to_ask`, `interview_at`, `contact_name` (and optionally `contact_email`), and `talking_points` gives users dedicated places for the most common prep content and dates, without overloading a single notes field.

---

## 4. Sessions filtered by job (optional but useful)

**Goal:** When showing “Practice” for a given job, the frontend needs sessions for that job. Today it fetches all sessions and filters by `job_posting_id` client-side, which does not scale.

- **List sessions by job:** Support a query parameter on the existing list endpoint, e.g.:
  - `GET /sessions?job_posting_id=:id` (and keep existing `page`, `page_size`).
- **Behaviour:** Return only sessions where `job_posting_id` equals the given id. Same response shape as current `GET /sessions`.

This allows the frontend to load only sessions for one job (e.g. for a “Continue practice” dropdown) without loading the full session list.

---

## 5. Optional extras (job detail page)

These are not blocking but improve the job detail experience.

### 5.1 Application / job ad URL

- **Model:** Optional `application_url` (string, nullable) on job posting – link to the original job ad or application page.
- **Create/Update:** Accept in `POST /job-postings` and `PATCH /job-postings/:id`.
- **Response:** Include in GET payloads.

### 5.2 Application stage / status

- **Model:** Optional `stage` or `status` (string, nullable) with a small set of values, e.g.:
  - `"saved"` | `"preparing"` | `"applied"` | `"interview"` | `"offer"` (or similar).
- **Create/Update:** Accept in POST/PATCH.
- **Response:** Include in GET payloads.

Frontend can then show a status badge and optional filters on the job tracker.

---

## 6. Summary table

| Feature             | Backend change                                                                 | Priority  |
|---------------------|---------------------------------------------------------------------------------|-----------|
| Reorder jobs        | Add `display_order` (or similar) to job posting; list by it; PATCH to update     | High      |
| Cover image         | Add `cover_image_url` to job posting; include in create/update/GET              | High      |
| Notes               | Add `notes` to job posting; include in PATCH and GET                           | High      |
| Questions to ask    | Add `questions_to_ask` (string) to job posting; PATCH and GET                   | High      |
| Interview date      | Add `interview_at` (ISO datetime, nullable) to job posting; PATCH and GET      | Medium    |
| Contact / recruiter | Add `contact_name`, `contact_email` (or single `contact`) to job posting         | Medium    |
| Talking points      | Add `talking_points` (string) to job posting; PATCH and GET                    | Medium    |
| Sessions by job     | `GET /sessions?job_posting_id=:id`                                             | Medium    |
| Application URL    | Add `application_url` to job posting; create/update/GET                         | Low       |
| Stage / status      | Add `stage` (or `status`) to job posting; create/update/GET                    | Low       |

---

## 7. Type / contract changes (for frontend)

Once the backend adds the above, the frontend will extend its types roughly as follows (conceptual):

- **JobPosting:** optional `cover_image_url`, `notes`, `display_order`, `application_url`, `stage`, `questions_to_ask`, `interview_at`, `contact_name`, `contact_email`, `talking_points`.
- **JobPostingCreate / JobPostingUpdate:** same fields as optional.
- **listSessions:** optional query param `job_posting_id`.

No breaking changes to existing fields are required; all new fields are additive and optional.
