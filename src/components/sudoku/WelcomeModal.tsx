import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { User, Sparkles, ArrowRight } from "lucide-react";

export function WelcomeModal() {
  const isRegistered = useUserStore((s) => s.isRegistered);
  const registerGuest = useUserStore((s) => s.registerGuest);
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (isRegistered) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await registerGuest(usernameInput);
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

        <h2 className="display text-center text-2xl font-bold tracking-tight">Welcome to Zen Sudoku</h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Enter a username to track your progress, stats, and climb global leaderboards.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
