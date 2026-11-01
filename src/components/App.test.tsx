import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useAppStore } from "@/store/useAppStore";
import { resetStores } from "@/test/utils";

beforeEach(resetStores);

describe("App", () => {
  it("walks onboarding → chapter 1 → celebration → chapter 2", async () => {
    render(<App />);
    await screen.findByTestId("onboarding");
    await userEvent.type(screen.getByLabelText("Your first name"), "Elijah");
    await userEvent.click(screen.getByTestId("onboarding-begin"));
    expect(useAppStore.getState().onboarded).toBe(true);
    expect(useAppStore.getState().name).toBe("Elijah");

    expect(screen.getByTestId("quest-title")).toHaveTextContent("Meet your map");
    await userEvent.click(screen.getByTestId("quest-action"));
    await waitFor(() => expect(useAppStore.getState().chapters.meet).toBeTruthy());
    expect(screen.getByTestId("node-panel")).toBeInTheDocument();
    const title = await screen.findByTestId("celebration-title", {}, { timeout: 3000 });
    expect(title).toHaveTextContent("Meet your map");
    await userEvent.click(screen.getByTestId("celebration-continue"));
    await waitFor(() =>
      expect(screen.getByTestId("quest-title")).toHaveTextContent("Choose your discipline"),
    );

    // chapter 2: pick a discipline through a discipline node
    await userEvent.click(screen.getByTestId("quest-action"));
    await userEvent.click(document.querySelector('[data-node-id="averi"]')!);
    await userEvent.click(screen.getByTestId("set-discipline"));
    await waitFor(() => expect(useAppStore.getState().chapters.disc).toBeTruthy());
    expect(screen.getByTestId("hud-disc")).toHaveTextContent("Business");
    await screen.findByTestId("celebration-title", {}, { timeout: 3000 });
    await userEvent.click(screen.getByTestId("celebration-continue"));
    await waitFor(() => expect(screen.getByTestId("quest-title")).toHaveTextContent("First words"));
    expect(screen.getByTestId("today-read")).toBeInTheDocument();
  });

  it("keeps progress when the reset dialog is dismissed", async () => {
    useAppStore.setState({ onboarded: true, xp: 99 });
    render(<App />);
    await screen.findByTestId("app");
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(useAppStore.getState().xp).toBe(99);
  });

  it("wipes progress when reset is confirmed", async () => {
    useAppStore.setState({ onboarded: true, xp: 99 });
    render(<App />);
    await screen.findByTestId("app");
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await userEvent.click(await screen.findByTestId("reset-confirm"));
    expect(useAppStore.getState().xp).toBe(0);
    expect(useAppStore.getState().onboarded).toBe(false);
  });
});
