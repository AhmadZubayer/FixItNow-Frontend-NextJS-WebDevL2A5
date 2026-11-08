import { NextRequest, NextResponse } from "next/server";

const dashboardRoles = ["customer", "technician", "admin"] as const;

export const proxy = async (request: NextRequest) => {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  let sessionResponse: Response;
  try {
    sessionResponse = await fetch(new URL("/api/session/me", request.url), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
  } catch {
    return new NextResponse("The dashboard is temporarily unavailable. Please try again.", { status: 503 });
  }

  if (sessionResponse.status === 401 || sessionResponse.status === 403) {
    const redirect = NextResponse.redirect(new URL("/auth/login", request.url));
    for (const cookie of sessionResponse.headers.getSetCookie()) redirect.headers.append("set-cookie", cookie);
    return redirect;
  }

  if (!sessionResponse.ok) {
    return new NextResponse("The dashboard is temporarily unavailable. Please try again.", { status: 503 });
  }

  const session: { role?: string } = await sessionResponse.json();
  const role = session.role?.toLowerCase();
  if (!role || !dashboardRoles.some((validRole) => validRole === role)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const requestedRole = request.nextUrl.pathname.split("/")[2];
  const response = requestedRole && requestedRole !== role
    ? NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    : NextResponse.next();
  for (const cookie of sessionResponse.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  return response;
};

export const config = {
  matcher: ["/dashboard/:path*"],
};
