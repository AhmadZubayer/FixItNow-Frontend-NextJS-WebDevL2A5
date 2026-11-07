import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { availabilityPayload, availabilitySchema } from "@/validations/availability.validation";

export async function PUT(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid availability request" }, { status: 400 }); }
  const result = availabilitySchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check the start and end times" }, { status: 400 });

  try {
    return NextResponse.json(await sessionRequest("put", "/api/technician/availability", availabilityPayload(result.data)));
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
