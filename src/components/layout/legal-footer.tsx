import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-3 px-5 py-6 text-[13px] text-muted-foreground sm:flex-row">
        <p>© 2026 Orbit — AI Job Application OS</p>
        <nav className="flex items-center gap-4" aria-label="Legal">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}