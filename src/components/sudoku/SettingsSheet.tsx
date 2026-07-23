import { useState } from "react";
import { Settings, X, Download, Upload, Trash2, RotateCcw, Cloud, Check } from "lucide-react";
import { THEMES, useSettingsStore } from "@/store/settingsStore";
import { useGameStore } from "@/store/gameStore";
import { getFullscreenElement, checkFullscreenSupport } from "@/components/sudoku/ZoomControls";
import { Footer } from "@/components/sudoku/Footer";
import { cn } from "@/lib/utils";

export function SettingsSheet() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const s = useSettingsStore();
  const smartNotes = useGameStore((g) => g.smartNotes);
  const toggleSmart = useGameStore((g) => g.toggleSmartNotes);
  const mistakeLimit = useGameStore((g) => g.mistakeLimit);
  const setMistakeLimit = useGameStore((g) => g.setMistakeLimit);
  const hideTimer = useGameStore((g) => g.hideTimer);
  const toggleHideTimer = useGameStore((g) => g.toggleHideTimer);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenSupported = checkFullscreenSupport();

  const handleOpen = () => {
    setIsClosing(false);
    setOpen(true);
    setIsFullscreen(!!getFullscreenElement());
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 230);
  };

  const toggleFullscreenMode = () => {
    if (!isFullscreenSupported) return;
    try {
      if (!getFullscreenElement()) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(!isFullscreen);
    } catch {}
  };

  const handleExportData = () => {
    const data = {
      settings: useSettingsStore.getState(),
      stats: useGameStore.getState().stats,
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zen-sudoku-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.settings) {
          useSettingsStore.setState(parsed.settings);
          alert("Progress and settings imported successfully!");
        }
      } catch {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearLocalData = () => {
    if (confirm("Are you sure you want to clear all local data and reset settings?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Settings"
        className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground"
        aria-label="Settings"
      >
        <Settings className="size-4" />
      </button>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm",
            isClosing ? "animate-backdrop-fade-out" : "animate-backdrop-fade-in",
          )}
          onClick={handleClose}
        >
          <div
            className={cn(
              "h-full w-full max-w-sm overflow-y-auto border-l bg-surface p-6 shadow-2xl flex flex-col justify-between",
              isClosing ? "animate-drawer-slide-out" : "animate-drawer-slide-in",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="display text-2xl">Settings</h2>
                <button onClick={handleClose} aria-label="Close" className="grid size-9 place-items-center rounded-md hover:bg-muted">
                  <X className="size-4" />
                </button>
              </div>

              {/* 1. APPEARANCE */}
              <Section title="Appearance">
                <div className="mb-3">
                  <div className="mb-1.5 flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Current Theme</span>
                    <span className="font-semibold text-primary capitalize">{THEMES.find((t) => t.id === s.theme)?.label || s.theme}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => s.setTheme(t.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-2 text-left transition",
                          s.theme === t.id ? "border-primary ring-2 ring-primary/40 bg-highlight-strong" : "hover:bg-muted",
                        )}
                      >
                        <div className="flex overflow-hidden rounded border">
                          {t.swatch.map((c) => (
                            <span key={c} className="block h-7 w-3.5" style={{ background: c }} />
                          ))}
                        </div>
                        <span className="text-xs font-semibold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Font Size</span>
                    <span className="tabular-nums font-semibold">{Math.round(s.fontScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.85}
                    max={1.3}
                    step={0.05}
                    value={s.fontScale}
                    onChange={(e) => s.setFontScale(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <Toggle
                  label="Fullscreen Mode"
                  checked={isFullscreen}
                  onChange={toggleFullscreenMode}
                  disabled={!isFullscreenSupported}
                />
                <Toggle
                  label="Reduce Animations"
                  checked={s.reduceAnimations}
                  onChange={() => s.toggle("reduceAnimations")}
                />
              </Section>

              {/* 2. GAMEPLAY */}
              <Section title="Gameplay">
                <Toggle label="Auto-check mistakes" checked={s.highlightErrors} onChange={() => s.toggle("highlightErrors")} />
                <Toggle label="Highlight same number" checked={s.highlightSame} onChange={() => s.toggle("highlightSame")} />
                <Toggle label="Highlight row / col / box" checked={s.highlightPeers} onChange={() => s.toggle("highlightPeers")} />
                <Toggle label="Smart notes (auto-remove)" checked={smartNotes} onChange={toggleSmart} />
                <Toggle label="Auto-save state" checked={s.autoSave} onChange={() => s.toggle("autoSave")} />
                <Toggle label="Show timer" checked={!hideTimer} onChange={toggleHideTimer} />

                <div className="mt-3">
                  <div className="mb-1 text-xs text-muted-foreground font-medium">Mistake limit</div>
                  <div className="flex gap-2">
                    {[null, 3, 5].map((n) => (
                      <button
                        key={String(n)}
                        onClick={() => setMistakeLimit(n)}
                        className={cn(
                          "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition",
                          mistakeLimit === n ? "border-primary bg-highlight-strong text-foreground font-bold" : "hover:bg-muted text-muted-foreground",
                        )}
                      >
                        {n == null ? "Off" : `${n} strikes`}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              {/* 3. CONTROLS */}
              <Section title="Controls">
                <Toggle label="Sound effects" checked={s.sound} onChange={() => s.toggle("sound")} />
                <Toggle label="Keyboard shortcuts" checked={s.keyboardShortcuts} onChange={() => s.toggle("keyboardShortcuts")} />
                <Toggle label="Haptic feedback (mobile)" checked={s.haptics} onChange={() => s.toggle("haptics")} />
                <Toggle label="Left-handed mode (mobile)" checked={s.leftHanded} onChange={() => s.toggle("leftHanded")} />
              </Section>

              {/* 4. DATA */}
              <Section title="Data & Sync">
                <div className="mb-2 flex items-center justify-between rounded-lg border bg-surface-2 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cloud className="size-4 text-emerald-500" />
                    <span>Cloud Persistence</span>
                  </div>
                  <span className="font-semibold text-emerald-500 flex items-center gap-1">
                    <Check className="size-3" /> Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-1.5 rounded-lg border bg-surface-2 px-2.5 py-2 text-xs font-medium transition hover:bg-muted"
                  >
                    <Download className="size-3.5" /> Export Data
                  </button>
                  <label className="flex items-center justify-center gap-1.5 rounded-lg border bg-surface-2 px-2.5 py-2 text-xs font-medium cursor-pointer transition hover:bg-muted">
                    <Upload className="size-3.5" /> Import Data
                    <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  </label>
                </div>

                <button
                  onClick={handleClearLocalData}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/20"
                >
                  <Trash2 className="size-3.5" /> Clear Local Data
                </button>
              </Section>
            </div>

            {/* MINIMAL FOOTER */}
            <Footer className="mt-8 pt-4 border-t" />
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg border bg-surface-2 px-3 py-2 text-xs transition",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className="font-medium">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onChange}
        aria-pressed={checked}
        className={cn(
          "relative h-5 w-9 rounded-full transition",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-surface transition",
            checked ? "left-[calc(100%-1.125rem)]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
