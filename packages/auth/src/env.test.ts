import { describe, expect, it } from "vitest";

import { parseSsoTrustedIssuers } from "./sso-issuers";

describe("parseSsoTrustedIssuers", () => {
  it("splits, trims, and drops empty entries", () => {
    expect(
      parseSsoTrustedIssuers(
        " https://gmacko.okta.com , https://login.microsoftonline.com,, ",
      ),
    ).toEqual(["https://gmacko.okta.com", "https://login.microsoftonline.com"]);
  });

  it("returns an empty list for unset or blank input", () => {
    expect(parseSsoTrustedIssuers(undefined)).toEqual([]);
    expect(parseSsoTrustedIssuers("")).toEqual([]);
    expect(parseSsoTrustedIssuers(" , ")).toEqual([]);
  });
});
