import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewLoop from "./ReviewLoop";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

beforeEach(() => {
  resetStores();
  useUiStore.getState().openLoop("review");
});

describe("ReviewLoop", () => {
  it("shows an empty state that routes to the read loop", async () => {
    render(<ReviewLoop open />);
    expect(screen.getByText(/No cards yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go read" }));
    expect(useUiStore.getState().modal).toMatchObject({ kind: "loop", loop: "read" });
  });

  it("flips cards, rates them and completes the loop at the end of the deck", async () => {
    useAppStore.getState().addWords(
      [
        { w: "tort", s: "A tort is a civil wrong." },
        { w: "estoppel", s: "" },
      ],
      "",
    );
    render(<ReviewLoop open />);
    expect(screen.getByText(/Card 1 of 2/)).toBeInTheDocument();
    const card = screen.getByTestId("review-card");
    expect(card).not.toHaveClass("flip");
    await userEvent.click(card);
    expect(card).toHaveClass("flip");
    await userEvent.click(screen.getByRole("button", { name: "Easy" }));
    expect(useAppStore.getState().cards.find((c) => c.w === "tort")?.box).toBe(3);
    expect(screen.getByText(/Card 2 of 2/)).toBeInTheDocument();
    expect(screen.getByText("(no sentence logged)")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Again" }));
    await waitFor(() => expect(useAppStore.getState().counts.review).toBe(1));
    expect(useAppStore.getState().reviewed).toBe(2);
    expect(useUiStore.getState().modal.kind).toBe("none");
  });
});
