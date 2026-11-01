import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReadLoop from "./ReadLoop";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

beforeEach(() => {
  resetStores();
  useUiStore.getState().openLoop("read");
});

describe("ReadLoop", () => {
  it("rejects a session with fewer than 3 words", async () => {
    render(<ReadLoop open />);
    await userEvent.type(screen.getByLabelText("word 1"), "tort");
    await userEvent.type(screen.getByLabelText("word 2"), "estoppel");
    await userEvent.click(screen.getByRole("button", { name: "Log words" }));
    expect(useAppStore.getState().words).toHaveLength(0);
    expect(useAppStore.getState().counts.read).toBe(0);
    expect(useUiStore.getState().toasts[0]?.msg).toMatch(/at least 3 words/);
    expect(useUiStore.getState().modal.kind).toBe("loop");
  });

  it("logs 5 words, creates cards and completes the loop", async () => {
    render(<ReadLoop open nodeId="ovi" />);
    await userEvent.type(screen.getByLabelText("What did you read?"), "a Lancet editorial");
    for (let i = 1; i <= 5; i++) {
      await userEvent.type(screen.getByLabelText(`word ${i}`), `word${i}`);
      await userEvent.type(screen.getByLabelText(`sentence ${i}`), `sentence ${i}`);
    }
    await userEvent.click(screen.getByRole("button", { name: "Log words" }));
    const s = useAppStore.getState();
    expect(s.words).toHaveLength(5);
    expect(s.words[0]).toMatchObject({ w: "word1", s: "sentence 1", src: "a Lancet editorial" });
    expect(s.cards).toHaveLength(5);
    expect(s.counts.read).toBe(1);
    expect(s.progress.ovi).toBe(1);
    expect(useUiStore.getState().modal.kind).toBe("none");
    expect(useUiStore.getState().toasts.at(-1)?.msg).toBe("5 words logged → 5 cards created");
    const types = useUiStore.getState().commands.map((c) => c.type);
    expect(types).toContain("pullBack");
    expect(types).toContain("reward");
  });
});
