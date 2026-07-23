import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "group/footer mx-auto hidden sm:flex w-full max-w-[min(92vw,560px)] items-center justify-center gap-4 sm:gap-5 py-4 text-[13px] font-medium text-muted-foreground opacity-60 transition-opacity duration-200 hover:opacity-100",
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

      <Link
        to="/"
        className="footer-link hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
      >
        Zen Sudoku
      </Link>
      <span className="opacity-30">•</span>

      <div className="flex items-center gap-1">
        <span>Made by</span>
        <a
          href="https://abhiishek-dev.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-block font-bold border-b-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded transition-transform hover:scale-105 active:scale-95 animate-glow-text"
          style={{
            paddingBottom: "1px",
          }}
        >
          Abhishek
        </a>
      </div>
    </footer>
  );
}
