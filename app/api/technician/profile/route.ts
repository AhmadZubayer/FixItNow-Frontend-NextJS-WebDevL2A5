import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { technicianProfileSchema } from "@/validations/technician.validation";

export async function GET() {
  try {
    return NextResponse.json(await sessionRequest("get", "/api/technician/profile"));
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid profile request" }, { status: 400 }); }
  const result = technicianProfileSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check your profile fields" }, { status: 400 });

  try {
    return NextResponse.json(await sessionRequest("put", "/api/technician/profile", result.data));
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
