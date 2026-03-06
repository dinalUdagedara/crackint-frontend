import axios from "axios"
import { API_V1 } from "@/lib/api-client"

/**
 * Shared Axios instance for authenticated API calls.
 * Use with useAxiosAuth() so request/response interceptors inject the token and handle 401.
 * baseURL is API_V1 so paths are relative to /api/v1 (e.g. "/sessions", "/resumes").
 */
export const axiosAuth = axios.create({
  baseURL: API_V1,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 25000,
})
