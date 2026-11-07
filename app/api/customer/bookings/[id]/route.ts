import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ message: "Invalid booking ID" }, { status: 400 });

  try {
    const booking = await sessionRequest("get", `/api/bookings/${id}`);
    return NextResponse.json(booking);
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
