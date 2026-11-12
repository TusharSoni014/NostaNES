import type { Metadata } from "next"
import { pageMetadata } from "@/lib/site"
import { InfoShell } from "@/components/info/info-shell"
import { FAQ_ITEMS } from "@/lib/faq"

const TITLE = "NES Emulator FAQ"
const DESCRIPTION =
  "Answers about playing NES games online with NostaNES: phones and gamepads, save states, cheats, your own ROMs, 2-player play and display filters."

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/faq" })

export default function FaqPage() {
  return (
    <InfoShell
      path="/faq"
      title="Frequently asked questions"
      intro="Everything about playing NES games in your browser with NostaNES."
      jsonLd={[
        {
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        },
      ]}
    >
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h2 className="text-base">{item.question}</h2>
              <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </InfoShell>
  )
}
