import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { backend, apiError } from "@/lib/backend";
import { loginSchema } from "@/validations/auth.validation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check your login details" }, { status: 400 });

  try {
    const response = await backend.post<{ data: { accessToken: string; refreshToken: string } }>("/api/auth/login", result.data);
    const { accessToken, refreshToken } = response.data.data;
    const cookieStore = await cookies();
    const secure = process.env.NODE_ENV === "production";
    cookieStore.set("accessToken", accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 });
    cookieStore.set("refreshToken", refreshToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
