import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session-cookies";

export const POST = async () => {
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
};
