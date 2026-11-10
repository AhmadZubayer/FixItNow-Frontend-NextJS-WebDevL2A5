import { NextResponse } from "next/server";
import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
export const GET = async (request: Request) => {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 100) return NextResponse.json({ message: "Enter 2 to 100 characters" }, { status: 400 });
  try { return NextResponse.json(await sessionRequest("get", `/api/technician/services/suggestions?q=${encodeURIComponent(q)}`)); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
};
