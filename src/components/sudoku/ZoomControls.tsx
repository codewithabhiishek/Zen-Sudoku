import { useEffect, useState, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFullscreenElement,
  checkFullscreenSupport,
  requestFullscreenElement,
  exitFullscreenElement,
} from "@/lib/fullscreen";

export function ZoomControls() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(checkFullscreenSupport());
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!getFullscreenElement());
    };

    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];

    events.forEach((evt) => document.addEventListener(evt, handleFullscreenChange));
    window.addEventListener("orientationchange", handleFullscreenChange);
    window.addEventListener("resize", handleFullscreenChange);

    return () => {
      events.forEach((evt) => document.removeEventListener(evt, handleFullscreenChange));
      window.removeEventListener("orientationchange", handleFullscreenChange);
      window.removeEventListener("resize", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!supported) return;

    try {
      const current = getFullscreenElement();
      if (!current) {
        await requestFullscreenElement();
      } else {
        await exitFullscreenElement();
      }
    } catch {
      // Gracefully handle browser errors/permission rejections without throwing
    }
  }, [supported]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const k = e.key;

      // Keybinding 'f' or 'F' for Fullscreen
      if ((k === "f" || k === "F") && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen();
        e.preventDefault();
        return;
      }

      // Escape key to Exit Fullscreen
      if (k === "Escape" && getFullscreenElement()) {
        toggleFullscreen();
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

  if (!supported) {
    return (
      <button
        disabled
        type="button"
        title="Fullscreen"
        className="grid size-8 sm:size-9 place-items-center rounded-lg text-muted-foreground/40 opacity-40 cursor-not-allowed"
        aria-label="Fullscreen"
      >
        <Maximize2 className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      className={cn(
        "btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground",
        isFullscreen && "text-primary bg-primary/10 font-bold",
      )}
      aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
    >
      {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );
}
