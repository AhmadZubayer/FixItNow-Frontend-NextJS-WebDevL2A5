import { NextResponse } from "next/server";
import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

export async function GET() {
  try { return NextResponse.json(await sessionRequest("get", "/api/admin/bookings")); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
}
