import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RitualBar, { SLOT_KEY, SLOT_ORDER } from "./RitualBar";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

beforeEach(resetStores);

const allUnlocked = { meet: 1, disc: 1, read1: 1, review1: 1, prep: 1, pyramid: 1, aloud: 1 };

describe("RitualBar", () => {
  it("always shows the four slots in the same order with their keys printed", () => {
    useAppStore.setState({ chapters: { meet: 1, disc: 1 } });
    render(<RitualBar onOpenLoop={vi.fn()} />);
    const slots = screen.getAllByTestId(/^today-/);
    expect(slots.map((s) => s.getAttribute("data-slot"))).toEqual([...SLOT_ORDER]);
    for (const k of SLOT_ORDER) {
      expect(screen.getByTestId(`today-${k}`)).toHaveAttribute("aria-keyshortcuts", SLOT_KEY[k]);
      expect(screen.getByTestId(`today-${k}`)).toHaveTextContent(SLOT_KEY[k]);
    }
    expect(screen.getByTestId("today-read")).toHaveAttribute("data-state", "ready");
    expect(screen.getByTestId("today-write")).toHaveAttribute("data-state", "locked");
  });

  it("keyboard shortcuts 1–4 open the four loops", async () => {
    const onOpenLoop = vi.fn();
    useAppStore.setState({ chapters: allUnlocked });
    render(<RitualBar onOpenLoop={onOpenLoop} />);
    await userEvent.keyboard("1");
    await userEvent.keyboard("2");
    await userEvent.keyboard("3");
    await userEvent.keyboard("4");
    expect(onOpenLoop.mock.calls.map((c) => c[0])).toEqual(["read", "write", "explain", "review"]);
  });

  it("ignores shortcuts for locked slots, while typing, and while a modal is open", async () => {
    const onOpenLoop = vi.fn();
    useAppStore.setState({ chapters: { meet: 1, disc: 1 } });
    render(
      <>
        <input aria-label="field" />
        <RitualBar onOpenLoop={onOpenLoop} />
      </>,
    );
    await userEvent.keyboard("2"); // write is locked
    expect(onOpenLoop).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText("field"), "1");
    expect(onOpenLoop).not.toHaveBeenCalled();
    (document.activeElement as HTMLElement | null)?.blur();
    useUiStore.getState().openLoop("read");
    await userEvent.keyboard("1");
    expect(onOpenLoop).not.toHaveBeenCalled();
    useUiStore.getState().closeModal();
    await userEvent.keyboard("1");
    expect(onOpenLoop).toHaveBeenCalledWith("read");
  });

  it("pulses the slot the UI store asks for", () => {
    useAppStore.setState({ chapters: { meet: 1, disc: 1 } });
    useUiStore.getState().setPulseSlot("read");
    render(<RitualBar onOpenLoop={vi.fn()} />);
    expect(screen.getByTestId("today-read")).toHaveClass("pulse");
  });
});
