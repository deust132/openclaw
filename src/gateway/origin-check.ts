type OriginCheckResult = { ok: true } | { ok: false; reason: string };

function normalizeHostHeader(hostHeader?: string): string {
  return (hostHeader ?? "").trim().toLowerCase();
}

function resolveHostName(hostHeader?: string): string {
  const host = normalizeHostHeader(hostHeader);
  if (!host) {
    return "";
  }
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end !== -1) {
      return host.slice(1, end);
    }
  }
  const [name] = host.split(":");
  return name ?? "";
}

function parseOrigin(
  originRaw?: string,
): { origin: string; host: string; hostname: string } | null {
  const trimmed = (originRaw ?? "").trim();
  if (!trimmed || trimmed === "null") {
    return null;
  }
  try {
    const url = new URL(trimmed);
    return {
      origin: url.origin.toLowerCase(),
      host: url.host.toLowerCase(),
      hostname: url.hostname.toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function isLoopbackHost(hostname: string): boolean {
  if (!hostname) {
    return false;
  }
  if (hostname === "localhost") {
    return true;
  }
  if (hostname === "::1") {
    return true;
  }
  if (hostname === "127.0.0.1" || hostname.startsWith("127.")) {
    return true;
  }
  return false;
}

/**
 * Check if the Host header value is allowed.
 * Defends against DNS rebinding by rejecting unexpected hostnames.
 * Loopback hostnames (localhost, 127.x, ::1) are always accepted.
 */
export function isHostAllowed(hostname: string, allowedHosts?: string[]): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true; // no host header → skip check (non-browser)
  }
  if (isLoopbackHost(normalized)) {
    return true;
  }
  if (!allowedHosts || allowedHosts.length === 0) {
    return true; // no allowlist configured → permissive
  }
  return allowedHosts.some((h) => h.trim().toLowerCase() === normalized);
}

export function checkBrowserOrigin(params: {
  requestHost?: string;
  origin?: string;
  allowedOrigins?: string[];
  allowedHosts?: string[];
}): OriginCheckResult {
  // DNS rebinding defense: validate Host header first
  const requestHostname = resolveHostName(params.requestHost);
  if (requestHostname && !isHostAllowed(requestHostname, params.allowedHosts)) {
    return { ok: false, reason: "host not allowed (possible DNS rebinding)" };
  }

  const parsedOrigin = parseOrigin(params.origin);
  if (!parsedOrigin) {
    return { ok: false, reason: "origin missing or invalid" };
  }

  const allowlist = (params.allowedOrigins ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.includes(parsedOrigin.origin)) {
    return { ok: true };
  }

  const requestHost = normalizeHostHeader(params.requestHost);
  if (requestHost && parsedOrigin.host === requestHost) {
    return { ok: true };
  }

  if (isLoopbackHost(parsedOrigin.hostname) && isLoopbackHost(requestHostname)) {
    return { ok: true };
  }

  return { ok: false, reason: "origin not allowed" };
}
