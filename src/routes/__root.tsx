import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Auto-reload PWA on new deployments when running in standalone Home Screen mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialETag: string | null = null;

    const checkAppVersion = async () => {
      try {
        // Fetch current index.html headers to check for new deployment/build
        const res = await fetch(`/?_v=${Date.now()}`, { cache: "no-store", method: "HEAD" });
        const etag = res.headers.get("etag") || res.headers.get("last-modified");

        if (etag) {
          if (initialETag && initialETag !== etag) {
            console.log("[PWA Auto-Update] New version detected! Auto-reloading web app...");
            window.location.reload();
          } else {
            initialETag = etag;
          }
        }
      } catch (err) {
        // Ignore network check glitches silently
      }
    };

    // Initial check on launch
    checkAppVersion();

    // Periodic check every 30 seconds when window is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkAppVersion();
      }
    }, 30000);

    // Also check immediately when bringing the app back to foreground
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAppVersion();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Global theme synchronization: Ensures selected theme persists across refreshes & route changes
  useEffect(() => {
    const applyTheme = (t: string) => {
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
      root.classList.add(`theme-${t}`);
    };

    // Apply on route mount
    applyTheme(useSettingsStore.getState().theme);

    // Subscribe to store changes so theme updates instantly everywhere
    const unsub = useSettingsStore.subscribe((state) => {
      applyTheme(state.theme);
    });

    return () => unsub();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
