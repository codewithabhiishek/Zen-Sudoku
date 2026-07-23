import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "group/footer mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-center gap-2 py-4 text-[13px] font-medium text-muted-foreground opacity-60 transition-opacity duration-200 hover:opacity-100",
        className
      )}
    >
      <a
        href="https://github.com/codewithabhiishek/Zen-Sudoku"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
      >
        Open Source
      </a>
      <span className="opacity-30">•</span>

      <span>© 2026</span>
      <Link
        to="/"
        className="footer-link hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
      >
        Zen Sudoku
      </Link>
      <span className="opacity-30">•</span>

      <span>Made by</span>
      <a
        href="https://abhiishek-dev.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="relative inline-block text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded transition-transform hover:scale-105 active:scale-95 animate-pulse-subtle"
        style={{
          borderBottom: "1.5px solid var(--color-primary)",
          paddingBottom: "1px",
        }}
      >
        Abhishek
      </a>
    </footer>
  );
}
