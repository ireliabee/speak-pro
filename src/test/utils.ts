import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";

/** Reset both stores between tests. */
export function resetStores(): void {
  localStorage.clear();
  useAppStore.getState().reset();
  useUiStore.setState({ modal: { kind: "none" }, focusedId: null, toasts: [], commands: [] });
}
