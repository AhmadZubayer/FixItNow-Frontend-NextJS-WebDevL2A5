import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { reviewSchema } from "@/validations/review.validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid review request" }, { status: 400 });
  }

  const result = reviewSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "Check your rating and comment" }, { status: 400 });

  try {
    const review = await sessionRequest("post", "/api/reviews", result.data);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
