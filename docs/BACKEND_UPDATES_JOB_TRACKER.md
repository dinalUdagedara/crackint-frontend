# Backend Updates – Job Tracker & Job Detail (Implemented)

This document describes the **backend changes already implemented** for the job tracker and job detail page. Use it as the source of truth when wiring the frontend to the API.

**Base path (typical):** `GET/POST /api/v1/job-postings`, `PATCH/GET /api/v1/job-postings/:id`, `GET /api/v1/sessions`. Adjust if your backend uses a different prefix.

---

## 1. Job postings – new response fields

**`GET /job-postings`** (list) and **`GET /job-postings/:id`** (single) now include these optional fields on each job posting (all nullable):

| Field | Type | Description |
|-------|------|-------------|
| `display_order` | `number \| null` | User-defined order (integer). Lower = earlier in list. |
| `cover_image_url` | `string \| null` | URL for job card / detail cover image. |
| `notes` | `string \| null` | Free-form notes (e.g. requirements, follow-up). |
| `questions_to_ask` | `string \| null` | Questions to ask in the interview. |
| `interview_at` | `string \| null` | Interview date/time (ISO 8601, e.g. `2025-04-15T14:00:00Z`). |
| `contact_name` | `string \| null` | Recruiter/contact name. |
| `contact_email` | `string \| null` | Recruiter/contact email. |
| `talking_points` | `string \| null` | Key points to mention in the interview. |
| `application_url` | `string \| null` | Link to job ad or application page. |
| `stage` | `string \| null` | Application stage (e.g. `saved`, `preparing`, `applied`, `interview`, `offer`). |

Existing fields (`id`, `user_id`, `entities`, `raw_text`, `location`, `deadline`, `created_at`, `updated_at`) are unchanged.

---

## 2. Job postings list – ordering

- **`GET /job-postings`** returns jobs ordered by:
  1. `display_order` **ascending**, with `null` values last.
  2. Then by `updated_at` **descending** as tiebreaker.
- The frontend can rely on this order for the job tracker; no client-side sort by `display_order` is required.

---

## 3. Job postings – create and update

**`POST /job-postings`** (create)  
Request body may now include these optional fields (same names and types as in the table above).  
- Do **not** send `display_order` on create; the backend leaves it null (or assigns a default).  
- All other new fields are optional.

**`PATCH /job-postings/:id`** (update)  
Request body may include any of the new fields **and** `display_order`.  
- Only include fields you want to change; omitted fields are left unchanged.  
- Sending `null` for an optional field (e.g. `cover_image_url` or `notes`) clears it.

---

## 4. Bulk reorder endpoint (new)

**`PUT /job-postings/reorder`**

- **Body:** `{ "order": ["uuid1", "uuid2", "uuid3", ...] }`  
  - `order` is an array of job posting IDs (UUIDs) in the desired display order.  
  - Index in the array becomes `display_order` (0, 1, 2, …).
- **Auth:** Same as other job-postings endpoints (authenticated user). All IDs must belong to that user; otherwise the backend returns 404.
- **Response:** Standard success wrapper with a payload like `{ "updated": true }` (exact key may vary; check your backend’s `CommonResponse` shape).

Use this after drag-and-drop reorder instead of sending multiple PATCH requests.

---

## 5. Sessions – filter and pagination

**`GET /sessions`**

New optional query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `job_posting_id` | UUID (string) | If provided, returns only sessions for this job posting. Still scoped to the current user. |
| `page` | integer (≥ 1) | Page number (1-based). When used, `page_size` should also be set. |
| `page_size` | integer (1–100) | Items per page. Used only when `page` is provided. |

- **Without `page` and `page_size`:** Returns all matching sessions (no pagination); response has no `meta`.
- **With both `page` and `page_size`:** Returns a single page and includes pagination metadata (e.g. `page`, `page_size`, `total_pages`, `total_items`) in the response `meta` object, consistent with job postings list.

Use `job_posting_id` when loading “Practice” or “Sessions” for a specific job so the frontend doesn’t need to fetch all sessions and filter client-side.

---

## 6. Frontend type / contract summary

- **JobPosting (list + single):** Extend your type with optional:  
  `display_order`, `cover_image_url`, `notes`, `questions_to_ask`, `interview_at`, `contact_name`, `contact_email`, `talking_points`, `application_url`, `stage`.
- **JobPostingCreate / JobPostingUpdate:** Same optional fields; add `display_order` only to the update type (not create).
- **Reorder:** Request body type: `{ order: string[] }` (array of job posting UUID strings).
- **listSessions:** Optional query param `job_posting_id` (UUID string); optional `page` and `page_size` (numbers).

No breaking changes: all new fields are additive and optional; existing behaviour and fields are unchanged.

---

## 7. Frontend alignment checklist

When wiring the frontend to this API:

- [ ] **Types:** Extend `JobPosting`, `JobPostingCreate`, and `JobPostingUpdate` in `types/api.types.ts` with the new optional fields; keep `display_order` out of create.
- [ ] **Job postings service:** Add `reorderJobPostings(axiosAuth, order: string[])` calling `PUT /job-postings/reorder` with `{ order }`; ensure `updateJobPosting` is used with the extended `JobPostingUpdate` type.
- [ ] **Sessions service:** Extend `listSessions` to accept optional `job_posting_id?: string` and pass it as a query param when provided.
- [ ] **UI:** Use the new fields where relevant (cover image, notes, questions to ask, interview date, contact, talking points, application URL, stage; reorder via the new endpoint).
