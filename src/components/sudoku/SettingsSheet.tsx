import { useState } from "react";
import { Settings, X } from "lucide-react";
import { THEMES, useSettingsStore } from "@/store/settingsStore";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

export function SettingsSheet() {
  const [open, setOpen] = useState(false);
  const s = useSettingsStore();
  const smartNotes = useGameStore((g) => g.smartNotes);
  const toggleSmart = useGameStore((g) => g.toggleSmartNotes);
  const mistakeLimit = useGameStore((g) => g.mistakeLimit);
  const setMistakeLimit = useGameStore((g) => g.setMistakeLimit);
  const stats = useGameStore((g) => g.stats);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-md border bg-surface transition hover:bg-muted"
        aria-label="Settings"
      >
        <Settings className="size-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="h-full w-full max-w-sm overflow-y-auto border-l bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="display text-2xl">Settings</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-md hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <Section title="Theme">
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => s.setTheme(t.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 text-left transition",
                      s.theme === t.id ? "border-primary ring-2 ring-primary/40" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex overflow-hidden rounded border">
                      {t.swatch.map((c) => (
                        <span key={c} className="block h-8 w-4" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Gameplay">
              <Toggle label="Auto-check mistakes" checked={s.highlightErrors} onChange={() => s.toggle("highlightErrors")} />
              <Toggle label="Highlight same number" checked={s.highlightSame} onChange={() => s.toggle("highlightSame")} />
              <Toggle label="Highlight row / col / box" checked={s.highlightPeers} onChange={() => s.toggle("highlightPeers")} />
              <Toggle label="Smart notes (auto-remove)" checked={smartNotes} onChange={toggleSmart} />
              <Toggle label="Sound effects" checked={s.sound} onChange={() => s.toggle("sound")} />
              <div className="mt-3">
                <div className="mb-1 text-sm text-muted-foreground">Mistake limit</div>
                <div className="flex gap-2">
                  {[null, 3, 5].map((n) => (
                    <button
                      key={String(n)}
                      onClick={() => setMistakeLimit(n)}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-2 text-sm",
                        mistakeLimit === n ? "border-primary bg-highlight-strong" : "hover:bg-muted",
                      )}
                    >
                      {n == null ? "Off" : `${n} strikes`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Font size</span>
                  <span className="tabular-nums">{Math.round(s.fontScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.3}
                  step={0.05}
                  value={s.fontScale}
                  onChange={(e) => s.setFontScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </Section>

            <Section title="Stats">
              <StatRow label="Played" v={stats.gamesPlayed} />
              <StatRow label="Won" v={stats.gamesWon} />
              <StatRow label="Total points" v={stats.totalPoints} />
              <StatRow label="Current streak" v={`${stats.currentStreakDays} days`} />
              <StatRow label="Longest streak" v={`${stats.longestStreakDays} days`} />
              <div className="mt-3 text-xs text-muted-foreground">
                Best times:{" "}
                {(["easy", "medium", "hard", "expert"] as const)
                  .filter((d) => stats.bestTimeByDifficulty[d])
                  .map((d) => `${d} ${fmtSec(stats.bestTimeByDifficulty[d]!)}`)
                  .join(" · ") || "—"}
              </div>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}

function fmtSec(t: number) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border bg-surface-2 px-3 py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-surface transition",
            checked ? "left-[calc(100%-1.375rem)]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
function StatRow({ label, v }: { label: string; v: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
