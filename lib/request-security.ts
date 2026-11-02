export function getSameOriginOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const requestHost = (forwardedHost ?? request.headers.get("host"))?.split(",", 1)[0]?.trim();
  if (!origin || !requestHost || request.headers.get("sec-fetch-site") === "cross-site") return null;
  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.host.toLowerCase() !== requestHost.toLowerCase()) return null;
    return parsedOrigin.origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request) {
  return getSameOriginOrigin(request) !== null;
}
