import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { technicianServiceSchema } from "@/validations/technician.validation";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid service request" }, { status: 400 }); }
  const result = technicianServiceSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check your service fields" }, { status: 400 });

  try {
    return NextResponse.json(await sessionRequest("post", "/api/technician/services", result.data), { status: 201 });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
