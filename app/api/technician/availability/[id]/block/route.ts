import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ message: "Invalid slot ID" }, { status: 400 });
  try {
    return NextResponse.json(await sessionRequest("patch", `/api/technician/availability/${id}/block`));
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
