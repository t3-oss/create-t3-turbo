/**
 * Parse a scanned pairing QR: `{ url, code }` where `code` is a pre-approved
 * RFC 8628 device code minted by the web app's "Pair Mobile Device" panel.
 * The QR never contains a credential — the code is exchanged for a session
 * token at /device/token, and that exchange succeeds exactly once.
 */
export function parsePairingQR(
  data: string,
): { url: string; code: string } | null {
  try {
    const parsed = JSON.parse(data) as { url?: unknown; code?: unknown };
    if (typeof parsed.url !== "string" || typeof parsed.code !== "string") {
      return null;
    }
    return { url: parsed.url, code: parsed.code };
  } catch {
    return null;
  }
}
