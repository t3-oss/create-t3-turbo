import type { AuthConfig } from "@auth/core";
import { Auth } from "@auth/core";
import Discord from "@auth/core/providers/discord";
import { eventHandler, getHeaders, getRequestURL, readBody } from "h3";

export default eventHandler(async (event) => {
  const request = new Request(getRequestURL(event), {
    method: event.method,
    headers: getHeaders(event) as unknown as Headers,
    body: event.method === "POST" ? await readBody(event) : undefined,
  });

  const config = {
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      Discord({
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET,
      }),
    ],
  } satisfies AuthConfig;

  return Auth(request, config);
});
