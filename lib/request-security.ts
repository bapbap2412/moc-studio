export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const requestHost = (forwardedHost ?? request.headers.get("host"))?.split(",", 1)[0]?.trim();
  if (!origin || !requestHost || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    return new URL(origin).host.toLowerCase() === requestHost.toLowerCase();
  } catch {
    return false;
  }
}
