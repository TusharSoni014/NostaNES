import Image from "next/image"
import Link from "next/link"
import { GamepadIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { absoluteUrl, GITHUB_URL, INFO_PAGES, SITE_NAME, SITE_URL, safeJsonLd } from "@/lib/site"
import { cn } from "@/lib/utils"

type InfoShellProps = {
  /** Path of the current page, e.g. "/faq". */
  path: string
  title: string
  intro: string
  children: React.ReactNode
  /** Extra JSON-LD nodes for this page (FAQPage, AboutPage, ...). */
  jsonLd?: Record<string, unknown>[]
}

/** Scrollable static page frame shared by the About, Controls and FAQ pages. */
export function InfoShell({ path, title, intro, children, jsonLd = [] }: InfoShellProps) {
  const current = INFO_PAGES.find((page) => page.path === path)
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: current?.label ?? title,
            item: absoluteUrl(path),
          },
        ],
      },
      ...jsonLd,
    ],
  }

  return (
    // The root body is a fixed-height console stage, so these pages scroll here.
    <div className="h-dvh overflow-y-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }}
      />
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 py-5">
          <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Image src="/nostanes.png" alt="" width={36} height={36} className="size-9 object-contain" />
            <span className="text-base font-semibold tracking-wide">{SITE_NAME}</span>
          </Link>
          <nav aria-label="Site" className="flex items-center gap-1 text-sm">
            {INFO_PAGES.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                aria-current={page.path === path ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  page.path === path && "bg-secondary text-foreground",
                )}
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 pt-6 pb-16">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">{intro}</p>
          <div className="mt-10 space-y-12">{children}</div>

          <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Ready to play?</p>
              <p className="text-sm text-muted-foreground">No download, no sign-up. Pick a cartridge and press Start.</p>
            </div>
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              <GamepadIcon />
              Open the game library
            </Link>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-sm text-muted-foreground">
          <p>{SITE_NAME}: NES games in your browser.</p>
          <a
            href={GITHUB_URL}
            className="rounded-md transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Source on GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  )
}
