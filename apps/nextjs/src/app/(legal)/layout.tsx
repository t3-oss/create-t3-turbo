import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <nav className="text-muted-foreground mb-8 flex gap-4 text-sm">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms of Service
        </Link>
        <Link href="/cookies" className="hover:text-foreground transition-colors">
          Cookie Policy
        </Link>
      </nav>
      <article className="prose dark:prose-invert max-w-none">{children}</article>
      <div className="mt-12 border-t pt-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
