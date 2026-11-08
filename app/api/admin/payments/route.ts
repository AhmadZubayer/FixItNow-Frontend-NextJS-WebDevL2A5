import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";

export const GET = async () => {
  try {
    return NextResponse.json(await sessionRequest("get", "/api/admin/payments"));
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
};
