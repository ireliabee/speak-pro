import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WriteLoop from "./WriteLoop";
import { scoreText } from "@/lib/scoring";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

const GOOD = `Reading outside your field is the fastest way to grow a precise vocabulary. This works because every discipline names ideas that your own field only gestures at. For example, a doctor who reads a court opinion meets the word estoppel and has a tool for a whole class of arguments. Last week I logged five such words from a single editorial and used three of them in a memo. The habit costs thirty minutes a day and nothing else. That is why reading outside your field is the fastest way to grow a precise vocabulary.`;

beforeEach(resetStores);

describe("WriteLoop", () => {
  it("shows the score and keeps Submit disabled under 40", async () => {
    render(<WriteLoop open nodeId="mir" />);
    expect(screen.getByRole("radio", { name: "Pyramid Principle" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    const submit = screen.getByRole("button", { name: "Submit" });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Your paragraph"), "Too short. Really. Yes. Ok.");
    await userEvent.click(screen.getByRole("button", { name: "Score it" }));
    const score = screen.getByTestId("write-score");
    const expected = scoreText("Too short. Really. Yes. Ok.", "mir").score;
    expect(expected).toBeLessThan(40);
    expect(score).toBeInTheDocument();
    expect(screen.getByTestId("write-score-value")).toHaveAttribute("data-score", String(expected));
    expect(score.querySelectorAll("[data-ok='false']").length).toBeGreaterThan(0);
    expect(submit).toBeDisabled();
    expect(useUiStore.getState().toasts[0]?.msg).toMatch(/Score 40\+/);
  });

  it("enables Submit at 40+ and records the best score on submit", async () => {
    render(<WriteLoop open nodeId="jatavia" />);
    await userEvent.click(screen.getByLabelText("Your paragraph"));
    await userEvent.paste(GOOD);
    await userEvent.click(screen.getByRole("button", { name: "Score it" }));
    expect(screen.getByTestId("write-score-value")).toHaveAttribute("data-score", "100");
    await waitFor(() => expect(screen.getByTestId("write-score-value")).toHaveTextContent("100"), {
      timeout: 4000,
    });
    const submit = screen.getByRole("button", { name: "Submit" });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    const s = useAppStore.getState();
    expect(s.best.jatavia).toBe(100);
    expect(s.counts.write).toBe(1);
    expect(s.flags.orwell).toBe(true);
    expect(useUiStore.getState().modal.kind).toBe("none");
  });

  it("switching framework clears the score", async () => {
    render(<WriteLoop open />);
    await userEvent.type(screen.getByLabelText("Your paragraph"), "Some text here.");
    await userEvent.click(screen.getByRole("button", { name: "Score it" }));
    expect(screen.getByTestId("write-score")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "SCQA" }));
    expect(screen.queryByTestId("write-score")).not.toBeInTheDocument();
  });
});
