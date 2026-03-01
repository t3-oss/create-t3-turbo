import { describe, expect, it } from "vitest";

import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  truncate,
} from "./format";

describe("formatDate", () => {
  it("formats a date with default options", () => {
    const result = formatDate(new Date("2026-02-27T12:00:00Z"));
    expect(result).toContain("Feb");
    expect(result).toContain("27");
    expect(result).toContain("2026");
  });

  it("returns 'just now' for very recent dates in relative mode", () => {
    const result = formatDate(new Date(), { relative: true });
    expect(result).toBe("just now");
  });

  it("returns minutes ago for recent dates", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatDate(fiveMinutesAgo, { relative: true });
    expect(result).toBe("5m ago");
  });

  it("returns hours ago for same-day dates", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatDate(threeHoursAgo, { relative: true });
    expect(result).toBe("3h ago");
  });

  it("returns days ago for recent past dates", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = formatDate(twoDaysAgo, { relative: true });
    expect(result).toBe("2d ago");
  });

  it("falls back to absolute format for dates older than 7 days", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const result = formatDate(twoWeeksAgo, { relative: true });
    // Should return an absolute date, not "Xd ago"
    expect(result).not.toContain("ago");
  });

  it("accepts string and number inputs", () => {
    const fromString = formatDate("2026-01-15");
    const fromNumber = formatDate(new Date("2026-01-15").getTime());
    expect(fromString).toContain("Jan");
    expect(fromNumber).toContain("Jan");
  });
});

describe("formatCurrency", () => {
  it("converts cents to dollars with USD default", () => {
    expect(formatCurrency(1999)).toBe("$19.99");
  });

  it("formats zero cents", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("supports EUR currency", () => {
    const result = formatCurrency(500, { currency: "EUR" });
    // The exact format may vary by locale, but should contain 5.00
    expect(result).toContain("5.00");
  });

  it("handles large amounts", () => {
    const result = formatCurrency(999999);
    expect(result).toBe("$9,999.99");
  });
});

describe("formatNumber", () => {
  it("formats thousands compactly", () => {
    const result = formatNumber(1234);
    expect(result).toMatch(/1\.2K/i);
  });

  it("formats millions compactly", () => {
    const result = formatNumber(1234567);
    expect(result).toMatch(/1\.2M/i);
  });

  it("returns small numbers as-is", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("truncate", () => {
  it("truncates long strings with ellipsis", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("returns short strings unchanged", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("handles exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("respects decimal precision", () => {
    expect(formatBytes(1536, 2)).toBe("1.5 KB");
  });
});
