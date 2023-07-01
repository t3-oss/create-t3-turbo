import type { IncomingMessage } from "http";
import parser from "accept-language-parser";

import i18NextConfig from "../../apps/nextjs/next-i18next.config.mjs";
import type { Maybe } from "../trpc/server";

const { i18n } = i18NextConfig;

export function getLocaleFromHeaders(req: IncomingMessage): string {
  let preferredLocale: string | null | undefined;
  if (req.headers["accept-language"]) {
    preferredLocale = parser.pick(
      i18n.locales,
      req.headers["accept-language"],
    ) as Maybe<string>;
  }
  return preferredLocale ?? i18n.defaultLocale;
}
