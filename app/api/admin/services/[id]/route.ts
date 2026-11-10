import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

const schema = z.object({ action: z.enum(["approve", "reject", "pause", "resume", "delete"]) }).strict();
export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ message: "Invalid service ID" }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid service request" }, { status: 400 }); }
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Invalid service action" }, { status: 400 });
  try { return NextResponse.json(await sessionRequest("patch", `/api/admin/services/${id}`, result.data)); }
  catch (error) { const { status, message } = apiError(error); return NextResponse.json({ message }, { status }); }
};
