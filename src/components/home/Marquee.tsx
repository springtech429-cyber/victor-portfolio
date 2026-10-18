export function Marquee({ words }: { words: string[] }) {
  const list = words.length ? words : ['Web', 'Writing', 'Brand voice'];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {list.map((w, i) => (
        <li key={w + i} className="flex items-center">
          <span className={`px-8 font-display text-4xl font-extrabold uppercase md:text-6xl ${i % 2 ? 'text-outline' : ''}`}>{w}</span>
          <span className="text-neon-blue" aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section id="next" className="relative z-10 overflow-hidden border-y hairline bg-bg-primary/60 py-8 backdrop-blur-sm" aria-label="Services">
      <div className="marquee">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
