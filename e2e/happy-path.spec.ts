import { expect, test } from "@playwright/test"

const CV_TEXT = `Jane Doe
jane.doe@example.com
Software Engineer with 4 years of experience.
Skills: Python, PostgreSQL, Docker, REST APIs`

const JOB_TEXT = `Backend Engineer at Acme
We are hiring a Backend Engineer. Required skills: Python, Kafka, Kubernetes.
3+ years of experience.`

test("register → CV → job → practice session → report", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`

  // Register (signs in and lands on the dashboard)
  await page.goto("/register")
  await page.getByLabel("Name").fill("E2E User")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("Password123!")
  await page.getByRole("button", { name: "Register" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText("Get started")).toBeVisible()

  // CV from pasted text
  await page.goto("/cv-upload")
  await page.getByRole("tab", { name: /Paste text/ }).click()
  await page.getByPlaceholder(/Paste your CV text here/).fill(CV_TEXT)
  await page.getByRole("button", { name: "Extract", exact: true }).click()
  await expect(page.getByText("Extracted information")).toBeVisible()

  // Job posting from pasted text
  await page.goto("/job-upload")
  await page.getByRole("tab", { name: /Paste text/ }).click()
  await page.locator("textarea").fill(JOB_TEXT)
  await page.getByRole("button", { name: "Extract", exact: true }).click()
  await page.getByRole("button", { name: "Save as job posting" }).click()
  await expect(page).toHaveURL(/\/job-postings\/[0-9a-f-]{36}$/)

  // Targeted session with that CV and job
  await page.goto("/sessions")
  await page.locator("#resume-select").click()
  await page.getByRole("option").first().click()
  await page.locator("#job-select").click()
  await page.getByRole("option").first().click()
  await page.getByRole("button", { name: "Start prep session" }).click()
  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/)

  // First question, then an answer: streamed feedback and the next question
  const input = page.getByPlaceholder("Type message")
  await input.fill("Hi, I'm ready")
  await input.press("Enter")
  await expect(page.getByText(/Practice question 1/)).toBeVisible()

  await input.fill("I would define the contract, validate input, return clear errors and test each path.")
  await input.press("Enter")
  await expect(page.getByText("Good structure. Add a concrete example with measurable results.")).toBeVisible()
  await expect(page.getByText(/Practice question 2/)).toBeVisible()

  // End the session: report with the score and a weak topic to practice
  await page.getByRole("button", { name: "End session" }).click()
  await expect(page).toHaveURL(/\/report$/)
  await expect(page.getByText("72 / 100")).toBeVisible()
  await expect(page.getByText("api design").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Retry weak areas" })).toBeVisible()
})

test("profile name shows the saved value and survives a reload after editing", async ({ page }) => {
  const email = `e2e-profile-${Date.now()}@example.com`
  await page.goto("/register")
  await page.getByLabel("Name").fill("Profile User")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("Password123!")
  await page.getByRole("button", { name: "Register" }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto("/profile")
  const nameInput = page.locator("#profile-name")
  await expect(nameInput).toHaveValue("Profile User")
  await nameInput.fill("Renamed User")
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Profile updated.")).toBeVisible()
  await page.reload()
  await expect(nameInput).toHaveValue("Renamed User")
})
