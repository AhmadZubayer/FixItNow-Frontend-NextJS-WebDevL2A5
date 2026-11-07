import { NextResponse } from "next/server";
import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { categorySchema } from "@/validations/admin.validation";

export async function GET() {
  try { return NextResponse.json(await sessionRequest("get", "/api/admin/categories")); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid category request" }, { status: 400 }); }
  const result = categorySchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check category fields" }, { status: 400 });
  try { return NextResponse.json(await sessionRequest("post", "/api/admin/categories", result.data), { status: 201 }); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
}
