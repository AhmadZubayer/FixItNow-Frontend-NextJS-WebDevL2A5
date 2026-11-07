import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { bookingStatusSchema } from "@/validations/booking.validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ message: "Invalid booking ID" }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid status request" }, { status: 400 }); }
  const result = bookingStatusSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Invalid booking status" }, { status: 400 });

  try {
    return NextResponse.json(await sessionRequest("patch", `/api/technician/bookings/${id}`, result.data));
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
