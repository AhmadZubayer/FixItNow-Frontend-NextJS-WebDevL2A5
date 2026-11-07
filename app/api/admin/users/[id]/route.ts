import { NextResponse } from "next/server";
import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { adminStatusSchema } from "@/validations/admin.validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid status request" }, { status: 400 }); }
  const result = adminStatusSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Choose a valid status" }, { status: 400 });
  try { return NextResponse.json(await sessionRequest("patch", `/api/admin/users/${id}`, result.data)); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
}
