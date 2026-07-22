import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ZoomControls() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const k = e.key;

      // Keybinding 'f' or 'F' for Fullscreen / Maximize
      if ((k === "f" || k === "F") && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen();
        e.preventDefault();
        return;
      }

      // Escape key to Exit Fullscreen / Minimize
      if (k === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      onClick={toggleFullscreen}
      title={isFullscreen ? "Exit Fullscreen (Esc / F)" : "Fullscreen / Maximize (F)"}
      className={cn(
        "grid size-11 place-items-center rounded-md border bg-surface transition hover:bg-muted text-muted-foreground hover:text-foreground",
        isFullscreen && "border-primary text-primary bg-primary/10",
      )}
      aria-label="Toggle Fullscreen"
    >
      {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );
}
