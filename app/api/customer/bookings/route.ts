import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { bookingSchema } from "@/validations/booking.validation";

export async function GET() {
  try {
    const bookings = await sessionRequest<unknown[]>("get", "/api/bookings");
    return NextResponse.json(bookings);
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid booking request" }, { status: 400 });
  }

  const result = bookingSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Choose a service and available time" }, { status: 400 });

  try {
    const booking = await sessionRequest("post", "/api/bookings", result.data);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
