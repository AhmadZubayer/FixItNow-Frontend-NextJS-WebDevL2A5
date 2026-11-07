import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { getCategories } from "@/lib/public-api";

export async function GET() {
  try {
    return NextResponse.json(await getCategories());
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
