import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExplainLoop, { MIN_SPOKEN_SECONDS, SESSION_SECONDS } from "./ExplainLoop";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

beforeEach(() => {
  resetStores();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

describe("ExplainLoop", () => {
  it("unlocks Done after the minimum speaking time and records the checks", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ExplainLoop open nodeId="mir" />);
    expect(screen.getByRole("radio", { name: "Pyramid Principle" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("button", { name: "Speaking…" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(MIN_SPOKEN_SECONDS * 1000));
    expect(screen.getByTestId("explain-timer")).toHaveTextContent("1:30");
    expect(done).toBeEnabled();
    for (const cb of screen.getAllByRole("checkbox")) await user.click(cb);
    await user.click(done);
    const s = useAppStore.getState();
    expect(s.counts.explain).toBe(1);
    expect(s.flags.feynman3).toBe(true);
    expect(s.progress.mir).toBe(2);
    expect(useUiStore.getState().modal.kind).toBe("none");
  });

  it("stops at zero and lets the user pick another concept", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ExplainLoop open nodeId="mir" />);
    await user.click(screen.getByRole("radio", { name: "SCQA" }));
    expect(screen.getByRole("radio", { name: "SCQA" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Start" }));
    act(() => vi.advanceTimersByTime(SESSION_SECONDS * 1000 + 100));
    expect(screen.getByTestId("explain-timer")).toHaveTextContent("0:00");
    expect(screen.getByRole("button", { name: "Time" })).toBeDisabled();
    expect(useUiStore.getState().toasts.at(-1)?.msg).toMatch(/Two minutes/);
  });
});
