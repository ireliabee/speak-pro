import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Celebration from "./Celebration";
import Onboarding from "./Onboarding";
import TodayStrip from "./TodayStrip";
import TopBar from "./TopBar";
import Tutorial from "./Tutorial";
import Snapshot from "./Snapshot";
import Toasts from "./ui/Toasts";
import NodePanel from "./quest/NodePanel";
import { JOURNEY } from "@/data/journey";
import { NODE_BY_ID } from "@/data/graph";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

beforeEach(resetStores);

describe("Celebration", () => {
  it("shows the completed chapter, xp and the next objective", async () => {
    const onContinue = vi.fn();
    useAppStore.setState({ xp: 160 });
    render(<Celebration open chapter={JOURNEY[0]!} next={JOURNEY[1]!} onContinue={onContinue} />);
    expect(screen.getByTestId("celebration-title")).toHaveTextContent("Meet your map");
    expect(screen.getByText("+20 XP · Apprentice")).toBeInTheDocument();
    expect(screen.getByText(/Pick a discipline pack/)).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("celebration-continue"));
    expect(onContinue).toHaveBeenCalled();
  });
  it("renders the journey-finished copy without a next chapter", () => {
    render(<Celebration open chapter={JOURNEY.at(-1)!} next={null} onContinue={vi.fn()} />);
    expect(screen.getByText("You finished the journey.")).toBeInTheDocument();
  });
});

describe("Onboarding", () => {
  it("collects a name and an optional discipline", async () => {
    const onBegin = vi.fn();
    render(<Onboarding open onBegin={onBegin} />);
    await userEvent.type(screen.getByLabelText("Your first name"), "Elijah");
    await userEvent.click(screen.getByRole("radio", { name: "Business" }));
    expect(screen.getByRole("radio", { name: "Business" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("radio", { name: "Business" }));
    expect(screen.getByRole("radio", { name: "Business" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Law" }));
    await userEvent.click(screen.getByTestId("onboarding-begin"));
    expect(onBegin).toHaveBeenCalledWith("Elijah", "caterina");
  });
});

describe("TodayStrip", () => {
  it("renders nothing before the read chapter is reachable", () => {
    const { container } = render(<TodayStrip onOpenLoop={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("shows unlocked loops with done state and opens them", async () => {
    const onOpenLoop = vi.fn();
    useAppStore.setState({ chapters: { meet: 1, disc: 1, read1: 1, review1: 1 } });
    useAppStore.getState().completeLoop("read");
    render(<TodayStrip onOpenLoop={onOpenLoop} />);
    expect(screen.getByTestId("today-read")).toHaveTextContent("✓");
    expect(screen.getByTestId("today-review")).toHaveTextContent("0 due");
    expect(screen.queryByTestId("today-explain")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("today-review"));
    expect(onOpenLoop).toHaveBeenCalledWith("review");
  });
});

describe("TopBar", () => {
  it("shows stats, toggles label mode and fires callbacks", async () => {
    const onSnapshot = vi.fn();
    const onReset = vi.fn();
    useAppStore.getState().addWords([{ w: "a", s: "" }], "");
    useAppStore.getState().completeLoop("read");
    render(<TopBar onSnapshot={onSnapshot} onReset={onReset} />);
    expect(screen.getByTestId("stat-words")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-due")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-streak")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-mastery")).toHaveTextContent("%");
    await userEvent.click(screen.getByRole("radio", { name: "Image names" }));
    expect(useAppStore.getState().mode).toBe("orig");
    await userEvent.click(screen.getByRole("button", { name: "Snapshot" }));
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onSnapshot).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
  });
});

describe("Tutorial", () => {
  it("steps through three cards and finishes", async () => {
    const onDone = vi.fn();
    render(<Tutorial open onDone={onDone} />);
    expect(screen.getByText("This is your map")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("This is your quest")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("Snapshot", () => {
  it("summarises the map and copies it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    useAppStore.getState().onboard("Elijah");
    render(<Snapshot open onClose={vi.fn()} />);
    expect(screen.getByText("Elijah communication map")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Copy summary" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("SpeakPro · Elijah"));
  });
});

describe("Toasts", () => {
  it("renders and auto-dismisses toasts", async () => {
    vi.useFakeTimers();
    render(<Toasts />);
    act(() => useUiStore.getState().toast("Hello", "good"));
    expect(screen.getByRole("status")).toHaveTextContent("Hello");
    act(() => vi.advanceTimersByTime(3000));
    expect(useUiStore.getState().toasts).toHaveLength(0);
    vi.useRealTimers();
  });
});

describe("NodePanel", () => {
  it("renders a leaf with reps and a practise button", async () => {
    const onPractise = vi.fn();
    useAppStore.setState({ progress: { mir: 4 } });
    render(
      <NodePanel
        node={NODE_BY_ID.mir!}
        onBack={vi.fn()}
        onPractise={onPractise}
        onSetDiscipline={vi.fn()}
      />,
    );
    expect(screen.getByText("Pyramid Principle")).toBeInTheDocument();
    expect(screen.getByText("practising")).toBeInTheDocument();
    expect(screen.getByText("4 / 10")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Practise now/ }));
    expect(onPractise).toHaveBeenCalledWith("write", "mir");
  });
  it("renders the root's critical path, a hub's connections and a discipline group", async () => {
    const onSetDiscipline = vi.fn();
    const { rerender } = render(
      <NodePanel
        node={NODE_BY_ID.azair!}
        onBack={vi.fn()}
        onPractise={vi.fn()}
        onSetDiscipline={vi.fn()}
      />,
    );
    expect(screen.getByText("Critical path")).toBeInTheDocument();
    expect(screen.getByText("Map mastery")).toBeInTheDocument();
    rerender(
      <NodePanel
        node={NODE_BY_ID.hubC!}
        onBack={vi.fn()}
        onPractise={vi.fn()}
        onSetDiscipline={vi.fn()}
      />,
    );
    expect(screen.getByText("Connected (9)")).toBeInTheDocument();
    rerender(
      <NodePanel
        node={NODE_BY_ID.averi!}
        onBack={vi.fn()}
        onPractise={vi.fn()}
        onSetDiscipline={onSetDiscipline}
      />,
    );
    await userEvent.click(screen.getByTestId("set-discipline"));
    expect(onSetDiscipline).toHaveBeenCalledWith("averi");
  });
});
