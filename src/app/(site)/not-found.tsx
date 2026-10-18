import { TLink } from '@/components/shell/Transition';

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[80vh] flex-col justify-center py-32">
      <p className="eyebrow">Error 404</p>
      <h1 className="h-display mt-6">Lost in <span className="text-outline">space.</span></h1>
      <p className="mt-6 max-w-md text-lg text-text-secondary">That page does not exist, or it has been unpublished.</p>
      <TLink href="/" className="mt-10 w-fit rounded-full bg-neon-blue px-7 py-4 font-mono text-xs font-medium uppercase tracking-[0.16em] text-bg-primary">Back to home</TLink>
    </section>
  );
}
