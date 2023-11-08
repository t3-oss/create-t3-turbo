import type { AuthConfig } from "@auth/core";
import { Auth } from "@auth/core";
import Discord from "@auth/core/providers/discord";
import { eventHandler, getHeaders, getRequestURL } from "h3";

export default eventHandler((event) => {
  const request = new Request(getRequestURL(event), {
    headers: new Headers(
      Object.entries(getHeaders(event)).filter(
        (e): e is [string, string] => !!e[1],
      ),
    ),
  });

  return Auth(request, getDefaults({ providers: [Discord] }));
});

function getDefaults(config: AuthConfig) {
  config.secret ??= process.env.AUTH_SECRET;
  config.trustHost ??= !!process.env.VERCEL;
  config.redirectProxyUrl ??= process.env.AUTH_REDIRECT_PROXY_URL;
  config.providers = config.providers.map((p) => {
    const finalProvider = typeof p === "function" ? p() : p;
    if (finalProvider.type === "oauth" || finalProvider.type === "oidc") {
      const ID = finalProvider.id.toUpperCase();
      finalProvider.clientId ??= process.env[`AUTH_${ID}_ID`];
      finalProvider.clientSecret ??= process.env[`AUTH_${ID}_SECRET`];
      if (finalProvider.type === "oidc") {
        finalProvider.issuer ??= process.env[`AUTH_${ID}_ISSUER`];
      }
    }
    return finalProvider;
  });
  return config;
}
