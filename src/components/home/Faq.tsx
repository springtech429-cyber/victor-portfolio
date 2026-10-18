import { Plus } from 'lucide-react';
import type { Faq } from '@/lib/types';

/** Plain <details> elements: they work without JavaScript, and the answers are always in the page for search and AI tools. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <div className="divide-y hairline border-y hairline">
      {faqs.map((f) => (
        <details key={f.q} className="group py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold md:text-2xl [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus size={22} className="shrink-0 text-neon-blue transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-secondary">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
