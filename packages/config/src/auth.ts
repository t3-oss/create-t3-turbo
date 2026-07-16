/**
 * OAuth client identifier used by the RFC 8628 device-authorization (QR
 * pairing) flow. The web app's "Pair Mobile Device" panel and the mobile
 * app's pairing screen must present the same client id — the token endpoint
 * rejects a redemption whose client_id doesn't match the code's issuer.
 */
export const PAIRING_CLIENT_ID = "mobile-app";
