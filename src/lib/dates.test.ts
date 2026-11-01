import { describe, expect, it } from "vitest";
import { dayDiff, pathWarm, todayISO } from "./dates";

describe("dates", () => {
  it("formats ISO days and diffs them", () => {
    expect(todayISO(new Date("2026-11-01T13:00:00Z"))).toBe("2026-11-01");
    expect(dayDiff("2026-10-30", "2026-11-01")).toBe(2);
  });
  it("path is warm for today/yesterday only", () => {
    expect(pathWarm(null)).toBe(false);
    expect(pathWarm("2026-11-01", "2026-11-01")).toBe(true);
    expect(pathWarm("2026-10-31", "2026-11-01")).toBe(true);
    expect(pathWarm("2026-10-29", "2026-11-01")).toBe(false);
  });
});
