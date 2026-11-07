import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backend, apiError } from "@/lib/backend";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return NextResponse.json({ message: "Please log in" }, { status: 401 });

  try {
    const response = await backend.post<{ data: { accessToken: string } }>("/api/auth/refresh-token", { refreshToken });
    cookieStore.set("accessToken", response.data.data.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 });
    return NextResponse.json({ success: true });
  } catch (error) {
    cookieStore.delete("accessToken");
    cookieStore.set("refreshToken", "", { httpOnly: true, path: "/api/session", maxAge: 0 });
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
