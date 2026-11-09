import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backend, apiError } from "@/lib/backend";
import { clearSessionCookies } from "@/lib/session-cookies";

export const POST = async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    const response = NextResponse.json({ message: "Please log in" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  try {
    const response = await backend.post<{ data: { accessToken: string } }>("/api/auth/refresh-token", { refreshToken });
    cookieStore.set("accessToken", response.data.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, message } = apiError(error);
    const response = NextResponse.json({ message }, { status });
    clearSessionCookies(response);
    return response;
  }
};
