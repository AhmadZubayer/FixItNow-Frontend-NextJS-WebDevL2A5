import { NextResponse } from "next/server";

import { apiError } from "@/lib/backend";
import { sessionRequest } from "@/lib/session-request";
import { paymentSchema } from "@/validations/payment.validation";

export async function GET() {
  try {
    const payments = await sessionRequest<unknown[]>("get", "/api/payments");
    return NextResponse.json(payments);
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid payment request" }, { status: 400 });
  }

  const result = paymentSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: "A valid accepted booking is required" }, { status: 400 });

  try {
    const checkout = await sessionRequest("post", "/api/payments/create", result.data);
    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    const { status, message } = apiError(error);
    return NextResponse.json({ message }, { status });
  }
}
