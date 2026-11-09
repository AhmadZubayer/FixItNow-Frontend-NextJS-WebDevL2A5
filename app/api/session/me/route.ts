import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backend, apiError } from "@/lib/backend";
import { clearSessionCookies } from "@/lib/session-cookies";

export const GET = async () => {
  const cookieStore = await cookies();
  let token = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    if (!token && refreshToken) {
      const refreshed = await backend.post<{ data: { accessToken: string } }>("/api/auth/refresh-token", { refreshToken });
      token = refreshed.data.data.accessToken;
      cookieStore.set("accessToken", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 });
    }
    if (!token) return NextResponse.json({ message: "Please log in" }, { status: 401 });
    const response = await backend.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    return NextResponse.json(response.data.data);
  } catch (error) {
    const { status, message } = apiError(error);
    if (status === 401 && refreshToken && token) {
      try {
        const refreshed = await backend.post<{ data: { accessToken: string } }>("/api/auth/refresh-token", { refreshToken });
        const nextToken = refreshed.data.data.accessToken;
        cookieStore.set("accessToken", nextToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 });
        const response = await backend.get("/api/auth/me", { headers: { Authorization: `Bearer ${nextToken}` } });
        return NextResponse.json(response.data.data);
      } catch {
        // The failed refresh is cleared on the response below.
      }
    }
    const response = NextResponse.json({ message }, { status });
    if (status === 401 || status === 403) clearSessionCookies(response);
    return response;
  }
};
