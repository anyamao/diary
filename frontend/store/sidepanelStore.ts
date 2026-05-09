import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidepanelState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setOpen: (isOpen: boolean) => void;
}

export const useSidepanelStore = create<SidepanelState>()(
  persist(
    (set) => ({
      isOpen: true, // default state
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen: boolean) => set({ isOpen }),
    }),
    {
      name: "sidepanel-storage", // optional: persist to localStorage
    },
  ),
);
