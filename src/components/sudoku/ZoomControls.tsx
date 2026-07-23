import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  webkitCancelFullScreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface VendorElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  webkitRequestFullScreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as VendorDocument;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

export function checkFullscreenSupport(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const doc = document as VendorDocument;
  const el = document.documentElement as VendorElement;
  return !!(
    doc.fullscreenEnabled ||
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  );
}

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
      "orientationchange",
      "resize",
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

  const toggleFullscreen = async () => {
    if (!supported) return;

    try {
      const current = getFullscreenElement();
      if (!current) {
        const el = document.documentElement as VendorElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.webkitRequestFullScreen) {
          await el.webkitRequestFullScreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      } else {
        const doc = document as VendorDocument;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.webkitCancelFullScreen) {
          await doc.webkitCancelFullScreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch {
      // Gracefully handle browser errors/permission rejections without throwing
    }
  };

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
  }, [supported, isFullscreen]);

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
