import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "light" | "dark" | "crt" | "paper" | "contrast";

interface SettingsState {
  theme: ThemeId;
  sound: boolean;
  highlightSame: boolean;
  highlightPeers: boolean;
  fontScale: number; // 0.85 - 1.3
  setTheme: (t: ThemeId) => void;
  toggle: (key: "sound" | "highlightSame" | "highlightPeers") => void;
  setFontScale: (v: number) => void;
}

export const THEMES: { id: ThemeId; label: string; swatch: string[] }[] = [
  { id: "light", label: "Light", swatch: ["#ffffff", "#0a0a0a", "#2563eb"] },
  { id: "dark", label: "Dark", swatch: ["#0b0f19", "#e5e7eb", "#6366f1"] },
  { id: "crt", label: "Retro CRT", swatch: ["#0a0a0a", "#39ff14", "#ff0080"] },
  { id: "paper", label: "Paper", swatch: ["#f4ecd8", "#2b2418", "#7a5c2e"] },
  { id: "contrast", label: "High Contrast", swatch: ["#000000", "#ffffff", "#ffe600"] },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme:
        typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      sound: false,
      highlightSame: true,
      highlightPeers: true,
      fontScale: 1,
      setTheme: (theme) => set({ theme }),
      toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<SettingsState>),
      setFontScale: (fontScale) => set({ fontScale }),
    }),
    { name: "sudoku-settings-v1" },
  ),
);
