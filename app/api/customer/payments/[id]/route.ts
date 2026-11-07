import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ message: "Invalid payment ID" }, { status: 400 });

  try {
    const payment = await sessionRequest("get", `/api/payments/${id}`);
    return NextResponse.json(payment);
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
