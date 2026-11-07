import { NextResponse } from "next/server";
import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { categoryEditSchema } from "@/validations/admin.validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ message: "Invalid category ID" }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid category request" }, { status: 400 }); }
  const result = categoryEditSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check category fields" }, { status: 400 });
  try { return NextResponse.json(await sessionRequest("patch", `/api/admin/categories/${id}`, result.data)); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
}
