import Link from "next/link";
import { LegalFooter } from "@/components/layout/legal-footer";

export function LegalPageLayout({
  updated,
  title,
  children,
}: {
  updated: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center border-b px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">
            O
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Orbit</p>
            <p className="text-[11px] text-muted-foreground">
              Job Application OS
            </p>
          </div>
        </Link>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
          <p className="text-[13px] text-muted-foreground">{updated}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <div className="mt-8 space-y-10">{children}</div>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}