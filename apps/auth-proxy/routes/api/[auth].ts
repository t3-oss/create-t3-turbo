import type { AuthConfig } from "@auth/core";
import { Auth } from "@auth/core";
import Discord from "@auth/core/providers/discord";
import type { H3Event } from "h3";
import { eventHandler, getHeaders, getRequestURL, readBody } from "h3";

export const handleEvent = async (event: H3Event) => {
  const request = new Request(getRequestURL(event), {
    method: event.method,
    headers: new Headers(
      Object.entries(getHeaders(event)).filter(
        (e): e is [string, string] => !!e[1],
      ),
    ),
    body: event.method === "POST" ? await readBody(event) : undefined,
  });

  console.log(request);

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

  const response = await Auth(request, config);

  console.log(
    getRequestURL(event).href,
    Object.fromEntries(response.headers.entries()),
  );

  return response;
};

export default eventHandler(handleEvent);
