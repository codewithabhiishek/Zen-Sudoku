import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trackThemeChanged } from "@/lib/analytics";

export type ThemeId = "graphite" | "forest" | "tokyo" | "catppuccin" | "amoled" | "chessboard";

interface SettingsState {
  theme: ThemeId;
  sound: boolean;
  highlightSame: boolean;
  highlightPeers: boolean;
  highlightErrors: boolean;
  autoRemoveIncorrect: boolean;
  reduceAnimations: boolean;
  autoSave: boolean;
  keyboardShortcuts: boolean;
  haptics: boolean;
  leftHanded: boolean;
  fontScale: number; // 0.85 - 1.3
  zoomLevel: number; // 0.8 - 1.6
  setTheme: (t: ThemeId) => void;
  toggle: (key: "sound" | "highlightSame" | "highlightPeers" | "highlightErrors" | "autoRemoveIncorrect" | "reduceAnimations" | "autoSave" | "keyboardShortcuts" | "haptics" | "leftHanded") => void;
  setFontScale: (v: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const THEMES: { id: ThemeId; label: string; swatch: string[] }[] = [
  { id: "graphite", label: "Graphite", swatch: ["#0E1116", "#171C23", "#7C9DFF"] },
  { id: "forest", label: "Forest Zen", swatch: ["#08120D", "#13211B", "#5CBF89"] },
  { id: "tokyo", label: "Tokyo Night", swatch: ["#1A1B26", "#24283B", "#7AA2F7"] },
  { id: "catppuccin", label: "Catppuccin Mocha", swatch: ["#1E1E2E", "#313244", "#89B4FA"] },
  { id: "amoled", label: "AMOLED", swatch: ["#000000", "#0A0A0A", "#4EA8FF"] },
  { id: "chessboard", label: "Chessboard Beige", swatch: ["#F3EFE6", "#ECE4D6", "#8B6B45"] },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "graphite",
      sound: true,
      highlightSame: true,
      highlightPeers: true,
      highlightErrors: true,
      autoRemoveIncorrect: false,
      reduceAnimations: false,
      autoSave: true,
      keyboardShortcuts: true,
      haptics: true,
      leftHanded: false,
      fontScale: 1,
      zoomLevel: 1,
      setTheme: (theme) => {
        set({ theme });
        trackThemeChanged(theme);
      },
      toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<SettingsState>),
      setFontScale: (fontScale) => set({ fontScale }),
      zoomIn: () => set((s) => ({ zoomLevel: Math.min(1.6, Number((s.zoomLevel + 0.1).toFixed(2))) })),
      zoomOut: () => set((s) => ({ zoomLevel: Math.max(0.8, Number((s.zoomLevel - 0.1).toFixed(2))) })),
      resetZoom: () => set({ zoomLevel: 1 }),
    }),
    { name: "sudoku-settings-v1" },
  ),
);
