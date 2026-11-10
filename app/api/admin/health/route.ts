import { NextResponse } from "next/server";
import { backend, apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

export const GET = async () => {
  try {
    const session = await sessionRequest<{ role: string }>("get", "/api/auth/me");
    if (session.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const response = await backend.get("/health", { validateStatus: () => true, headers: { "Cache-Control": "no-cache" } });
    return NextResponse.json(response.data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } });
  }
};
