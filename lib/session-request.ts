import axios from "axios";
import { cookies } from "next/headers";

import { backend, SessionError } from "@/lib/backend";

export async function sessionRequest<T>(method: "get" | "post" | "patch" | "put", path: string, body?: unknown) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  let accessToken = cookieStore.get("accessToken")?.value;

  async function refresh() {
    if (!refreshToken) throw new SessionError("Please log in");
    const response = await backend.post<{ data: { accessToken: string } }>("/api/auth/refresh-token", { refreshToken });
    accessToken = response.data.data.accessToken;
    cookieStore.set("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 });
  }

  if (!accessToken) await refresh();

  try {
    const response = await backend.request<{ data: T }>({ method, url: path, data: body, headers: { Authorization: `Bearer ${accessToken}` } });
    return response.data.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !refreshToken) throw error;
    await refresh();
    const response = await backend.request<{ data: T }>({ method, url: path, data: body, headers: { Authorization: `Bearer ${accessToken}` } });
    return response.data.data;
  }
}
