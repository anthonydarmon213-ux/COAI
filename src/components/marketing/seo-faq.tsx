import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

type FaqItem = { question: string; reponse: string };

// Rend une FAQ visuelle + les données structurées FAQPage (schema.org)
// correspondantes, pour que Google puisse afficher ces questions
// directement dans les résultats de recherche (rich snippet).
export function SeoFaq({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.reponse },
    })),
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center">
        <SectionLabel>Questions fréquentes</SectionLabel>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.question}>
            <details>
              <summary className="cursor-pointer list-none text-sm font-medium text-graphite-50 marker:content-none">
                <span className="text-base font-semibold">{item.question}</span>
              </summary>
              <p className="mt-3 text-sm text-graphite-300">{item.reponse}</p>
            </details>
          </Card>
        ))}
      </div>
    </section>
  );
}
