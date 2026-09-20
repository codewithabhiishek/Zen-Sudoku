import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { isHoneypotTriggered, isSpeedTrapTriggered, sanitizeUsername } from "@/lib/security";

export function WelcomeModal() {
  const isRegistered = useUserStore((s) => s.isRegistered);
  const registerGuest = useUserStore((s) => s.registerGuest);
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mountTime] = useState<number>(() => Date.now());

  if (isRegistered) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const botcheck = (form.elements.namedItem("botcheck") as HTMLInputElement | null)?.checked;
    const gotcha = (form.elements.namedItem("_gotcha") as HTMLInputElement | null)?.value;

    if (isHoneypotTriggered(botcheck, gotcha)) {
      return;
    }

    if (isSpeedTrapTriggered(mountTime)) {
      return;
    }

    const cleanName = sanitizeUsername(usernameInput);
    setLoading(true);
    try {
      await registerGuest(cleanName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-backdrop-fade-in">
      <div className="w-full max-w-md rounded-2xl border bg-surface p-6 sm:p-8 shadow-2xl animate-modal-pop">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border bg-surface-2 text-primary shadow-sm">
          <Sparkles className="size-6 text-primary" />
        </div>

        <h2 className="display text-center text-2xl font-bold tracking-tight">
          Welcome to Zen Sudoku
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Enter a username to track your progress, stats, and climb global leaderboards.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Strix Dual Honeypot Shield */}
          <div
            style={{
              position: "absolute",
              left: "-9999px",
              top: "-9999px",
              opacity: 0,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
            <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. ZenMaster99"
                maxLength={24}
                required
                className="w-full rounded-xl border bg-surface-2 px-4 py-3 pl-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <User className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">No password or email required.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.98]"
          >
            {loading ? "Creating Profile..." : "Continue to Game"}
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
