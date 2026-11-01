import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SkillMap from "./SkillMap";
import { NODES } from "@/data/graph";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { resetStores } from "@/test/utils";

beforeEach(resetStores);

const nodeEl = (id: string) => document.querySelector(`[data-node-id="${id}"]`);

describe("SkillMap", () => {
  it("renders every node and puts the beacon on the current chapter target", () => {
    render(<SkillMap onNodeClick={vi.fn()} onBackgroundClick={vi.fn()} />);
    expect(screen.getByTestId("skill-map")).toBeInTheDocument();
    for (const n of NODES) expect(nodeEl(n.id)).not.toBeNull();
    expect(document.querySelectorAll("[data-beacon='true']")).toHaveLength(1);
    expect(nodeEl("azair")).toHaveAttribute("data-beacon", "true");
    expect(nodeEl("azair")).not.toHaveAttribute("data-fog");
    // chapter 3's node is still fogged at the start
    expect(nodeEl("ovi")).toHaveAttribute("data-fog", "true");
    expect(nodeEl("mir")).toHaveAttribute("data-state", "locked");
  });

  it("moves the beacon as chapters complete and reflects node state", () => {
    useAppStore.setState({ chapters: { meet: 1, disc: 1 }, progress: { mir: 3 } });
    render(<SkillMap onNodeClick={vi.fn()} onBackgroundClick={vi.fn()} />);
    expect(nodeEl("ovi")).toHaveAttribute("data-beacon", "true");
    expect(nodeEl("azair")).not.toHaveAttribute("data-beacon");
    expect(nodeEl("ovi")).not.toHaveAttribute("data-fog");
    expect(nodeEl("mir")).toHaveAttribute("data-state", "practising");
  });

  it("dispatches clicks on nodes and the background", async () => {
    const onNodeClick = vi.fn();
    const onBackgroundClick = vi.fn();
    render(<SkillMap onNodeClick={onNodeClick} onBackgroundClick={onBackgroundClick} />);
    await userEvent.click(nodeEl("azair")!);
    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: "azair" }));
    expect(onBackgroundClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("skill-map"));
    expect(onBackgroundClick).toHaveBeenCalled();
  });

  it("consumes map commands sent through the UI store", () => {
    render(<SkillMap onNodeClick={vi.fn()} onBackgroundClick={vi.fn()} />);
    act(() => {
      useUiStore.getState().send({ type: "zoomTo", id: "mir" });
      useUiStore.getState().send({ type: "burst", ids: ["mir"] });
    });
    expect(useUiStore.getState().commands).toHaveLength(0);
  });
});
