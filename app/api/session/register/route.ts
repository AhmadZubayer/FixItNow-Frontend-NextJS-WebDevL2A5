import { NextResponse } from "next/server";

import { backend, apiError } from "@/lib/backend";
import { registerSchema } from "@/validations/auth.validation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const result = registerSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check the registration details" }, { status: 400 });

  try {
    await backend.post("/api/auth/register", result.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
