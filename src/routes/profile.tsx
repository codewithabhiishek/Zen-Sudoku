import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useUserStore } from "@/store/userStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useGameStore } from "@/store/gameStore";
import { SignInButton, UserButton, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { ArrowLeft, User, Copy, Check, Trash2, RotateCcw, ShieldCheck, Cloud, LogIn, Sparkles } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

export function ProfilePage() {
  const theme = useSettingsStore((s) => s.theme);
  const userId = useUserStore((s) => s.userId);
  const username = useUserStore((s) => s.username);
  const updateUsername = useUserStore((s) => s.updateUsername);
  const deleteProfile = useUserStore((s) => s.deleteProfile);

  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  const [inputName, setInputName] = useState(username);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (clerkUser?.username || clerkUser?.firstName) {
      const name = clerkUser.username || clerkUser.firstName || "";
      setInputName(name);
    } else {
      setInputName(username);
    }
  }, [username, clerkUser]);

  // Apply theme
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove(
      "theme-graphite",
      "theme-forest",
      "theme-tokyo",
      "theme-catppuccin",
      "theme-amoled",
      "theme-chessboard"
    );
    root.classList.add(`theme-${theme}`);
    document.title = "Profile • Zen Sudoku";
  }, [theme]);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    await updateUsername(inputName.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyUUID = () => {
    const activeId = clerkUser?.id || userId;
    if (!activeId) return;
    navigator.clipboard.writeText(activeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteProfile = () => {
    if (confirm("Are you sure you want to delete your local profile? Your saved user ID will be removed from this browser.")) {
      deleteProfile();
      window.location.href = "/";
    }
  };

  const handleResetProgress = () => {
    if (confirm("Are you sure you want to reset all game stats, streaks, and progress? This action cannot be undone.")) {
      useGameStore.setState({
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          bestTimeByDifficulty: {},
          totalPoints: 0,
          currentStreakDays: 0,
          longestStreakDays: 0,
          lastPlayedDate: null,
          completedLevels: [],
        },
        history: [],
      });
      alert("All game progress has been reset.");
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors animate-page-enter">
      <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="btn-interactive grid size-10 place-items-center rounded-lg border bg-surface text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Back to Game"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="display text-2xl sm:text-3xl font-bold tracking-tight">
                {isSignedIn ? "Cloud Profile" : "Guest Profile"}
              </h1>
              <p className="text-xs text-muted-foreground">Manage your identity and game preferences</p>
            </div>
          </div>
        </div>

        {/* ── CLERK CLOUD SYNC CARD ──────────────────────────── */}
        <div className="mb-6 rounded-2xl border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Cloud className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  Cloud Sync
                  {isSignedIn ? (
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                      Active ✓
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted text-muted-foreground border px-2 py-0.5 text-[10px] font-bold">
                      Guest Mode
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSignedIn
                    ? "Your level progress & stats sync automatically across all your devices."
                    : "Sign in with Google to sync your level progress & stats seamlessly across all your devices."}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <SignedIn>
                <UserButton userProfileMode="navigation" userProfileUrl="/profile" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-interactive flex items-center gap-1.5 rounded-xl border border-primary bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90">
                    <LogIn className="size-3.5" /> Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-interactive rounded-2xl border bg-surface p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b pb-5">
            <div className="grid size-14 place-items-center rounded-2xl border bg-surface-2 text-primary font-bold text-xl shadow-sm overflow-hidden">
              {clerkUser?.imageUrl ? (
                <img src={clerkUser.imageUrl} alt="Avatar" className="size-full object-cover" />
              ) : username ? (
                username[0].toUpperCase()
              ) : (
                <User className="size-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {clerkUser?.fullName || clerkUser?.username || username || "Guest Player"}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                {isSignedIn ? (
                  <>
                    <Sparkles className="size-4 text-primary" /> Logged in via Google / Clerk
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" /> Guest Profile Active
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Change Username Form */}
          <form onSubmit={handleSaveUsername} className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Change Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={24}
                required
                className="flex-1 rounded-xl border bg-surface-2 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {savedSuccess ? <Check className="size-4" /> : "Save"}
              </button>
            </div>
          </form>

          {/* User UUID Section */}
          <div className="space-y-2 border-t pt-5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Player Identifier (UUID)
            </label>
            <div className="flex items-center justify-between rounded-xl border bg-surface-2 p-3 font-mono text-xs text-muted-foreground">
              <span className="truncate max-w-[280px] sm:max-w-md">{userId || "Not generated yet"}</span>
              <button
                onClick={handleCopyUUID}
                className="ml-2 flex items-center gap-1 rounded-lg border bg-surface px-2.5 py-1 text-xs font-sans text-foreground hover:bg-muted transition"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              This unique identifier syncs your high scores and stats across sessions.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="space-y-3 border-t pt-5">
            <label className="block text-xs font-semibold text-danger uppercase tracking-wider">
              Danger Zone
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={handleResetProgress}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition"
              >
                <RotateCcw className="size-4" /> Reset Game Progress
              </button>
              <button
                onClick={handleDeleteProfile}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs font-semibold text-danger hover:bg-danger/20 transition"
              >
                <Trash2 className="size-4" /> Delete Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
