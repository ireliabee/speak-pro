import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestPanel from "./QuestPanel";
import { JOURNEY } from "@/data/journey";
import { useAppStore } from "@/store/useAppStore";
import { resetStores } from "@/test/utils";

beforeEach(resetStores);

describe("QuestPanel", () => {
  it("shows the first chapter's title, objective and action button", async () => {
    const onAction = vi.fn();
    render(<QuestPanel onAction={onAction} />);
    expect(screen.getByTestId("quest-title")).toHaveTextContent("Meet your map");
    expect(screen.getByTestId("quest-objective")).toHaveTextContent(
      "Click the glowing node to begin",
    );
    expect(screen.getByText(/Chapter 1 of 19/)).toBeInTheDocument();
    expect(screen.getByTestId("quest-level")).toHaveTextContent("Novice · 0 XP");
    const btn = screen.getByTestId("quest-action");
    expect(btn).toHaveTextContent("Find the node");
    await userEvent.click(btn);
    expect(onAction).toHaveBeenCalledWith({ type: "focus", node: "azair" });
  });

  it("advances to the read chapter with a loop button and progress meter", () => {
    useAppStore.setState({ chapters: { meet: 1, disc: 1 }, xp: 50 });
    useAppStore.getState().addWords([{ w: "tort", s: "" }], "");
    render(<QuestPanel onAction={vi.fn()} />);
    expect(screen.getByTestId("quest-title")).toHaveTextContent(JOURNEY[2]!.title);
    expect(screen.getByTestId("quest-action")).toHaveTextContent("Start: Read & log");
    expect(screen.getByText("1/5 words")).toBeInTheDocument();
    expect(screen.getByText(/Chapter 3 of 19/)).toBeInTheDocument();
  });

  it("shows the finished state when the journey is complete", () => {
    const chapters = Object.fromEntries(JOURNEY.slice(0, -1).map((c) => [c.id, 1]));
    useAppStore.setState({ chapters });
    render(<QuestPanel onAction={vi.fn()} />);
    expect(screen.queryByTestId("quest-action")).not.toBeInTheDocument();
    expect(screen.getByText(/endless mode/)).toBeInTheDocument();
  });
});
