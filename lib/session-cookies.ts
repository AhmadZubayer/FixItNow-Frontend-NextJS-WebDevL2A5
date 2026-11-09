import { NextResponse } from "next/server";

export const clearSessionCookies = (response: NextResponse) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const attributes = `Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`;
  response.headers.append("Set-Cookie", `accessToken=; Path=/; ${attributes}`);
  response.headers.append("Set-Cookie", `refreshToken=; Path=/; ${attributes}`);
  response.headers.append("Set-Cookie", `refreshToken=; Path=/api/session; ${attributes}`);
};
