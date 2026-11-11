export function isAllowedOrigin(
  origin: string | null,
  requestUrl: string,
  development = false,
): boolean {
  if (!origin) return true;
  try {
    const expected = new URL(requestUrl);
    const actual = new URL(origin);
    if (origin === expected.origin) return true;
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    return (
      development &&
      actual.pathname === "/" &&
      !actual.search &&
      !actual.hash &&
      loopback.has(actual.hostname) &&
      loopback.has(expected.hostname) &&
      actual.protocol === expected.protocol &&
      actual.port === expected.port
    );
  } catch {
    return false;
  }
}
