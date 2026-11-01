import { describe, expect, it } from "vitest";
import { dayDiff, pathState, pathWarm, todayISO } from "./dates";

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

describe("pathState", () => {
  const now = new Date("2026-11-01T12:00:00Z").getTime();
  const H = 3600 * 1000;
  it("is cold with no streak or an old one", () => {
    expect(pathState(null, null, now)).toBe("cold");
    expect(pathState("2026-10-29", now - 3 * 24 * H, now)).toBe("cold");
  });
  it("is lit within 20 h and at-risk after", () => {
    expect(pathState("2026-11-01", now - 2 * H, now)).toBe("lit");
    expect(pathState("2026-10-31", now - 21 * H, now)).toBe("at-risk");
    expect(pathState("2026-11-01", null, now)).toBe("lit");
  });
});
