import axios from "axios";

export const backend = axios.create({
  baseURL: process.env.API_BASE_URL ?? (
    process.env.NODE_ENV === "development"
      ? "http://localhost:8001"
      : "https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app"
  ),
  timeout: 10000,
});

export class SessionError extends Error {
  status = 401;
}

export function apiError(error: unknown) {
  if (error instanceof SessionError) return { status: 401, message: "Please log in" };
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 502;
    const message = typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : "The service is unavailable. Please try again.";
    return { status, message };
  }

  return { status: 500, message: "Something went wrong. Please try again." };
}
